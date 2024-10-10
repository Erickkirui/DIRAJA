from flask_sqlalchemy import SQLAlchemy
from app import db
from sqlalchemy.orm import validates
from sqlalchemy import func


class ShopStock(db.Model):
    __tablename__ = 'shop_stock'
    stock_id = db.Column(db.Integer, primary_key=True)
    shop_id = db.Column(db.Integer, db.ForeignKey('shops.shops_id'), nullable=False)
    total_cost = db.Column(db.Float, nullable=False)
    unit_price = db.Column(db.Float, nullable=False)
    inventory_id = db.Column(db.Integer, db.ForeignKey('inventory.inventory_id'), nullable=False)
    quantity = db.Column(db.Float, nullable=False)

    shop = db.relationship('Shops', backref=db.backref('shop_stock', lazy=True))
    inventory = db.relationship('Inventory', backref=db.backref('shop_stocks', lazy=True))

    def __repr__(self):
        return f"<ShopStock Shop ID: {self.shop_id}, Item ID: {self.inventory_id}, Quantity: {self.quantity}kg>"