from flask_sqlalchemy import SQLAlchemy
from app import db
from sqlalchemy.orm import validates
from sqlalchemy import func

class CookedItems(db.Model):
    __tablename__ = 'cooked_items'

    id = db.Column(db.Integer, primary_key=True)
    shop_id = db.Column(db.Integer, nullable=False)
    from_itemname = db.Column(db.String(255), nullable=False)
    to_itemname = db.Column(db.String(255), nullable=False)
    quantity_moved = db.Column(db.Float, nullable=False)
    unit_cost = db.Column(db.Float, nullable=True)
    total_cost = db.Column(db.Float, nullable=True)
    performed_by = db.Column(db.Integer, db.ForeignKey('users.users_id'), nullable=False)
    created_at = db.Column(db.DateTime, server_default=func.now())

    def __repr__(self):
        return f"<CookedItems {self.from_itemname} -> {self.to_itemname} ({self.quantity_moved})>"
