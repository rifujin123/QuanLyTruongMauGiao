import sys
import json
import os
from pathlib import Path
from datetime import datetime, date

# Add project root to Python path
# This allows running the script from any directory
project_root = Path(__file__).parent.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

from werkzeug.security import generate_password_hash

from app import create_app, db
from app.models.Models import (
    Role,
    User,
    Classroom,
    Student,
    HealthRecord,
    TuitionFee,
    Invoice,
    GenderEnum,
    PaymentStatusEnum,
)

app = create_app()

# Load seed data from JSON
def load_seed_data():
    seed_file = project_root / 'seed_data.json'
    with open(seed_file, 'r', encoding='utf-8') as f:
        return json.load(f)


def create_roles():
    with app.app_context():
        seed_data = load_seed_data()
        roles_data = seed_data['roles']
        
        roles = []
        for role_data in roles_data:
            role = Role(id=role_data['id'], name=role_data['name'])
            roles.append(role)
        
        db.session.add_all(roles)
        db.session.commit()
        print(f"Roles created successfully! ({len(roles)} roles)")

def create_users():
    with app.app_context():
        seed_data = load_seed_data()
        users_data = seed_data['users']
        
        # Get role mappings
        role_map = {
            'Admin': Role.query.filter_by(name='Admin').first(),
            'Teacher': Role.query.filter_by(name='Teacher').first(),
            'Parent': Role.query.filter_by(name='Parent').first(),
            'Accountant': Role.query.filter_by(name='Accountant').first(),
        }
        
        user_entities = []
        for user_data in users_data:
            user = User(
                name=user_data['name'],
                phone=user_data['phone'],
                email=user_data['email'],
                password_hash=generate_password_hash(user_data['password']),
            )
            role = role_map.get(user_data['role'])
            if role:
                user.roles.append(role)
            user_entities.append(user)

        db.session.add_all(user_entities)
        db.session.commit()
        print(f"Users created successfully! ({len(user_entities)} users)")

def create_students():
    with app.app_context():
        seed_data = load_seed_data()
        students_data = seed_data['students']
        
        # Get parent by email
        parent_map = {}
        for student_data in students_data:
            parent_email = student_data.get('parent_email')
            if parent_email and parent_email not in parent_map:
                parent = User.query.filter_by(email=parent_email).first()
                if parent:
                    parent_map[parent_email] = parent.id
        
        # Get classroom by name
        classroom_map = {}
        for student_data in students_data:
            classroom_name = student_data.get('classroom_name')
            if classroom_name and classroom_name not in classroom_map:
                classroom = Classroom.query.filter_by(name=classroom_name).first()
                if classroom:
                    classroom_map[classroom_name] = classroom.id
        
        # Gender enum mapping
        gender_map = {
            'Nam': GenderEnum.Nam,
            'Nữ': GenderEnum.Nu,
        }

        students = []
        for student_data in students_data:
            parent_email = student_data.get('parent_email')
            classroom_name = student_data.get('classroom_name')
            parent_id = parent_map.get(parent_email) if parent_email else None
            class_id = classroom_map.get(classroom_name) if classroom_name else None
            
            student = Student(
                name=student_data['name'],
                age=student_data['age'],
                dob=date.fromisoformat(student_data['dob']),
                gender=gender_map.get(student_data['gender'], GenderEnum.Nam),
                address=student_data['address'],
                entry_date=date.fromisoformat(student_data['entry_date']),
                parent_id=parent_id,
                class_id=class_id,
            )
            students.append(student)

        db.session.add_all(students)
        db.session.commit()
        print(f"Students created successfully! ({len(students)} students)")

def create_classrooms():
    with app.app_context():
        seed_data = load_seed_data()
        classrooms_data = seed_data['classrooms']
        
        # Get teacher by email
        teacher_users = {}
        for classroom_data in classrooms_data:
            teacher_email = classroom_data.get('teacher_email')
            if teacher_email and teacher_email not in teacher_users:
                teacher = User.query.filter_by(email=teacher_email).first()
                if teacher:
                    teacher_users[teacher_email] = teacher.id
        
        classrooms = []
        for classroom_data in classrooms_data:
            teacher_email = classroom_data.get('teacher_email')
            teacher_id = teacher_users.get(teacher_email) if teacher_email else None
            
            classroom = Classroom(
                name=classroom_data['name'],
                term=classroom_data['term'],
                max_slots=classroom_data['max_slots'],
                teacher_id=teacher_id,
            )
            classrooms.append(classroom)

        db.session.add_all(classrooms)
        db.session.commit()
        print(f"Classrooms created successfully! ({len(classrooms)} classrooms)")

def create_healthRecords():
    """Tạo một số phiếu sức khỏe demo cho học sinh."""
    with app.app_context():
        seed_data = load_seed_data()
        health_records_data = seed_data['health_records']
        
        # Get student by name
        student_map = {}
        for record_data in health_records_data:
            student_name = record_data.get('student_name')
            if student_name and student_name not in student_map:
                student = Student.query.filter_by(name=student_name).first()
                if student:
                    student_map[student_name] = student.id
        
        # Get teacher by email
        teacher_map = {}
        for record_data in health_records_data:
            teacher_email = record_data.get('teacher_email')
            if teacher_email and teacher_email not in teacher_map:
                teacher = User.query.filter_by(email=teacher_email).first()
                if teacher:
                    teacher_map[teacher_email] = teacher.id

        records = []
        for record_data in health_records_data:
            student_name = record_data.get('student_name')
            teacher_email = record_data.get('teacher_email')
            student_id = student_map.get(student_name) if student_name else None
            teacher_id = teacher_map.get(teacher_email) if teacher_email else None
            
            if not student_id or not teacher_id:
                continue
            
            r = HealthRecord(
                weight=record_data['weight'],
                height=record_data['height'],
                temperature=record_data['temperature'],
                date_created=datetime.fromisoformat(record_data['date']),
                note=record_data['note'],
                student_id=student_id,
                teacher_id=teacher_id,
            )
            records.append(r)

        db.session.add_all(records)
        db.session.commit()
        print(f"Health records created successfully! ({len(records)} records)")

def create_invoices():
    with app.app_context():
        seed_data = load_seed_data()
        invoices_data = seed_data['invoices']
        
        # Get accountant by email
        accountant_map = {}
        for invoice_data in invoices_data:
            accountant_email = invoice_data.get('accountant_email')
            if accountant_email and accountant_email not in accountant_map:
                accountant = User.query.filter_by(email=accountant_email).first()
                if accountant:
                    accountant_map[accountant_email] = accountant.id

        invoices = []
        for invoice_data in invoices_data:
            accountant_email = invoice_data.get('accountant_email')
            accountant_id = accountant_map.get(accountant_email) if accountant_email else None
            
            if not accountant_id:
                continue
            
            inv = Invoice(
                date_created=datetime.fromisoformat(invoice_data['date']),
                amount=invoice_data['amount'],
                content=invoice_data['content'],
                accountant_id=accountant_id,
            )
            invoices.append(inv)

        db.session.add_all(invoices)
        db.session.commit()
        print(f"Invoices created successfully! ({len(invoices)} invoices)")

def create_tuitionfees():
    with app.app_context():
        seed_data = load_seed_data()
        fees_data = seed_data['tuition_fees']
        
        # Get student by name
        student_map = {}
        for fee_data in fees_data:
            student_name = fee_data.get('student_name')
            if student_name and student_name not in student_map:
                student = Student.query.filter_by(name=student_name).first()
                if student:
                    student_map[student_name] = student.id
        
        # Get invoices list for indexing
        invoices = Invoice.query.all()
        
        # Status enum mapping (dùng chung cho các trường status)
        status_map = {
            'Paid': PaymentStatusEnum.Paid,
            'Unpaid': PaymentStatusEnum.Unpaid,
        }

        fees = []
        for fee_data in fees_data:
            student_name = fee_data.get('student_name')
            invoice_index = fee_data.get('invoice_index')
            student_id = student_map.get(student_name) if student_name else None
            
            if not student_id:
                continue
            
            payment_date = None
            if fee_data.get('payment_date'):
                payment_date = datetime.fromisoformat(fee_data['payment_date'])
            
            invoice_id = None
            if invoice_index is not None and invoice_index < len(invoices):
                invoice_id = invoices[invoice_index].id

            # Đọc trạng thái từng khoản; fallback về 'Unpaid' nếu thiếu
            base_status_str = fee_data.get('base_status', fee_data.get('status', 'Unpaid'))
            meal_status_str = fee_data.get('meal_status', fee_data.get('status', 'Unpaid'))
            extra_status_str = fee_data.get('extra_status', fee_data.get('status', 'Unpaid'))
            overall_status_str = fee_data.get('status', 'Unpaid')

            fee = TuitionFee(
                month=fee_data['month'],
                year=fee_data['year'],
                fee_base=fee_data['fee_base'],
                meal_fee=fee_data['meal_fee'],
                extra_fee=fee_data['extra_fee'],
                payment_date=payment_date,
                base_status=status_map.get(base_status_str, PaymentStatusEnum.Unpaid),
                meal_status=status_map.get(meal_status_str, PaymentStatusEnum.Unpaid),
                extra_status=status_map.get(extra_status_str, PaymentStatusEnum.Unpaid),
                status=status_map.get(overall_status_str, PaymentStatusEnum.Unpaid),
                invoice_id=invoice_id,
                student_id=student_id,
            )
            fees.append(fee)

        db.session.add_all(fees)
        db.session.commit()
        print(f"Tuition fees created successfully! ({len(fees)} fees)")

if __name__ == '__main__':
    create_roles()
    create_users()
    create_classrooms()
    create_students()
    create_healthRecords()
    create_invoices()
    create_tuitionfees()