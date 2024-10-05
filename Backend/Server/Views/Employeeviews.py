from flask_restful import Resource
from Server.Models.Employees import Employees
from app import db
from flask_jwt_extended import jwt_required
from flask import jsonify,request,make_response


from datetime import datetime

class AddNewemployee(Resource):
    @jwt_required()
    def post(self):
        data = request.get_json()

        employee_id = data.get('employee_id')
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
            employee_id=employee_id,
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

        return {"message": "Employee added successfully"}, 201

    def parse_date(self, date_str):
        """
        Helper method to parse a date string into a datetime object.
        Handles both 'YYYY-MM-DD' and 'YYYY-MM-DD HH:MM:SS' formats.
        """
        if date_str:
            try:
                # Try parsing the full datetime format first
                return datetime.strptime(date_str, '%Y-%m-%d %H:%M:%S')
            except ValueError:
                # If only the date is provided, parse as date
                return datetime.strptime(date_str, '%Y-%m-%d')
        return None
