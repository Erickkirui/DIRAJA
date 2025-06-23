from flask_restful import Resource
from flask import request
from Server.Models.Users import Users
from flask_jwt_extended import jwt_required
from app import db
from flask_jwt_extended import jwt_required,get_jwt_identity
from flask import jsonify,request,make_response
from datetime import datetime
from functools import wraps
from Server.Models.Meritpoints import MeritPoints

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

class PostMeritPoint(Resource):

    @jwt_required()
    @check_role('manager')
    def post(self):
        data = request.get_json()

        reason = data.get('reason')
        point = data.get('point')

        if not reason:
            return {"message": "Reason is required."}, 400

        if point is None:
            return {"message": "Point is required."}, 400

        try:
            point = int(point)
        except ValueError:
            return {"message": "Point must be an integer."}, 400

        merit = MeritPoints(reason=reason, point=point)
        db.session.add(merit)
        db.session.commit()

        return {
            "message": "Merit point entry created successfully.",
            "merit_point": {
                "id": merit.meritpoint_id,
                "reason": merit.reason,
                "point": merit.point
            }
        }, 201


class GetAllMeripoints(Resource):

    @jwt_required()
    @check_role('manager')
    def get(self):
        # Optional query param: ?filter=positive|negative|all
        filter_type = request.args.get('filter', 'all')

        query = MeritPoints.query

        if filter_type == 'positive':
            query = query.filter(MeritPoints.point > 0)
        elif filter_type == 'negative':
            query = query.filter(MeritPoints.point < 0)

        merit_points = query.order_by(MeritPoints.meritpoint_id.desc()).all()

        return [{
            "id": mp.meritpoint_id,
            "reason": mp.reason,
            "point": mp.point,
            "created_at": mp.created_at
        } for mp in merit_points], 200

class MeritPointResource(Resource):

    @jwt_required()
    @check_role('manager')
    def get(self, meritpoint_id):
        merit = MeritPoints.query.get(meritpoint_id)
        if not merit:
            return {"message": "Merit point not found."}, 404

        return {
            "id": merit.meritpoint_id,
            "reason": merit.reason,
            "point": merit.point,
            "created_at": merit.created_at
        }, 200

    @jwt_required()
    @check_role('manager')
    def put(self, meritpoint_id):
        data = request.get_json()

        merit = MeritPoints.query.get(meritpoint_id)
        if not merit:
            return {"message": "Merit point not found."}, 404

        reason = data.get("reason")
        point = data.get("point")

        if reason:
            merit.reason = reason
        if point is not None:
            try:
                merit.point = int(point)
            except ValueError:
                return {"message": "Point must be an integer."}, 400

        db.session.commit()

        return {
            "message": "Merit point updated successfully.",
            "merit_point": {
                "id": merit.meritpoint_id,
                "reason": merit.reason,
                "point": merit.point
            }
        }, 200

    @jwt_required()
    @check_role('manager')
    def delete(self, meritpoint_id):
        merit = MeritPoints.query.get(meritpoint_id)
        if not merit:
            return {"message": "Merit point not found."}, 404

        db.session.delete(merit)
        db.session.commit()

        return {"message": "Merit point deleted successfully."}, 200
