from extensions import db
from datetime import datetime

# ===============================
#           UTILISATEURS
# ===============================
class User(db.Model):
    __tablename__ = 'user'
    id = db.Column(db.Integer, primary_key=True)
    nom = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    type = db.Column(db.String(20))  # 'etudiant' ou 'enseignant'
    password = db.Column(db.String(128), nullable=False)
    image_url = db.Column(db.String(500), nullable=True)

class Etudiant(User):
    __tablename__ = 'etudiants'
    id = db.Column(db.Integer, db.ForeignKey('user.id'), primary_key=True)
    group_id = db.Column(db.Integer, db.ForeignKey('group.id'))
    __mapper_args__ = {'polymorphic_identity': 'etudiant'}

class Enseignant(User):
    __tablename__ = 'enseignants'
    id = db.Column(db.Integer, db.ForeignKey('user.id'), primary_key=True)
    groupes = db.relationship('Group', backref='enseignant', lazy=True)
    __mapper_args__ = {'polymorphic_identity': 'enseignant'}

# ===============================
#           GROUPES
# ===============================
class Group(db.Model):
    __tablename__ = 'group'
    id = db.Column(db.Integer, primary_key=True)
    nom = db.Column(db.String(100))
    enseignant_id = db.Column(db.Integer, db.ForeignKey('enseignants.id'))
    etudiants = db.relationship('Etudiant', backref='groupe', lazy=True)

# ===============================
#            CATEGORY
# ===============================
class Category(db.Model):
    __tablename__ = 'category'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), unique=True, nullable=False)
    description = db.Column(db.Text, nullable=True)
    image_url = db.Column(db.String(500), nullable=True)   # 🆕 image pour la catégorie
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    courses = db.relationship('Course', back_populates='category', lazy=True)

# ===============================
#        COURS & CHAPITRES
# ===============================
class Course(db.Model):
    __tablename__ = 'course'
    id = db.Column(db.Integer, primary_key=True)
    titre = db.Column(db.String(200), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))

    category_id = db.Column(db.Integer, db.ForeignKey('category.id'), nullable=True)
    category = db.relationship('Category', back_populates='courses')

    image_url = db.Column(db.String(500), nullable=True)   # existe déjà d’après tes logs

class Chapter(db.Model):
    __tablename__ = 'chapter'
    id = db.Column(db.Integer, primary_key=True)
    titre = db.Column(db.String(200))
    description = db.Column(db.Text, nullable=True)
    course_id = db.Column(db.Integer, db.ForeignKey('course.id'))

    flashcards = db.relationship('Flashcard', backref='chapter', cascade="all, delete", lazy=True)
    resumes = db.relationship('Resume', backref='chapter', cascade="all, delete", lazy=True)
    quizzes = db.relationship('Quiz', backref='chapter', cascade="all, delete", lazy=True)
    documents = db.relationship('Document', backref='chapter', cascade="all, delete", lazy=True)

# ===============================
#   CONTENUS GENERES (NLP/IA)
# ===============================
class Flashcard(db.Model):
    __tablename__ = 'flashcard'
    id = db.Column(db.Integer, primary_key=True)
    contenu = db.Column(db.Text)
    chapter_id = db.Column(db.Integer, db.ForeignKey('chapter.id'))

class Resume(db.Model):
    __tablename__ = 'resume'
    id = db.Column(db.Integer, primary_key=True)
    texte = db.Column(db.Text)
    chapter_id = db.Column(db.Integer, db.ForeignKey('chapter.id'))

class Quiz(db.Model):
    __tablename__ = 'quiz'
    id = db.Column(db.Integer, primary_key=True)
    questions = db.Column(db.JSON)
    chapter_id = db.Column(db.Integer, db.ForeignKey('chapter.id'))

# ===============================
#          DOCUMENTS
# ===============================
class Document(db.Model):
    __tablename__ = 'document'
    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    supabase_url = db.Column(db.String(500), nullable=False)
    chapter_id = db.Column(db.Integer, db.ForeignKey('chapter.id'), nullable=False)

class Share(db.Model):
    __tablename__ = "share"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    target_user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    object_type = db.Column(db.String(50), nullable=False)  # "course", "chapter", "resume", "quiz"
    object_id = db.Column(db.Integer, nullable=False)

    user = db.relationship("User", foreign_keys=[user_id], backref="shares_sent")
    target_user = db.relationship("User", foreign_keys=[target_user_id], backref="shares_received")
