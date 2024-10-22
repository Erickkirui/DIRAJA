from flask_sqlalchemy import SQLAlchemy
from app import db
from sqlalchemy.orm import validates
from sqlalchemy import func


class ShopStock(db.Model):
    __tablename__ = 'shop_stock'

    stock_id = db.Column(db.Integer, primary_key=True)
    shop_id = db.Column(db.Integer, db.ForeignKey('shops.shops_id'), nullable=False)
    transfer_id = db.Column(db.Integer, db.ForeignKey('transfers.transfer_id'))
    total_cost = db.Column(db.Float, nullable=False)
    itemname = db.Column(db.String(100), nullable=False)
    metric = db.Column(db.String)
    inventory_id = db.Column(db.Integer, db.ForeignKey('inventory.inventory_id'), nullable=False)
    quantity = db.Column(db.Float, nullable=False)
    BatchNumber = db.Column(db.String(100), nullable=False)
    unitPrice = db.Column (db.Float, nullable=False)


    shop = db.relationship('Shops', backref=db.backref('shop_stock', lazy=True))
    inventory = db.relationship('Inventory', backref=db.backref('shop_stock', lazy=True))
    transfers = db.relationship('Transfer', backref='shop_stock', lazy=True)


    def __repr__(self):
        return f"<ShopStock Shop ID: {self.shop_id}, Item ID: {self.inventory_id}, Quantity: {self.quantity}kg>"