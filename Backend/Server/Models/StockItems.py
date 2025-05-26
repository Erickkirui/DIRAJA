from flask_sqlalchemy import SQLAlchemy
from app import db
from sqlalchemy import func

class StockItems(db.Model):
    __tablename__ = "stock_item"

    id = db.Column(db.Integer, primary_key=True)
    item_name = db.Column(db.String(150), nullable=False)
    item_code = db.Column(db.String(150), nullable=False)


    def __str__(self):
        return f"{self.type} - {self.name}"


