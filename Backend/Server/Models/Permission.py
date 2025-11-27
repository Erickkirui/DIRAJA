from flask_sqlalchemy import SQLAlchemy
from app import db
from sqlalchemy.orm import validates
from sqlalchemy import func

class Permission(db.Model):
    __tablename__ = "permission"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.users_id'), nullable=False)
    Dashboard = db.Column(db.Boolean, default=False)
    Stock = db.Column(db.Boolean, default=False)
    Sales = db.Column(db.Boolean, default=False)
    Sales_analytics = db.Column(db.Boolean, default=False)
    Expenses = db.Column(db.Boolean, default=False)
    Mabanda_Farm = db.Column(db.Boolean, default=False)
    Shops = db.Column(db.Boolean, default=False)
    Employess = db.Column(db.Boolean, default=False)
    Suppliers = db.Column(db.Boolean, default=False)
    Creditors = db.Column(db.Boolean, default=False)
    Task_manager = db.Column(db.Boolean, default=False)
    Accounting = db.Column(db.Boolean, default=False)
    Settings = db.Column(db.Boolean, default=False)

    # Relationships
    users = db.relationship('Users', backref='permission', lazy=True)

    def __repr__(self):
        return f"<Permission id={self.id}>"
