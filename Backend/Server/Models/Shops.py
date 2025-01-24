from flask_sqlalchemy import SQLAlchemy
from app import db
from sqlalchemy.orm import validates
from sqlalchemy import func


class Shops(db.Model):
    __tablename__ = "shops"
    
    
    #Table columns
    shops_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    shopname = db.Column(db.String(50), unique=True, nullable=False)
    location = db.Column(db.String(50), nullable=False)
    employee = db.Column(db.JSON, unique=True, nullable=False)
    shopstatus = db.Column(db.String(50), default="active", nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    

    @validates('shopstatus')
    def validate_shopstatus(self, key, shopstatus):
        valid_shopstatus = ['active', 'inactive']
        assert shopstatus in shopstatus, f"Invalid status. Must be one of: {', '.join(valid_shopstatus)}"
        return shopstatus
   
    def __repr__(self):
        return f"Shop(id={self.id}, sales_id='{self.sales_id}, shopname='{self.shopname}', employee'{self.employee}', shopstatus='{self.shopstatus}')"
    
    
