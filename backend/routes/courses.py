# routes/courses.py
import os
import time
import mimetypes
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename

from supabase_client import create_client
from extensions import db
from models import Course, Chapter, Document, Category, Resume, Quiz, Flashcard
# si Flashcard n’existe pas chez toi, enlève-le des deletes ci-dessous

courses_bp = Blueprint('courses', __name__)

# ✅ Supabase
supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_KEY')
)
bucket_name = "resume-docs"


# -------------------------------------------------------------------
# Créer un cours
# -------------------------------------------------------------------
@courses_bp.route('/api/courses', methods=['POST'])
@jwt_required()
def create_course():
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}

    titre = (data.get('titre') or '').strip()
    if not titre:
        return jsonify(msg="Titre is required"), 400

    category_id = data.get('category_id')
    image_url = (data.get('image_url') or '').strip() or None

    # Vérifier la catégorie si fournie
    if category_id is not None:
        cat = Category.query.get(category_id)
        if not cat:
            return jsonify(msg="Catégorie introuvable"), 400

    course = Course(titre=titre, user_id=user_id, category_id=category_id)

    # Hériter de l'image de la catégorie si aucune image personnalisée
    if not image_url and category_id:
        cat = Category.query.get(category_id)
        if cat and cat.image_url:
            image_url = cat.image_url
    course.image_url = image_url

    db.session.add(course)
    db.session.commit()
    return jsonify({"msg": "Course created", "id": course.id}), 201


# -------------------------------------------------------------------
# Lister mes cours (avec filtre optionnel par catégorie)
# -------------------------------------------------------------------
@courses_bp.route('/api/courses', methods=['GET'])
@jwt_required()
def get_courses():
    user_id = int(get_jwt_identity())
    q = Course.query.filter_by(user_id=user_id)

    # /api/courses?category_id=3
    category_id = request.args.get('category_id', type=int)
    if category_id is not None:
        q = q.filter(Course.category_id == category_id)

    courses = q.all()
    result = [
        {
            "id": c.id,
            "titre": c.titre,
            "image_url": c.image_url,
            "category_id": c.category_id
        }
        for c in courses
    ]
    return jsonify(result), 200


# -------------------------------------------------------------------
# Supprimer un cours
# -------------------------------------------------------------------
@courses_bp.route('/api/courses/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_course(id):
    user_id = int(get_jwt_identity())
    course = Course.query.filter_by(id=id, user_id=user_id).first()
    if not course:
        return jsonify({"msg": "Course not found or unauthorized"}), 404

    # ⚠️ ne pas compter sur course.chapters (relation absente chez toi)
    chapters = Chapter.query.filter_by(course_id=course.id).all()

    # Supprimer les dépendances des chapitres (ordre sûr)
    for ch in chapters:
        Document.query.filter_by(chapter_id=ch.id).delete(synchronize_session=False)
        Resume.query.filter_by(chapter_id=ch.id).delete(synchronize_session=False)
        Quiz.query.filter_by(chapter_id=ch.id).delete(synchronize_session=False)
        try:
            Flashcard.query.filter_by(chapter_id=ch.id).delete(synchronize_session=False)
        except Exception:
            pass  # si pas de modèle Flashcard, ignore

    # Supprimer les chapitres
    Chapter.query.filter_by(course_id=course.id).delete(synchronize_session=False)

    # Enfin supprimer le cours
    db.session.delete(course)
    db.session.commit()

    return jsonify({"msg": "Course deleted"}), 200



# -------------------------------------------------------------------
# Modifier un cours (titre, category_id, image_url)
# -------------------------------------------------------------------
@courses_bp.route('/api/courses/<int:course_id>', methods=['PUT'])
@jwt_required()
def update_course(course_id):
    user_id = int(get_jwt_identity())
    course = Course.query.filter_by(id=course_id, user_id=user_id).first()
    if not course:
        return jsonify(msg="Cours introuvable ou non autorisé"), 404

    data = request.get_json() or {}

    # titre
    if 'titre' in data:
        titre = (data.get('titre') or '').strip()
        if not titre:
            return jsonify(msg="Titre is required"), 400
        course.titre = titre

    # catégorie
    if 'category_id' in data:
        category_id = data.get('category_id')
        if category_id is not None:
            cat = Category.query.get(category_id)
            if not cat:
                return jsonify(msg="Catégorie introuvable"), 400
        course.category_id = category_id

    # image personnalisée (si vide => héritage catégorie)
    if 'image_url' in data:
        image_url = (data.get('image_url') or '').strip()
        if image_url:
            course.image_url = image_url
        else:
            course.image_url = None
            if course.category_id:
                cat = Category.query.get(course.category_id)
                if cat and cat.image_url:
                    course.image_url = cat.image_url

    db.session.commit()
    return jsonify(msg="Cours modifié"), 200


# -------------------------------------------------------------------
# Récupérer 1 cours + ses chapitres (robuste sans relation .chapters)
# -------------------------------------------------------------------
@courses_bp.route('/api/courses/<int:course_id>', methods=['GET'])
@jwt_required()
def get_course(course_id):
    user_id = int(get_jwt_identity())
    course = Course.query.filter_by(id=course_id, user_id=user_id).first()
    if not course:
        return jsonify({"msg": "Course introuvable"}), 404

    # ✅ ne pas utiliser course.chapters
    chapters = Chapter.query.filter_by(course_id=course.id).all()
    payload_chapters = []
    for ch in chapters:
        docs = Document.query.filter_by(chapter_id=ch.id).all()
        payload_chapters.append({
            "id": ch.id,
            "titre": ch.titre,
            "description": ch.description,
            "documents": [
                {
                    "id": d.id,
                    "filename": d.filename,
                    "description": d.description,
                    "supabase_url": d.supabase_url
                } for d in docs
            ]
        })

    return jsonify({
        "id": course.id,
        "titre": course.titre,
        "chapters": payload_chapters,
    }), 200


# -------------------------------------------------------------------
# Lister les chapitres d’un cours (utile pour ton front)
# -------------------------------------------------------------------
@courses_bp.route('/api/courses/<int:course_id>/chapters', methods=['GET'])
@jwt_required()
def list_chapters(course_id):
    user_id = int(get_jwt_identity())
    course = Course.query.filter_by(id=course_id, user_id=user_id).first()
    if not course:
        return jsonify({"msg": "Course introuvable"}), 404

    chapters = Chapter.query.filter_by(course_id=course.id).all()
    result = []
    for ch in chapters:
        docs = Document.query.filter_by(chapter_id=ch.id).all()
        result.append({
            "id": ch.id,
            "titre": ch.titre,
            "description": ch.description,
            "documents": [
                {
                    "id": d.id,
                    "filename": d.filename,
                    "supabase_url": d.supabase_url
                } for d in docs
            ]
        })
    return jsonify(result), 200


# -------------------------------------------------------------------
# Créer un chapitre (upload fichier -> Supabase, doc lié au chapitre)
# -------------------------------------------------------------------
@courses_bp.route('/api/courses/<int:course_id>/chapters', methods=['POST'])
@jwt_required()
def create_chapter(course_id):
    user_id = int(get_jwt_identity())
    course = Course.query.filter_by(id=course_id, user_id=user_id).first()
    if not course:
        return jsonify({"msg": "Course introuvable"}), 404

    titre = request.form.get('titre') or ''
    description = request.form.get('description', '')
    file = request.files.get('file')

    if not titre.strip():
        return jsonify({"msg": "Titre du chapitre requis"}), 400

    chapter = Chapter(titre=titre.strip(), description=description, course_id=course.id)
    db.session.add(chapter)
    db.session.commit()

    if file:
        original_filename = secure_filename(file.filename)
        filename = f"{user_id}_{int(time.time())}_{original_filename}"

        # lire data
        file_data = file.read()

        # deviner type MIME
        mime_type, _ = mimetypes.guess_type(original_filename)
        mime_type = mime_type or "application/octet-stream"

        # upload
        response = supabase.storage.from_(bucket_name).upload(
            path=filename,
            file=file_data,
            file_options={"content-type": mime_type}
        )
        if hasattr(response, "error") and response.error is not None:
            return jsonify({"msg": "Erreur lors de l’upload Supabase", "error": str(response.error)}), 500

        # URL publique
        public_url = supabase.storage.from_(bucket_name).get_public_url(filename)

        # Enregistrer le document lié
        doc = Document(
            filename=original_filename,
            description=description,
            supabase_url=public_url,
            chapter_id=chapter.id
        )
        db.session.add(doc)
        db.session.commit()

    return jsonify({"msg": "Chapitre ajouté"}), 201
