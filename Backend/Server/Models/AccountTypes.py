from flask_sqlalchemy import SQLAlchemy
from app import db
from sqlalchemy import func

class AccountTypes(db.Model):
    __tablename__ = "account_type"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    type = db.Column(db.String(50), nullable=False, unique=True)

    def __str__(self):
        return f"{self.type} - {self.name}"


