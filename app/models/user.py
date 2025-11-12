from app import db

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    phone = db.Column(db.String(10), nullable=False)
    email = db.Column(db.String(50), nullable=False, unique=True)
    password_hash = db.Column(db.String(255), nullable=False)

    def __repr__(self):
        return f"<User {self.email}>"