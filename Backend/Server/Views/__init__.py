from flask import Blueprint
from flask_restful import Api

api_endpoint = Blueprint 

# add all file inputs 
from Server.Views.Usersviews import CountUsers,Addusers,UsersResourceById,UserLogin,GetAllUsers
from Server.Views.Shopsviews import AddShops, ShopsResourceById, ShopsResourceByName
from Server.Views.Inventoryviews import AddInventory, GetAllInventory, InventoryResourceByName
from Server.Views.Bankviews import AddBank, BankResourceByName
from Server.Views.Expenses import AllExpenses,AddExpence,GetShopExpenses,ExpensesResources
from Server.Views.Employeeviews import AddNewemployee,GetAllemployees,Employeeresource


api_endpoint = Blueprint('auth',__name__,url_prefix='/diraja')
api = Api(api_endpoint)


# add all endpoints 

# users endpoints 
api.add_resource(CountUsers, '/countusers')
api.add_resource(GetAllUsers,'/allusers')
api.add_resource(Addusers , '/newuser')
api.add_resource(UsersResourceById, '/user/<int:users_id>')
api.add_resource(UserLogin, '/login')

# shops endpoints 
api.add_resource(AddShops, '/newshop')
api.add_resource(ShopsResourceById, '/shop/<int:shops_id>')
api.add_resource(ShopsResourceByName, '/shop/<string:shopname>')


# inventory endpoints 
api.add_resource(AddInventory, '/newinventory')
api.add_resource(GetAllInventory,'/allinventories')
api.add_resource(InventoryResourceByName, '/inventory/<string:itemname>')


# expenses endpoint 
api.add_resource(AddExpence,'/newexpense')
api.add_resource(AllExpenses, '/allexpenses')
api.add_resource(GetShopExpenses, '/expense/shop/<int:shop_id>')
api.add_resource(ExpensesResources, '/expenses/<int:expense_id>')


# banks endpoint
api.add_resource(AddBank, '/newbank')
api.add_resource(BankResourceByName, '/bank/<string:bankname>')

#emmployee  endpoints 
api.add_resource(AddNewemployee, '/newemployee')
api.add_resource(GetAllemployees, '/allemployees')
api.add_resource(Employeeresource, '/employee/<int:employee_id>')

