from flask import Blueprint, request, url_for, redirect, flash, current_app
from flask_login import login_user, logout_user, current_user
from flask_principal import identity_changed, Identity

from app.services.auth_service import (
    authenticate_user,
    signup_parent_user,
    MissingFieldError,
    PasswordMismatchError,
    InvalidCredentials,
)
from app.services.user_service import EmailAlreadyExists

auth_service = Blueprint('auth', __name__)


@auth_service.route('/signup', methods=['POST'])
def signup():
    if current_user.is_authenticated:
        # Nếu đã đăng nhập, kiểm tra role để redirect
        user_roles = [role.name for role in current_user.roles]
        if 'Admin' in user_roles:
            return redirect(url_for('admin.index'))
        return redirect(url_for('pages.home'))

    # get data from form
    name = request.form.get('username') or "guest"
    email = request.form.get('email')
    phone = request.form.get('phone')
    password = request.form.get('password')
    confirm_password = request.form.get('confirmPassword')

    try:
        signup_parent_user(
            name=name,
            email=email,
            phone=phone,
            password=password,
            confirm_password=confirm_password,
        )
    except MissingFieldError:
        flash('Vui lòng nhập đầy đủ thông tin', 'error')
        return redirect(url_for('pages.signup'))
    except PasswordMismatchError:
        flash('Mật khẩu xác nhận không khớp', 'error')
        return redirect(url_for('pages.signup'))
    except EmailAlreadyExists:
        flash('Email đã được sử dụng', 'error')
        return redirect(url_for('pages.signup'))

    flash('Đăng ký thành công! Vui lòng đăng nhập', 'success')
    return redirect(url_for('pages.signup'))


@auth_service.route('/login', methods=['POST'])
def login():
    if current_user.is_authenticated:
        # Nếu đã đăng nhập, kiểm tra role để redirect
        user_roles = [role.name for role in current_user.roles]
        if 'Admin' in user_roles:
            return redirect(url_for('admin.index'))
        return redirect(url_for('pages.home'))

    # Get data from form
    email = request.form.get('email')
    password = request.form.get('password')

    try:
        user = authenticate_user(email, password)
        login_user(user)
        identity_changed.send(current_app, identity=Identity(user.id))
        flash('Đăng nhập thành công!', 'success')
        
        # Kiểm tra role để redirect đúng trang
        user_roles = [role.name for role in user.roles]
        if 'Admin' in user_roles:
            return redirect(url_for('admin.index'))
        return redirect(url_for('pages.home'))
    except MissingFieldError:
        flash('Vui lòng nhập đầy đủ thông tin', 'error')
    except InvalidCredentials:
        flash('Email hoặc mật khẩu không đúng', 'error')

    return redirect(url_for('pages.signup'))


@auth_service.route('/logout', methods=['GET', 'POST'])
def logout():
    logout_user()
    return redirect(url_for('pages.home'))
