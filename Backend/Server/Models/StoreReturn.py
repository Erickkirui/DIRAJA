from flask_sqlalchemy import SQLAlchemy
from app import db
from sqlalchemy.orm import validates
from sqlalchemy import func

class ReturnsV2(db.Model):
    __tablename__ = "stock_returnv2"

    returnv2_id = db.Column(db.Integer, primary_key=True)
    stockv2_id = db.Column(db.Integer, db.ForeignKey('shop_stock_v2.stockv2_id'))
    inventoryv2_id = db.Column(db.Integer, db.ForeignKey('inventoryV2.inventoryV2_id'))
    shop_id = db.Column(db.Integer, db.ForeignKey('shops.shops_id'))
    quantity = db.Column(db.Integer, nullable=False)
    returned_by = db.Column(db.Integer, db.ForeignKey('users.users_id'))
    return_date = db.Column(db.DateTime, nullable=False)
    reason = db.Column(db.String(255))
    
    # Relationships
    shop_stock = db.relationship('ShopStockV2', backref='returns')
    inventory = db.relationship('InventoryV2', backref='returns')
    returned_by_user = db.relationship('Users', backref='returns')