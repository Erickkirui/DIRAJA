from flask_sqlalchemy import SQLAlchemy
from app import db
from sqlalchemy.orm import validates
from sqlalchemy import func


class Creditors(db.Model):
    __tablename__ = "creditors"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(50), unique=True, nullable=False)
    shop_id = db.Column(db.Integer, db.ForeignKey('shops.shops_id'), nullable=False)
    total_credit = db.Column(db.Float)
    credit_amount = db.Column(db.Float)

    # Relationship using back_populates
    shops = db.relationship('Shops', back_populates='creditors', lazy=True)

    def __str__(self):
        return f"Creditor(id={self.id}, name='{self.name}', shop_id={self.shop_id}, total_credit={self.total_credit}, credit_amount={self.credit_amount})"