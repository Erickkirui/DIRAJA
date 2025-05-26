from flask_sqlalchemy import SQLAlchemy
from app import db
from sqlalchemy import func

class TranscationType(db.Model):
    __tablename__ = 'transaction'  # ✅ correct

    id = db.Column(db.Integer, primary_key=True)
    Transaction_type = db.Column(db.String(50), nullable= False)
    Transaction_amount = db.Column(db.Float, nullable= False)
    From_account = db.Column(db.String(50), nullable= False)
    To_account = db.Column(db.String(50), nullable= True)
    created_at = db.Column(db.DateTime, server_default=func.now(), nullable=False)


