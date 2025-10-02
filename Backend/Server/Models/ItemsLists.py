from flask_sqlalchemy import SQLAlchemy
from app import db
from sqlalchemy.orm import validates
from sqlalchemy import func


class ItemsList(db.Model):
    __tablename__ = "items_list"

    item_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    item_type = db.Column(db.String(50), nullable=False)
    item_name = db.Column(db.String(50))

    # Foreign keys referencing chart_of_accounts.id
    purchase_account = db.Column(db.Integer, db.ForeignKey("chart_of_accounts.id"), nullable=True)
    sales_account = db.Column(db.Integer, db.ForeignKey("chart_of_accounts.id"), nullable=True)
    cost_of_sales_account = db.Column(db.Integer, db.ForeignKey("chart_of_accounts.id"), nullable=True)
    gl_account_id = db.Column(db.Integer, db.ForeignKey("chart_of_accounts.id"), nullable=True)

    description = db.Column(db.String, nullable=True)

    # Relationships (optional but useful)
    purchase_account_rel = db.relationship("ChartOfAccounts", foreign_keys=[purchase_account])
    sales_account_rel = db.relationship("ChartOfAccounts", foreign_keys=[sales_account])
    cost_of_sales_account_rel = db.relationship("ChartOfAccounts", foreign_keys=[cost_of_sales_account])
    gl_account_rel = db.relationship("ChartOfAccounts", foreign_keys=[gl_account_id])

    def __repr__(self):
        return (
            f"<ItemsList(id={self.item_id}, type={self.item_type}, "
            f"gl_account_id={self.gl_account_id})>"
        )
