from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from supabase_client import supabase
from models import Course, Document, Chapter, db
import time

documents_bp = Blueprint('documents', __name__)

# ========================
# 📥 Upload document
# ========================
@documents_bp.route('/api/chapters/<int:chapter_id>/documents', methods=['POST'])
@jwt_required()
def upload_document(chapter_id):
    user_id = int(get_jwt_identity())

    # Vérifier l'accès au chapitre
    chapter = Chapter.query.join(Course).filter(
        Chapter.id == chapter_id,
        Course.user_id == user_id
    ).first()
    if not chapter:
        return jsonify({"msg": "Chapitre non trouvé ou accès refusé"}), 404

    if 'file' not in request.files:
        return jsonify({"msg": "Fichier manquant"}), 400

    file = request.files['file']
    description = request.form.get('description', '')

    # Nom de fichier unique
    filename = f"{user_id}_{int(time.time())}_{file.filename}"

    try:
        # Upload vers Supabase Storage
        res = supabase.storage.from_("resume-docs").upload(filename, file)

        # Générer l'URL publique
        public_url = supabase.storage.from_("resume-docs").get_public_url(filename)

        # Enregistrer en base
        doc = Document(
            filename=file.filename,
            description=description,
            supabase_url=public_url,
            chapter_id=chapter_id
        )
        db.session.add(doc)
        db.session.commit()

        return jsonify({"msg": "Document uploadé", "document_url": public_url}), 201

    except Exception as e:
        print("❌ Erreur Supabase:", e)
        return jsonify({"msg": "Erreur serveur"}), 500

# ========================
# 📄 Obtenir les documents
# ========================
@documents_bp.route('/api/chapters/<int:chapter_id>/documents', methods=['GET'])
@jwt_required()
def get_documents(chapter_id):
    user_id = int(get_jwt_identity())

    # Vérifier l'accès au chapitre
    chapter = Chapter.query.join(Course).filter(
        Chapter.id == chapter_id,
        Course.user_id == user_id
    ).first()
    if not chapter:
        return jsonify({"msg": "Chapitre introuvable ou accès refusé"}), 404

    # Récupérer les documents associés
    docs = Document.query.filter_by(chapter_id=chapter_id).all()
    result = [
        {
            "id": doc.id,
            "filename": doc.filename,
            "description": doc.description,
            "url": doc.supabase_url  # URL publique Supabase
        }
        for doc in docs
    ]

    return jsonify(result), 200

# ========================
# 📖 Obtenir un chapitre
# ========================
@documents_bp.route('/api/chapters/<int:chapter_id>', methods=['GET'])
@jwt_required()
def get_chapter(chapter_id):
    user_id = int(get_jwt_identity())

    # Vérifier l'accès au chapitre
    chapter = Chapter.query.join(Course).filter(
        Chapter.id == chapter_id,
        Course.user_id == user_id
    ).first()

    if not chapter:
        return jsonify({"msg": "Chapitre introuvable ou accès refusé"}), 404

    return jsonify({
        "id": chapter.id,
        "titre": chapter.titre,
        "course_id": chapter.course_id
    }), 200
