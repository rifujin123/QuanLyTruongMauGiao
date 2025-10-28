# Hệ Thống Quản Lý Trường Mẫu Giáo

Hệ thống quản lý toàn diện cho trường mẫu giáo, được xây dựng bằng Python Flask với mô hình MVC.

## Tính Năng

-  Quản lý thông tin trường học
-  Quản lý học sinh
-  Quản lý giáo viên và nhân viên
-  Quản lý lớp học
-  Quản lý thời khóa biểu
-  Quản lý hoạt động hàng ngày
-  Quản lý học phí
-  Quản lý bữa ăn
-  Báo cáo và thống kê

## Cấu Trúc Dự Án

```
QuanLyTruongMauGiao/
├── app/
│   ├── controllers/    # Xử lý logic nghiệp vụ
│   ├── models/        # Mô hình dữ liệu
│   └── views/         # Giao diện người dùng
├── static/           # File tĩnh (CSS, JS, images)
├── templates/        # Templates HTML
├── requirements.txt  # Các thư viện cần thiết
└── run.py           # File khởi chạy ứng dụng
```

## Yêu Cầu Hệ Thống

- Python 3.7+
- Các thư viện Python (được liệt kê trong `requirements.txt`):
  - Flask==3.0.0
  - Werkzeug==3.0.1
  - Jinja2==3.1.2
  - và các thư viện phụ thuộc khác

## Hướng Dẫn Cài Đặt

1. Clone repository về máy:
   ```bash
   git clone https://github.com/rifujin123/QuanLyTruongMauGiao.git
   cd QuanLyTruongMauGiao
   ```

2. Tạo môi trường ảo Python:
   ```bash
   python -m venv venv
   ```

3. Kích hoạt môi trường ảo:
   - Windows:
     ```bash
     .\venv\Scripts\activate
     ```
   - Linux/Mac:
     ```bash
     source venv/bin/activate
     ```

4. Cài đặt các thư viện cần thiết:
   ```bash
   pip install -r requirements.txt
   ```

5. Khởi chạy ứng dụng:
   ```bash
   python run.py
   ```

6. Truy cập ứng dụng tại địa chỉ: `http://127.0.0.1:5000`

## Công Nghệ Sử Dụng

- 🐍 Python Flask - Web Framework
- 🎨 Bootstrap 5 - Frontend Framework
- 📝 Jinja2 - Template Engine
- 🔒 Werkzeug - WSGI Utility Library
- 🗄️ SQLAlchemy (coming soon) - ORM và Database

## Đóng Góp

Mọi đóng góp đều được chào đón! Vui lòng:
1. Fork dự án
2. Tạo branch mới (`git checkout -b feature/AmazingFeature`)
3. Commit thay đổi (`git commit -m 'Add some AmazingFeature'`)
4. Push lên branch (`git push origin feature/AmazingFeature`)
5. Mở Pull Request

## Giấy Phép

Dự án này được phân phối dưới giấy phép MIT License.

## Liên Hệ

- GitHub: [@rifujin123](https://github.com/rifujin123)
- Email: [2351050085khoi@ou.edu.vn]

---
⭐️ From [rifujin123](https://github.com/rifujin123)