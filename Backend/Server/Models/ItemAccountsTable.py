from flask_sqlalchemy import SQLAlchemy
from app import db

class ItemAccounts(db.Model):
    __tablename__ = 'item_accounts'

    id = db.Column(db.Integer, primary_key=True)
    item = db.Column(db.String(50), nullable=False)

    # Foreign key linking to ChartOfAccounts
    type = db.Column(db.Integer, db.ForeignKey('chart_of_accounts.id'), nullable=False)

    # Relationship to ChartOfAccounts
    chart_account = db.relationship("ChartOfAccounts", backref="item_accounts")

    def __str__(self):
        return f"ItemAccounts(id={self.id}, item='{self.item}', type={self.type})"
