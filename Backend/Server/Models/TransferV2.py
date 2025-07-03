from flask_sqlalchemy import SQLAlchemy
from app import db
from sqlalchemy.orm import validates
from sqlalchemy import func


class TransfersV2(db.Model):
    __tablename__ = 'transfers_v2'

    transfer_id = db.Column(db.Integer, primary_key=True)
    shop_id = db.Column(db.Integer, db.ForeignKey('shops.shops_id'), nullable=False)
    inventory_id = db.Column(db.Integer, db.ForeignKey('inventoryv2.inventoryv2_id'), nullable=True)
    quantity = db.Column(db.Float, nullable=False)
    total_cost = db.Column(db.Float, nullable=False)  # New Field
    BatchNumber = db.Column(db.String(50), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.users_id'))
    itemname = db.Column(db.String(50), nullable=False)
    metric = db.Column(db.String(50))
    amountPaid = db.Column(db.Float, nullable=False)
    unitCost = db.Column(db.Float, nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    shop = db.relationship('Shops', backref=db.backref('transfers_v2', lazy=True))
    users = db.relationship('Users', backref='transfers_v2', lazy=True)
    inventory = db.relationship('InventoryV2', backref='transfers_v2', lazy=True)

    def __repr__(self):
        return f"<TransfersV2 Shop ID: {self.shop_id}, Quantity: {self.quantity}kg>"
