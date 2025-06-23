from flask_restful import Resource, reqparse
from flask import request
from flask_jwt_extended import jwt_required
from datetime import datetime
from app import db
from Server.Models.Employees import Employees
from Server.Models.Users import Users
from Server.Models.MeritLedger import MeritLedger
from Server.Models.Meritpoints import MeritPoints
from functools import wraps
from flask_jwt_extended import jwt_required,get_jwt_identity
from flask import jsonify,request,make_response


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

class AssignMeritPoints(Resource):
    @jwt_required()
    @check_role('manager')  # or other permitted roles
    def post(self, employee_id):
        data = request.get_json()

        merit_id = data.get("merit_id")
        comment = data.get("comment", "")

        if not merit_id:
            return {"message": "'merit_id' is required."}, 400

        # Fetch employee
        employee = Employees.query.get(employee_id)
        if not employee:
            return {"message": "Employee not found."}, 404

        # Fetch merit reason
        merit = MeritPoints.query.filter_by(meritpoint_id=merit_id).first()
        if not merit:
            return {"message": "Merit point reason not found."}, 404

        # Update employee points
        employee.merit_points += merit.point
        employee.merit_points_updated_at = datetime.utcnow()

        # Save to ledger
        ledger_entry = MeritLedger(
            employee_id=employee.employee_id,
            merit_id=merit.meritpoint_id,
            comment=comment,
            resulting_points=employee.merit_points,
            date=datetime.utcnow()
        )

        db.session.add(ledger_entry)
        db.session.commit()

        return {
            "message": "Merit points assigned successfully.",
            "employee": {
                "id": employee.employee_id,
                "name": f"{employee.first_name} {employee.middle_name} {employee.surname}",
                "current_merit_points": employee.merit_points
            },
            "ledger": {
                "merit_id": merit.meritpoint_id,
                "reason": merit.reason,
                "point_change": merit.point,
                "comment": comment,
                "date": ledger_entry.date.isoformat() if ledger_entry.date else None,
                "resulting_points": ledger_entry.resulting_points
            }
        }, 200

class GetMeritLedger(Resource):
    @jwt_required()
    def get(self):
        parser = reqparse.RequestParser()
        parser.add_argument('employee_id', type=int, required=False, help='Optional employee ID to filter')
        args = parser.parse_args()

        if args['employee_id']:
            ledger_entries = MeritLedger.query.filter_by(employee_id=args['employee_id']).order_by(MeritLedger.date.desc()).all()
        else:
            ledger_entries = MeritLedger.query.order_by(MeritLedger.date.desc()).all()

        result = []
        for entry in ledger_entries:
            result.append({
                "ledger_id": entry.meritledger_id,
                "employee_id": entry.employee_id,
                "employee_name": f"{entry.employee.first_name} {entry.employee.middle_name} {entry.employee.surname}",
                "merit_id": entry.merit_id,
                "reason": entry.merit_reason.reason,
                "point_change": entry.merit_reason.point,
                "comment": entry.comment,
                "date": entry.date.isoformat() if entry.date else None,
                "resulting_points": entry.resulting_points
            })

        return {
            "message": "Merit ledger retrieved successfully.",
            "count": len(result),
            "entries": result
        }, 200