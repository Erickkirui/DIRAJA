from  flask_restful import Resource
from Server.Models.Users import Users
from app import db



class CountUsers(Resource):

    def get(self):
        countUsers = Users.query.count()
        return {"total users": countUsers}, 200

class Addusers(Resource):
    pass


class UsersResourceById(Resource):


    def get(self):
        pass

    def delete(self):
        pass

   
