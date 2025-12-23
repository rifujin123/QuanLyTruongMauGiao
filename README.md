# Hệ Thống Quản Lý Trường Mẫu Giáo

Hệ thống quản lý toàn diện cho trường mẫu giáo, được xây dựng bằng Python Flask.

### 1. Cấu hình Database

Tạo database MySQL tên `educa` và cập nhật thông tin kết nối trong `app/__init__.py`:

```python
SQLALCHEMY_DATABASE_URI="mysql+pymysql://root:password@localhost/educa?charset=utf8mb4"
```

## Trình Tự Chạy

### Bước 1: Seed dữ liệu (chỉ chạy 1 lần)

Chạy file `dao.py` để tạo dữ liệu mẫu:

```bash
python app/dao.py
```

### Bước 2: Khởi động ứng dụng

Chạy file `run.py` để khởi động server:

```bash
python run.py
```

Truy cập ứng dụng tại: `http://127.0.0.1:5000`

## Tài Khoản Mặc Định

Sau khi chạy `dao.py`, các tài khoản mẫu (mật khẩu: `123456`) riêng admin mật khẩu là admin:

- **Admin**: educa@admin.com
- **Teacher**: teacher@example.com
- **Parent**: parent@example.com
- **Accountant**: accountant@example.com

## Deploy

Ứng dụng đã được deploy lên pythonanywhere: `https://letuankhoi123.pythonanywhere.com/`

## Lưu Ý

- Chạy `dao.py` trước khi chạy `run.py` lần đầu tiên
- File `dao.py` chỉ cần chạy 1 lần để khởi tạo dữ liệu
- Đảm bảo MySQL đã được cài đặt và chạy trước khi khởi động ứng dụng
