from flask import Blueprint, render_template, redirect, url_for, abort, request, jsonify
from flask_login import login_required, current_user
from functools import wraps

from app.models.Models import Classroom, Student
from app.services.class_service import get_all_class
from app.services.health_record_service import count_student_record, count_students_recorded_today, count_students_not_recorded_today
from app.services.student_service import get_all_students, total_student, search_students, \
    get_student_count_by_classroom, total_male_count, total_female_count, classroom_student_count, get_gender_stats_by_class

page_routes = Blueprint('pages', __name__)

#decorator wrap login_required for rbac
def roles_required(*role_names):
    """Custom decorator to check if user has required roles."""
    def decorator(f):
        @wraps(f)
        @login_required
        def decorated_function(*args, **kwargs):
            user_roles = [role.name for role in current_user.roles]
            if not any(role in user_roles for role in role_names):
                abort(403)
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

@page_routes.route('/')
def home():
    if current_user.is_authenticated:
        user_roles = [role.name for role in current_user.roles]
        if 'Admin' in user_roles:
            return redirect(url_for('admin.index'))
    return render_template('pages/home.html', Title='Trang chủ')


@page_routes.route('/student',methods=['POST','GET'])
@roles_required('Teacher')
def student():
    all_classrooms = get_all_class()
    total_students = total_student(all_classrooms)

    classroom_student_counts = {}
    for classroom in all_classrooms:
        classroom_student_counts[classroom.id] = get_student_count_by_classroom(classroom.id)

    q = request.args.get('q','',type = str).strip()
    
    students = search_students(q)

    return render_template('pages/student.html', Title='Danh sách học sinh', students=students, classrooms=all_classrooms, total_students=total_students, classroom_student_counts=classroom_student_counts)


@page_routes.route('/health')
@roles_required('Teacher')
def health():
    from app.models.Models import HealthRecord
    all_classrooms = Classroom.query.all()
    all_students = Student.query.all()
    recorded_students = count_students_recorded_today()
    unrecorded_students = count_students_not_recorded_today()

    return render_template('pages/health.html', Title='Sức khỏe',students=all_students,classrooms=all_classrooms,recorded_students=recorded_students,unrecorded_students=unrecorded_students)

@page_routes.route('/classsize')
@roles_required('Teacher')
def classsize():
    all_classrooms = Classroom.query.all()
    all_students = Student.query.all()
    capacity = 100
    total_students = total_student(all_classrooms)
    male_count = total_male_count()
    female_count = total_female_count()
    

    gender_stats_by_class = get_gender_stats_by_class(all_classrooms)
    
    return render_template('pages/classSize.html', Title="Quản lý sĩ số lớp", classrooms=all_classrooms, students=all_students, classroom_student_count=classroom_student_count(), male_count=male_count, female_count=female_count, total_students=total_students,capacity=capacity, get_gender_stats_by_class=gender_stats_by_class)

@page_routes.route('/fee')
@roles_required('Accountant')
def fee():
    return render_template('pages/fee.html', Title='Học phí')

@page_routes.route('/report')
@roles_required('Accountant')
def report():
    return render_template('pages/report.html', Title='Doanh thu')

@page_routes.route('/kidtracking')
@roles_required('Parent')
def kid():
    parent_id = current_user.id
    student = Student.query.filter_by(parent_id=parent_id).first()

    # Nếu phụ huynh chưa có trẻ, tránh lỗi khi đếm record
    if student:
        count = count_student_record(student.id)
        student_id = student.id
    else:
        count = 0
        student_id = None

    return render_template(
        'pages/kid.html',
        Title="Thông tin trẻ",
        parent_id=parent_id,
        student_id=student_id,
        count=count
    )

@page_routes.route('/feetracking')
@roles_required('Parent')
def feetracking():
    return render_template('pages/feeTracking.html', Title = "Theo dõi học phí")

@page_routes.route('/signup', methods=['GET'])
def signup():
    if current_user.is_authenticated:
        user_roles = [role.name for role in current_user.roles]
        if 'Admin' in user_roles:
            return redirect(url_for('admin.index'))
    return render_template('pages/login.html')

@page_routes.route('/administrator')
@roles_required('Admin')
def administrator():
    return redirect(url_for('admin.index'))


