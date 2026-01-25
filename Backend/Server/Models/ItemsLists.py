from flask_sqlalchemy import SQLAlchemy
from app import db
from sqlalchemy.orm import validates
from sqlalchemy import func
from datetime import datetime


class ItemsList(db.Model):
    __tablename__ = "items_list"

    item_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    item_type = db.Column(db.String(50), nullable=False)
    item_name = db.Column(db.String(50))
    
    # ✅ Added: Foreign key referencing StockItems table
    stock_item_id = db.Column(db.Integer, db.ForeignKey("stock_item.id"), nullable=True)

    # Foreign keys referencing chart_of_accounts.id
    purchase_account = db.Column(db.Integer, db.ForeignKey("chart_of_accounts.id"), nullable=True)
    sales_account = db.Column(db.Integer, db.ForeignKey("chart_of_accounts.id"), nullable=True)
    cost_of_sales_account = db.Column(db.Integer, db.ForeignKey("chart_of_accounts.id"), nullable=True)
    gl_account_id = db.Column(db.Integer, db.ForeignKey("chart_of_accounts.id"), nullable=True)

    description = db.Column(db.String(50), nullable=True)

    # Relationships (optional but useful)
    purchase_account_rel = db.relationship("ChartOfAccounts", foreign_keys=[purchase_account])
    sales_account_rel = db.relationship("ChartOfAccounts", foreign_keys=[sales_account])
    cost_of_sales_account_rel = db.relationship("ChartOfAccounts", foreign_keys=[cost_of_sales_account])
    gl_account_rel = db.relationship("ChartOfAccounts", foreign_keys=[gl_account_id])
    
    # ✅ Added: Relationship to StockItems table
    stock_item_rel = db.relationship("StockItems", foreign_keys=[stock_item_id])

    def __repr__(self):
        return (
            f"<ItemsList(id={self.item_id}, type={self.item_type}, "
            f"name={self.item_name}, stock_item_id={self.stock_item_id})>"
        )
    
    # Optional: Add a property to easily access stock item information
    @property
    def stock_item_info(self):
        """Returns related stock item information if exists"""
        if self.stock_item_rel:
            return {
                'item_code': self.stock_item_rel.item_code,
                'unit_price': self.stock_item_rel.unit_price,
                'pack_price': self.stock_item_rel.pack_price,
                'category': self.stock_item_rel.category
            }
        return None