from flask import Blueprint, render_template, session
from app.models.student import Student

routeController = Blueprint('routeController', __name__)

@routeController.route('/')
def home():
    user = session.get('user')
    return render_template('home.html',Title='Trang chủ')

@routeController.route('/student')
def student():
    # Lấy tất cả học sinh từ database
    students = Student.query.order_by(Student.id).all()
    total_students = Student.query.count()
    return render_template('students.html', Title='Danh sách học sinh', students=students, total_students=total_students)

@routeController.route('/health')
def health():
    return render_template('health.html',Title='Sức khỏe')

@routeController.route('/schedule')
def schedule():
    return render_template('schedule.html',Title='Lịch học')

@routeController.route('/fee')
def fee():
    return render_template('fee.html',Title='Học phí')

@routeController.route('/report')
def report():
    return render_template('report.html',Title='Báo cáo')

@routeController.route('/signup', methods=['GET'])
def signup():
    return render_template('login.html')