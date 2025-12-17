from typing import List

from app.models.DTO import StudentDTO
from app.models.Models import Student, Classroom


def get_all_students() -> List[Student]:
    return Student.query.all()

def get_student_by_classroom(classroom: Classroom) -> List[Student]:
    return Student.query.filter_by(classroom = classroom.id).all()

def get_student_count_by_classroom(classroom_id: int) -> int:
    return Student.query.filter_by(class_id=classroom_id).count()

def total_student(classrooms: List[Classroom]) -> int:
    if not classrooms:
        return 0
    classroom_ids = [classroom.id for classroom in classrooms]
    return Student.query.filter(Student.class_id.in_(classroom_ids)).count()

def search_students(q=None, class_id=None) -> List[Student]:
    student_query = Student.query

    if q:
        q = q.strip()
        like_pattern = f"%{q}%"
        student_query = student_query.filter(Student.name.ilike(like_pattern))

    if class_id:
        student_query = student_query.filter_by(class_id=class_id)

    return student_query.all()

def total_male_count(classid=None):
    from app.models.Models import GenderEnum
    if classid is None:
        return Student.query.filter(Student.gender == GenderEnum.Nam).count()
    else:
        return Student.query.filter(Student.gender == GenderEnum.Nam, Student.class_id == classid).count()

def total_female_count(classid=None):
    from app.models.Models import GenderEnum
    if classid is None:
        return Student.query.filter(Student.gender == GenderEnum.Nu).count()
    else:
        return Student.query.filter(Student.gender == GenderEnum.Nu, Student.class_id == classid).count()

def get_gender_stats_by_class(classrooms):
    data = {}
    for c in classrooms:
        data[c.id] = {
            "male": total_male_count(c.id),
            "female": total_female_count(c.id),
        }
    return data

def classroom_student_count():
    all_students = Student.query.all()
    classroom_student_count = {}

    for student in all_students:
        if student.class_id:
            if student.class_id in classroom_student_count:
                classroom_student_count[student.class_id] += 1
            else:
                classroom_student_count[student.class_id] = 1
    return classroom_student_count

def is_classroom_full(classroom_id: int, exclude_student_id: int = None) -> bool:

    if not classroom_id:
        return False
    
    classroom = Classroom.query.get(classroom_id)
    if not classroom:
        return False
    
    current_count = get_student_count_by_classroom(classroom_id)
    

    if exclude_student_id:
        existing_student = Student.query.get(exclude_student_id)
        if existing_student and existing_student.class_id == classroom_id:
            current_count -= 1
    
    return current_count >= classroom.max_slots

