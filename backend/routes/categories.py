# routes/categories.py
from flask import Blueprint, request, jsonify
from extensions import db
from models import Category
from seeds.default_categories import DEFAULT_CATEGORIES

categories_bp = Blueprint('categories', __name__, url_prefix='/api/categories')

def _to_dict(c: Category):
    return {
        "id": c.id,
        "name": c.name,
        "description": c.description,
        "image_url": c.image_url
    }

@categories_bp.get('')
def list_categories():
    items = Category.query.order_by(Category.name.asc()).all()
    if not items:
        # Fallback immédiat pour l’UI même si la DB est vide
        return jsonify([
            {"id": None, **cat} for cat in DEFAULT_CATEGORIES
        ])
    return jsonify([_to_dict(c) for c in items])

@categories_bp.post('')
def create_category():
    data = request.get_json() or {}
    c = Category(
        name=data.get('name'),
        description=data.get('description'),
        image_url=data.get('image_url'),
    )
    db.session.add(c)
    db.session.commit()
    return jsonify({"id": c.id}), 201

@categories_bp.post('/seed')
def seed_categories():
    created = 0
    for s in DEFAULT_CATEGORIES:
        # On se base sur le nom (unique) pour éviter les doublons
        if not Category.query.filter_by(name=s["name"]).first():
            db.session.add(Category(**s))
            created += 1
    if created:
        db.session.commit()
    return jsonify({"created": created})
