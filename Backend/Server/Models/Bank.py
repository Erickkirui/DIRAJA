from flask_sqlalchemy import SQLAlchemy
from app import db
from sqlalchemy.orm import validates
from sqlalchemy import func


class Bank(db.Model):
    __tablename__ = "bank"
    
    
    #Table columns
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    sales_id = db.Column(db.Integer, db.ForeignKey('sales.id'))
    bank_name = db.Column(db.String, unique=True, nullable=False)
    account_number = db.Column(db.JSON, unique=True, nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    
    #Relationships
    # sales = db.relationship('Sales', backref='bank', lazy=True)
    
    
    def __repr__(self):
        return f"Bank(id={self.id},sales_id='{self.sales_id}', bank_name='{self.bank_name}, account_number='{self.account_number}')"