from flask_sqlalchemy import SQLAlchemy
from app import db
from sqlalchemy.orm import validates
from sqlalchemy import func
import datetime

class SpoiltStock(db.Model):
    __tablename__ = "spoilt"
    
    id = db.Column(db.Integer, primary_key=True)
    clerk_id = db.Column(db.Integer, db.ForeignKey('users.users_id'))
    shop_id = db.Column(db.Integer, db.ForeignKey('shops.shops_id'))
    item = db.Column(db.String(50), nullable=False)
    quantity = db.Column(db.Float)
    unit = db.Column(db.String(10))  # 'kgs' or 'count'
    disposal_method = db.Column(db.String(100))  # 'sent to depot' or 'collected by waste disposer'
    collector_name = db.Column(db.String(100))
    comment = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, server_default=func.now(), nullable=False, default=datetime.datetime.utcnow)
    
    
    users = db.relationship('Users', backref='spoilt', lazy=True)
    shops = db.relationship('Shops', backref='spoilt', lazy=True)