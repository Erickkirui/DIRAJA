from flask_sqlalchemy import SQLAlchemy
from app import db
import bcrypt
from sqlalchemy.orm import validates
from sqlalchemy import func


class Users(db.Model):
    __tablename__ = "users"
    
    #Table columns
    users_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    username = db.Column(db.String(20), unique=False, nullable=False)
    email = db.Column(db.String, unique=True, nullable=False)
    role = db.Column(db.String, default="manager", nullable=False)
    password = db.Column(db.String, unique=True, nullable=False)
    employee_id = db.Column(db.Integer, db.ForeignKey('employees.employee_id'))
    created_at = db.Column(db.DateTime, server_default=db.func.now())


    #users relationship
    employees = db.relationship('Employees', backref='users', lazy=True)

    
    # Data validation
    @validates('email')
    def validate_email(self, key, email):
        assert '@' in email, "Email address must contain the @ symbol."
        assert '.' in email.split('@')[-1], "Email address must have a valid domain name."
        return email
    
    def hash_password(self, password):
        # Hash the password using bcrypt
        salt = bcrypt.gensalt()
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), salt)
        return hashed_password.decode('utf-8')
    
    @validates('role')
    def validate_role(self, key, role):
        valid_roles = ['manager', 'clerk']
        assert role in valid_roles, f"Invalid role. Must be one of: {', '.join(valid_roles)}"
        return role
    
    @validates('password')
    def validate_password(self, key, password):
        error_messages = []

        if len(password) < 8:
            error_messages.append("Password must be at least 8 characters long.")

        if not any(char.isupper() for char in password):
            error_messages.append("Password must contain at least one capital letter.")

        if not any(char.isdigit() for char in password):
            error_messages.append("Password must contain at least one number.")
            
        if error_messages:
            raise AssertionError(" ".join(error_messages))

        return self.hash_password(password)
    
    def has_role(self, role):
        return self.role == role
    
    def __repr__(self):
        return f"User(id={self.id},username='{self.username}', email='{self.email}, role='{self.role}', password'{self.password}')" 