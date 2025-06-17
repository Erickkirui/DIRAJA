from flask_restful import Resource
from flask_jwt_extended import jwt_required
from flask import request
from datetime import datetime
from app import db
from Server.Models.Users import Users
from Server.Models.SalesDepartment import SalesDepartment  # Make sure your model is imported
from flask_jwt_extended import jwt_required, get_jwt_identity
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

class SalesdepartmentSale(Resource):
    @jwt_required()
    def post(self):
        data = request.get_json()

        try:
            new_sale = SalesDepartment(
                user_id=data['user_id'],
                shop_id=data['shop_id'],
                item_name=data['item_name'],  
                customer_name=data.get('customer_name'),
                customer_number=data.get('customer_number'),
                quantity=data['quantity'],
                total_price=data['total_price'],
                created_at=datetime.strptime(data['created_at'], '%Y-%m-%d')
            )

            db.session.add(new_sale)
            db.session.commit()

            return {"message": "Sale added successfully"}, 201

        except KeyError as e:
            return {"error": f"Missing field: {str(e)}"}, 400

        except Exception as e:
            return {"error": str(e)}, 500
