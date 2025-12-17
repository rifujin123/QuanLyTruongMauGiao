from flask import Flask, redirect, request, url_for
from flask_admin.contrib.sqla import ModelView
from flask_admin import BaseView, expose
from flask_admin.menu import MenuLink
from flask_login import current_user
from flask_migrate import Migrate
from wtforms import PasswordField
from werkzeug.security import generate_password_hash
from flask import flash
from app.models.Models import Setting

from app.extensions import db, login_manager, admin, babel


class SecureModelView(ModelView):
    # Ẩn trên danh sách
    column_exclude_list = ("password_hash", "account_status")
    # Ẩn trong form Create/Edit
    form_excluded_columns = ("password_hash", "account_status")
    def is_accessible(self):
        if not current_user.is_authenticated:
            return False
        roles = getattr(current_user, "roles", []) or []
        return any(getattr(r, "name", "") == "Admin" for r in roles)

    def inaccessible_callback(self, name, **kwargs):
        # /login của bạn chỉ POST => redirect về trang có form login/signup
        return redirect(url_for("pages.signup", next=request.url))

class UserAdminView(SecureModelView):
    column_list = ("name", "phone", "email", "roles", "last_login", "created_at")
    column_exclude_list = ("password_hash", "account_status")

    # ✅ form cho phép nhập mật khẩu dạng field riêng (không lưu trực tiếp)
    form_extra_fields = {
        "password": PasswordField("Mật khẩu")
    }

    # ✅ Cho phép tạo/sửa các field chính + password
    form_columns = ("name", "phone", "email", "roles", "password")

    form_excluded_columns = (
        "password_hash",
        "account_status",
        "children",
        "health_records_made",
        "last_login",
        "created_at",
    )

    def on_model_change(self, form, model, is_created):
        # Nếu có nhập password thì hash lại
        if getattr(form, "password", None) and form.password.data:
            model.password_hash = generate_password_hash(form.password.data)

        # Khi tạo mới mà không nhập password -> báo lỗi (tránh insert null)
        if is_created and not model.password_hash:
            raise ValueError("Vui lòng nhập mật khẩu khi tạo tài khoản mới.")


class QuyDinhView(BaseView):
    def is_accessible(self):
        return SecureModelView.is_accessible(self)

    def inaccessible_callback(self, name, **kwargs):
        return SecureModelView.inaccessible_callback(self, name, **kwargs)

    @expose("/", methods=("GET", "POST"))
    def index(self):
        from flask import flash
        from flask_login import current_user
        from app.extensions import db
        from app.models.Models import Classroom, Setting

        classrooms = db.session.query(Classroom).order_by(Classroom.name.asc()).all()

        # ✅ luôn lấy 1 record settings (thường chỉ có 1 dòng)
        settings = db.session.query(Setting).first()
        if not settings:
            settings = Setting(tuition_base=0, meal_fee_per_day=0, max_students_per_class=0,
                               updated_by=getattr(current_user, "id", None))
            db.session.add(settings)
            db.session.commit()

        if request.method == "POST":
            hoc_phi = (request.form.get("hoc_phi_co_ban") or "").strip()
            tien_an = (request.form.get("tien_an_ngay") or "").strip()
            class_id = request.form.get("class_id")
            max_slots = (request.form.get("max_slots") or "").strip()

            # ✅ lưu settings
            if hoc_phi:
                settings.tuition_base = int(hoc_phi)
            if tien_an:
                settings.meal_fee_per_day = int(tien_an)
            settings.updated_by = getattr(current_user, "id", None)

            # ✅ nếu muốn lưu thêm max_students_per_class chung toàn trường (optional)
            if max_slots:
                settings.max_students_per_class = int(max_slots)

            # ✅ update sĩ số theo lớp (classrooms.max_slots)
            if class_id and max_slots:
                cls = db.session.get(Classroom, int(class_id))
                if cls:
                    cls.max_slots = int(max_slots)
                else:
                    flash("Không tìm thấy lớp.", "error")

            db.session.commit()
            flash("Thay đổi quy định thành công.", "success")

        # ✅ đổ dữ liệu ra form (để input hiện giá trị hiện tại)
        return self.render(
            "admin/quydinh.html",
            classrooms=classrooms,
            settings=settings
        )


class ThongBaoView(BaseView):
    def is_accessible(self):
        return SecureModelView.is_accessible(self)

    def inaccessible_callback(self, name, **kwargs):
        return SecureModelView.inaccessible_callback(self, name, **kwargs)

    @expose("/", methods=("GET", "POST"))
    def index(self):
        from app.extensions import db
        from app.models.Models import Notification

        if request.method == "POST":
            title = (request.form.get("title") or "").strip()
            content = (request.form.get("content") or "").strip()
            target = request.form.get("target") or "all"

            # map dropdown -> giá trị lưu DB
            target_map = {
                "all": "All",
                "parent": "Parent",
                "teacher": "Teacher",
                "accountant": "Accountant",
            }
            target_role = target_map.get(target, "All")

            if not title or not content:
                flash("Vui lòng nhập tiêu đề và nội dung.", "error")
                return self.render("admin/thongbao.html")

            n = Notification(
                title=title,
                content=content,
                target_role=target_role,
                created_by=getattr(current_user, "id", None),
            )
            db.session.add(n)
            db.session.commit()

            flash(f"Đã lưu thông báo vào DB | Gửi tới: {target_role}", "success")

        return self.render("admin/thongbao.html")


class BaoCaoView(BaseView):
    def is_accessible(self):
        return SecureModelView.is_accessible(self)

    def inaccessible_callback(self, name, **kwargs):
        return SecureModelView.inaccessible_callback(self, name, **kwargs)

    @expose("/")
    def index(self):
        return self.render("admin/baocao.html")


def create_app():
    app = Flask(
        __name__,
        template_folder="templates",
        static_folder="static",
    )

    app.config.from_mapping(
        SQLALCHEMY_DATABASE_URI="mysql+pymysql://root:password@localhost/educa?charset=utf8mb4",
        SQLALCHEMY_TRACK_MODIFICATIONS=False,
        SECRET_KEY="khoideptrai",
    )

    # init extensions
    db.init_app(app)
    Migrate(app, db)

    login_manager.init_app(app)
    login_manager.login_view = "pages.signup"
    login_manager.login_message = "Bạn phải đăng nhập để xem chức năng này"

    babel.init_app(app)

    # Import models (sau khi db đã init)
    from app.models.Models import User, Role, Student  # noqa: F401

    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))

    # Create tables if not exist
    with app.app_context():
        db.create_all()

    # Register blueprints
    from app.controllers.page_routes import page_routes
    from app.controllers.auth_routes import auth_service
    from app.controllers.user_api import user_api
    from app.controllers.student_api import student_api
    from app.controllers.kid_api import kid_api
    from app.controllers.health_api import health_api
    from app.controllers.tuitionFee_api import tuitionFee_api

    app.register_blueprint(page_routes)
    app.register_blueprint(auth_service)
    app.register_blueprint(user_api, url_prefix="/api/users")
    app.register_blueprint(student_api)
    app.register_blueprint(kid_api)
    app.register_blueprint(health_api)
    app.register_blueprint(tuitionFee_api)

    # Flask-Admin
    admin.init_app(app)

    admin.add_view(UserAdminView(User, db.session, name="Quản lý người dùng"))
    admin.add_view(QuyDinhView(name="Thay đổi quy định", endpoint="quy-dinh"))
    admin.add_view(ThongBaoView(name="Thông báo", endpoint="thong-bao"))

    # logout endpoint: auth.logout (Blueprint('auth', __name__))
    admin.add_link(MenuLink(name="Đăng xuất", url="/logout"))

    return app
