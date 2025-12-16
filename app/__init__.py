from flask import Flask
from flask_admin import Admin
from flask_admin.contrib.sqla import ModelView
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager,current_user
from flask_migrate import Migrate
from flask_babel import Babel

db = SQLAlchemy()
login_manager = LoginManager()
admin = Admin(
    name="microblog",
)
babel = Babel()

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

    db.init_app(app)
    migrate = Migrate(app, db)
    login_manager.init_app(app)
    login_manager.login_view = "pages.signup"
    login_manager.login_message = "Bạn phải đăng nhập để xem chức năng này"
    babel.init_app(app)
    
    # Import models
    from app.models.Models import User, Role, Student
    
    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))

    # Create tables if not exist
    with app.app_context():
        db.create_all()

    from app.controllers.page_routes import page_routes
    from app.controllers.auth_routes import auth_service
    from app.controllers.user_api import user_api
    from app.controllers.student_api import student_api
    from app.controllers.kid_api import kid_api
    from app.controllers.health_api import health_api
    from app.controllers.tuitionFee_api import tuitionFee_api

    app.register_blueprint(page_routes)
    app.register_blueprint(auth_service)
    app.register_blueprint(user_api, url_prefix='/api/users')
    app.register_blueprint(student_api)
    app.register_blueprint(kid_api)
    app.register_blueprint(health_api)
    app.register_blueprint(tuitionFee_api)

    # flask-admin
    admin.init_app(app)
    admin.add_view(ModelView(User, db.session))
    admin.add_view(ModelView(Student, db.session))

    return app


