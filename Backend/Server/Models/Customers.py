from flask_sqlalchemy import SQLAlchemy
from app import db
from sqlalchemy.orm import validates

class Customers(db.Model):
    __tablename__= "customers"

    id = db.Column(db.Integer, primary_key=True , autoincrement=True)
    customer_name = db.Column(db.String(20), nullable=False)
    customer_number = db.Column(db.Integer, nullable=False)
    shop_id = db.Column(db.Integer, db.ForeignKey('shops.id'))
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    item = db.Column(db.JSON, unique=False, nullable=False)
    amount_paid = db.Column(db.Float, nullable=False)
    payment_method = db.Column(db.String(20), nullable=False)

    # relationship 
    shops = db.relationship('Shops' ,backref='customers', lazy=True)
    users = db.relationship('Users', backref='customers', lazy=True)
   


    @validates('payment_method')
    def validate_payment_method(self, key,payment_method):
        valid_method = ['bank', 'cash', 'mpesa']
        assert payment_method in payment_method, f"Invalid Payment Method. Must be one of: {', '.join(valid_method)}"
        return payment_method
    

    def __repr__(self):
        return  f"Customers(id={self.id}, customer_name='{self.customer_name}',customer_number='{self.customer_number}',shopId='{self.shop_id}',userId='{self.user_id}',amoutpayed='{self.amount_paid}', paymentMethod='{self.payment_method}')"