from flask import Flask
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

def create_app():
    app = Flask(__name__)
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///database.sqlite3"
    db.init_app(app)

    # Import & register blueprint route ở đây nếu cần
    # from app.controllers.routes import routes
    # app.register_blueprint(routes)

    return app