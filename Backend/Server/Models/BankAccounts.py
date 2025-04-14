from flask_sqlalchemy import SQLAlchemy
from app import db

class BankAccount(db.Model):
    __table__= 'bank_account'

    id = db.Column(db.Integer, primary_key=True)
    Account_name = db.Column(db.String(50), nullable=False)
    Account_Balance = db.Column(db.Float , nullable=False)
    
    #for Accounting 

    Transaction_type_credit = db.Cuumn() 
    Transaction_type_debit = db.Column()

    

