import enum
from typing import List
from datetime import datetime

from sqlalchemy import case, and_
from sqlalchemy.ext.hybrid import hybrid_property

from app import db

from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import relationship, column_property

from app import db
from datetime import datetime, date
from flask_login import UserMixin

from app.models.DTO import UserDTO


#Enums
class GenderEnum(enum.Enum):
    Nam = "Nam"
    Nu = "Nữ"

class PaymentStatusEnum(enum.Enum):
    Paid = "Paid"
    Unpaid = "Unpaid"

#Association Class
roles_users = db.Table('roles_users',
    db.Column('user_id', db.Integer(), db.ForeignKey('users.id')),
    db.Column('role_id', db.Integer(), db.ForeignKey('roles.id'))
)

#Database Models
class User(db.Model, UserMixin):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), default='guest')
    phone = db.Column(db.String(10), nullable = False,unique=True)
    email = db.Column(db.String(50), nullable = False, unique = True)
    password_hash = db.Column(db.String(255),nullable = False)
    account_status = db.Column(db.Boolean(), default=False)
    last_login = db.Column(db.DateTime, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    #relationships
    roles = db.relationship('Role',secondary= roles_users,backref= 'roled')
    children = db.relationship('Student', back_populates='parent')

class Role(db.Model):
    __tablename__ = "roles"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)

class Classroom(db.Model):
    __tablename__ = "classrooms"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    term = db.Column(db.String(100), nullable=False)
    max_slots = db.Column(db.Integer, nullable=False)
    #relationships
    teacher_id = db.Column(db.Integer, db.ForeignKey('users.id'))

class Student(db.Model):
    __tablename__ = "students"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    age = db.Column(db.Integer, nullable=False)
    dob = db.Column(db.Date, nullable=False)
    gender = db.Column(db.Enum(GenderEnum), nullable=False)
    address = db.Column(db.String(255), nullable=False)
    entry_date = db.Column(db.Date, default=date.today)  # Ngày nhập học
    #relationships
    parent_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    class_id = db.Column(db.Integer, db.ForeignKey('classrooms.id'))
    tuitionfee = relationship("TuitionFee", uselist=False, back_populates="student")
    parent = db.relationship("User", foreign_keys = [parent_id],back_populates="children")
    classroom = db.relationship("Classroom", foreign_keys=[class_id])

    @property
    def formatted_dob(self):
        if self.dob:
            return self.dob.strftime("%d/%m/%Y")
        return ""

class HealthRecord(db.Model):
    __tablename__ = "health_records"
    id = db.Column(db.Integer, primary_key=True)
    weight = db.Column(db.Float, nullable=False)
    height = db.Column(db.Float, nullable=False)
    temperature = db.Column(db.Float, nullable=False)
    date_created = db.Column(db.DateTime, default=datetime.utcnow)
    note = db.Column(db.String(255), nullable=False)
    #FK
    student_id = db.Column(db.Integer, db.ForeignKey('students.id'))
    teacher_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    #relationships
    student = db.relationship("Student",backref="health_records")
    teacher = db.relationship("User",backref="health_records_made")

class TuitionFee(db.Model):
    __tablename__ = "fees"
    id = db.Column(db.Integer, primary_key=True)
    month = db.Column(db.Integer, nullable=False)
    year = db.Column(db.Integer, nullable=False)
    fee_base = db.Column(db.Float, nullable=False)
    meal_fee = db.Column(db.Float, nullable=False)
    extra_fee = db.Column(db.Float, nullable=False)
    total = column_property(fee_base + meal_fee + extra_fee)

    base_status = db.Column(db.Enum(PaymentStatusEnum), default=PaymentStatusEnum.Unpaid, nullable=False)
    meal_status = db.Column(db.Enum(PaymentStatusEnum), default=PaymentStatusEnum.Unpaid, nullable=False)
    extra_status = db.Column(db.Enum(PaymentStatusEnum), default=PaymentStatusEnum.Unpaid, nullable=False)

    payment_date = db.Column(db.DateTime)

    status = db.Column(db.Enum(PaymentStatusEnum), nullable=False, default=PaymentStatusEnum.Unpaid)
    #relationships
    invoice_id = db.Column(db.Integer, db.ForeignKey('invoices.id'))
    student_id = db.Column(db.Integer, db.ForeignKey('students.id'))
    student = relationship("Student", uselist=False, back_populates="tuitionfee")

    # Overall status tính từ 3 khoản
    @hybrid_property
    def overall_status(self):
        if (self.base_status == PaymentStatusEnum.Paid and
                self.meal_status == PaymentStatusEnum.Paid and
                self.extra_status == PaymentStatusEnum.Paid):
            return PaymentStatusEnum.Paid
        return PaymentStatusEnum.Unpaid

    @overall_status.expression
    def overall_status(cls):
        return case(
            (
                and_(cls.base_status == PaymentStatusEnum.Paid,
                     cls.meal_status == PaymentStatusEnum.Paid,
                     cls.extra_status == PaymentStatusEnum.Paid),
                PaymentStatusEnum.Paid
            ),
            else_=PaymentStatusEnum.Unpaid
        )

    def sync_overall_status(self):
        """Gọi sau khi cập nhật 1 khoản để đồng bộ status tổng."""
        self.status = self.overall_status
        if self.status == PaymentStatusEnum.Paid and self.payment_date is None:
            self.payment_date = datetime.utcnow()


class Invoice(db.Model):
    __tablename__ = "invoices"
    id = db.Column(db.Integer, primary_key=True)
    date_created = db.Column(db.DateTime, default=datetime.utcnow)
    amount = db.Column(db.Float, nullable=False)
    content: db.Column = db.Column(db.String(255), nullable=False)
    #relationships
    accountant_id = db.Column(db.Integer, db.ForeignKey('users.id'))

#Mapping model to DTO
def user_to_dto(user: User) -> UserDTO:
    return UserDTO(
        id = user.id,
        name = user.name,
        phone = user.phone,
        email = user.email,
        roles = [r.name for r in user.roles]
    )

def users_to_dto(users: List[User]) -> List[UserDTO]:
    return [user_to_dto(u) for u in users]

def dto_to_user(dto:UserDTO) -> User:
    user = User(
        name = dto.name,
        phone = dto.phone,
        email = dto.email
    )
    return user

