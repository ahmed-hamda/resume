from flask import Blueprint, request, jsonify
from extensions import db, bcrypt
from flask_jwt_extended import create_access_token, jwt_required
from models import User

users_bp = Blueprint('users', __name__)

@users_bp.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    hashed_password = bcrypt.generate_password_hash(data['password']).decode('utf-8')
    new_user = User(
        nom=data['nom'],
        email=data['email'],
        type=data['type'],
        password=hashed_password
    )
    db.session.add(new_user)
    db.session.commit()
    return jsonify(message="User created successfully"), 201

@users_bp.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(email=data['email']).first()
    if user and bcrypt.check_password_hash(user.password, data['password']):
        access_token = create_access_token(identity=str(user.id))
        return jsonify(token=access_token, user={
            'id': user.id,
            'nom': user.nom,
            'email': user.email
        }), 200
    return jsonify(message="Identifiants invalides"), 401


@users_bp.route('/api/users/search', methods=['GET'])
@jwt_required()
def search_users():
    q = request.args.get("q", "").strip().lower()
    if not q:
        return jsonify([])

    users = User.query.filter(User.email.ilike(f"%{q}%")).limit(10).all()
    return jsonify([
        {"id": u.id, "email": u.email, "nom": u.nom}
        for u in users
    ])




import time, os
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db, bcrypt
from supabase_client import supabase
from models import User



# --- Profil courant ---
@users_bp.route('/api/profile', methods=['GET'])
@jwt_required()
def get_profile():
    user_id = int(get_jwt_identity())
    user = User.query.get_or_404(user_id)

    return jsonify({
    "id": user.id,
    "nom": user.nom,
    "email": user.email,
    "image_url": user.image_url   # ✅ c’est ça qui doit être utilisé
}), 200



# --- Mise à jour profil (avec image) ---
@users_bp.route("/api/profile", methods=["PUT"])
@jwt_required()
def update_profile():
    user_id = int(get_jwt_identity())
    user = User.query.get_or_404(user_id)

    try:
        # 📤 Cas image de profil
        if "file" in request.files:
            file = request.files["file"]
            if not file or not file.filename:
                return jsonify({"msg": "Fichier invalide"}), 400

            filename = f"profile_{user_id}_{int(time.time())}_{file.filename}"

    # 🔑 Lire en mémoire (bytes)
            file_bytes = file.read()

    # 📤 Upload vers Supabase
            res = supabase.storage.from_("profile-pics").upload(
            filename,
            file_bytes,  # ✅ bytes, pas FileStorage
            {"content-type": file.content_type or "image/png"}
            )

            if hasattr(res, "error") and res.error:
                return jsonify({"msg": "Erreur upload Supabase", "error": str(res.error)}), 500

            public_url = supabase.storage.from_("profile-pics").get_public_url(filename)
            user.image_url = public_url

        # 📄 Cas données JSON ou multipart
        data = request.form if request.form else request.get_json(silent=True) or {}
        user.nom = data.get("nom", user.nom)
        user.email = data.get("email", user.email)

        if data.get("password"):
            user.password = bcrypt.generate_password_hash(data["password"]).decode("utf-8")

        db.session.commit()

        return jsonify({
            "id": user.id,
            "nom": user.nom,
            "email": user.email,
            "image_url": user.image_url
        }), 200

    except Exception as e:
        print("❌ Erreur update_profile:", e)
        return jsonify({"msg": "Erreur serveur", "detail": str(e)}), 500
