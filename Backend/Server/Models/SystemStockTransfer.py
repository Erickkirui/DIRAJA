from flask_sqlalchemy import SQLAlchemy
from app import db
from sqlalchemy.orm import validates
from sqlalchemy import func

class SystemStockTransfer(db.Model):
    __tablename__ = 'system_stock_transfer'

    transfer_id = db.Column(db.Integer, primary_key=True)
    shops_id = db.Column(db.Integer, db.ForeignKey('shops.shops_id'), nullable=False)  # Main shop reference
    from_shop_id = db.Column(db.Integer, nullable=False)  # Just a field, not a ForeignKey
    to_shop_id = db.Column(db.Integer, nullable=False)  # Just a field, not a ForeignKey
    users_id = db.Column(db.Integer, db.ForeignKey('users.users_id'), nullable=False)  # User who did the transfer
    itemname = db.Column(db.String(50), nullable=False)
    inventory_id = db.Column(db.Integer, db.ForeignKey('inventory.inventory_id'), nullable=False)
    quantity = db.Column(db.Float, nullable=False)
    batch_number = db.Column(db.String(50), nullable=False)
    transfer_date = db.Column(db.DateTime, default=func.now())
    total_cost = db.Column(db.Float, nullable=False)
    unit_price = db.Column(db.Float, nullable=False)

    # Relationships 
    shop = db.relationship('Shops', backref=db.backref('system_stock_transfers', lazy=True))  # Main shop relation
    user = db.relationship('Users', backref=db.backref('stock_transfers', lazy=True))
    inventory = db.relationship('Inventory', backref=db.backref('system_transfers', lazy=True))

    def __repr__(self):
        return (f"<StockTransfer {self.transfer_id}: {self.quantity} {self.itemname} "
                f"from Shop {self.from_shop_id} to Shop {self.to_shop_id} by User {self.user_id}>")
