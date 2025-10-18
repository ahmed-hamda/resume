from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager

db = SQLAlchemy()

cors = CORS(resources={r"/api/*": {
    "origins": "http://localhost:4200",
    "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    "allow_headers": ["Content-Type", "Authorization"],
    "supports_credentials": True
}})

bcrypt = Bcrypt()
jwt = JWTManager()

# Gestion des erreurs JWT
@jwt.unauthorized_loader
def custom_unauthorized_response(callback):
    return {"msg": "Token manquant ou invalide"}, 401

@jwt.invalid_token_loader
def custom_invalid_token(callback):
    return {"msg": "Token invalide"}, 422

@jwt.expired_token_loader
def custom_expired_token(jwt_header, jwt_payload):
    return {"msg": "Token expiré"}, 401
