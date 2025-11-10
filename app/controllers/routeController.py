from flask import Blueprint, render_template

routeController = Blueprint('routeController', __name__)

@routeController.route('/')
def home():
    return render_template('home.html',Title='Trang chủ')

@routeController.route('/student')
def student():
    return render_template('student.html',Title='Danh sách học sinh')

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