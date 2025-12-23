import json
from pathlib import Path
from datetime import datetime, date
from werkzeug.security import generate_password_hash

from app import create_app, db
from app.models.Models import (
    Role, User, Classroom, Student, HealthRecord, 
    TuitionFee, Invoice, GenderEnum, PaymentStatusEnum
)

app = create_app()

def load_seed_data():
    seed_file = Path(__file__).parent.parent / 'seed_data.json'
    with open(seed_file, 'r', encoding='utf-8') as f:
        return json.load(f)

def create_roles():
    with app.app_context():
        data = load_seed_data()
        for role_data in data['roles']:
            role = Role(id=role_data['id'], name=role_data['name'])
            db.session.add(role)
        db.session.commit()
        print("Đã tạo roles!")

def create_users():
    with app.app_context():
        data = load_seed_data()
        for user_data in data['users']:
            user = User(
                name=user_data['name'],
                phone=user_data['phone'],
                email=user_data['email'],
                password_hash=generate_password_hash(user_data['password'])
            )
            # Tìm role theo tên
            role = Role.query.filter_by(name=user_data['role']).first()
            if role:
                user.roles.append(role)
            db.session.add(user)
        db.session.commit()
        print("Đã tạo users!")

def create_classrooms():
    with app.app_context():
        data = load_seed_data()
        for classroom_data in data['classrooms']:
            teacher_id = None
            if classroom_data.get('teacher_email'):
                teacher = User.query.filter_by(email=classroom_data['teacher_email']).first()
                if teacher:
                    teacher_id = teacher.id
            
            classroom = Classroom(
                name=classroom_data['name'],
                term=classroom_data['term'],
                max_slots=classroom_data['max_slots'],
                teacher_id=teacher_id
            )
            db.session.add(classroom)
        db.session.commit()
        print("Đã tạo classrooms!")

def create_students():
    with app.app_context():
        data = load_seed_data()
        for student_data in data['students']:
            # Tìm parent
            parent_id = None
            if student_data.get('parent_email'):
                parent = User.query.filter_by(email=student_data['parent_email']).first()
                if parent:
                    parent_id = parent.id
            
            # Tìm classroom
            class_id = None
            if student_data.get('classroom_name'):
                classroom = Classroom.query.filter_by(name=student_data['classroom_name']).first()
                if classroom:
                    class_id = classroom.id
            
            # Xử lý gender
            gender = GenderEnum.Nam
            if student_data['gender'] == 'Nữ':
                gender = GenderEnum.Nu
            
            student = Student(
                name=student_data['name'],
                age=student_data['age'],
                dob=date.fromisoformat(student_data['dob']),
                gender=gender,
                address=student_data['address'],
                entry_date=date.fromisoformat(student_data['entry_date']),
                parent_id=parent_id,
                class_id=class_id
            )
            db.session.add(student)
        db.session.commit()
        print("Đã tạo students!")

def create_healthRecords():
    with app.app_context():
        data = load_seed_data()
        for record_data in data['health_records']:
            # Tìm student
            student = Student.query.filter_by(name=record_data['student_name']).first()
            if not student:
                continue
            
            # Tìm teacher
            teacher = User.query.filter_by(email=record_data['teacher_email']).first()
            if not teacher:
                continue
            
            record = HealthRecord(
                weight=record_data['weight'],
                height=record_data['height'],
                temperature=record_data['temperature'],
                date_created=datetime.fromisoformat(record_data['date']),
                note=record_data['note'],
                student_id=student.id,
                teacher_id=teacher.id
            )
            db.session.add(record)
        db.session.commit()
        print("Đã tạo health records!")

def create_invoices():
    with app.app_context():
        data = load_seed_data()
        for invoice_data in data['invoices']:
            accountant = User.query.filter_by(email=invoice_data['accountant_email']).first()
            if not accountant:
                continue
            
            invoice = Invoice(
                date_created=datetime.fromisoformat(invoice_data['date']),
                amount=invoice_data['amount'],
                content=invoice_data['content'],
                accountant_id=accountant.id
            )
            db.session.add(invoice)
        db.session.commit()
        print("Đã tạo invoices!")

def create_tuitionfees():
    with app.app_context():
        data = load_seed_data()
        invoices = Invoice.query.all()
        
        for fee_data in data['tuition_fees']:
            student = Student.query.filter_by(name=fee_data['student_name']).first()
            if not student:
                continue
            
            payment_date = None
            if fee_data.get('payment_date'):
                payment_date = datetime.fromisoformat(fee_data['payment_date'])
            
            invoice_id = None
            if fee_data.get('invoice_index') is not None:
                idx = fee_data['invoice_index']
                if idx < len(invoices):
                    invoice_id = invoices[idx].id
            
            base_status = PaymentStatusEnum.Unpaid
            if fee_data.get('base_status') == 'Paid' or fee_data.get('status') == 'Paid':
                base_status = PaymentStatusEnum.Paid
            
            meal_status = PaymentStatusEnum.Unpaid
            if fee_data.get('meal_status') == 'Paid' or fee_data.get('status') == 'Paid':
                meal_status = PaymentStatusEnum.Paid
            
            extra_status = PaymentStatusEnum.Unpaid
            if fee_data.get('extra_status') == 'Paid' or fee_data.get('status') == 'Paid':
                extra_status = PaymentStatusEnum.Paid
            
            overall_status = PaymentStatusEnum.Unpaid
            if fee_data.get('status') == 'Paid':
                overall_status = PaymentStatusEnum.Paid
            
            fee = TuitionFee(
                month=fee_data['month'],
                year=fee_data['year'],
                fee_base=fee_data['fee_base'],
                meal_fee=fee_data['meal_fee'],
                extra_fee=fee_data['extra_fee'],
                payment_date=payment_date,
                base_status=base_status,
                meal_status=meal_status,
                extra_status=extra_status,
                status=overall_status,
                invoice_id=invoice_id,
                student_id=student.id
            )
            db.session.add(fee)
        db.session.commit()
        print("Đã tạo tuition fees!")

if __name__ == '__main__':
    create_roles()
    create_users()
    create_classrooms()
    create_students()
    create_healthRecords()
    create_invoices()
    create_tuitionfees()
