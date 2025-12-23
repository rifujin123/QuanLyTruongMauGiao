import json
from flask import Blueprint, request, jsonify
from flask_login import current_user
from app.models.Models import Student
from app.utils import format_date
from app.controllers.page_routes import roles_required


kid_api = Blueprint('kid_api', __name__)

#GET: GET /api/kids/<int:parent_id>
@kid_api.route('/api/kids/<int:parent_id>', methods=['GET'])
@roles_required('Parent', 'Teacher', 'Admin')
def get_kids(parent_id):
    kids = Student.query.filter_by(parent_id=parent_id).all()
    kids_data = []
    for kid in kids:
        kids_data.append({
            "id": kid.id if kid.id else "",
            "name": kid.name if kid.name else "",
            "dob": format_date(kid.dob) if kid.dob else "",
            "gender": kid.gender.value,
            "address": kid.address if kid.address else "",
            "class": {
                "id": kid.classroom.id if kid.classroom else "",
                "name": kid.classroom.name if kid.classroom else ""
            },
            "parent":{
                "id": kid.parent.id if kid.parent else "",
                "name": kid.parent.name if kid.parent else "",
                "phone": kid.parent.phone if kid.parent else ""
            }
            
        })
    return jsonify(kids_data), 200

