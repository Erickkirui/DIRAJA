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
    def get(self):
        merit_entries = MeritLedger.query.all()
        result = []

        for entry in merit_entries:
            result.append({
                'meritledger_id': entry.meritledger_id,
                'employee_id': entry.employee_id,
                'employee_name': entry.employee.first_name if entry.employee else None,  # assuming 'name' exists
                'merit_id': entry.merit_id,
                'merit_reason': entry.merit_reason.reason if entry.merit_reason else None,  # assuming 'reason' field
                'merit_point': entry.merit_reason.point if entry.merit_reason else None,
                'comment': entry.comment,
                'date': entry.date.strftime('%Y-%m-%d %H:%M:%S'),
                'resulting_points': entry.resulting_points
            })

        return {'merit_ledger': result}, 200