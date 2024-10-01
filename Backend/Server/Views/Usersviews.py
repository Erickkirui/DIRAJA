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

        username = data.get('username')
        email = data.get('email')
        role = data.get('role')
        password = data.get('password')

        user = Users(username=username, email=email, password=password, role=role)
        db.session.add(user)
        db.session.commit()


        return {'message': 'User added successfully'}, 201
    


class UsersResourceById(Resource):


    def get(self):
        pass

    def delete(self):
        pass

   
