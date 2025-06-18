from flask_sqlalchemy import SQLAlchemy
from app import db
from sqlalchemy.orm import validates

class SalesDepartment(db.Model):
    __tablename__ = "sales_department"

    departemntsale_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.users_id'), nullable=False)
    shop_id = db.Column(db.Integer, db.ForeignKey('shops.shops_id'), nullable=False)
    item_name = db.Column(db.JSON, nullable=False)
    shop_sale_name = db.Column(db.String(50), nullable=False)
    customer_name = db.Column(db.String(50), nullable=True)
    customer_number = db.Column(db.String(15), nullable=True)
    created_at = db.Column(db.DateTime, nullable=False)
    total_price = db.Column(db.Float)
   

    # Relationships
    users = db.relationship('Users', backref='sales-department', lazy=True)
    shops = db.relationship('Shops', backref='sales-department', lazy=True)
    
    
    def __repr__(self):
        return (
            f"Sale(id={self.sale_id}, user_id='{self.user_id}', "
            f"shop_id='{self.shop_id}', customer_name='{self.customer_name}', "
            f"item_name='{self.item_name}', quantity='{self.quantity}',"
            f"total_price='{self.total_price}', customer_number'{self.customer_number}',"
        )