"""
Script để tạo dữ liệu mẫu cho bảng student
Chạy: python seed_students.py
"""
from app import create_app, db
from app.models.student import Student
from datetime import datetime, timedelta
import random

def create_sample_students():
    app = create_app()
    
    with app.app_context():
        # Kiểm tra xem đã có dữ liệu chưa
        existing_count = Student.query.count()
        if existing_count > 0:
            print(f"Đã có {existing_count} học sinh trong database. Bỏ qua việc tạo dữ liệu mẫu.")
            return
        
        # Danh sách tên học sinh mẫu
        student_names = [
            "Nguyễn Minh Anh",
            "Trần Văn Bảo",
            "Lê Thị Cẩm",
            "Phạm Đức Duy",
            "Hoàng Thị Hoa",
            "Vũ Minh Khang",
            "Đặng Thị Lan",
            "Bùi Văn Nam",
            "Ngô Thị Oanh",
            "Phan Đức Phúc"
        ]
        
        # Danh sách tên phụ huynh
        parent_names = [
            "Nguyễn Văn An",
            "Trần Thị Bình",
            "Lê Văn Cường",
            "Phạm Thị Dung",
            "Hoàng Văn Em",
            "Vũ Thị Giang",
            "Đặng Văn Hùng",
            "Bùi Thị Hương",
            "Ngô Văn Ích",
            "Phan Thị Kim"
        ]
        
        # Danh sách số điện thoại
        parent_phones = [
            "0912345678",
            "0923456789",
            "0934567890",
            "0945678901",
            "0956789012",
            "0967890123",
            "0978901234",
            "0989012345",
            "0990123456",
            "0901234567"
        ]
        
        # Danh sách tên lớp
        class_names = [
            "Lớp hoa sen",
            "Lớp hoa hồng",
            "Lớp hoa hướng dương"
        ]
        
        students_data = []
        
        for i in range(10):
            # Tính toán ngày sinh (từ 3-6 tuổi, tức là sinh từ 2018-2021)
            years_old = random.uniform(3, 6)
            birth_date = datetime.now() - timedelta(days=int(years_old * 365))
            
            # Giới tính
            gender = "Nam" if i % 2 == 0 else "Nữ"
            
            # Cân nặng và chiều cao phù hợp với độ tuổi
            if years_old < 4:
                weight = round(random.uniform(12.0, 18.0), 1)  # kg
                height = round(random.uniform(90.0, 105.0), 1)  # cm
            elif years_old < 5:
                weight = round(random.uniform(15.0, 20.0), 1)  # kg
                height = round(random.uniform(100.0, 115.0), 1)  # cm
            else:
                weight = round(random.uniform(18.0, 25.0), 1)  # kg
                height = round(random.uniform(110.0, 125.0), 1)  # cm
            
            # Tính BMI: BMI = weight (kg) / (height (m))^2
            height_m = height / 100
            bmi = round(weight / (height_m ** 2), 1)
            
            # Nhiệt độ cơ thể bình thường (36.5 - 37.5 độ C)
            temperature = round(random.uniform(36.5, 37.5), 1)
            
            # Phân lớp ngẫu nhiên
            class_name = random.choice(class_names)
            
            student = Student(
                name=student_names[i],
                date_of_birth=birth_date,
                gender=gender,
                weight=weight,
                height=height,
                bmi=bmi,
                temperature=temperature,
                class_name=class_name,
                parent_name=parent_names[i],
                parent_phone=parent_phones[i]
            )
            
            students_data.append(student)
        
        # Thêm tất cả vào database
        try:
            db.session.add_all(students_data)
            db.session.commit()
            print(f" Đã tạo thành công {len(students_data)} học sinh mẫu!")
            print("\nDanh sách học sinh đã tạo:")
            for student in students_data:
                print(f"  - {student.name} ({student.gender}), {student.class_name}, Ngày sinh: {student.date_of_birth.strftime('%d/%m/%Y')}")
        except Exception as e:
            db.session.rollback()
            print(f" Lỗi khi tạo dữ liệu: {str(e)}")

if __name__ == "__main__":
    create_sample_students()

