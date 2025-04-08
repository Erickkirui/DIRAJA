from flask_sqlalchemy import SQLAlchemy
from app import db
from sqlalchemy.orm import validates
import datetime


class Expenses(db.Model):
    __tablename__= "expenses"

    #Table columns
    expense_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.users_id'))
    shop_id = db.Column(db.Integer, db.ForeignKey('shops.shops_id'))
    item = db.Column(db.String(50), unique=False, nullable=False)
    description = db.Column(db.String(50), nullable=False) 
    category = db.Column(db.String(50), nullable=False) 
    quantity = db.Column (db.Float, nullable=True)
    paidTo = db.Column (db.String(50), nullable=True)
    totalPrice = db.Column (db.Float, nullable=False)
    amountPaid = db.Column (db.Float, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False)
    source = db.Column(db.String(100), nullable=False)

    #relationship 

    users = db.relationship('Users' ,backref='expenses', lazy=True)
    shops = db.relationship('Shops' ,backref='expenses', lazy=True)
    
    # Validation for source column
    VALID_SOURCES = {
        "Shop Tills",
        "Petty Cash - 011 64 (0) 0393 held by Momanyi",
        "Bank (Standard Chartered Account number 0102488954500)",
        "Leonard Sasapay (account: 254711592002)"
    }

    @validates('source')
    def validate_source(self, key, value):
        if value not in self.VALID_SOURCES:
            raise ValueError(f"Invalid source: {value}. Must be one of {self.VALID_SOURCES}")
        return value   


    

    def __repr__(self):
        return (f"Expense (expense_id={self.expense_id}, user_id='{self.user_id}', "
            f"shop_id='{self.shop_id}', category='{self.category}', item='{self.item}', description='{self.description}', "
            f"quantity='{self.quantity}', paidTo='{self.paidTo}', totalPrice='{self.totalPrice}', amountPaid='{self.amountPaid}')"
            f"source='{self.source}')")
