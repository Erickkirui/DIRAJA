from flask_sqlalchemy import SQLAlchemy
from app import db
from sqlalchemy.orm import validates
from sqlalchemy import func


class Expenses(db.Model):
    __tablename__= "expenses"

    #Table columns
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    item = db.Column(db.String(100), unique=True, nullable=False)
    description = db.Column(db.String(100), unique=True, nullable=False)
    quantity = db.Column (db.Float, nullable=True)
    totalPrice = db.Column (db.Float, nullable=False)
    amountPaid = db.Column (db.Float, nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    #relationship 

    users = db.relationship('Users' ,backref='expenses', lazy=True)
    

    def __repr__(self):
        return f"Expense (id{self.id}, userid= '{self.user_id}', item='{self.item}', description='{self.description}', quantity='{self.quantity}', totalprice='{self.totalPrice}', amountpaid='{self.amountPaid}')"