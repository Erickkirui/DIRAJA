from flask_sqlalchemy import SQLAlchemy
from app import db
from datetime import datetime

class ExpenseCategory(db.Model):

    __tablename__ = 'categories'

   
    category_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    categoryname = db.Column(db.String(100), nullable=False, unique=True)
    
    def __init__(self, categoryname):
        self.categoryname = categoryname  # Fixed initialization to match column name

    def to_dict(self):
        return {
            "id": self.category_id,  # Adjusted to match column name
            "name": self.categoryname,  # Adjusted to match column name
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
