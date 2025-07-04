from flask_sqlalchemy import SQLAlchemy
from app import db
from sqlalchemy.orm import validates
from sqlalchemy import func


class ShopStockV2(db.Model):
    __tablename__ = 'shop_stock_v2'

    stockv2_id = db.Column(db.Integer, primary_key=True)
    shop_id = db.Column(db.Integer, db.ForeignKey('shops.shops_id'), nullable=False)
    transferv2_id = db.Column(db.Integer, db.ForeignKey('transfers.transfer_id'))
    total_cost = db.Column(db.Float, nullable=False)
    itemname = db.Column(db.String(50), nullable=False)
    metric = db.Column(db.String(50))
    inventoryv2_id = db.Column(db.Integer, db.ForeignKey('inventoryV2.inventoryV2_id'), nullable=False)
    quantity = db.Column(db.Float, nullable=False)
    BatchNumber = db.Column(db.String(50), nullable=False)
    unitPrice = db.Column(db.Float, nullable=False)

    shop = db.relationship('Shops', backref=db.backref('shop_stock_v2', lazy=True))
    inventory = db.relationship('InventoryV2', backref=db.backref('shop_stock_v2', lazy=True))
    transfers = db.relationship('Transfer', backref='shop_stock_v2', lazy=True)

    def __repr__(self):
        return f"<ShopStockV2 Shop ID: {self.shop_id}, Item ID: {self.inventory_id}, Quantity: {self.quantity}kg>"
