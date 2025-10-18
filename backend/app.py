from flask import Flask
from seeds.default_categories import DEFAULT_CATEGORIES
from config import Config
from extensions import db, cors, bcrypt, jwt
from flask_migrate import Migrate
from dotenv import load_dotenv

# Charger les variables d'environnement (.env)
load_dotenv()

# Créer l'application Flask
app = Flask(__name__)
app.config.from_object(Config)

# Initialiser les extensions
db.init_app(app)
bcrypt.init_app(app)
jwt.init_app(app)
cors.init_app(app)  # Autoriser tous les domaines (CORS fix)

# Initialiser Flask-Migrate
migrate = Migrate(app, db)

# Importer les modèles et blueprints
from models import *
from routes.users import users_bp
from routes.courses import courses_bp
from routes.documents import documents_bp
from routes.chapters import chapters_bp
from routes.shares import shares_bp
from routes.categories import categories_bp




def seed_categories_if_empty(app):
    """Insère les catégories par défaut si la table existe et est vide."""
    with app.app_context():
        inspector = db.inspect(db.engine)
        if inspector.has_table('category'):
            if db.session.query(Category).count() == 0:
                db.session.bulk_insert_mappings(Category, DEFAULT_CATEGORIES)
                db.session.commit()
                print("[seed] catégories par défaut insérées.")
        else:
            print("[seed] La table 'category' n'existe pas encore (migration à appliquer).")


# Enregistrer les blueprints
app.register_blueprint(users_bp)
app.register_blueprint(courses_bp)
app.register_blueprint(documents_bp)
app.register_blueprint(chapters_bp)
app.register_blueprint(shares_bp)

app.register_blueprint(categories_bp)


seed_categories_if_empty(app)


# Test route
@app.route('/api/message')
def index():
    return {'message': 'API backend stage'}

# Lancer l'app
if __name__ == '__main__':
    app.run(debug=True)
