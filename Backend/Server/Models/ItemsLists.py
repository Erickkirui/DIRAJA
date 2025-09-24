from flask_sqlalchemy import SQLAlchemy
from app import db
from sqlalchemy.orm import validates
from sqlalchemy import func


class ItemsList(db.Model):
    __tablename__ = "items_list"

    item_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    item_type = db.Column(db.String(50), nullable=False)
    item_name = db.Column(db.String(50))
    gl_account_id = db.Column(db.JSON)
    description = db.Column(db.String , nullable=True)
   


    def __repr__(self):
        return f"<ItemsList(id={self.item_id}, type={self.item_type}, gl_account_id={self.gl_account_id})>"
