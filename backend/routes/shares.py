# routes/shares.py
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from extensions import db
from models import Share, User, Course, Chapter, Resume, Quiz, Document

shares_bp = Blueprint("shares", __name__)

ALLOWED_TYPES = {"course", "chapter", "resume", "quiz"}


# --------------------------------------------------------------------
# Créer un partage
# --------------------------------------------------------------------
@shares_bp.route("/api/shares", methods=["POST"])
@jwt_required()
def create_share():
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}

    target_user_id = data.get("target_user_id")
    object_type = (data.get("object_type") or "").lower()
    object_id = data.get("object_id")

    if not (target_user_id and object_type and object_id):
        return jsonify({"msg": "Champs requis manquants"}), 400
    if object_type not in ALLOWED_TYPES:
        return jsonify({"msg": "Type non supporté"}), 400

    # optionnel : vérifier l'existence du destinataire
    if not User.query.get(target_user_id):
        return jsonify({"msg": "Utilisateur destinataire introuvable"}), 404

    share = Share(
        user_id=user_id,
        target_user_id=target_user_id,
        object_type=object_type,
        object_id=object_id,
    )
    db.session.add(share)
    db.session.commit()

    return jsonify({"msg": "Partage créé", "share_id": share.id}), 201


# --------------------------------------------------------------------
# Liste des partages reçus (enrichie pour l'UI)
# --------------------------------------------------------------------
@shares_bp.route("/api/shares/received", methods=["GET"])
@jwt_required()
def get_received_shares():
    me = int(get_jwt_identity())
    shares = Share.query.filter_by(target_user_id=me).order_by(Share.id.desc()).all()

    out = []
    for s in shares:
        course_title, chapter_title = None, None

        if s.object_type == "course":
            course = Course.query.get(s.object_id)
            course_title = course.titre if course else None

        elif s.object_type == "chapter":
            ch = Chapter.query.get(s.object_id)
            if ch:
                chapter_title = ch.titre
                if ch.course_id:
                    course = Course.query.get(ch.course_id)
                    course_title = course.titre if course else None

        elif s.object_type == "resume":
            res = Resume.query.get(s.object_id)
            if res:
                ch = Chapter.query.get(res.chapter_id)
                if ch:
                    chapter_title = ch.titre
                    if ch.course_id:
                        course = Course.query.get(ch.course_id)
                        course_title = course.titre if course else None

        elif s.object_type == "quiz":
            qz = Quiz.query.get(s.object_id)
            if qz:
                ch = Chapter.query.get(qz.chapter_id)
                if ch:
                    chapter_title = ch.titre
                    if ch.course_id:
                        course = Course.query.get(ch.course_id)
                        course_title = course.titre if course else None

        from_user = User.query.get(s.user_id)
        out.append({
            "id": s.id,
            "object_type": s.object_type,
            "object_id": s.object_id,
            "from_user": (from_user.nom or from_user.email) if from_user else "Inconnu",
            "course_title": course_title or "—",
            "chapter_title": chapter_title or ("—" if s.object_type != "course" else None),
        })

    return jsonify(out), 200


# --------------------------------------------------------------------
# Supprimer un partage (expéditeur OU destinataire)
# --------------------------------------------------------------------
@shares_bp.route("/api/shares/<int:share_id>", methods=["DELETE"])
@jwt_required()
def delete_share(share_id):
    user_id = int(get_jwt_identity())
    share = Share.query.get_or_404(share_id)

    if share.user_id != user_id and share.target_user_id != user_id:
        return jsonify({"msg": "Non autorisé"}), 403

    db.session.delete(share)
    db.session.commit()
    return jsonify({"msg": "Partage supprimé"}), 200


# --------------------------------------------------------------------
# Contenu d'un partage (utilisé par tes pages de détails)
# --------------------------------------------------------------------
@shares_bp.route("/api/shares/<int:share_id>/content", methods=["GET"])
@jwt_required()
def get_share_content(share_id):
    me = int(get_jwt_identity())
    share = Share.query.get_or_404(share_id)

    # seul le destinataire peut consulter
    if share.target_user_id != me:
        return jsonify({"msg": "Non autorisé"}), 403

    if share.object_type == "resume":
        res = Resume.query.get(share.object_id)
        return jsonify({
            "type": "resume",
            "content": res.texte if res else "❌ Résumé introuvable"
        }), 200

    if share.object_type == "quiz":
        qz = Quiz.query.get(share.object_id)
        return jsonify({
            "type": "quiz",
            "quiz_id": qz.id if qz else None,
            "quiz": {
                "title": "Quiz partagé" if qz else "",
                "questions": qz.questions if qz else []
            }
        }), 200

    if share.object_type == "course":
        course = Course.query.get(share.object_id)
        if not course:
            return jsonify({"type": "course", "content": {}}), 200

        # ⚠️ ne pas utiliser course.chapters (relation absente dans ton cas)
        chapters = Chapter.query.filter_by(course_id=course.id).all()

        content_chapters = []
        for ch in chapters:
            res = Resume.query.filter_by(chapter_id=ch.id).first()
            qz = Quiz.query.filter_by(chapter_id=ch.id).first()

            # ⚠️ si la relation Chapter.documents n'existe pas chez toi, on requête direct
            docs = Document.query.filter_by(chapter_id=ch.id).all()
            docs_payload = [
                {"id": d.id, "filename": d.filename, "supabase_url": d.supabase_url}
                for d in docs
            ]

            content_chapters.append({
                "id": ch.id,
                "titre": ch.titre,
                "description": ch.description,
                "resume": True if res else False,
                "resume_id": res.id if res else None,
                "quiz_id": qz.id if qz else None,
                "documents": docs_payload
            })

        return jsonify({
            "type": "course",
            "content": {
                "id": course.id,
                "titre": course.titre,
                "chapters": content_chapters
            }
        }), 200

    if share.object_type == "chapter":
        ch = Chapter.query.get(share.object_id)
        if not ch:
            return jsonify({"type": "chapter", "content": {}}), 200

        res = Resume.query.filter_by(chapter_id=ch.id).first()
        qz = Quiz.query.filter_by(chapter_id=ch.id).first()
        docs = Document.query.filter_by(chapter_id=ch.id).all()
        docs_payload = [
            {"id": d.id, "filename": d.filename, "supabase_url": d.supabase_url}
            for d in docs
        ]

        return jsonify({
            "type": "chapter",
            "content": {
                "id": ch.id,
                "titre": ch.titre,
                "description": ch.description,
                "resume": True if res else False,
                "resume_id": res.id if res else None,
                "quiz_id": qz.id if qz else None,
                "documents": docs_payload
            }
        }), 200

    return jsonify({"msg": "Type non supporté"}), 400


# --------------------------------------------------------------------
# (Optionnel) Accès direct à un résumé partagé
# --------------------------------------------------------------------
@shares_bp.route("/api/shared-resume/<int:resume_id>", methods=["GET"])
@jwt_required()
def get_shared_resume(resume_id):
    res = Resume.query.get_or_404(resume_id)
    return jsonify({
        "id": res.id,
        "type": "resume",
        "content": res.texte
    }), 200
