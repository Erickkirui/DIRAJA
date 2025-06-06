from flask_sqlalchemy import SQLAlchemy
from app import db
from sqlalchemy.orm import validates

class SoldItem(db.Model):
    __tablename__ = "sold_items"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    sales_id = db.Column(db.Integer, db.ForeignKey('sales.sales_id'), nullable=False)
    item_name = db.Column(db.String(50), nullable=False)
    quantity = db.Column(db.Float, nullable=False)
    metric = db.Column(db.String(10), nullable=False)
    unit_price = db.Column(db.Float, nullable=False)
    total_price = db.Column(db.Float, nullable=False)
    BatchNumber = db.Column(db.String(255), nullable=False)
    stock_id = db.Column(db.Integer, db.ForeignKey('shop_stock.stock_id'), nullable=False)
    Cost_of_sale = db.Column(db.Float, nullable=False)
    Purchase_account = db.Column(db.Float, nullable=False)

    shop_stock = db.relationship('ShopStock', backref='sold_items', lazy=True)

    @validates('metric')
    def validate_metric(self, key, metric):
        valid_metric = ['item', 'kg', 'ltrs']
        if metric is not None:
            assert metric in valid_metric, f"Invalid metric. Must be one of: {', '.join(valid_metric)}"
        return metric

    def __repr__(self):
        return f"<SoldItem id={self.id}, item={self.item_name}, quantity={self.quantity}>"
