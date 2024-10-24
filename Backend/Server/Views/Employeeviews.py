from flask_restful import Resource
from Server.Models.Employees import Employees
from Server.Models.Users import Users
from app import db
from flask_jwt_extended import jwt_required,get_jwt_identity
from flask import jsonify,request,make_response
from datetime import datetime
from functools import wraps



def check_role(required_role):
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            current_user_id = get_jwt_identity()
            user = Users.query.get(current_user_id)
            if user and user.role != required_role:
                 return make_response( jsonify({"error": "Unauthorized access"}), 403 )       
            return fn(*args, **kwargs)
        return decorator
    return wrapper

class AddNewemployee(Resource):
    @jwt_required()
    @check_role('manager')
    def post(self):
        data = request.get_json()

        first_name = data.get('first_name')
        middle_name = data.get('middle_name')
        surname = data.get('surname')
        phone_number = data.get('phone_number')
        work_email = data.get('work_email')
        account_status = data.get('account_status')
        shop_id = data.get('shop_id')
        role = data.get('role')
        personal_email = data.get('personal_email')
        designation = data.get('designation')
        national_id_number = data.get('national_id_number')
        kra_pin = data.get('kra_pin')
        monthly_gross_salary = data.get('monthly_gross_salary')
        payment_method = data.get('payment_method')
        bank_account_number = data.get('bank_account_number')
        bank_name = data.get('bank_name')
        department = data.get('department')

        # Parse the date fields safely
        date_of_birth = self.parse_date(data.get('date_of_birth'))
        starting_date = self.parse_date(data.get('starting_date'))
        contract_termination_date = self.parse_date(data.get('contract_termination_date'))
        contract_renewal_date = self.parse_date(data.get('contract_renewal_date'))

        new_employee = Employees(
            first_name=first_name,
            middle_name=middle_name,
            surname=surname,
            phone_number=phone_number,
            work_email=work_email,
            account_status=account_status,
            shop_id=shop_id,
            role=role,
            personal_email=personal_email,
            designation=designation,
            date_of_birth=date_of_birth,
            national_id_number=national_id_number,
            kra_pin=kra_pin,
            monthly_gross_salary=monthly_gross_salary,
            payment_method=payment_method,
            bank_account_number=bank_account_number,
            bank_name=bank_name,
            department=department,
            starting_date=starting_date,
            contract_termination_date=contract_termination_date,
            contract_renewal_date=contract_renewal_date
        )

        db.session.add(new_employee)
        db.session.commit()

        # Add a new user with the employee details
        default_password = 'defaultPassword123'  # Set a default password or generate one
        new_user = Users(
            username=first_name,  # Use first name as username
            email=work_email,  # Use work email
            role=role if role else 'manager',  # Set role to 'employee' if not provided
            password=default_password,  # Set a default password, or use a password hash function
            employee_id=new_employee.employee_id  # Link to the newly created employee
        )

        db.session.add(new_user)
        db.session.commit()

        return {"message": "Employee and user added successfully"}, 201

    def parse_date(self, date_str):
        """
        Helper method to parse a date string into a datetime object.
        Handles both 'YYYY-MM-DD' and 'YYYY-MM-DD HH:MM:SS' formats.
        """
        if date_str:
            try:
                # Try parsing the full datetime format first
                return datetime.strptime(date_str, '%Y-%m-%d')
            except ValueError:
                # If only the date is provided, parse as date
                return datetime.strptime(date_str, '%Y-%m-%d')
        return None



class GetAllemployees(Resource):
    @jwt_required() 
    @check_role('manager')
    
    def get(self):
    
        employees = Employees.query.all()

        all_employess = [ {
            'employee_id' : employee.employee_id,
            'first_name' : employee.first_name,
            'middle_name' : employee.middle_name,
            'surname' : employee.surname,
            'phone_number' : employee.phone_number,
            'work_email' : employee.work_email,
            'account_status' :employee. account_status,
            'shop_id' : employee.shop_id,
            'role' : employee.role,
            'personal_email' :  employee.personal_email,
            'designation' : employee.designation ,
            'date_of_birth' : employee.date_of_birth,
            'national_id_number':employee.national_id_number,
            'kra_pin' : employee.kra_pin,
            'monthly_gross_salary': employee.monthly_gross_salary,
            'payment_method' : employee.payment_method,
            'bank_account_number' : employee.bank_account_number,
            'bank_name': employee.bank_name,
            'department':employee.department,
            'starting_date' : employee.starting_date,
            'contract_termination_date': employee.contract_termination_date,
            'contract_renewal_date': employee.contract_renewal_date,
            "created_at": employee.created_at

        } for employee in employees ]


        return make_response(jsonify(all_employess), 200)
    



class Employeeresource(Resource):
    @jwt_required()
    @check_role('manager')
    def get(self, employee_id):
        """Get employee details by employee_id"""
        employee = Employees.query.get(employee_id)

        if not employee:
            return {"error": "Employee not found"}, 404

        employee_data = {
            'employee_id': employee.employee_id,
            'first_name': employee.first_name,
            'middle_name': employee.middle_name,
            'surname': employee.surname,
            'phone_number': employee.phone_number,
            'work_email': employee.work_email,
            'account_status': employee.account_status,
            'shop_id': employee.shop_id,
            'role': employee.role,
            'personal_email': employee.personal_email,
            'designation': employee.designation,
            'date_of_birth': employee.date_of_birth,
            'national_id_number': employee.national_id_number,
            'kra_pin': employee.kra_pin,
            'monthly_gross_salary': employee.monthly_gross_salary,
            'payment_method': employee.payment_method,
            'bank_account_number': employee.bank_account_number,
            'bank_name': employee.bank_name,
            'department': employee.department,
            'starting_date': employee.starting_date,
            'contract_termination_date': employee.contract_termination_date,
            'contract_renewal_date': employee.contract_renewal_date
        }

        return make_response(jsonify(employee_data), 200)
    
    @jwt_required()
    @check_role('manager')
    def put(self, employee_id):
        """Update employee details by employee_id"""
        data = request.get_json()

        employee = Employees.query.get(employee_id)
        if not employee:
            return {"error": "Employee not found"}, 404

        # Update fields with the provided data
        employee.first_name = data.get('first_name', employee.first_name)
        employee.middle_name = data.get('middle_name', employee.middle_name)
        employee.surname = data.get('surname', employee.surname)
        employee.phone_number = data.get('phone_number', employee.phone_number)
        employee.work_email = data.get('work_email', employee.work_email)
        employee.account_status = data.get('account_status', employee.account_status)
        employee.shop_id = data.get('shop_id', employee.shop_id)
        employee.role = data.get('role', employee.role)
        employee.personal_email = data.get('personal_email', employee.personal_email)
        employee.designation = data.get('designation', employee.designation)
        employee.date_of_birth = self.parse_date(data.get('date_of_birth'), employee.date_of_birth)
        employee.national_id_number = data.get('national_id_number', employee.national_id_number)
        employee.kra_pin = data.get('kra_pin', employee.kra_pin)
        employee.monthly_gross_salary = data.get('monthly_gross_salary', employee.monthly_gross_salary)
        employee.payment_method = data.get('payment_method', employee.payment_method)
        employee.bank_account_number = data.get('bank_account_number', employee.bank_account_number)
        employee.bank_name = data.get('bank_name', employee.bank_name)
        employee.department = data.get('department', employee.department)
        employee.starting_date = self.parse_date(data.get('starting_date'), employee.starting_date)
        employee.contract_termination_date = self.parse_date(data.get('contract_termination_date'), employee.contract_termination_date)
        employee.contract_renewal_date = self.parse_date(data.get('contract_renewal_date'), employee.contract_renewal_date)

        db.session.commit()

        return {"message": "Employee updated successfully"}, 200
    
    @jwt_required()
    @check_role('manager')
    def delete(self, employee_id):
        """Delete an employee by employee_id"""
        employee = Employees.query.get(employee_id)
        if not employee:
            return {"error": "Employee not found"}, 404

        db.session.delete(employee)
        db.session.commit()

        return {"message": "Employee deleted successfully"}, 200

    def parse_date(self, date_str, original_date):
        """Helper method to parse a date string into a datetime object"""
        if date_str:
            try:
                return datetime.strptime(date_str, '%Y-%m-%d')
            except ValueError:
                try:
                    return datetime.strptime(date_str, '%Y-%m-%d')
                except ValueError:
                    return original_date  # Return the original date if parsing fails
        return original_date  # Return the original date if no new date is provided

class CountEmployees(Resource):
    @jwt_required()
    @check_role('superadmin')
    @check_role('manager')
    def get(self):
        countEmployees = Employees.query.count()
        return {"total employees": countEmployees}, 200 