from flask import Blueprint
from flask_restful import Api

api_endpoint = Blueprint 

# add all file inputs 
from Server.Views.Usersviews import CountUsers,Addusers,UsersResourceById,UserLogin,GetAllUsers
from Server.Views.Shopsviews import AddShops, ShopsResourceById, ShopsResourceByName, ShopStockDelete, GetShopStock, GetShopStockByShopId
from Server.Views.Inventoryviews import AddInventory, GetAllInventory, InventoryResourceById, InventoryDistribute, GetAllDistributions, GetDistributionById
from Server.Views.Bankviews import AddBank, BankResourceById
from Server.Views.Expenses import AllExpenses,AddExpence,GetShopExpenses

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
#Get stock
api.add_resource(GetShopStock, '/shop_stock')
#Get stock by shopid
api.add_resource(GetShopStockByShopId, '/shop_stock/shop/<int:shop_id>')  
#Delete a stock in a specific shop
# api.add_resource(ShopStockDelete, '/shops/<int:shop_id>/shop_stock/<int:stock_id>')
api.add_resource(ShopStockDelete, '/shops/<int:shop_id>/shop_stock/<int:inventory_id>')




# inventory endpoints 
api.add_resource(AddInventory, '/newinventory')
api.add_resource(GetAllInventory,'/allinventories')
api.add_resource(InventoryResourceById, '/inventory/<int:inventory_id>')

#distribute stock to a specific shop
api.add_resource(InventoryDistribute, '/inventory/distribute')

#get distribution details
api.add_resource(GetAllDistributions, '/inventory/distributions')
api.add_resource(GetDistributionById, '/inventory/distributions/<distribution_id>')



# expenses endpoint 
api.add_resource(AddExpence,'/newexpense')
api.add_resource(AllExpenses, '/allexpenses')
api.add_resource(GetShopExpenses, '/expense/shop/<int:shop_id>')


# banks endpoint
api.add_resource(AddBank, '/newbank')
api.add_resource(BankResourceById, '/bank/<int:bank_id>')




