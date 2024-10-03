from flask_sqlalchemy import SQLAlchemy
from app import db
from sqlalchemy.orm import validates
from sqlalchemy import func


class Stock(db.Model):
    __tablename__= "stock"

    #Table columns
    stock_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    itemname = db.Column(db.String(100), nullable=False)
    shop_id = db.Column(db.Integer, db.ForeignKey('shops.shops_id'))
    quantity = db.Column (db.Float, nullable=False)
    metric = db.Column (db.String)
    unitCost = db.Column (db.Float, nullable=False)
    totalCost = db.Column (db.Float, nullable=False)
    amountPaid = db.Column (db.Float, nullable=False)
    unitPrice = db.Column (db.Float, nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    #relationship 

    shops = db.relationship('Shops' ,backref='stock', lazy=True)
    
    
    #validations
    
    @validates('metric')
    def validate_metric(self, key,metric):
        valid_metric = ['item', 'kg', 'ltrs']
        assert metric in metric, f"Invalid metric. Must be one of: {', '.join(valid_metric)}"
        return metric



    def __repr__(self):
        return f"Stock (id{self.id}, shopid= '{self.shop_id}', itemname='{self.item_name}', quantity='{self.quantity}', metric='{self.metric}', totalcost='{self.totalCost}', unitcost='{self.unitCost}', amountpaid='{self.amountPaid}', unitprice='{self.unitPrice}')"