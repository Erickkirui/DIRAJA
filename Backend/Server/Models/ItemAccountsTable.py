from flask_sqlalchemy import SQLAlchemy
from app import db


class ItemAccounts(db.Model):
    __table__ = 'item_accounts'

    id = db.Column(db.Integer, primary_key=True)
    item = db.Column(db.Sting(50), nullable=False)
    # item_type = 
