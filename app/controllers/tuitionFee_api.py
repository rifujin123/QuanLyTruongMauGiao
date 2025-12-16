from flask import Blueprint, jsonify, request
from app import db
from app.models.Models import TuitionFee, Student
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
            "student": {
                "id": tuition.student.id,
                "name":tuition.student.name
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
