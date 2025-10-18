# backend/wsgi.py
from app import app  # ⬅️ adapte si ton module s'appelle autrement
application = app    # certains hosts attendent "application"
