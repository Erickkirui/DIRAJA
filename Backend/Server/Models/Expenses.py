from flask_sqlalchemy import SQLAlchemy
from app import db
import datetime

class Expenses(db.Model):
    __tablename__ = "expenses"

    # Table columns
    expense_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.users_id'))
    shop_id = db.Column(db.Integer, db.ForeignKey('shops.shops_id'))
    item = db.Column(db.String(50), nullable=False)
    description = db.Column(db.String(50), nullable=False) 
    category = db.Column(db.String(50), nullable=False) 
    quantity = db.Column(db.Float, nullable=True)
    paidTo = db.Column(db.String(50), nullable=True)
    totalPrice = db.Column(db.Float, nullable=False)
    amountPaid = db.Column(db.Float, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.datetime.utcnow)
    source = db.Column(db.String(100), nullable=False)
    comments = db.Column(db.Text, nullable=True)  # Added comments column
    paymentRef = db.Column(db.String(100), nullable=False)

    # Relationships
    users = db.relationship('Users', backref='expenses', lazy=True)
    shops = db.relationship('Shops', backref='expenses', lazy=True)

    def __repr__(self):
        return (f"Expense (expense_id={self.expense_id}, user_id='{self.user_id}', "
                f"shop_id='{self.shop_id}', category='{self.category}', item='{self.item}', "
                f"description='{self.description}', quantity='{self.quantity}', "
                f"paidTo='{self.paidTo}', totalPrice='{self.totalPrice}', "
                f"amountPaid='{self.amountPaid}', source='{self.source}', comments='{self.comments}')")
