from flask_sqlalchemy import SQLAlchemy
from app import db
from sqlalchemy.orm import validates
from sqlalchemy import func

class Shoptoshoptransfer(db.Model):
    __tablename__ = 'shoptoshop_transfer'

    transfer_id = db.Column(db.Integer, primary_key=True)
    shops_id = db.Column(db.Integer, db.ForeignKey('shops.shops_id'), nullable=False)
    from_shop_id = db.Column(db.Integer, nullable=False)
    to_shop_id = db.Column(db.Integer, nullable=False)
    users_id = db.Column(db.Integer, db.ForeignKey('users.users_id'), nullable=False)
    stockv2_id = db.Column(db.Integer, db.ForeignKey('shop_stock_v2.stockv2_id'), nullable=False)
    itemname = db.Column(db.String(50), nullable=False)
    metric = db.Column(db.String(20), nullable=False)   # ✅ added metric column
    quantity = db.Column(db.Float, nullable=False)
    transfer_date = db.Column(db.DateTime, default=func.now())
    status = db.Column(db.String(20), default="pending")   # pending | accepted | declined

    
    # Relationships 
    shop = db.relationship('Shops', backref=db.backref('shoptoshop_transfers', lazy=True))
    user = db.relationship('Users', backref=db.backref('shoptoshop_transfers', lazy=True))
    stockv2 = db.relationship('ShopStockV2', backref=db.backref('system_transfers', lazy=True))

    def __repr__(self):
        return (f"<StockTransfer {self.transfer_id}: {self.quantity} {self.itemname} "
                f"from Shop {self.from_shop_id} to Shop {self.to_shop_id} by User {self.users_id}>")