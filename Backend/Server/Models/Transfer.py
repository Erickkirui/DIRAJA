# # Server/Models/Transfer.py

# from flask_sqlalchemy import SQLAlchemy
# from app import db

# class Transfer(db.Model):
#     __tablename__ = 'transfers'
#     transfer_id = db.Column(db.Integer, primary_key=True)
#     distribution_id = db.Column(db.Integer, db.ForeignKey('distributions.distribution_id'), nullable=False)
#     shop_id = db.Column(db.Integer, db.ForeignKey('shops.shops_id'), nullable=False)
#     inventory_id = db.Column(db.Integer, db.ForeignKey('inventory.inventory_id'), nullable=False)
#     quantity = db.Column(db.Float, nullable=False)
#     total_cost = db.Column(db.Float, nullable=False)
#     # expense_id = db.Column(db.Integer, db.ForeignKey('expenses.expense_id'), nullable=True)  # New Field

#     # distribution = db.relationship('Distribution', backref='transfers', lazy=True)
#     shop = db.relationship('Shops', backref='transfers', lazy=True)
#     inventory = db.relationship('Inventory', backref='transfers', lazy=True)
#     expense = db.relationship('Expenses', back_populates='transfers', lazy=True)  #New Relationship

#     def __repr__(self):
#         return f"<Transfer {self.transfer_id} - Shop ID: {self.shop_id}, Inventory ID: {self.inventory_id}, Quantity: {self.quantity}>"




from flask_sqlalchemy import SQLAlchemy
from app import db
from sqlalchemy.orm import validates
from sqlalchemy import func

class Transfer(db.Model):
    __tablename__ = 'transfers'
    transfer_id = db.Column(db.Integer, primary_key=True)
    distribution_id = db.Column(db.Integer, db.ForeignKey('distributions.distribution_id'), nullable=False)
    shop_id = db.Column(db.Integer, db.ForeignKey('shops.shops_id'), nullable=False)
    quantity = db.Column(db.Float, nullable=False)
    total_cost = db.Column(db.Float, nullable=False, default=0.0)  # New Field

    shop = db.relationship('Shops', backref=db.backref('transfers', lazy=True))

    def __repr__(self):
        return f"<Transfer Shop ID: {self.shop_id}, Quantity: {self.quantity}kg>"