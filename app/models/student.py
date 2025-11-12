from app import db

class Student(db.Model):
    __tablename__ = 'student'
    id = db.Column(db.Integer, primary_key=True,autoincrement=True)
    name = db.Column(db.String(50), nullable=False)
    date_of_birth = db.Column(db.DateTime, nullable=False)
    gender = db.Column(db.String(10), nullable = False)
    weight = db.Column(db.Float, nullable = False)
    height = db.Column(db.Float,nullable = False)
    bmi = db.Column(db.Float,nullable = False)
    temperature = db.Column(db.Float,nullable = False)
    class_name = db.Column(db.String(50), nullable = False)
    parent_name = db.Column(db.String(50), nullable = False)
    parent_phone = db.Column(db.String(10), nullable = False)

    def __repr__(self):
        return f"<Student {self.name}>"