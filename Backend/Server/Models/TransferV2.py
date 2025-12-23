from flask_sqlalchemy import SQLAlchemy
from app import db
from sqlalchemy.orm import validates
from sqlalchemy import func, Enum


class TransfersV2(db.Model):
    __tablename__ = 'transfers_v2'

    transferv2_id = db.Column(db.Integer, primary_key=True)
    shop_id = db.Column(db.Integer, db.ForeignKey('shops.shops_id'), nullable=False)
    inventoryV2_id = db.Column(db.Integer, db.ForeignKey('inventoryV2.inventoryV2_id'), nullable=True)  # ✅ FK points to inventoryV2
    quantity = db.Column(db.Float, nullable=False)
    received_quantity = db.Column(db.Float, nullable=False, default=0)
    difference = db.Column(db.Float, nullable=False, default=0)
    total_cost = db.Column(db.Float, nullable=False)
    BatchNumber = db.Column(db.String(50), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.users_id'))
    itemname = db.Column(db.String(50), nullable=False)
    metric = db.Column(db.String(50))
    amountPaid = db.Column(db.Float, nullable=False)
    unitCost = db.Column(db.Float, nullable=False)
    created_at = db.Column(db.DateTime, server_default=func.now())

    # ✅ Status field (Received / Not Received)
    status = db.Column(
        Enum('Received', 'Not Received', 'Declined',  name='transfer_status'),
        default='Not Received',
        nullable=False
    )

    # Relationships
    shop = db.relationship('Shops', backref=db.backref('transfers_v2', lazy=True))
    users = db.relationship('Users', backref='transfers_v2', lazy=True)
    
    inventory = db.relationship(
        'InventoryV2',
        primaryjoin="TransfersV2.inventoryV2_id == InventoryV2.inventoryV2_id",
        backref='transfers_v2',
        lazy=True
    )

    def __repr__(self):
        return f"<TransfersV2 Shop ID: {self.shop_id}, Quantity: {self.quantity}{self.metric}, Status: {self.status}>"
