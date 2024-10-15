# # Server/Models/Expenses.py

# from flask_sqlalchemy import SQLAlchemy
# from app import db
# from sqlalchemy.orm import validates

# class Expenses(db.Model):
#     __tablename__= "expenses"

#     # Table columns
#     expense_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
#     user_id = db.Column(db.Integer, db.ForeignKey('users.users_id'), nullable=False)
#     shop_id = db.Column(db.Integer, db.ForeignKey('shops.shops_id'), nullable=False)
#     item = db.Column(db.String(100), unique=False, nullable=False)
#     description = db.Column(db.String(100), nullable=False)
#     quantity = db.Column(db.Float, nullable=True)
#     totalPrice = db.Column(db.Float, nullable=False)
#     amountPaid = db.Column(db.Float, nullable=False)
#     created_at = db.Column(db.DateTime, nullable=False)
#     transfer_id = db.Column(db.Integer, db.ForeignKey('transfers.transfer_id'), nullable=True)  # New Field

#     # Relationships 
#     user = db.relationship('Users', backref='expenses', lazy=True)
#     shop = db.relationship('Shops', backref='expenses', lazy=True)
#     transfer = db.relationship('Transfer', back_populates='expenses', lazy=True)  #New Relationship

#     def __repr__(self):
#         return f"Expense (id={self.expense_id}, user_id='{self.user_id}', shop_id='{self.shop_id}', item='{self.item}', description='{self.description}', quantity='{self.quantity}', totalPrice='{self.totalPrice}', amountPaid='{self.amountPaid}')"




from flask_sqlalchemy import SQLAlchemy
from app import db
from sqlalchemy.orm import validates



class Expenses(db.Model):
    __tablename__= "expenses"

    #Table columns
    expense_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.users_id'))
    shop_id = db.Column(db.Integer, db.ForeignKey('shops.shops_id'))
    item = db.Column(db.String(100), unique=False, nullable=False)
    description = db.Column(db.String(100), nullable=False)
    quantity = db.Column (db.Float, nullable=True)
    totalPrice = db.Column (db.Float, nullable=False)
    amountPaid = db.Column (db.Float, nullable=False)


    transfer_id = db.Column(db.Integer, db.ForeignKey('transfers.transfer_id'), nullable=True)

    created_at = db.Column(db.DateTime, nullable=False)

    #relationship 

    users = db.relationship('Users' ,backref='expenses', lazy=True)
    shops = db.relationship('Shops' ,backref='expenses', lazy=True)


    # transfer = db.relationship('Transfer', back_populates='expenses', lazy=True)

    

    def __repr__(self):
        return f"Expense (id{self.id}, userid= '{self.user_id}', shopid= '{self.shop_id}', item='{self.item}', description='{self.description}', quantity='{self.quantity}', totalprice='{self.totalPrice}', amountpaid='{self.amountPaid}')"