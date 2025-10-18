from datetime import timedelta

class Config:
    SQLALCHEMY_DATABASE_URI = 'postgresql://postgres:postgres@localhost/resume'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # 🔑 JWT
    JWT_SECRET_KEY = 'super-secret-key'   # Clé secrète JWT
    JWT_TOKEN_LOCATION = ['headers']      # ✅ Token dans les headers
    JWT_HEADER_NAME = 'Authorization'
    JWT_HEADER_TYPE = 'Bearer'
    
    # ⏳ Durée de session (exemple : 2 heures)
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
