from flask_sqlalchemy import SQLAlchemy
from app import db
from sqlalchemy.orm import validates

class Sales(db.Model):
    __tablename__ = "sales"
    
    # Table columns
    sales_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.users_id'))
    shop_id = db.Column(db.Integer, db.ForeignKey('shops.shops_id'))
    customer_name = db.Column(db.String(50), nullable=True)
    status = db.Column(db.String(50), default="unpaid", nullable=False)
    customer_number = db.Column(db.Integer, nullable=True)  # Updated to allow empty value
    item_name = db.Column(db.String(50), nullable=False)
    quantity = db.Column(db.Float, nullable=False)
    metric = db.Column(db.String(10), nullable=False)
    unit_price = db.Column(db.Float, nullable=False)
    amount_paid = db.Column(db.Float, nullable=False)
    total_price = db.Column(db.Float, nullable=False)
    payment_method = db.Column(db.String(50), nullable=False)
    BatchNumber = db.Column(db.String(50), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False)
    stock_id = db.Column(db.Integer, db.ForeignKey('shop_stock.stock_id'), nullable=False)
    balance = db.Column(db.Float)  # Fixed typo from 'ballance' to 'balance'
    note = db.Column(db.String(50))
    
    # Relationships
    users = db.relationship('Users', backref='sales', lazy=True)
    shops = db.relationship('Shops', backref='sales_for_shop', lazy=True, foreign_keys=[shop_id])
    shop_stock = db.relationship('ShopStock', backref='sales', lazy=True)
    payment= db.relationship('SalesPaymentMethods', backref='related_sale', lazy=True, cascade="all, delete-orphan")
    
    # Validations
    @validates('status')
    def validate_status(self, key, status):
        valid_status = ['paid', 'unpaid', 'partially_paid']
        if status is not None:
            assert status in valid_status, f"Invalid status. Must be one of: {', '.join(valid_status)}"
        return status

    @validates('payment_method')
    def validate_payment_method(self, key, payment_method):
        valid_method = ['bank', 'cash', 'mpesa']
        if payment_method is not None:
            assert payment_method in valid_method, f"Invalid payment method. Must be one of: {', '.join(valid_method)}"
        return payment_method
    
    @validates('customer_number')
    def validate_customer_number(self, key, customer_number):
        if customer_number == '':
            return None  # Set to None if an empty string is provided
        return customer_number


    @validates('metric')
    def validate_metric(self, key, metric):
        valid_metric = ['item', 'kg', 'ltrs']
        if metric is not None:
            assert metric in valid_metric, f"Invalid metric. Must be one of: {', '.join(valid_metric)}"
        return metric
    
    def __repr__(self):
        return (
            f"Sale(id={self.sales_id}, user_id='{self.user_id}', "
            f"shop_id='{self.shop_id}', customer_name='{self.customer_name}', "
            f"item_name='{self.item_name}', quantity='{self.quantity}', metric='{self.metric}', "
            f"unit_price='{self.unit_price}', amount_paid='{self.amount_paid}', "
            f"total_price='{self.total_price}', payment_method='{self.payment_method}')"
        )
