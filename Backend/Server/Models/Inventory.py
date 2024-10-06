from flask_sqlalchemy import SQLAlchemy
from app import db
from sqlalchemy.orm import validates
from sqlalchemy import func


class Inventory(db.Model):
    __tablename__= "inventory"

    #Table columns
    inventory_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    itemname = db.Column(db.String(100), nullable=False)
    quantity = db.Column (db.Float, nullable=False)
    metric = db.Column (db.String)
    unitCost = db.Column (db.Float, nullable=False)
    totalCost = db.Column (db.Float, nullable=False)
    amountPaid = db.Column (db.Float, nullable=False)
    unitPrice = db.Column (db.Float, nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    
    
    #validations
    
    @validates('metric')
    def validate_metric(self, key,metric):
        valid_metric = ['item', 'kg', 'ltrs']
        assert metric in metric, f"Invalid metric. Must be one of: {', '.join(valid_metric)}"
        return metric

    def __repr__(self):
        return f"Stock (id{self.id}, itemname='{self.item_name}', quantity='{self.quantity}', metric='{self.metric}', totalcost='{self.totalCost}', unitcost='{self.unitCost}', amountpaid='{self.amountPaid}', unitprice='{self.unitPrice}')"
    
    
class Distribution(db.Model):
    __tablename__ = 'distributions'
    distribution_id = db.Column(db.Integer, primary_key=True)
    inventory_id = db.Column(db.Integer, db.ForeignKey('inventory.inventory_id'), nullable=False)
    distributed_at = db.Column(db.DateTime, server_default=db.func.now())
    remaining_quantity = db.Column(db.Integer)
    # distributed_by = db.Column(db.String(100))  # e.g., username or user_id

    inventory = db.relationship('Inventory', backref=db.backref('distributions', lazy=True))
    transfers = db.relationship('Transfer', backref='distributions', lazy=True)

    def __repr__(self):
        return f"<Distribution {self.distribution_id} - Item ID: {self.inventory_id}>"
    

class Transfer(db.Model):
    __tablename__ = 'transfers'
    transfer_id = db.Column(db.Integer, primary_key=True)
    distribution_id = db.Column(db.Integer, db.ForeignKey('distributions.distribution_id'), nullable=False)
    shop_id = db.Column(db.Integer, db.ForeignKey('shops.shops_id'), nullable=False)
    quantity = db.Column(db.Float, nullable=False)

    shop = db.relationship('Shops', backref=db.backref('transfers', lazy=True))

    def __repr__(self):
        return f"<Transfer Shop ID: {self.shop_id}, Quantity: {self.quantity}kg>"