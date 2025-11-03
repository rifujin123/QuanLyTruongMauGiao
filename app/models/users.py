from flask_sqlalchemy import SQLAlchemy
from app import db
from datetime import datetime

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    phone = db.Column(db.String(10), unique=True, nullable = False)
    email = db.Column(db.String(50), nullable = False, unique = True)
    password_hash = db.Column(db.String(255),nullable = False)
    created_at = db.Column(db.DateTime,default = datetime.utcnow)
