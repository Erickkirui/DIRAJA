from flask_sqlalchemy import SQLAlchemy
from app import db
from sqlalchemy.orm import validates
from sqlalchemy import func

class SalesPaymentMethods(db.Model):
    __tablename__ = "sales_payment_methods"
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    sale_id = db.Column(db.Integer, db.ForeignKey('sales.sales_id'), nullable=False)
    payment_method = db.Column(db.String(50), nullable=False)
    amount_paid = db.Column(db.Float, nullable=False)
    balance = db.Column(db.Float, nullable=True)  # New field for balance


    # Validation for payment method
    @validates('payment_method')
    def validate_payment_method(self, key, payment_method):
        valid_methods = ['bank', 'cash', 'mpesa', 'sasapay']
        assert payment_method in valid_methods, f"Invalid payment method. Must be one of: {', '.join(valid_methods)}"
        return payment_method

    def __repr__(self):
        return (
            f"SalesPaymentMethods(id={self.id}, sale_id={self.sale_id}, "
            f"payment_method='{self.payment_method}', amount_paid={self.amount_paid}, balance={self.balance})"
        )