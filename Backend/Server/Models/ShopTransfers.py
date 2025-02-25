from flask_sqlalchemy import SQLAlchemy
from app import db
from sqlalchemy import func
from sqlalchemy.orm import validates


class ShopTransfer(db.Model):
    __tablename__="shoptransfers"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    shop_id = db.Column(db.Integer, db.ForeignKey("shops.shops_id"), nullable=False)
    item_name = db.Column(db.String(30), nullable=False)
    quantity = db.Column(db.Float, nullable=False)
    metric = db.Column(db.String(50))
    fromshop = db.Column(db.String(255), nullable=True)  # Stock transfered from
    toshop = db.Column(db.String(255), nullable=True)  #Stock transfered to
    created_at = db.Column(db.DateTime, server_default=func.now(), nullable=False)

    shops = db.relationship('Shops' ,backref='Shoptransfers', lazy=True)


    #validations for metrics
    
    @validates('metric')
    def validate_metric(self, key, metric):
        valid_metric = ['item', 'kg', 'ltrs']
        assert metric in valid_metric, f"Invalid metric. Must be one of: {', '.join(valid_metric)}"
        return metric


    def __repr__(self):
        return f"ShopTransfer(id={self.id}, shop_id={self.shop_id}, item_name='{self.item_name}', quantity='{self.quantity}', metric='{self.metric}', fromshop={self.fromshop}, toshop={self.toshop})"