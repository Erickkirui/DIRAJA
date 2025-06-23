from app import db
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import func


class MeritLedger(db.Model):
    __tablename__ = "merit_ledger"

    meritledger_id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.Integer, db.ForeignKey('employees.employee_id'), nullable=False)
    merit_id = db.Column(db.Integer, db.ForeignKey('merit_points.meritpoint_id'), nullable=False)
    comment = db.Column(db.String(255), nullable=True)
    date = db.Column(db.DateTime, default=func.now(), nullable=False)
    resulting_points = db.Column(db.Integer, nullable=False)

    # Relationships
    employee = db.relationship('Employees', backref='merit_ledger')
    merit_reason = db.relationship('MeritPoints', backref='merit_ledger')
