from flask_sqlalchemy import SQLAlchemy
from app import db
import bcrypt
from sqlalchemy.orm import validates
from sqlalchemy import func


class Shops(db.Model):
    __tablename__ = "shops"
    
    #Table columns
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    sales_id = db.Column(db.Integer, db.ForeignKey('sales.id'))
    shop_name = db.Column(db.String, unique=True, nullable=False)
    employee = db.Column(db.JSON, unique=True, nullable=False)
    shop_status = db.Column(db.String, default="active", nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    
    users = db.relationship('Users', backref='shops', lazy=True)
    sales = db.relationship('Sales', backref='sales', lazy=True)
    
    @validates('shopstatus')
    def validate_role(self, key, shopstatus):
        valid_shopstatus = ['active', 'inactive']
        assert shopstatus in shopstatus, f"Invalid role. Must be one of: {', '.join(valid_shopstatus)}"
        return shopstatus
   
    def __repr__(self):
        return f"Shop(id={self.id},user_id='{self.user_id}', sales_id='{self.sales_id}, shop_name='{self.shop_name}', employee'{self.employee}', shop_status='{self.shop_status}')"