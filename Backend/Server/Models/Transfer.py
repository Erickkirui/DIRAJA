
from flask_sqlalchemy import SQLAlchemy
from app import db
from sqlalchemy.orm import validates
from sqlalchemy import func

class Transfer(db.Model):
    __tablename__ = 'transfers'

    transfer_id = db.Column(db.Integer, primary_key=True)
    shop_id = db.Column(db.Integer, db.ForeignKey('shops.shops_id'), nullable=False)
    inventory_id = db.Column(db.Integer, db.ForeignKey('inventory.inventory_id'), nullable=False)
    quantity = db.Column(db.Float, nullable=False)
    total_cost = db.Column(db.Float, nullable=False)  # New Field
    BatchNumber = db.Column(db.String(100), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.users_id'))
    itemname = db.Column(db.String(100), nullable=False)
    metric = db.Column(db.String)
    amountPaid = db.Column (db.Float, nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    shop = db.relationship('Shops', backref=db.backref('transfers', lazy=True))
    users = db.relationship('Users' ,backref='transfer', lazy=True)
    inventory = db.relationship('Inventory', backref='transfers', lazy=True)
    expenses = db.relationship('Expenses', back_populates='transfer', uselist=False, lazy=True)


    def __repr__(self):
        return f"<Transfer Shop ID: {self.shop_id}, Quantity: {self.quantity}kg>"