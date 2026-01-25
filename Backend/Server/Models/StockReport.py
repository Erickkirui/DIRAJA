from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import validates
from sqlalchemy import func, ForeignKey
from sqlalchemy.dialects.postgresql import JSON
from datetime import datetime
from app import db

class StockReport(db.Model):
    __tablename__ = 'stock_reports'

    id = db.Column(db.Integer, primary_key=True)
    shop_id = db.Column(db.Integer, db.ForeignKey('shops.shops_id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.users_id'), nullable=False)

    report = db.Column(db.JSON, nullable=False)
    comment = db.Column(db.String(100), nullable=True)
    reported_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    shop = db.relationship('Shops', backref='stock_reports', lazy=True)
    user = db.relationship('Users', backref='stock_reports', lazy=True)

    def __repr__(self):
        return f"<StockReport id={self.id}, shop_id={self.shop_id}, user_id={self.user_id}, reported_at={self.reported_at}>"
