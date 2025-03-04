from flask_sqlalchemy import SQLAlchemy
from app import db

from datetime import datetime


class MabandaStock(db.Model):
    __tablename__ = "mabandastock"
    
    mabandastock_id = db.Column(db.Integer, primary_key=True)
    itemname = db.Column(db.String(100), nullable=False)
    quantity = db.Column(db.String (100), nullable=False)
    price = db.Column(db.Float, nullable=True)
    date_added = db.Column(db.Date, nullable=False)
    shop_id = db.Column(db.Integer, db.ForeignKey('shops.shops_id'), nullable=False)  # Add this line
    
    shop = db.relationship('Shops', backref=db.backref('mabandastock', lazy=True))




class MabandaSale(db.Model):
    __tablename__ = "mabandasale"

    mabandasale_id = db.Column(db.Integer, primary_key=True)
    itemname = db.Column(db.String(100), nullable=False)
    quantity_sold = db.Column(db.String (100), nullable=False)
    amount_paid = db.Column(db.Float, nullable=False)
    sale_date = db.Column(db.Date, nullable=False)
    shop_id = db.Column(db.Integer, db.ForeignKey('shops.shops_id'), nullable=False)    
    
    shop = db.relationship('Shops', backref=db.backref('mabandasale', lazy=True))


class MabandaPurchase(db.Model):
    __tablename__ = "mabandapurchase"

    mabandapurchase_id = db.Column(db.Integer, primary_key=True)
    itemname = db.Column(db.String(100), nullable=False)
    quantity = db.Column(db.String (100), nullable=False)
    price = db.Column(db.Float, nullable=False)
    purchase_date = db.Column(db.Date, nullable=False)
    shop_id = db.Column(db.Integer, db.ForeignKey('shops.shops_id'), nullable=False)
    
    shop = db.relationship('Shops', backref=db.backref('mabandapurchase', lazy=True))


class MabandaExpense(db.Model):
    __tablename__ = "mabandaexpense"
    
    mabandaexpense_id = db.Column(db.Integer, primary_key=True)
    description = db.Column(db.String(200), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    expense_date = db.Column(db.Date, nullable=False)
    shop_id = db.Column(db.Integer, db.ForeignKey('shops.shops_id'), nullable=False)
    
    shop = db.relationship('Shops', backref=db.backref('mabandaexpense', lazy=True))
