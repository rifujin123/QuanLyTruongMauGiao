from flask import Flask, session
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv
import os

# Load biến môi trường từ file .env
load_dotenv()

db = SQLAlchemy()


def create_app():
    app = Flask(
        __name__,
        template_folder="templates",
        static_folder="static",
    )

    app.config["SQLALCHEMY_DATABASE_URI"] = "mysql+pymysql://root:password@localhost/truongmamnon?charset=utf8mb4"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = True
    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production")

    db.init_app(app)

    # Import models để đăng ký với SQLAlchemy
    from app.models.user import User
    from app.models.student import Student

    # Context processor để tự động truyền user vào tất cả templates
    @app.context_processor
    def inject_user():
        user = None
        if 'user_id' in session:
            user = User.query.get(session['user_id'])
        return dict(user=user)

    # Tạo bảng nếu chưa tồn tại
    with app.app_context():
        db.create_all()

    from app.controllers.routeController import routeController
    from app.controllers.authController import authController

    app.register_blueprint(routeController)
    app.register_blueprint(authController)

    return app