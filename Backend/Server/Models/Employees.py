from flask_sqlalchemy import SQLAlchemy
from app import db
from sqlalchemy.orm import validates
from sqlalchemy import func


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
    
    #Relationship
    shops = db.relationship('Shops' ,backref='employees', lazy=True)
    
    #Valiidations
    @validates('work_email')
    def validate_email(self, key, work_email):
        assert '@' in work_email, "work_email address must contain the @ symbol."
        assert '.' in work_email.split('@')[-1], "work_email address must have a valid domain name."
        return work_email
    
    
    @validates('role')
    def validate_role(self, key, role):
        valid_roles = ['manager', 'clerk']
        assert role in valid_roles, f"Invalid role. Must be one of: {', '.join(valid_roles)}"
        return role
    
    @validates('phone_number')
    def validate_phone_number(self, key, phone_number):
        phone_str = str(phone_number)
        assert phone_str.isdigit(), "Phone number must contain only digits."
        assert len(phone_str) >= 10 and len(phone_str) <= 15, "Phone number must be between 10 and 15 digits."
        return phone_number
    
    @validates('contract_termination_date')
    def validate_contract_termination_date(self, key, contract_termination_date):
        if contract_termination_date is not None and self.starting_date is not None:
            assert contract_termination_date > self.starting_date, "Contract Termination Date must be after Starting Date."
        elif contract_termination_date is None or self.starting_date is None:
            pass  # Allow the employee to be created without these dates
        else:
            raise ValueError("Both contract_termination_date and starting_date must be provided.")

    
    @validates('account_status')
    def validate_account_status(self, key, account_status):
        valid_account_status = ['active', 'inactive']
        assert account_status in account_status, f"Invalid status. Must be one of: {', '.join(valid_account_status)}"
        return account_status
    
    @validates('payment_method')
    def validate_payment_method(self, key,payment_method):
        valid_method = ['bank', 'cash', 'mpesa']
        assert payment_method in payment_method, f"Invalid Payment Method. Must be one of: {', '.join(valid_method)}"
        return payment_method
    

    def __repr__(self):
        return f"<Employee id={self.id}, name={self.first_name} {self.middle_name} {self.surname}, email={self.work_email}, role={self.role}>"
    

