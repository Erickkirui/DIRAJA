from flask import Blueprint
from flask_restful import Api

api_endpoint = Blueprint 

# add all file inputs 
from Server.Views.Usersviews import CountUsers,Addusers,UsersResourceById


api_endpoint = Blueprint('auth',__name__,url_prefix='/diraja')
api = Api(api_endpoint)


# add all endpoints 

# users endpoints 
api.add_resource(CountUsers, '/countusers')
api.add_resource(Addusers , '/newuser')
api.add_resource(UsersResourceById, '/user/<int:users_id>')

