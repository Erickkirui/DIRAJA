from flask_sqlalchemy import SQLAlchemy
from app import db
from sqlalchemy.orm import validates
# from InventoryV2 import InventoryV2
from sqlalchemy import func
import datetime

class SpoiltStock(db.Model):
    __tablename__ = "spoilt"
    
    id = db.Column(db.Integer, primary_key=True)
    clerk_id = db.Column(db.Integer, db.ForeignKey('users.users_id'))
    shop_id = db.Column(db.Integer, db.ForeignKey('shops.shops_id'))
    item = db.Column(db.String(50), nullable=False)
    quantity = db.Column(db.Float)
    unit = db.Column(db.String(10))

    inventory_id = db.Column(db.Integer, db.ForeignKey('inventoryV2.inventoryV2_id'), nullable=True)
    inventory_batch = db.relationship('InventoryV2', backref='spoilt_from_inventory', lazy=True)

    disposal_method = db.Column(db.String(100))
    collector_name = db.Column(db.String(100))
    comment = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, server_default=func.now(), nullable=False, default=datetime.datetime.utcnow)

    status = db.Column(db.String(20), default='pending')
    approved_by = db.Column(db.Integer, db.ForeignKey('users.users_id'), nullable=True)
    approved_at = db.Column(db.DateTime, nullable=True)

    batches_affected = db.Column(db.String(200), nullable=True)
    livestock_deduction = db.Column(db.Float, nullable=True, default=0.0)

    # Relationships
    users = db.relationship('Users', primaryjoin="SpoiltStock.clerk_id == Users.users_id", backref='spoilt', lazy=True)
    shops = db.relationship('Shops', backref='spoilt', lazy=True)
    approver = db.relationship('Users', primaryjoin="SpoiltStock.approved_by == Users.users_id", backref='approved_spoilt', lazy=True)

    # ⬇️ ADD THIS PART HERE — after columns & relationships ⬇️

    # @validates('inventory_id')
    # def load_inventory_item(self, key, value):
    #     """Auto-fill item/unit when spoilage comes from inventory."""
    #     if value:
    #         inv = InventoryV2.query.get(value)
    #         if inv:
    #             self.item = inv.itemname
    #             self.unit = inv.metric
    #     return value
