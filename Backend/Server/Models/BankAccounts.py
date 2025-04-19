from flask_sqlalchemy import SQLAlchemy
from app import db

class BankAccount(db.Model):
    __tablename__ = 'bank_account'

    id = db.Column(db.Integer, primary_key=True)
    Account_name = db.Column(db.String(50), nullable=False, unique=True)
    Account_Balance = db.Column(db.Float, nullable=False)

    transactions = db.relationship('BankingTransaction', backref='account', lazy=True)


class BankingTransaction(db.Model):
    __tablename__ = 'banking_transaction'

    id = db.Column(db.Integer, primary_key=True)
    account_id = db.Column(db.Integer, db.ForeignKey('bank_account.id'), nullable=False)
    Transaction_type_credit = db.Column(db.Float)
    Transaction_type_debit = db.Column(db.Float)
