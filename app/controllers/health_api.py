from datetime import datetime, time

from flask import Blueprint, jsonify, request
from flask_login import current_user
from sqlalchemy import func, and_
from sqlalchemy.orm import aliased

from app import db
from app.models.Models import HealthRecord, Student
from app.utils import format_date, time_ago, _get_payload



health_api = Blueprint('health_api', __name__)

#GET: GET /api/health
@health_api.route('/api/health', methods=['GET'])
def get_all_health_record():
    health_records = HealthRecord.query.all()
    if not health_records:
        return jsonify({
            "messgage": "no health record"
        })
    health_records_data = []
    for record in health_records:
        health_records_data.append({
            "id": record.id,
            "student":{
                "id": record.student.id,
                "name": record.student.name,
            },
            "teacher":{
                "id": record.teacher.id,
                "name": record.teacher.name,
            },
            "height": record.height,
            "weight": record.weight,
            "temperature" : record.temperature,
            "note" : record.note,
            "date": format_date(record.date_created)
        })

    return jsonify(health_records_data),200

#GET: GET /api/health/<int:student_id>
@health_api.route('/api/health/<int:student_id>', methods=['GET'])
def get_health_record_by_student_id(student_id):
    health_records = HealthRecord.query.filter_by(student_id=student_id).order_by(HealthRecord.date_created.asc()).all()
    if not health_records:
        return jsonify({
            "messgage": "no health record"
        })

    health_records_data = []
    for record in health_records:
        health_records_data.append({
            "id": record.id,
            "student":{
                "id": record.student.id,
                "name": record.student.name,
            },
            "height": record.height,
            "weight": record.weight,
            "temperature" : record.temperature,
            "note" : record.note,
            "date_created": format_date(record.date_created),
            "time_ago": time_ago(record.date_created),
            "teacher":{
                "id": record.teacher.id if record.teacher else None,
                "name": record.teacher.name if record.teacher else None,
            }
        })
    return jsonify(health_records_data),200



#POST: POST /api/health/<int:student_id>/health-records/<int:record_id>
@health_api.route('/api/health/<int:student_id>/health-records', methods=['POST'])
def create_health_record_by_id(student_id):
    payload = _get_payload()
    if current_user.is_authenticated:
        teacher = {
            "id": current_user.id,
            "name": current_user.name,
        }
    health_record = HealthRecord(
        student_id=student_id,
        weight=payload['weight'],
        height=payload['height'],
        temperature=payload['temperature'],
        note=payload['note'],
        teacher_id = teacher['id']
    )

    db.session.add(health_record)
    db.session.commit()
    return jsonify({
        "message": "created successfully",
        "data":{
            "id": health_record.id,
            "student_id": student_id,
            "weight": payload['weight'],
            "height": payload['height'],
            "temperature": payload['temperature'],
            "note": payload['note'],
            "time_ago": time_ago(health_record.date_created),
            "teacher": teacher
        }
    }),201

#PUT: PUT /api/health/<int:student_id>/health-records/<int:record_id>
@health_api.route('/api/health/<int:student_id>/health-records/<int:record_id>', methods=['PUT'])
def update_health_record_by_id(student_id, record_id):
    payload = _get_payload()
    health_record = HealthRecord.query.filter_by(student_id=student_id, id=record_id).first()
    if not health_record:
        return jsonify({"messgage": "not found"}),404
    health_record.weight = payload['weight']
    health_record.height = payload['height']
    health_record.temperature = payload['temperature']
    health_record.note = payload['note']
    db.session.commit()
    return jsonify({
        "message": "updated successfully",
        "data":{
            "id": health_record.id,
            "student_id": student_id,
            "weight": payload['weight'],
            "height": payload['height'],
            "temperature": payload['temperature'],
            "note": payload['note']
        }
    })

@health_api.route("/api/classes/<int:class_id>/temperatures", methods=["GET"])
def get_class_temperatures(class_id):
    # optional: lọc theo ngày (YYYY-MM-DD)
    date_str = request.args.get("date")
    day_start = day_end = None
    if date_str:
        d = datetime.strptime(date_str, "%Y-%m-%d").date()
        day_start = datetime.combine(d, time.min)
        day_end = datetime.combine(d, time.max)

    HR = aliased(HealthRecord)

    # subquery lấy lần đo mới nhất theo student_id
    subq = db.session.query(
        HealthRecord.student_id.label("student_id"),
        func.max(HealthRecord.date_created).label("max_date")
    )

    if day_start and day_end:
        subq = subq.filter(and_(HealthRecord.date_created >= day_start,
                                HealthRecord.date_created <= day_end))

    subq = subq.group_by(HealthRecord.student_id).subquery()

    # lấy danh sách học sinh trong lớp + join lần đo mới nhất (nếu có)
    q = db.session.query(
        Student.id,
        Student.name,
        HR.temperature,
        HR.date_created
    ).filter(Student.class_id == class_id) \
     .outerjoin(subq, subq.c.student_id == Student.id) \
     .outerjoin(HR, and_(HR.student_id == Student.id, HR.date_created == subq.c.max_date)) \
     .order_by(Student.name.asc())

    data = []
    for sid, name, temp, dt in q.all():
        data.append({
            "student_id": sid,
            "student_name": name,
            "temperature": temp,  # có thể None nếu chưa đo
            "measured_at": dt.isoformat() if dt else None
        })

    return jsonify(data), 200