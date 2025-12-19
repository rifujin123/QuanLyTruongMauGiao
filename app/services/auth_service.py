from dataclasses import dataclass
from werkzeug.security import check_password_hash

from app.models.Models import User
from app.services.user_service import create_user_account, EmailAlreadyExists


class MissingFieldError(Exception):
    pass


class PasswordMismatchError(Exception):
    pass


class InvalidCredentials(Exception):
    pass


class InvalidPhoneError(Exception):
    pass


@dataclass
class SignupResult:
    user: User


def signup_parent_user(name: str, email: str, phone: str, password: str, confirm_password: str) -> SignupResult:
    if not all([name, email, phone, password, confirm_password]):
        raise MissingFieldError()
    if password != confirm_password:
        raise PasswordMismatchError()
    if phone and len(phone.strip()) > 10:
        raise InvalidPhoneError()

    user = create_user_account(
        name=name,
        email=email,
        phone=phone,
        password=password,
        role_name="Parent",
        allow_custom_role=False,
    )
    return SignupResult(user=user)


def authenticate_user(email: str, password: str) -> User:
    if not all([email, password]):
        raise MissingFieldError()

    user = User.query.filter_by(email=email).first()
    if user and check_password_hash(user.password_hash, password):
        return user

    raise InvalidCredentials()

