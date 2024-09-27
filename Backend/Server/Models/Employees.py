from flask_sqlalchemy import SQLAlchemy
from app import db
from sqlalchemy.orm import validates


class Employees(db.Model):
    __tablename__= "employees"

    