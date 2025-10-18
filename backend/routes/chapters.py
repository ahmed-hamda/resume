# routes/chapters.py
import os
import json
import tempfile
import requests
import fitz  # PyMuPDF

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from models import Chapter, Course, Document, Resume, Quiz, db
from utils.claude_summary import summarize_with_claude
from utils.gemini_summary import summarize_with_gemini
from utils.gpt_summary import summarize_with_gpt
from utils.quiz_generator import generate_quiz_from_summary

import supabase

chapters_bp = Blueprint('chapters', __name__)

# Supabase config
supabase_url = os.getenv('SUPABASE_URL')
supabase_key = os.getenv('SUPABASE_KEY')
sb = supabase.create_client(supabase_url, supabase_key) if supabase_url and supabase_key else None
bucket_name = "resume-docs"

HTTP_TIMEOUT = (10, 60)
MAX_WORDS_INPUT = 12000


def _download_pdf_to_temp(url: str) -> str:
    r = requests.get(url, timeout=HTTP_TIMEOUT)
    if r.status_code != 200:
        raise RuntimeError(f"Téléchargement impossible ({r.status_code}) : {url}")
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        tmp.write(r.content)
        tmp.flush()
        return tmp.name


def _extract_text_with_pymupdf(pdf_path: str) -> str:
    seen, lines = set(), []
    with fitz.open(pdf_path) as doc:
        for page in doc:
            for line in page.get_text().splitlines():
                line = (line or "").strip()
                if line and line not in seen:
                    seen.add(line)
                    lines.append(line)
    return "\n".join(lines).strip()


def _safe_truncate_words(s: str, max_words: int) -> str:
    words = (s or "").split()
    return " ".join(words[:max_words]) if len(words) > max_words else s


def _normalize_quiz_payload(quiz_json: dict) -> dict:
    if not isinstance(quiz_json, dict):
        quiz_json = {}

    title = quiz_json.get("title") or "Quiz"
    quiz_json["title"] = title

    qs = quiz_json.get("questions", [])
    if isinstance(qs, str):
        try:
            qs = json.loads(qs)
        except Exception:
            qs = []
    if not isinstance(qs, list):
        qs = []

    normalized = []
    for q in qs:
        if not isinstance(q, dict):
            continue

        # texte
        text = q.get("text") or q.get("question") or ""
        if not text:
            continue

        # type (on force en boolean ou mcq, sinon skip)
        qtype = (q.get("type") or "").lower()
        if qtype not in ("boolean", "mcq", "qcm"):
            # skip les questions ouvertes ou autres
            continue

        q["text"] = text
        q["question"] = text
        q["type"] = "boolean" if qtype == "boolean" else "mcq"

        # options si mcq
        if q["type"] == "mcq":
            if not isinstance(q.get("options"), list) or not q["options"]:
                # skip si pas d'options
                continue

        # answers → liste d'indices
        ans = q.get("answer")
        if isinstance(ans, (int, str)):
            try:
                ans = [int(ans)]
            except Exception:
                ans = [0]
        elif isinstance(ans, list):
            fixed = []
            for a in ans:
                try:
                    fixed.append(int(a))
                except Exception:
                    pass
            ans = fixed if fixed else [0]
        else:
            ans = [0]
        q["answer"] = ans

        # id unique
        if not q.get("id"):
            q["id"] = f"q{abs(hash(text)) % 100000}"

        # explication
        if "explanation" not in q:
            q["explanation"] = ""

        normalized.append(q)

    quiz_json["questions"] = normalized
    return quiz_json


@chapters_bp.route('/api/courses/<int:course_id>/chapters', methods=['GET'])
@jwt_required()
def list_chapters(course_id):
    user_id = int(get_jwt_identity())
    course = Course.query.filter_by(id=course_id, user_id=user_id).first()
    if not course:
        return jsonify({"msg": "Cours introuvable ou non autorisé"}), 404

    chapters = Chapter.query.filter_by(course_id=course_id).all()
    data = []
    for c in chapters:
        data.append({
            "id": c.id,
            "titre": c.titre,
            "description": c.description,
            "documents": [
                {
                    "id": d.id,
                    "filename": d.filename,
                    "description": d.description,
                    "supabase_url": d.supabase_url
                } for d in c.documents
            ]
        })
    return jsonify(data), 200


@chapters_bp.route('/api/chapters/<int:chapter_id>', methods=['DELETE'])
@jwt_required()
def delete_chapter(chapter_id):
    user_id = int(get_jwt_identity())

    # Charger le chapitre
    chapter = Chapter.query.get(chapter_id)
    if not chapter:
        return jsonify({"msg": "Chapitre introuvable"}), 404

    # Autorisation via course_id (⚠️ ne pas utiliser chapter.course)
    course = Course.query.get(chapter.course_id) if chapter.course_id else None
    if not course or course.user_id != user_id:
        return jsonify({"msg": "Non autorisé"}), 403

    # Supprimer les dépendances (si pas de cascade côté modèles)
    # - documents
    Document.query.filter_by(chapter_id=chapter.id).delete(synchronize_session=False)
    # - résumé
    Resume.query.filter_by(chapter_id=chapter.id).delete(synchronize_session=False)
    # - quiz
    Quiz.query.filter_by(chapter_id=chapter.id).delete(synchronize_session=False)

    # Supprimer le chapitre
    db.session.delete(chapter)
    db.session.commit()

    return jsonify({"msg": "Chapitre supprimé"}), 200



@chapters_bp.route('/api/chapters/<int:chapter_id>/resume', methods=['GET'])
@jwt_required()
def get_or_generate_resume(chapter_id):
    chapter = Chapter.query.get_or_404(chapter_id)

    # NEW: forcer recalcul ?force=1|true|yes
    force = str(request.args.get("force", "0")).lower() in ("1", "true", "yes")

    existing_resume = Resume.query.filter_by(chapter_id=chapter.id).first()
    if existing_resume and not force:
        return jsonify({"resume": existing_resume.texte,"id": existing_resume.id,  }), 200

    try:
        # concat texte de tous les PDFs
        parts = []
        for doc in chapter.documents:
            url = (doc.supabase_url or "").strip()
            if not url:
                continue
            if url.endswith(".pdf") or ".pdf?" in url:
                tmp_path = None
                try:
                    tmp_path = _download_pdf_to_temp(url)
                    txt = _extract_text_with_pymupdf(tmp_path)
                    if txt:
                        parts.append(txt)
                finally:
                    if tmp_path and os.path.exists(tmp_path):
                        try:
                            os.remove(tmp_path)
                        except Exception as e:
                            print(f"⚠️ Cleanup temp: {e}")

        full_text = "\n".join(parts).strip()
        if not full_text:
            return jsonify({"msg": "Aucun contenu PDF lisible à résumer."}), 400

        full_text = _safe_truncate_words(full_text, MAX_WORDS_INPUT)

        # cascade IA
        summary, last_err = None, None
        try:
            summary = summarize_with_claude(full_text)
        except Exception as e1:
            print(f"⚠️ Claude indisponible : {e1}")
            last_err = f"Claude: {e1}"
        if not summary:
            try:
                summary = summarize_with_gemini(full_text)
            except Exception as e2:
                print(f"⚠️ Gemini indisponible : {e2}")
                last_err = f"{last_err} | Gemini: {e2}" if last_err else f"Gemini: {e2}"
        if not summary:
            try:
                summary = summarize_with_gpt(full_text)
            except Exception as e3:
                print(f"❌ GPT indisponible : {e3}")
                last_err = f"{last_err} | GPT: {e3}" if last_err else f"GPT: {e3}"

        if not summary:
            return jsonify({"msg": "Aucune IA disponible pour le résumé.", "detail": last_err}), 502

        # upsert du résumé
        if existing_resume:
            existing_resume.texte = summary
            resume_obj = existing_resume
        else:
            resume_obj = Resume(texte=summary, chapter_id=chapter.id)
            db.session.add(resume_obj)

            db.session.commit()

        return jsonify({"resume": summary, "id": resume_obj.id}), 200


    except Exception as e:
        return jsonify({"msg": f"Erreur IA : {str(e)}"}), 500


# --- QUIZ ---
@chapters_bp.route('/api/chapters/<int:chapter_id>/quiz', methods=['GET'])
@jwt_required()
def get_or_generate_quiz(chapter_id):
    """
    Renvoie un quiz existant pour le chapitre OU en génère un à partir du résumé.
    Query param: ?force=1 pour régénérer.
    """
    chapter = Chapter.query.get_or_404(chapter_id)

    # il faut un résumé existant (logique business décidée)
    resume = Resume.query.filter_by(chapter_id=chapter_id).first()
    if not resume or not (resume.texte or "").strip():
        return jsonify({"msg": "Résumé introuvable pour ce chapitre. Générez le résumé avant le quiz."}), 400

    force = str(request.args.get("force", "0")).lower() in ("1", "true", "yes")

    # on réutilise un quiz existant si présent & pas forcé
    existing = Quiz.query.filter_by(chapter_id=chapter_id).order_by(Quiz.id.desc()).first()
    if existing and not force:
        # ⚠️ certain anciens enregistrements peuvent contenir une STRING JSON : normaliser
        qs = existing.questions
        if isinstance(qs, str):
            try:
                qs = json.loads(qs)
            except Exception:
                qs = []
        payload = _normalize_quiz_payload({
            "title": f"Quiz - {chapter.titre or 'Chapitre'}",
            "questions": qs or []
        })
        return jsonify({
            "quiz_id": existing.id,
            "quiz": {
                "title": payload.get("title"),
                "questions": payload.get("questions", [])
            }
        }), 200

    # Génération via LLM
    try:
        quiz_json = generate_quiz_from_summary(resume.texte)
    except Exception as e:
        return jsonify({"msg": f"Echec génération quiz : {e}"}), 502

    # Normalisation & validations minimales
    quiz_json = _normalize_quiz_payload(quiz_json)
    if not quiz_json.get("questions"):
        return jsonify({"msg": "Quiz invalide généré par l'IA."}), 500

    # Persistance (on stocke la LISTE, pas une string)
    q = Quiz(chapter_id=chapter_id, questions=quiz_json["questions"])
    db.session.add(q)
    db.session.commit()

    return jsonify({
        "quiz_id": q.id,
        "quiz": {
            "title": quiz_json.get("title") or f"Quiz - {chapter.titre or 'Chapitre'}",
            "questions": quiz_json["questions"]
        }
    }), 200


@chapters_bp.route('/api/quizzes/<int:quiz_id>/submit', methods=['POST'])
@jwt_required()
def submit_quiz(quiz_id):
    """
    Corrige un quiz côté serveur.
    body: { "answers": { "q1":[0], "q2":[1], ... } }
    """
    _ = int(get_jwt_identity())  # user_id si tu veux le loguer plus tard
    quiz = Quiz.query.get_or_404(quiz_id)
    body = request.get_json(silent=True) or {}
    answers = body.get("answers") or {}

    questions = quiz.questions or []
    # si jamais stocké en string
    if isinstance(questions, str):
        try:
            questions = json.loads(questions)
        except Exception:
            questions = []

    qmap = {q.get("id"): q for q in questions if isinstance(q, dict)}
    total = len(qmap)
    correct = 0
    details = []

    for qid, q in qmap.items():
        expected = list(q.get("answer") or [])
        given = list((answers.get(qid) or []))
        ok = (given == expected)
        if ok:
            correct += 1
        details.append({
            "id": qid,
            "ok": ok,
            "expected": expected,
            "given": given,
            "explanation": q.get("explanation") or ""
        })

    score = round(100.0 * correct / max(total, 1), 2)
    return jsonify({"score": score, "total": total, "correct": correct, "details": details}), 200

@chapters_bp.route('/api/quizzes/<int:quiz_id>', methods=['GET'])
@jwt_required()
def get_quiz_by_id(quiz_id):
    """
    Récupère un quiz existant directement par son ID.
    Utilisé quand on ouvre un quiz partagé (via cours partagé).
    """
    quiz = Quiz.query.get_or_404(quiz_id)
    chapter = Chapter.query.get(quiz.chapter_id)

    qs = quiz.questions
    # ⚠️ certains anciens enregistrements peuvent être une string JSON
    if isinstance(qs, str):
        try:
            qs = json.loads(qs)
        except Exception:
            qs = []

    payload = _normalize_quiz_payload({
        "title": f"Quiz - {chapter.titre if chapter else 'Chapitre'}",
        "questions": qs or []
    })

    return jsonify({
        "quiz_id": quiz.id,
        "quiz": {
            "title": payload.get("title"),
            "questions": payload.get("questions", [])
        }
    }), 200
