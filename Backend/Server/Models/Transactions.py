from flask_sqlalchemy import SQLAlchemy
from app import db
from sqlalchemy import func

class TranscationType(db.Modle):
    __table__ = 'transaction'

    id = db.Column(db.Integer, primary_key=True)
    Transaction_type = db.Column(db.String(50), nullable= False)
    Transaction_amount = db.Column(db.Float, nullable= False)
    created_at = db.Column(db.DateTime, server_default=func.now(), nullable=False)

