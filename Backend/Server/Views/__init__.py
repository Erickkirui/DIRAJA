from flask import Blueprint
from flask_restful import Api

api_endpoint = Blueprint 

# add all file inputs 
from Server.Views.Usersviews import CountUsers,Addusers,UsersResourceById,UserLogin,GetAllUsers
from Server.Views.Shopsviews import AddShops, ShopsResourceById, GetAllShops
from Server.Views.Shopstockviews import ShopStockDelete, GetShopStock, GetShopStockByShopId,GetAllStock,UpdateShopStockUnitPrice,AvailableItemsByShopResource,ItemDetailsResourceForShop
from Server.Views.Inventoryviews import AddInventory, GetAllInventory, InventoryResourceById,DistributeInventory,GetTransfer,ManualTransfer, StockDeletionResource


# from Server.Views.Inventoryviews import  GetAllInventory, InventoryResourceById,NewInventory,TransferInventory

from Server.Views.Shopstockviews import GetItemsByShopId,BatchDetailsResource,AvailableBatchesResource,AvailableBatchesByShopResource,GetStockValueByShop,TotalStockValue, ShopStockByDate

from Server.Views.Shopstockviews import GetItemsByShopId,BatchDetailsResource,AvailableBatchesResource,AvailableBatchesByShopResource,BatchDetailsResourceForShop

from Server.Views.Inventoryviews import AddInventory, GetAllInventory, InventoryResourceById,DistributeInventory,DeleteShopStock
from Server.Views.Bankviews import AddBank, BankResourceById
from Server.Views.Expenses import AllExpenses,AddExpense,GetShopExpenses,ExpensesResources,TotalBalance
from Server.Views.Customersviews import AddCustomer, GetAllCustomers, GetCustomerById,GetCustomersByShop
from Server.Views.Employeeviews import AddNewemployee,GetAllemployees,Employeeresource
from Server.Views.employeeloanview import AddEmployeeLoan,GetEmployeeLoan
from Server.Views.Sales import AddSale,GetSales,GetSalesByShop,SalesResources, GetPaymentTotals, SalesBalanceResource, TotalBalanceSummary
from Server.Views.ManagerDashbordViews import TotalAmountPaidExpenses,TotalAmountPaidSalesPerShop,CountEmployees,CountShops,TotalAmountPaidAllSales,TotalAmountPaidPerShop,TotalAmountPaidPurchases,StockAlert


api_endpoint = Blueprint('auth',__name__,url_prefix='/api/diraja')
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



#stock endpoints
#Get stock
api.add_resource(GetShopStock, '/shopstock')
#Get stock by shopid
api.add_resource(GetShopStockByShopId, '/shopstock/shop/<int:shop_id>')  
api.add_resource(ShopStockDelete, '/shops/<int:shop_id>/inventory/<int:inventory_id>/delete')
api.add_resource(BatchDetailsResource, '/batch-details')
api.add_resource(BatchDetailsResourceForShop, '/shop-batchdetails')
api.add_resource(AvailableBatchesResource, '/batches/available')
api.add_resource(AvailableBatchesByShopResource, '/batches/available-by-shop')
api.add_resource(GetAllStock, '/allstock')
api.add_resource(GetStockValueByShop, '/shop/<int:shop_id>/stock-value')
api.add_resource(TotalStockValue, '/shopstock/value')
api.add_resource(UpdateShopStockUnitPrice, '/shopstock/<int:stock_id>/update-unitprice')
api.add_resource(StockDeletionResource, '/stock-delete/<int:stock_id>')

#Shopstock date range
api.add_resource(ShopStockByDate, '/shopstock/bydate')

#Shopstock by item
api.add_resource(AvailableItemsByShopResource, '/items/available-by-shop')
api.add_resource(ItemDetailsResourceForShop, '/shop-itemdetails')





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
api.add_resource(DeleteShopStock, '/deleteshopstock/<int:shop_stock_id>')


#distribute stock to a specific shop
# api.add_resource(InventoryDistribute, '/inventory/distribute')

api.add_resource(GetEmployeeLoan,'/employee/loan/<int:employee_id>')


# expenses endpoint 
api.add_resource(AddExpense,'/newexpense')
api.add_resource(AllExpenses, '/allexpenses')
api.add_resource(GetShopExpenses, '/expense/shop/<int:shop_id>')
api.add_resource(ExpensesResources,'/expense/<int:expense_id>')
api.add_resource(TotalBalance, '/accountsreceivable')


# banks endpoint
api.add_resource(AddBank, '/newbank')
api.add_resource(BankResourceById, '/bank/<int:bank_id>')


#Customers endpoints
api.add_resource(AddCustomer, '/newcustomer')  
api.add_resource(GetAllCustomers, '/allcustomers')  
api.add_resource(GetCustomersByShop, '/customers/<shop_id>')
# api.add_resource(GetCustomerById, '/customers/<int:customer_id>')  


#Sales 
api.add_resource(AddSale, '/newsale')
api.add_resource(GetSales, '/allsales')
api.add_resource(GetSalesByShop,'/sales/shop/<int:shop_id>')
api.add_resource(SalesResources,'/sale/<int:sales_id>')
api.add_resource(GetPaymentTotals, '/get_payment_totals')
api.add_resource(SalesBalanceResource, '/sales/totalsalesbalance')
api.add_resource(TotalBalanceSummary, '/accountspayable')


#Distribution
api.add_resource(DistributeInventory,'/transfer')
api.add_resource(GetTransfer,'/alltransfers')
api.add_resource(ManualTransfer,'/manualtransfer')


###  Manager dashbord 
# 1. Total sales 
# 2. Total expenses 
# 3. Count all Shops
# 4. Count Employess
# 5. Sales filter by current date 
# 6. Current date expenses 
# 7. Check items that are close >-10 0 - out of stock 

#manager dashbord
api.add_resource(CountShops, '/totalshops')
api.add_resource(CountEmployees,'/totalemployees')
api.add_resource(TotalAmountPaidExpenses,'/totalexpenses')
api.add_resource(TotalAmountPaidSalesPerShop,'/totalsales')
api.add_resource(TotalAmountPaidAllSales,"/allshopstotal")
api.add_resource(TotalAmountPaidPurchases,"/totalpurchases")
api.add_resource(StockAlert,"/checkstock")


## clerak Dashbord
# 1.sales for shop for the day
# 2.Total slaes
#4.Customesrs for customners
# 5.stock 

api.add_resource(GetItemsByShopId, '/items/<int:shop_id>')

# Sales dashboard
api.add_resource(TotalAmountPaidPerShop,"/totalsalespershop")