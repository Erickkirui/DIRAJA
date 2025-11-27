from flask_restful import Resource,reqparse
from Server.Models.Permission import Permission
from app import db
from flask_jwt_extended import jwt_required

class GetAllPermissions(Resource):
    @jwt_required()
    def get(self):
        try:
            permissions = Permission.query.all()

            data = []
            for p in permissions:
                data.append({
                    "id": p.id,
                    "user_id": p.user_id,
                    "Dashboard": p.Dashboard,
                    "Stock": p.Stock,
                    "Sales": p.Sales,
                    "Sales_analytics": p.Sales_analytics,
                    "Expenses": p.Expenses,
                    "Mabanda_Farm": p.Mabanda_Farm,
                    "Shops": p.Shops,
                    "Employess": p.Employess,
                    "Suppliers": p.Suppliers,
                    "Creditors": p.Creditors,
                    "Task_manager": p.Task_manager,
                    "Accounting": p.Accounting,
                    "Settings":p.Settings
                })

            return {"status": "success", "permissions": data}, 200

        except Exception as e:
            return {"status": "error", "message": str(e)}, 500


class GetUserPermissions(Resource):

    @jwt_required()
    def get(self, user_id):
        try:
            permission = Permission.query.filter_by(user_id=user_id).first()

            if not permission:
                return {"status": "error", "message": "Permissions not found for this user"}, 404

            data = {
                "id": permission.id,
                "user_id": permission.user_id,
                "Dashboard": permission.Dashboard,
                "Stock": permission.Stock,
                "Sales": permission.Sales,
                "Sales_analytics": permission.Sales_analytics,
                "Expenses": permission.Expenses,
                "Mabanda_Farm": permission.Mabanda_Farm,
                "Shops": permission.Shops,
                "Employess": permission.Employess,
                "Suppliers": permission.Suppliers,
                "Creditors": permission.Creditors,
                "Task_manager": permission.Task_manager,
                "Accounting": permission.Accounting,
                "Settings":permission.Settings
            }

            return {"status": "success", "permissions": data}, 200

        except Exception as e:
            return {"status": "error", "message": str(e)}, 500


class UpdateUserPermissions(Resource):

    @jwt_required()
    def put(self, user_id):
        try:
            permission = Permission.query.filter_by(user_id=user_id).first()

            if not permission:
                return {"status": "error", "message": "Permissions not found for this user"}, 404

            # Parse JSON body
            parser = reqparse.RequestParser()
            parser.add_argument("Dashboard", type=bool)
            parser.add_argument("Stock", type=bool)
            parser.add_argument("Sales", type=bool)
            parser.add_argument("Sales_analytics", type=bool)
            parser.add_argument("Expenses", type=bool)
            parser.add_argument("Mabanda_Farm", type=bool)
            parser.add_argument("Shops", type=bool)
            parser.add_argument("Employess", type=bool)
            parser.add_argument("Suppliers", type=bool)
            parser.add_argument("Creditors", type=bool)
            parser.add_argument("Task_manager", type=bool)
            parser.add_argument("Accounting", type=bool)
            parser.add_argument("Settings", type=bool)

            args = parser.parse_args()

            # Update only non-null values (fields sent in request)
            for key, value in args.items():
                if value is not None:
                    setattr(permission, key, value)

            db.session.commit()

            return {
                "status": "success",
                "message": "Permissions updated successfully"
            }, 200

        except Exception as e:
            db.session.rollback()
            return {"status": "error", "message": str(e)}, 500