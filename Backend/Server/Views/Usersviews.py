from  flask_restful import Resource
from Server.Models.Users import Users
from Server.Models.Employees import Employees
from app import db
import bcrypt
from flask_jwt_extended import create_access_token, create_refresh_token
from flask import jsonify,request,make_response
from functools import wraps
from flask_jwt_extended import jwt_required,get_jwt_identity


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


class CountUsers(Resource):
    @jwt_required()
    def get(self):
        countUsers = Users.query.count()
        return {"total users": countUsers}, 200

class Addusers(Resource):
    
    def post (self):
        data = request.get_json()

        if 'username' not in data or 'email' not in data or 'password' not in data:
            return {'message': 'Missing username, email, or password'}, 400

        username = data.get('username')
        email = data.get('email')
        role = data.get('role')
        password = data.get('password')

        # Check if user already exists
        if Users.query.filter_by(email=email).first():
            return {'message': 'User already exists'}, 400

        user = Users(username=username, email=email, password=password, role=role)
        db.session.add(user)
        db.session.commit()


        return {'message': 'User added successfully'}, 201


class UserLogin(Resource):
    def post(self):
        
        email = request.json.get("email", None)
        password = request.json.get("password", None)

        user = Users.query.filter_by(email=email).one_or_none()

        if not user:
            return make_response(jsonify({"error": "User not found. Please check your email."}), 404)

        if not bcrypt.checkpw(password.encode('utf-8'), user.password.encode('utf-8')):
            return make_response(jsonify({"error": "Wrong password"}), 401)
        
        username = user.username
        user_role = user.role
        response_data = {
            "access_token": create_access_token(identity=user.users_id, additional_claims={'roles': [user_role]}),
            "refresh_token": create_refresh_token(identity=user.users_id),
            "username": username,
            "role": user_role
        }

        # Check if the user is a clerk and include shop_id if so
        if user_role == "clerk":
            employee = Employees.query.filter_by(work_email=email).one_or_none()
            if employee:
                response_data["shop_id"] = employee.shop_id

        return make_response(jsonify(response_data), 200)



class UsersResourceById(Resource):

    @jwt_required()
    @check_role('manager')
    def get(self, users_id):
        user = Users.query.get(users_id)

        if user :
            return {
                    "users_id": user.users_id,
                    "username": user.username,
                    "email": user.email,
                    "password": user.password,
                    "role" : user.role
                }, 200
        else:
            return {"error": "User not found"}, 404
    
    @jwt_required()
    @check_role('manager')
    def delete(self, users_id):
        user = Users.query.get(users_id)

        if user:
            # Delete the user
            db.session.delete(user)
            db.session.commit()

            return {"message": f"User with id {users_id} deleted successfully"}, 200
        else:
            return {"error": "User not found"}, 404

    @jwt_required()
    def put(self, users_id):
        user = Users.query.get(users_id)

        if not user:
            return {"error": "User not found"}, 404

        data = request.get_json()

        # Validate input data
        username = data.get("username")
        email = data.get("email")
        password = data.get("password")
        role = data.get("role")

        if username:
            user.username = username
        if email:
            user.email = email
        if password:
            user.password = password
        if role:
            user.role = role

        # Save changes to the database
        db.session.commit()

        return {
            "message": f"User with id {users_id} updated successfully",
            "user": {
                "users_id": user.users_id,
                "username": user.username,
                "email": user.email,
                "role": user.role
            }
        }, 200

   
class GetAllUsers(Resource):

    @jwt_required()
    @check_role('manager')
    def get(self):
        users = Users.query.all()

        all_users = [{

            "user_id": user.users_id,
            "username": user.username,
            "email": user.email,
            "password": user.password,
            "role" : user.role
            
        } for user in users]

        return make_response(jsonify(all_users), 200)
    
