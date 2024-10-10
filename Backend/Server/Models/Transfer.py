from flask_sqlalchemy import SQLAlchemy
from app import db
from sqlalchemy.orm import validates
from sqlalchemy import func

class Transfer(db.Model):
    __tablename__ = 'transfers'
    transfer_id = db.Column(db.Integer, primary_key=True)
    distribution_id = db.Column(db.Integer, db.ForeignKey('distributions.distribution_id'), nullable=False)
    shop_id = db.Column(db.Integer, db.ForeignKey('shops.shops_id'), nullable=False)
    quantity = db.Column(db.Float, nullable=False)
    total_cost = db.Column(db.Float, nullable=False, default=0.0)  # New Field

    shop = db.relationship('Shops', backref=db.backref('transfers', lazy=True))

    def __repr__(self):
        return f"<Transfer Shop ID: {self.shop_id}, Quantity: {self.quantity}kg>"