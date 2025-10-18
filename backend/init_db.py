from app import app, db
import models
from sqlalchemy import inspect

with app.app_context():
    print("Modèles détectés :", db.Model.__subclasses__())
    db.create_all()
    inspector = inspect(db.engine)
    print("Tables trouvées :", inspector.get_table_names())
