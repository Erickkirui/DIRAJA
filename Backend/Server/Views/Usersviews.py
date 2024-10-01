from  flask_restful import Resource
from Server.Models.Users import Users
from app import db
from flask import request



class CountUsers(Resource):

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
    


class UsersResourceById(Resource):


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

    def delete(self):
        pass

   
