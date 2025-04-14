from flask_sqlalchemy import SQLAlchemy
from app import db

class ChartOfAccounts(db.Model):
    __tablename__ = 'chart_of_accounts'

    id = db.Column(db.Integer, primary_key=True)
    Account = db.Column(db.String(50), nullable=False)
    
    link_type_account = db.Column(
        db.String(50), 
        db.ForeignKey('account_type.type'), 
        nullable=False
    )

    # Relationship def
    account_type = db.relationship("AccountTypes", backref="charts")

    def __str__(self):
        return f"ChartOfAccounts(id={self.id}, Account='{self.Account}', Type='{self.link_type_account}')"




