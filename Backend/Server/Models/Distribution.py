# from flask_sqlalchemy import SQLAlchemy
# from app import db
# from sqlalchemy.orm import validates
# from sqlalchemy import func

# class Distribution(db.Model):
#     __tablename__ = 'distributions'
#     distribution_id = db.Column(db.Integer, primary_key=True)
#     inventory_id = db.Column(db.Integer, db.ForeignKey('inventory.inventory_id'), nullable=False)
#     distributed_at = db.Column(db.DateTime, server_default=db.func.now())
#     remaining_quantity = db.Column(db.Integer)
#     # distributed_by = db.Column(db.String(100))  # e.g., username or user_id
#     inventory = db.relationship('Inventory', backref=db.backref('distributions', lazy=True))
#     transfers = db.relationship('Transfer', backref='distributions', lazy=True)
    

#     def __repr__(self):
#         return f"<Distribution {self.distribution_id} - Item ID: {self.inventory_id}>"