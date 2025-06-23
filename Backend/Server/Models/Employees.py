from flask_sqlalchemy import SQLAlchemy
from app import db
from sqlalchemy.orm import validates
from sqlalchemy import func, event
from datetime import datetime


class Employees(db.Model):
    __tablename__= "employees"

    employee_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    first_name = db.Column(db.String(50), nullable=False)
    middle_name = db.Column(db.String(50), nullable=False)
    surname = db.Column(db.String(50), nullable=False)
    phone_number = db.Column(db.Integer, nullable=False)
    work_email = db.Column(db.String(50), nullable= False)
    account_status= db.Column(db.String(50), nullable=False)
    shop_id = db.Column(db.Integer, db.ForeignKey('shops.shops_id'))
    role = db.Column(db.String(50), nullable=False)
    personal_email = db.Column(db.String(50), nullable=True)
    designation = db.Column(db.String(50), nullable=True)
    date_of_birth = db.Column (db.DateTime, nullable=True)
    national_id_number = db.Column (db.Integer, nullable=True)
    kra_pin = db.Column (db.String(50), nullable=True)
    monthly_gross_salary = db.Column (db.Float, nullable=True)
    payment_method = db.Column(db.String(50), nullable=True)
    bank_account_number = db.Column(db.Integer, nullable=True )
    bank_name = db.Column(db.String(50), nullable=True)
    department = db.Column(db.String(50), nullable=True)
    starting_date = db.Column (db.DateTime, nullable=True)
    contract_termination_date = db.Column (db.DateTime, nullable=True)
    contract_renewal_date = db.Column (db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, nullable=True)
    merit_points = db.Column(db.Integer, nullable=False, default=0)
    merit_points_updated_at = db.Column(db.DateTime, nullable=True)

    #Relationship
    shops = db.relationship('Shops' ,backref='employees', lazy=True)

    # Validations...
    @validates('work_email')
    def validate_email(self, key, work_email):
        assert '@' in work_email
        assert '.' in work_email.split('@')[-1]
        return work_email

    @validates('role')
    def validate_role(self, key, role):
        valid_roles = ['manager', 'clerk','procurement']
        assert role in valid_roles
        return role

    @validates('phone_number')
    def validate_phone_number(self, key, phone_number):
        phone_str = str(phone_number)
        assert phone_str.isdigit()
        assert 10 <= len(phone_str) <= 15
        return phone_number

    @validates('contract_termination_date')
    def validate_contract_termination_date(self, key, contract_termination_date):
        if contract_termination_date and self.starting_date:
            assert contract_termination_date > self.starting_date
        return contract_termination_date

    @validates('account_status')
    def validate_account_status(self, key, account_status):
        valid_account_status = ['active', 'inactive']
        assert account_status in valid_account_status
        return account_status

    def __repr__(self):
        return f"<Employee id={self.employee_id}, name={self.first_name} {self.middle_name} {self.surname}, email={self.work_email}, role={self.role}>"


@event.listens_for(Employees.merit_points, 'set')
def update_merit_points_timestamp(target, value, oldvalue, initiator):
    if value != oldvalue:
        target.merit_points_updated_at = datetime.utcnow()
