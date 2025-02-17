from flask_sqlalchemy import SQLAlchemy
from app import db
from sqlalchemy import func
from sqlalchemy.orm import validates


class LiveStock(db.Model):
    __tablename__="LiveStock"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    shop_id = db.Column(db.Integer, db.ForeignKey("shops.shops_id"), nullable=False)
    item_name = db.Column(db.String(30), nullable=False)
    metric = db.Column(db.String(50))
    clock_in_quantity = db.Column(db.Float, nullable=False)  # Stock counted at the beginning of the day
    added_stock = db.Column(db.Float, default=0.0)  # Stock added during the day
    current_quantity = db.Column(db.Float, nullable=False)  # Updated stock based on added stock
    mismatch_quantity = db.Column(db.Float, default=0.0)  # Difference between clock-in and actual stock
    mismatch_reason = db.Column(db.String(255), nullable=True)  # Reason for mismatch
    clock_out_quantity = db.Column(db.Float, nullable=False)  # Stock at the end of the day
    timestamp = db.Column(db.DateTime, server_default=func.now(), nullable=False)


     
    #validations
    
    @validates('metric')
    def validate_metric(self, key,metric):
        valid_metric = ['item', 'kg', 'ltrs']
        assert metric in metric, f"Invalid metric. Must be one of: {', '.join(valid_metric)}"
        return metric

    def __repr__(self):
        return f"Stock(id={self.id}, shop_id={self.shop_id}, item_name='{self.item_name}', metric='{self.metric}', clock_in_quantity={self.clock_in_quantity}, added_stock={self.added_stock}, current_quantity={self.current_quantity}, mismatch_quantity={self.mismatch_quantity}, clock_out_quantity={self.clock_out_quantity})"
