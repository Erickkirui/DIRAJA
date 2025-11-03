from flask_sqlalchemy import SQLAlchemy
from app import db
from sqlalchemy.orm import validates
from sqlalchemy import func
from sqlalchemy import func, Enum


class StockReconciliation(db.Model):
    __tablename__= "stock_reconciliation"

    id = db.Column(db.Integer, primary_key=True , autoincrement=True)
    shop_id = db.Column(db.Integer, db.ForeignKey('shops.shops_id'))
    user_id = db.Column(db.Integer, db.ForeignKey('users.users_id'))
    stock_value = db.Column(db.Float, nullable=False)
    report_value = db.Column(db.Float, nullable=False)
    item = db.Column(db.String(50), nullable=False)
    difference = db.Column(db.Float, nullable=False)
    status = db.Column(
        Enum('Solved', 'Unsolved', name='reconciliation_status'),
        default='Unsolved',
        nullable=False
    )
    comment = db.Column(db.String(50), nullable=True)
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    # relationship 
    shops = db.relationship('Shops' ,backref='stock_reconciliation', lazy=True)
    users = db.relationship('Users', backref='stock_reconciliation', lazy=True)



