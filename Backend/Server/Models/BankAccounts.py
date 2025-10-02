from flask_sqlalchemy import SQLAlchemy
from app import db

class BankAccount(db.Model):
    __tablename__ = 'bank_account'

    id = db.Column(db.Integer, primary_key=True)
    Account_name = db.Column(db.String(50), nullable=False, unique=True)
    Account_Balance = db.Column(db.Float, nullable=False)

    # Foreign key to Chart of Accounts
    chart_account_id = db.Column(
        db.Integer, 
        db.ForeignKey("chart_of_accounts.id"), 
        nullable=True
    )

    # Relationship (optional, but makes it easy to query the linked account)
    chart_account = db.relationship("ChartOfAccounts", backref="bank_accounts")

    transactions = db.relationship('BankingTransaction', backref='account', lazy=True)



class BankingTransaction(db.Model):
    __tablename__ = 'banking_transaction'

    id = db.Column(db.Integer, primary_key=True)
    account_id = db.Column(db.Integer, db.ForeignKey('bank_account.id'), nullable=False)
    Transaction_type_credit = db.Column(db.Float)
    Transaction_type_debit = db.Column(db.Float)
