from flask_sqlalchemy import SQLAlchemy
from app import db
from sqlalchemy import func

class ExpenseCategory(db.Model):
    __tablename__ = "expense_category"

    id = db.Column(db.Integer, primary_key=True)
    category_name = db.Column(db.String(150), nullable=False)
    type = db.Column(db.String(150), nullable=True)


    def __str__(self):
        return f"{self.type} - {self.category_name}"