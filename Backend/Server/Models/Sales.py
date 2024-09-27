from flask_sqlalchemy import SQLAlchemy
from app import db
from sqlalchemy.orm import validates
from sqlalchemy import func

class Sales(db.Model):
    __tablename__ = "sales"
    
    #Table columns
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    shop_id = db.Column(db.Integer, db.ForeignKey('shops.id'))
    customer_name = db.Column(db.String(20), nullable=False)
    status = db.Column(db.String(20), nullable=False)
    customer_number = db.Column(db.Integer, nullable=False)
    item_name = db.Column(db.String, nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    metric = db.Column(db.String(10), nullable=False)
    unit_price = db.Column(db.Float, nullable=False)
    amount_paid = db.Column(db.Float, nullable=False)
    total_price = db.Column(db.Float, nullable=False)
    payment_method = db.Column(db.String(20), nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    
    users = db.relationship('Users', backref='sales', lazy=True)
    # shops = db.relationship('Shops', backref='sales', lazy=True)
    
    #Validations
    @validates('status')
    def validate_status(self, key,status):
        valid_status = ['paid', 'unpaid', 'partially paid']
        assert status in status, f"Invalid status. Must be one of: {', '.join(valid_status)}"
        return status
    
    @validates('payment_method')
    def validate_payment_method(self, key,payment_method):
        valid_method = ['bank', 'cash', 'mpesa']
        assert payment_method in payment_method, f"Invalid Payment Method. Must be one of: {', '.join(valid_method)}"
        return payment_method
    
    @validates('metric')
    def validate_metric(self, key,metric):
        valid_metric = ['item', 'kg', 'ltrs']
        assert metric in metric, f"Invalid metric. Must be one of: {', '.join(valid_metric)}"
        return metric
   
    def __repr__(self):
        return (
            f"Sale(id={self.id}, user_id='{self.user_id}' "
            f"shop_id='{self.shop_id}', customer_name='{self.customer_name}', "
            f"item_nem={self.item_name}, quantity='{self.quantity}', metric='{self.metric}', "
            f"unit_price='{self.unit_price}', amount_paid='{self.amount_paid}'),"
            f"total_price='{self.total_price}', payment_method='{self.payment_method}')"
        )