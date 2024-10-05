from flask_sqlalchemy import SQLAlchemy
from app import db
from sqlalchemy.orm import validates
from sqlalchemy import func


class Shops(db.Model):
    __tablename__ = "shops"
    
    
    #Table columns
    shops_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.users_id'))
    shopname = db.Column(db.String, unique=True, nullable=False)
    employee = db.Column(db.JSON, unique=True, nullable=False)
    shopstatus = db.Column(db.String, default="active", nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    
    #Relationships
    users = db.relationship('Users', backref='shops', lazy=True)
   
   

    @validates('shopstatus')
    def validate_shopstatus(self, key, shopstatus):
        valid_shopstatus = ['active', 'inactive']
        assert shopstatus in shopstatus, f"Invalid status. Must be one of: {', '.join(valid_shopstatus)}"
        return shopstatus
   
    def __repr__(self):
        return f"Shop(id={self.id},user_id='{self.user_id}', sales_id='{self.sales_id}, shopname='{self.shopname}', employee'{self.employee}', shopstatus='{self.shopstatus}')"
    
    
class ShopStock(db.Model):
    __tablename__ = 'shop_stock'
    stock_id = db.Column(db.Integer, primary_key=True)
    shop_id = db.Column(db.Integer, db.ForeignKey('shops.shops_id'), nullable=False)
    inventory_id = db.Column(db.Integer, db.ForeignKey('inventory.inventory_id'), nullable=False)
    quantity = db.Column(db.Float, nullable=False)

    # shop = db.relationship('Shops', backref=db.backref('stock', lazy=True))
    inventory = db.relationship('Inventory', backref=db.backref('shop_stocks', lazy=True))

    def __repr__(self):
        return f"<ShopStock Shop ID: {self.shop_id}, Item ID: {self.inventory_id}, Quantity: {self.quantity}kg>"