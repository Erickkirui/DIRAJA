from flask_sqlalchemy import SQLAlchemy
from app import db
from sqlalchemy.orm import validates
from sqlalchemy import func

class Purchases(db.Model):
    __tablename__ = 'purchases'

    purchase_id = db.Column(db.Integer, primary_key=True)
    transfer_id = db.Column(db.Integer, db.ForeignKey('transfers.transfer_id'))
    total_cost = db.Column(db.Float, nullable=False)
    itemname = db.Column(db.String(100), nullable=False)
    amountPaid = db.Column(db.Float, nullable=False)
    Balance = db.Column(db.Float, nullable=False)
    shop_id = db.Column(db.Integer, db.ForeignKey('shops.shops_id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.users_id'))
    BatchNumber = db.Column(db.String(100), nullable=False)
 #add quantity

    users = db.relationship('Users', backref='purchases', lazy=True)
    shop = db.relationship('Shops', backref='purchases', lazy=True)
    transfers = db.relationship('Transfer', backref='purchases', lazy=True)
    created_at = db.Column(db.DateTime, server_default=db.func.now())



    @validates('itemname')
    def validate_itemname(self, key, value):
        """Ensure that item name is not empty and less than or equal to 100 characters."""
        if not value:
            raise ValueError("Item name cannot be empty.")
        if len(value) > 100:
            raise ValueError("Item name must be 100 characters or less.")
        return value

    @validates('BatchNumber')
    def validate_batch_number(self, key, value):
        """Ensure that batch number is not empty and less than or equal to 100 characters."""
        if not value:
            raise ValueError("Batch number cannot be empty.")
        if len(value) > 100:
            raise ValueError("Batch number must be 100 characters or less.")
        return value

    def __repr__(self):
        return f"<Purchases purchase_id={self.purchase_id}, itemname='{self.itemname}', total_cost={self.total_cost}, shop_id={self.shop_id}>"
