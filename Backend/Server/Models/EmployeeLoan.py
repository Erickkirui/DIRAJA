from flask_sqlalchemy import SQLAlchemy
from app import db
from sqlalchemy.orm import validates
from sqlalchemy import func


class EmployeeLoan(db.Model):
    __tablename__= "employeesLoan"

    
    loan_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    employee_id = db.Column(db.Integer, db.ForeignKey('employees.employee_id'))
    loan = db.Column (db.Float, nullable=False)
    wallet_ballance =db.Column (db.Float)

    #relationship 

    employees = db.relationship('Employees' ,backref='employeesLoan', lazy=True)

    def __repr__(self):
        return f"Employee Loan (id{self.id}, employeeid= {self.employee_id}, loan='{self.loan}, walletbalance={self.wallet_ballance}')"