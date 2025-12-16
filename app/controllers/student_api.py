from datetime import date
from flask import Blueprint, request, jsonify
from flask_login import current_user
from sqlalchemy import func

from app.utils import _get_payload, _string_to_date, get_filter_params
from app import db
from app.controllers.page_routes import roles_required
from app.models.Models import Student, HealthRecord
from app.services.student_service import search_students

student_api = Blueprint('student_api', __name__)

# GET: /api/students
@student_api.route('/api/students', methods=['GET'])
@roles_required('Teacher')
def get_students():
    filters = get_filter_params()
    students = search_students(**filters)

    students_data = []
    for student in students:
        # Lấy nhiệt độ mới nhất của học sinh
        latest_health = db.session.query(HealthRecord).filter_by(
            student_id=student.id
        ).order_by(HealthRecord.date_created.desc()).first()
        
        latest_temperature = latest_health.temperature if latest_health else None
        
        students_data.append({
            'id': student.id,
            'name': student.name,
            'dob': student.formatted_dob,
            'gender': student.gender.value,
            'class_id': student.class_id,
            'parent_id': student.parent_id,
            'classroom': {
                'id': student.classroom.id if student.classroom else None,
                'name': student.classroom.name if student.classroom else "Chưa phân lớp",
            },
            'parent': {
                'id': student.parent.id if student.parent else None,
                'name': student.parent.name if student.parent else "",
                'phone': student.parent.phone if student.parent else "",
            },
            'latest_temperature': latest_temperature
        })

    return jsonify(students_data), 200


@student_api.route("/api/parent/students", methods=["GET"])
@roles_required("Parent")
def get_students_for_current_parent():
    """
    Trả về danh sách học sinh của phụ huynh đang đăng nhập (Parent).
    Dùng cho các màn Parent như theo dõi học phí, thông tin trẻ, v.v.
    """
    parent_id = current_user.id
    students = Student.query.filter_by(parent_id=parent_id).all()

    data = []
    for s in students:
        data.append({
            "id": s.id,
            "name": s.name,
            "dob": s.formatted_dob,
            "gender": s.gender.value,
            "classroom": {
                "id": s.classroom.id if s.classroom else None,
                "name": s.classroom.name if s.classroom else "Chưa phân lớp",
            },
        })

    return jsonify(data), 200


# DELETE: /api/students/<int:student_id>
@student_api.route('/api/students/<int:student_id>', methods=['DELETE'])
@roles_required('Teacher')
def delete_student(student_id):
    student = Student.query.filter_by(id=student_id).first()
    if not student:
        return jsonify({"message": "student not found"}), 404

    db.session.delete(student)
    db.session.commit()
    return jsonify({"message": "student deleted"}), 200


# POST: /api/students
@student_api.route('/api/students', methods=['POST'])
@roles_required('Teacher')
def create_student():
    payload = _get_payload()

    required_fields = ['name', 'dob', 'gender', 'address']
    for f in required_fields:
        if f not in payload:
            return jsonify({"message": f"{f} is required"}), 400

    dob_value = _string_to_date(payload['dob'])
    if dob_value is None:
        return jsonify({"message": "dob is invalid"}), 400

    today = date.today()
    age = today.year - dob_value.year - ((today.month, today.day) < (dob_value.month, dob_value.day))

    new_student = Student(
        name=payload['name'],
        age=age,
        dob=dob_value,
        gender=payload['gender'],
        address=payload['address'],
        class_id=payload.get('class_id'),
        parent_id=payload.get('parent_id')
    )

    db.session.add(new_student)
    db.session.commit()

    return jsonify({
        "message": "student created",
        "student": {
            "id": new_student.id,
            "name": new_student.name,
            "dob": new_student.formatted_dob,
            "gender": new_student.gender.value,
            "class_id": new_student.class_id,
            "parent_id": new_student.parent_id
        }
    }), 201


# PUT: /api/students/<int:student_id>
@student_api.route('/api/students/<int:student_id>', methods=['PUT'])
@roles_required('Teacher')
def update_student(student_id):
    student = Student.query.get(student_id)
    if not student:
        return jsonify({"message": "student not found"}), 404

    payload = _get_payload()
    required_fields = ['name', 'dob', 'gender', 'class_id', 'parent_id']
    for f in required_fields:
        if f not in payload:
            return jsonify({"message": f"{f} is required"}), 400

    dob_value = _string_to_date(payload['dob'])
    if dob_value is None:
        return jsonify({"message": "dob is invalid"}), 400

    student.name = payload['name']
    student.dob = dob_value
    student.gender = payload['gender']
    student.class_id = payload['class_id']
    student.parent_id = payload['parent_id']

    db.session.commit()
    return jsonify({
        "message": "student updated",
        "student": {
            "id": student.id,
            "name": student.name,
            "dob": student.formatted_dob,
            "gender": student.gender.value,
            "class_id": student.class_id,
            "parent_id": student.parent_id
        }
    }), 200


# PATCH: /api/students/<int:student_id>
@student_api.route('/api/students/<int:student_id>', methods=['PATCH'])
@roles_required('Teacher')
def update_partial_student(student_id):
    student = Student.query.get(student_id)
    if not student:
        return jsonify({"message": "student not found"}), 404

    payload = _get_payload()

    if "name" in payload:
        student.name = payload['name']

    if "dob" in payload:
        dob_value = _string_to_date(payload["dob"])
        if dob_value is None:
            return jsonify({"message": "dob is invalid"}), 400
        student.dob = dob_value

    if "gender" in payload:
        student.gender = payload['gender']
    if "class_id" in payload:
        student.class_id = payload['class_id']
    if "parent_id" in payload:
        student.parent_id = payload['parent_id']

    db.session.commit()
    return jsonify({
        "message": "student updated",
        "student": {
            "id": student.id,
            "name": student.name,
            "dob": student.formatted_dob,
            "gender": student.gender.value,
            "class_id": student.class_id,
            "parent_id": student.parent_id
        }
    }), 200
