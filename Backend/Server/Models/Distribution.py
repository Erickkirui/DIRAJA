from flask_sqlalchemy import SQLAlchemy
from app import db
from sqlalchemy.orm import validates
from sqlalchemy import func

class SystemStockTransfer(db.Model):
    __tablename__ = 'system_stock_transfer'

    transfer_id = db.Column(db.Integer, primary_key=True)
    from_shop_id = db.Column(db.Integer, db.ForeignKey('shops.shops_id'), nullable=False)
    to_shop_id = db.Column(db.Integer, db.ForeignKey('shops.shops_id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)  # User who did the transfer
    itemname = db.Column(db.String(50), nullable=False)
    inventory_id = db.Column(db.Integer, db.ForeignKey('inventory.inventory_id'), nullable=False)
    quantity = db.Column(db.Float, nullable=False)
    batch_number = db.Column(db.String(50), nullable=False)
    transfer_date = db.Column(db.DateTime, default=func.now())
    total_cost = db.Column(db.Float, nullable=False)
    unit_price = db.Column(db.Float, nullable=False)

    # Relationships 
    from_shop = db.relationship('Shops', foreign_keys=[from_shop_id], backref=db.backref('transfers_sent', lazy=True))
    to_shop = db.relationship('Shops', foreign_keys=[to_shop_id], backref=db.backref('transfers_received', lazy=True))
    user = db.relationship('Users', backref=db.backref('stock_transfers', lazy=True))
    inventory = db.relationship('Inventory', backref=db.backref('transfers', lazy=True))

    def __repr__(self):
        return (f"<StockTransfer {self.transfer_id}: {self.quantity} {self.itemname} "
                f"from Shop {self.from_shop_id} to Shop {self.to_shop_id} by User {self.user_id}>")
