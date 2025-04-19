from flask_sqlalchemy import SQLAlchemy
from app import db

# ✅ Define association table first
item_chart_assoc = db.Table(
    'item_chart_assoc',
    db.Column('item_account_id', db.Integer, db.ForeignKey('item_accounts.id'), primary_key=True),
    db.Column('chart_account_id', db.Integer, db.ForeignKey('chart_of_accounts.id'), primary_key=True)
)

# ✅ ItemAccounts model
class ItemAccounts(db.Model):
    __tablename__ = 'item_accounts'

    id = db.Column(db.Integer, primary_key=True)
    item = db.Column(db.String(50), nullable=False)

    chart_accounts = db.relationship('ChartOfAccounts', secondary=item_chart_assoc, backref='items')

    def __str__(self):
        return f"ItemAccounts(id={self.id}, item='{self.item}')"