from flask import Blueprint, jsonify, request
from datetime import datetime
from app import db
from app.models.Models import TuitionFee, Student, Classroom, Setting, PaymentStatusEnum
from app.services.tuition_service import total_revenue, monthly_revenue, monthly_collected_amounts, \
    monthly_uncollected_amounts

tuitionFee_api = Blueprint('tuitionFee_api', __name__)


@tuitionFee_api.route('/api/tuitions', methods=["GET"])
def get_tuition():
    year = request.args.get("year", type=int)
    month = request.args.get("month", type=int)

    query = TuitionFee.query

    if year is not None:
        query = query.filter(TuitionFee.year == year)
    if month is not None:
        query = query.filter(TuitionFee.month == month)

    tuitions = query.all()

    tuitions_data = []
    for tuition in tuitions:
        # tránh lỗi null student
        if tuition.student is None:
            continue

        tuitions_data.append({
            "id": tuition.id,
            "fee_base": tuition.fee_base,
            "meal_fee": tuition.meal_fee,
            "extra_fee": tuition.extra_fee,
            "status": tuition.status.value,
            "month": tuition.month,
            "year": tuition.year,
            "due_date": f"05/{tuition.month:02d}/{tuition.year}",
            "student": {
                "id": tuition.student.id,
                "name":tuition.student.name
            },
            "classroom": {
                "id": tuition.student.classroom.id if tuition.student.classroom else None,
                "name": tuition.student.classroom.name if tuition.student.classroom else "Chưa phân lớp"
            }
        })
    return jsonify(tuitions_data), 200

#GET: GET /api/tuitions/totals
@tuitionFee_api.route('/api/tuitions/totals', methods=["GET"])
def get_totals():
    # Lấy tất cả cặp (month, year) duy nhất
    months_years = (
        db.session.query(TuitionFee.month, TuitionFee.year)
        .distinct()
        .order_by(TuitionFee.year, TuitionFee.month)
        .order_by(TuitionFee.year.asc(), TuitionFee.month.asc())
        .all()
    )
    totals_data = []
    for month, year in months_years:
        totals_data.append({
            "month": month,
            "year": year,
            "total_revenue": total_revenue(),  # tính tổng toàn hệ thống
            "monthly_revenue": monthly_revenue(month, year),
            "monthly_collected_amounts": monthly_collected_amounts(month, year),
            "monthly_uncollected_amounts": monthly_uncollected_amounts(month, year)
        })

    return jsonify(totals_data), 200


@tuitionFee_api.route('/api/tuitions/generate', methods=["POST"])
def generate_tuitions():
    data = request.get_json(silent=True) or {}
    year = int(data.get("year") or datetime.now().year)
    month = int(data.get("month") or datetime.now().month)

    settings = Setting.query.first()
    if not settings:
        return jsonify({"message": "Chưa cấu hình học phí trong bảng settings"}), 400

    students = Student.query.all()
    if not students:
        return jsonify({"message": "Không có học sinh nào"}), 400

    created = 0
    for student in students:
        #Nếu đã có thì bỏ qua
        existing = TuitionFee.query.filter_by(
            student_id=student.id,
            month=month,
            year=year,
        ).first()
        if existing:
            continue

        fee = TuitionFee(
            month=month,
            year=year,
            fee_base=settings.tuition_base or 0,
            meal_fee=(settings.meal_fee_per_day or 0) * 30,
            extra_fee=0,
            base_status=PaymentStatusEnum.Unpaid,
            meal_status=PaymentStatusEnum.Unpaid,
            extra_status=PaymentStatusEnum.Unpaid,
            status=PaymentStatusEnum.Unpaid,
            student_id=student.id,
        )
        db.session.add(fee)
        created += 1

    db.session.commit()

    return jsonify(
        {
            "message": "Đã tạo học phí tháng mới",
            "year": year,
            "month": month,
            "created": created,
        }
    ), 201


@tuitionFee_api.route("/api/tuitions/<int:tuition_id>/mark_paid", methods=["POST"])
def mark_tuition_paid(tuition_id):
    """Đánh dấu học phí là đã thanh toán (sử dụng sau khi quét QR)."""
    tuition = TuitionFee.query.get_or_404(tuition_id)

    tuition.base_status = PaymentStatusEnum.Paid
    tuition.meal_status = PaymentStatusEnum.Paid
    tuition.extra_status = PaymentStatusEnum.Paid
    tuition.status = PaymentStatusEnum.Paid
    tuition.payment_date = datetime.utcnow()

    db.session.commit()

    return jsonify({"message": "Cập nhật trạng thái học phí thành Đã thu"}), 200

@tuitionFee_api.route("/api/tuitions/<int:tuition_id>/items", methods=["GET"])
def get_tuition_items(tuition_id):
    tuition = TuitionFee.query.get_or_404(tuition_id)

    items = [
        {
            "label": "Học phí cơ bản",
            "type": "base_fee",
            "amount": tuition.fee_base,
            "status": tuition.base_status.value,
        },
        {
            "label": "Tiền ăn",
            "type": "meal_fee",
            "amount": tuition.meal_fee,
            "status": tuition.meal_status.value,
        },
        {
            "label": "Phụ thu khác",
            "type": "extra_fee",
            "amount": tuition.extra_fee,
            "status": tuition.extra_status.value,
        },
    ]

    return {
        "student": tuition.student.name,
        "items": items,
        "overall_status": tuition.overall_status.value  # hybrid_property
    }, 200

@tuitionFee_api.route('/api/classrooms', methods=["GET"])
def get_classrooms():
    classrooms = Classroom.query.all()
    classrooms_data = []
    for classroom in classrooms:
        classrooms_data.append({
            "id": classroom.id,
            "name": classroom.name
        })
    return jsonify(classrooms_data), 200
