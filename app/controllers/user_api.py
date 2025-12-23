from flask import Blueprint, jsonify, request
from app import db
from app.models.DTO import UserDTO
from app.models.Models import User, users_to_dto, user_to_dto
from app.services.user_service import create_user_account, EmailAlreadyExists
from app.utils import _get_payload
from app.controllers.page_routes import roles_required
user_api = Blueprint('user_api', __name__, url_prefix="/api/users")


#GET ALL: GET/api/users
@user_api.route('/', methods=['GET'])
@roles_required('Admin')
def list_users():
    users = User.query.all()
    dtos = users_to_dto(users)
    data = [dto.__dict__ for dto in dtos]
    return jsonify(data),200

#GET ONE: GET/api/users/<int:user_id>
@user_api.route('/<int:user_id>', methods=['GET'])
@roles_required('Admin')
def get_user(user_id):
    user = User.query.filter_by(id=user_id).first()
    if not user:
        return jsonify({"message":"User not found"}),404

    dto = user_to_dto(user)
    return jsonify(dto.__dict__),200

#CREATE: POST/api/users
@user_api.route('/', methods=['POST'])
@roles_required('Admin', 'Teacher')
def create_user():
    payload = _get_payload()
    name = payload.get('name') or "guest"
    email = payload.get('email')
    phone = payload.get('phone')
    password = payload.get('password')
    confirm_password = payload.get('confirm_password')

    #Data validation
    if not all([email, phone, password, confirm_password]):
        return jsonify({"message":"Missing required fields"}), 400

    if password != confirm_password:
        return jsonify({"message":"Passwords do not match"}), 400

    try:
        user = create_user_account(
            name=name,
            email=email,
            phone=phone,
            password=password,
            role_name="Parent"
        )
    except EmailAlreadyExists:
        return jsonify({"message":"Email already exists"}), 400

    created_dto: UserDTO = user_to_dto(user)
    return jsonify(created_dto.__dict__), 201

#UPDATE: PUT/PATCH /api/users/<int:user_id>
@user_api.route('/<int:user_id>', methods=['PUT', 'PATCH'])
@roles_required('Admin')
def update_user(user_id):
    user = User.query.filter_by(id=user_id).first()
    if not user:
        return jsonify({"message":"User not found"}), 404
    
    payload = _get_payload()
    
    # Cập nhật các trường nếu có trong payload
    if 'name' in payload:
        user.name = payload.get('name')
    if 'email' in payload:
        user.email = payload.get('email')
    if 'phone' in payload:
        user.phone = payload.get('phone')
    if 'password' in payload:
        from werkzeug.security import generate_password_hash
        user.password_hash = generate_password_hash(payload.get('password'))

    db.session.commit()

    updated_dto = user_to_dto(user)
    return jsonify({
        "message":"User updated",
        "user": updated_dto.__dict__
    }), 200

#DELETE: DELETE /api/users/<int:user_id>
@user_api.route('/<int:user_id>', methods=['DELETE'])
@roles_required('Admin')
def delete_user(user_id):
    user = User.query.filter_by(id=user_id).first()
    if not user:
        return jsonify({"message":"User not found"}), 404

    db.session.delete(user)
    db.session.commit()
    return jsonify({"message":"User deleted"}, 200)





