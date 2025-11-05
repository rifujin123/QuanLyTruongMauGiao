from flask import Blueprint, render_template, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from app.models.users import User
from app import db

routes = Blueprint('routes', __name__)

# Route mặc định: chuyển về dashboard
@routes.route('/')
def index():
    return render_template('home.html')

# Route chức năng

@routes.route('/dashboard')
def dashboard():
    return render_template('home.html')

@routes.route('/signup', methods=['GET', 'POST'])
def signup():
    return render_template('login.html')

#Endpoint login/register

def validate_register_payload(data):
    phone = data.get('phone')
    email = data.get('email')
    password = data.get('password')

    errors = []
    if not phone:
        errors.append('Phone is required')
    if not email:
        errors.append('Email is required')
    if not password:
        errors.append("Password is required")
    return errors, phone, email, password

@routes.route('/api/auth/register', methods=['POST'])
def api_register():
    data = request.get_json(silent=True) or {}
    errors, phone, email, password = validate_register_payload(data)
    if errors:
        return jsonify(
            success=False,
            message="Validation Failed",
            errors=errors
        ), 400

    # Check if phone or email already exists in the database
    existing_user = User.query.filter((User.phone == phone) | (User.email == email)).first()
    if existing_user:
        return jsonify(
            success=False,
            message='Phone number or email already exists'
        ), 400

    user = User(phone=phone, email=email, password_hash=generate_password_hash(password))
    db.session.add(user)
    db.session.commit()
    return jsonify(
        success=True,
        message='Registration successful'
    ), 201

# @routes.route('/api/auth/login', methods=['POST'])
# def api_login():
    