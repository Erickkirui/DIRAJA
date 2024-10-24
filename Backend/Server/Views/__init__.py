from flask import Blueprint
from flask_restful import Api

api_endpoint = Blueprint 

# add all file inputs 
from Server.Views.Usersviews import CountUsers,Addusers,UsersResourceById,UserLogin,GetAllUsers
from Server.Views.Shopsviews import AddShops, ShopsResourceById, GetAllShops,CountShops
from Server.Views.Shopstockviews import ShopStockDelete, GetShopStock, GetShopStockByShopId,GetAllStock
from Server.Views.Inventoryviews import AddInventory, GetAllInventory, InventoryResourceById,DistributeInventory


# from Server.Views.Inventoryviews import  GetAllInventory, InventoryResourceById,NewInventory,TransferInventory


from Server.Views.Bankviews import AddBank, BankResourceById
# from Server.Views.Distributionsview import InventoryDistribute, GetAllDistributions, GetDistributionById
from Server.Views.Expenses import AllExpenses,AddExpence,GetShopExpenses,ExpensesResources,TodaysExpenses,WeeksExpenses,MonthsExpenses
from Server.Views.Customersviews import AddCustomer, GetAllCustomers, GetCustomerById
from Server.Views.Employeeviews import AddNewemployee,GetAllemployees,Employeeresource
from Server.Views.employeeloanview import AddEmployeeLoan,GetEmployeeLoan
from Server.Views.Sales import AddSale,GetSales,GetSalesByShop,SalesResources,TodaysSales,WeeksSales,MonthsSales
from Server.Views.ManagerDashbordViews import TotalAmountPaidExpenses,TotalAmountPaidSales,CountEmployees,CountShops


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
api.add_resource(GetAllShops, '/allshops')
api.add_resource(CountShops, '/countshops')


#stock endpoints
#Get stock
api.add_resource(GetShopStock, '/shopstock')
#Get stock by shopid
api.add_resource(GetShopStockByShopId, '/shopstock/shop/<int:shop_id>')  
#Delete a stock in a specific shop
# api.add_resource(ShopStockDelete, '/shops/<int:shop_id>/shop_stock/<int:stock_id>')
# api.add_resource(ShopStockDelete, '/shops/<int:shop_id>/shop_stock/<int:inventory_id>')
api.add_resource(ShopStockDelete, '/shops/<int:shop_id>/inventory/<int:inventory_id>/delete')

api.add_resource(GetAllStock, '/allstock')


#Employess Routes

api.add_resource(AddNewemployee, '/newemployee')
api.add_resource(GetAllemployees,'/allemployees')
api.add_resource(Employeeresource, '/employee/<int:employee_id>')
## Add get employess by shop_id


#Employee loan 
api.add_resource(AddEmployeeLoan,'/newloan')
# inventory endpoints 
api.add_resource(AddInventory, '/newinventory')
api.add_resource(GetAllInventory,'/allinventories')
api.add_resource(InventoryResourceById, '/inventory/<int:inventory_id>')

#distribute stock to a specific shop
# api.add_resource(InventoryDistribute, '/inventory/distribute')
api.add_resource(GetEmployeeLoan,'/employee/loan/<int:employee_id>')

#get distribution details
# api.add_resource(GetAllDistributions, '/inventory/distributions')
# api.add_resource(GetDistributionById, '/inventory/distributions/<distribution_id>')



# expenses endpoint 
api.add_resource(AddExpence,'/newexpense')
api.add_resource(AllExpenses, '/allexpenses')
api.add_resource(GetShopExpenses, '/expense/shop/<int:shop_id>')
api.add_resource(ExpensesResources,'/expense/<int:expense_id>')
api.add_resource(WeeksExpenses, '/expenses/week')
api.add_resource(MonthsExpenses, '/expenses/month')


# banks endpoint
api.add_resource(AddBank, '/newbank')
api.add_resource(BankResourceById, '/bank/<int:bank_id>')


#Customers endpoints
api.add_resource(AddCustomer, '/newcustomer')  
api.add_resource(GetAllCustomers, '/allcustomers')  
api.add_resource(GetCustomerById, '/customers/<int:customer_id>')  


#Sales 
api.add_resource(AddSale, '/newsale')
api.add_resource(GetSales, '/allsales')
api.add_resource(GetSalesByShop,'/sales/shop/<int:shop_id>')
api.add_resource(SalesResources,'/sale/<int:sales_id>')
api.add_resource(WeeksSales, '/sales/week')
api.add_resource(MonthsSales, '/sales/month')




api.add_resource(DistributeInventory,'/transfer')

###  Manager dashbord 
# 1. Total sales 
# 2. Total expenses 
# 3. Count all Shops
# 4. Count Employess
# 5. Sales filter by current date 
# 6. Current date expenses 
# 7. Check items that are close >-10 0 - out of stock 

#manager dashbord
api.add_resource(CountEmployees, '/totalshops')
api.add_resource(TodaysSales, '/sales/today')
api.add_resource(CountEmployees,'/totalemployess')
api.add_resource(TotalAmountPaidExpenses,'/totalexpenses')
api.add_resource(TotalAmountPaidSales,'/totalsales')
api.add_resource(TodaysExpenses, '/expenses/today')

## clerak Dashbord
# 1.sales for shop for the day
# 2.Total slaes
#4.Customesrs for customners
# 5.stock 

