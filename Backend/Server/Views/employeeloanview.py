from flask_restful import Resource
from Server.Models.EmployeeLoan import EmployeeLoan
from Server.Models.Users import Users
from app import db
from flask_jwt_extended import jwt_required,get_jwt_identity
from flask import jsonify,request,make_response
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

class GetEmployeeLoan(Resource):
    @jwt_required()
    @check_role('manager')
    def get(self,employee_id):

        employeesloan = EmployeeLoan.query.filter_by(employee_id = employee_id)

        emlpoyee_loan = [{

            "loan_id": employeeloan.loan_id,
            "employee_id" : employeeloan.employee_id,
            "loan" : employeeloan.loan,
            "wallet_ballance" : employeeloan.wallet_ballance

        } for employeeloan in employeesloan]


        return make_response(jsonify(emlpoyee_loan), 200)
    

class AddEmployeeLoan(Resource):
    @jwt_required()
    @check_role('manager')
    def post(self):
        data = request.get_json()

        # Validate incoming data
        if not data or not data.get("employee_id") or not data.get("loan"):
            return make_response(jsonify({"error": "Invalid data, employee_id and loan are required"}), 400)

        try:
            # Create a new EmployeeLoan instance
            new_loan = EmployeeLoan(
                employee_id=data["employee_id"],
                loan=data["loan"],
                wallet_ballance=data.get("wallet_ballance", 0)  # default wallet balance to 0 if not provided
            )

            # Add the new loan to the session
            db.session.add(new_loan)
            db.session.commit()

            return make_response(jsonify({
                "message": "Employee loan added successfully",
                "loan_id": new_loan.loan_id,
                "employee_id": new_loan.employee_id,
                "loan": new_loan.loan,
                "wallet_balance": new_loan.wallet_ballance
            }), 201)

        except Exception as e:
            # Handle any exceptions (e.g., database errors)
            db.session.rollback()
            return make_response(jsonify({"error": str(e)}), 500)


