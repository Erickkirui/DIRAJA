from flask import Blueprint
from flask_restful import Api

api_endpoint = Blueprint 

# add all file inputs 
from Server.Views.Usersviews import (
    CountUsers, Addusers, UsersResourceById, UserLogin, GetAllUsers
)

from Server.Views.Shopsviews import (
    AddShops, ShopsResourceById, GetAllShops
)

from Server.Views.Shopstockviews import (
    ShopStockDelete, GetShopStock, GetShopStockByShopId, GetAllStock,
    UpdateShopStockUnitPrice, AvailableItemsByShopResource,
    ItemDetailsResourceForShop, TransferSystemStock, GetItemsByShopId,
    BatchDetailsResource, AvailableBatchesResource, AvailableBatchesByShopResource,
    GetStockValueByShop, TotalStockValue, ShopStockByDate, GetBatchStock,
    GetItemStock, AddShopStock, BatchDetailsResourceForShop
)

from Server.Views.Inventoryviews import (
    AddInventory, GetAllInventory, InventoryResourceById, DistributeInventory,
    GetTransfer, ManualTransfer, StockDeletionResource, UpdateTransfer,
    GetTransferById, GetInventoryByBatch, DeleteShopStock
)

from Server.Views.Mabandafarmviews import (
    AddMabandaStock, AddMabandaExpense, AddMabandaPurchase, AddMabandaSale,
    MabandaSaleResource, MabandaPurchaseResource, MabandaStockResource,
    MabandaExpenseResource, TotalAmountPaidSalesMabanda, MabandaProfitLossAPI
)

from Server.Views.LiveStock import (
    GetStock, RegisterStock, CheckInStock, CheckoutStock, DeleteStock,
    AddStock, GetAllLiveStock, TransferStock, GetShopTransfers, AutoCheckoutStock
)

from Server.Views.Bankviews import (
    AddBank, BankResourceById
)

from Server.Views.Expenses import (
    AllExpenses, AddExpense, GetShopExpenses, ExpensesResources, TotalBalance
)

from Server.Views.Customersviews import (
    AddCustomer, GetAllCustomers, GetCustomerById, GetCustomersByShop
)

from Server.Views.Employeeviews import (
    AddNewemployee, GetAllemployees, Employeeresource, UpdateEmployeeShop,
    GetEmployeeLeaderboard
)

from Server.Views.employeeloanview import (
    AddEmployeeLoan, GetEmployeeLoan
)

from Server.Views.Sales import (
    AddSale, GetSales, GetSalesByShop, SalesResources, GetPaymentTotals,
    SalesBalanceResource, TotalBalanceSummary, ItemsSoldSummary,
    UpdateSalePayment, GetUnpaidSales, PaymentMethodsResource,
    CapturePaymentResource, CreditHistoryResource, GetSingleSaleByShop,
    SalesByEmployeeResource, GetSale, GetUnpaidSalesByClerk,
    TotalCashSalesByUser, CashSales, CashSalesByUser, GenerateSalesReport
)

from Server.Views.ManagerDashbordViews import (
    TotalAmountPaidExpenses, TotalAmountPaidSalesPerShop, CountEmployees,
    CountShops, TotalAmountPaidAllSales, TotalAmountPaidPerShop,
    TotalAmountPaidPurchases, StockAlert, TotalSalesByShop,
    TotalUnpaidAmountAllSales, TotalAmountPaidForMabanda,
    TotalAmountPaidPurchasesInventory, SalesSummary, TotalFinancialSummary,
    TotalUnpaidAmountPerClerk, TotalExpensesForMabanda
)

from Server.Views.Emailnotifications import (
    Report
)

from Server.Views.Accountingviews import (
    AccountTypeResource, AccountTypeListResource, CreateAccount,
    CreateChartOfAccounts, ChartOfAccountsList, CreateItemAccount,
    GetAllItemAccounts, SalesLedger, PurchasesLedger
)

from Server.Views.AccountBalances import (
    PostBankAccount, DepositToAccount, BankAccountResource,
    GetAllBankAccounts, DailySalesDeposit, TotalBankBalance
)

from Server.Views.SpoiltStock import (
    AddSpoiltStock, SpoiltStockResource
)

from Server.Views.StockItems import (
    PostStockItem, GetAllStockItems, StockItem
)

from Server.Views.CashDepositviews import (
    AddCashDeposit, CashDepositResource
)

from Server.Views.Saledepartmentviews import (
    SalesdepartmentSale, GetSalesdepartmentSales, GetSalesDepartmentSalesByUser,
    TotalAmountDepartmentSales, TotalAmountDepartmentSalesByUser, TopSalesUsers
)

from Server.Views.Meritpointsviews import (
    PostMeritPoint, GetAllMeripoints, MeritPointResource
)

from Server.Views.MeritandDemerit import (
    AssignMeritPoints, GetMeritLedger
)

from Server.Views.SupplierView import (
    AddSupplier, GetAllSuppliers
)

from Server.Views.ShopstockviewsV2 import (
    AddShopStockV2, GetAllStockV2, GetBatchStockV2, GetItemsByShopIdV2,
    GetItemStockV2, GetStockValueByShopV2, GetShopStockByShopIdV2,
    GetShopStockV2, BatchDetailsResourceForShopV2, BatchDetailsResourceV2,
    AvailableBatchesByShopResourceV2, AvailableBatchesResourceV2,
    ShopStockByDateV2, AvailableItemsByShopResourceV2, ShopStockDeleteV2,
    TransferSystemStockV2, ItemDetailsResourceForShopV2, StockReturns
)

from Server.Views.InventoryV2Views import (
    GetInventoryByBatchV2, DistributeInventoryV2, DeleteShopStockV2,
    GetTransferV2, GetTransferByIdV2, UpdateTransferV2, AddInventoryV2,
    GetAllInventoryV2, InventoryResourceByIdV2, StockDeletionResourceV2,
    ManualTransferV2
)

from Server.Views.ExpenseCategoies import (
    PostExpenseCategory, GetAllExpenseCategories, ExpenseCategoryResource
)
from Server.Views.StockReport import(
    SubmitStockReport,ResetShopReportStatus
)

api_endpoint = Blueprint('auth',__name__,url_prefix='/api/diraja')
api = Api(api_endpoint)

# add all endpoints 

# Email reports
api.add_resource(Report, '/send-report')

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
api.add_resource(GetShopStock, '/shopstock')
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
# api.add_resource(TransferSystemStock, "/transfer-system-stock")
api.add_resource(GetBatchStock, '/batch-stock-level')
api.add_resource(GetItemStock, '/item-stock-level')
api.add_resource(ShopStockByDate, '/shopstock/bydate')
api.add_resource(AvailableItemsByShopResource, '/items/available-by-shop')
api.add_resource(ItemDetailsResourceForShop, '/shop-itemdetails')
api.add_resource(AddShopStock, '/addstock')
api.add_resource(GetItemsByShopId, '/items/<int:shop_id>')

#Employess Routes
api.add_resource(AddNewemployee, '/newemployee')
api.add_resource(GetAllemployees,'/allemployees')
api.add_resource(Employeeresource, '/employee/<int:employee_id>')
api.add_resource(UpdateEmployeeShop, '/update-shop/<int:employee_id>')
api.add_resource(AddEmployeeLoan,'/newloan')
api.add_resource(GetEmployeeLeaderboard, '/leaderboard/employee')
api.add_resource(GetEmployeeLoan,'/employee/loan/<int:employee_id>')

# inventory endpoints 
api.add_resource(AddInventory, '/newinventory')
api.add_resource(GetAllInventory,'/allinventories')
api.add_resource(InventoryResourceById, '/inventory/<int:inventory_id>')
api.add_resource(DeleteShopStock, '/deleteshopstock/<int:shop_stock_id>')
api.add_resource(GetInventoryByBatch, '/inventory-by-batch')

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
api.add_resource(GetCustomerById, '/customer/<int:customer_id>')

#Sales 
api.add_resource(AddSale, '/newsale')
api.add_resource(GetSales, '/allsales')
api.add_resource(GetSalesByShop,'/sales/shop/<int:shop_id>')
api.add_resource(SalesResources,'/sale/<int:sales_id>')
api.add_resource(GetPaymentTotals, '/get_payment_totals')
api.add_resource(SalesBalanceResource, '/sales/totalsalesbalance')
api.add_resource(TotalBalanceSummary, '/accountspayable')
api.add_resource(GetUnpaidSales, '/unpaidsales')
api.add_resource(SalesByEmployeeResource, '/sales/<string:username>/<int:shop_id>')
api.add_resource(UpdateSalePayment, '/sale/<int:sale_id>/payment')
api.add_resource(PaymentMethodsResource, "/sales/<int:sale_id>/payment_methods")
api.add_resource(CapturePaymentResource, "/sales/<int:sale_id>/capture-payment")
api.add_resource(CreditHistoryResource, "/credit-history")
api.add_resource(GetSingleSaleByShop, "/sale/<int:shop_id>/<int:sales_id>")
api.add_resource(GetUnpaidSalesByClerk, "/unpaidsales/clerk") 
api.add_resource(ItemsSoldSummary, '/sold-items-summary', '/sold-items-summary/<int:shop_id>')


#Distribution
api.add_resource(DistributeInventory,'/transfer')
api.add_resource(GetTransfer,'/alltransfers')
api.add_resource(UpdateTransfer, "/updatetransfer/<int:transfer_id>")
api.add_resource(ManualTransfer,'/manualtransfer')
api.add_resource(GetTransferById, '/singletransfer/<int:transfer_id>')

#Live stock 
api.add_resource(GetStock,"/get-stock/<int:shop_id>")
api.add_resource(RegisterStock , '/registerstock')
api.add_resource(CheckInStock, '/stockcheckin')
api.add_resource(DeleteStock, "/delete-stock/<int:stock_id>" )
api.add_resource(AddStock, "/addstock")
api.add_resource(CheckoutStock, "/checkout")
api.add_resource(GetAllLiveStock , "/all-shop-stocks")
api.add_resource(TransferStock , "/transfer-shop-stock")
api.add_resource(GetShopTransfers, '/allshoptransfers' )
api.add_resource(AutoCheckoutStock, "/auto-checkout")

#manager dashbord
api.add_resource(CountShops, '/totalshops')
api.add_resource(CountEmployees,'/totalemployees')
api.add_resource(TotalAmountPaidExpenses,'/totalexpenses')
api.add_resource(TotalAmountPaidSalesPerShop,'/totalsales')
api.add_resource(TotalAmountPaidAllSales,"/allshopstotal")
api.add_resource(TotalAmountPaidPurchases,"/totalpurchases")
api.add_resource(TotalAmountPaidPurchasesInventory,"/Invetory-purchase")
api.add_resource(StockAlert,"/checkstock")
api.add_resource(TotalUnpaidAmountAllSales,"/allunpaidtotal")
api.add_resource(TotalAmountPaidForMabanda,'/totalmabandasales')
api.add_resource(TotalExpensesForMabanda,'/totalmabandaexpenses')
api.add_resource(SalesSummary,'/Sale-Summery')
api.add_resource(TotalFinancialSummary,'/summery')
api.add_resource(TotalUnpaidAmountPerClerk, "/unpaidsales/totalperclerk")
api.add_resource(TotalAmountPaidPerShop,"/totalsalespershop")
api.add_resource(TotalSalesByShop,"/totalsalesbyshop/<int:shop_id>")

# Mabanda shop 
api.add_resource(AddMabandaSale,'/newmabandasale')
api.add_resource(AddMabandaExpense,'/newmabandaexpense')
api.add_resource(AddMabandaPurchase,'/newmabandapurchase')
api.add_resource(AddMabandaStock,'/newmabandastock')
api.add_resource(MabandaSaleResource,'/getmabandasale')
api.add_resource(MabandaPurchaseResource,'/getmabandapurchase')
api.add_resource(MabandaStockResource,'/getmabandastock')
api.add_resource(MabandaExpenseResource,'/getmabandaexpense')
api.add_resource(TotalAmountPaidSalesMabanda,'/totalsalesmabanda')
api.add_resource(MabandaProfitLossAPI, '/mabandap&l')

#Accounting 
api.add_resource(CreateAccount, '/add-account')
api.add_resource(AccountTypeListResource, '/account-types/all')
api.add_resource(AccountTypeResource, '/account-types/<int:id>')
api.add_resource(CreateChartOfAccounts, '/add-chart-of-accounts')
api.add_resource(ChartOfAccountsList, '/chart-of-accounts')
api.add_resource(CreateItemAccount, '/itemaccounts')
api.add_resource(GetAllItemAccounts, '/itemaccounts/all')
api.add_resource(SalesLedger, '/sale-ledger')
api.add_resource(PurchasesLedger , '/purchases-ledger')

#Account Ballance 
api.add_resource(PostBankAccount, '/bankaccount')
api.add_resource(GetAllBankAccounts, '/all-acounts')
api.add_resource(DailySalesDeposit, '/sales/daily-deposit', '/sales/daily-deposit/<string:date_str>')
api.add_resource(BankAccountResource, '/bankaccount/<int:account_id>')
api.add_resource(TotalBankBalance, '/total-balance')

#Spoiltstock
api.add_resource(AddSpoiltStock, '/newspoilt')
api.add_resource(SpoiltStockResource, '/allspoilt')

#stockItems 
api.add_resource(PostStockItem, '/add-stock-items')
api.add_resource(GetAllStockItems, '/stockitems')
api.add_resource(StockItem, '/stockitems/<int:item_id>')

#Cash sales
api.add_resource(CashSales, '/sales/cash/shops', '/sales/cash/sale/<int:sale_id>')
api.add_resource(CashSalesByUser, '/sales/cash/user/<int:user_id>')
api.add_resource(TotalCashSalesByUser, '/cashsaleperuser/<string:username>/<int:shop_id>')

#Cash Deposits
api.add_resource(AddCashDeposit, '/cashdeposits/add')
api.add_resource(CashDepositResource, '/cashdeposits', '/cashdeposits/<int:deposit_id>')

#reports 
api.add_resource(GenerateSalesReport, '/generate-sales-report')

#Sales Department
api.add_resource(SalesdepartmentSale, '/salesdepartmentnew')
api.add_resource(GetSalesdepartmentSales, '/allsalesdepartmentsales')
api.add_resource(GetSalesDepartmentSalesByUser, '/salesdepartmentsales/<int:user_id>')
api.add_resource(TotalAmountDepartmentSales,"/salesdepartmenttotal")
api.add_resource(TotalAmountDepartmentSalesByUser,"/salesdepartmenttotal/<int:user_id>")
api.add_resource(TopSalesUsers,'/promo-sales-rank')

#Merit points
api.add_resource(PostMeritPoint, '/newmeritpoint')
api.add_resource(GetAllMeripoints, '/allmeritpoints')
api.add_resource(MeritPointResource, '/merit-points/<int:id>')
api.add_resource(AssignMeritPoints, '/employee/<int:employee_id>/assign-merit')
api.add_resource(GetMeritLedger, '/meritledger')

#Suppliers endpoints 
api.add_resource(AddSupplier , '/creat-supplier')
api.add_resource(GetAllSuppliers,'/all-suppliers' )

#stockv2 endpoints
# api.add_resource(GetShopStockV2, '/shopstockv2')
# api.add_resource(GetShopStockByShopIdV2, '/shopstockv2/shop/<int:shop_id>')  
# api.add_resource(ShopStockDeleteV2, '/shops/<int:shop_id>/inventory/<int:inventory_id>/deletev2')
# api.add_resource(BatchDetailsResourceV2, '/batch-detailsv2')
# api.add_resource(BatchDetailsResourceForShopV2, '/shop-batchdetailsv2')
# api.add_resource(AvailableBatchesResourceV2, '/batches/availablev2')
# api.add_resource(AvailableItemsByShopResourceV2, '/batches/available-by-shopv2')
# api.add_resource(GetAllStockV2, '/allstockv2')
#Get stock
#Get stock by shopid
# api.add_resource(GetShopStockByShopIdV2, '/shopstockv2/shop/<int:shop_id>')  
# api.add_resource(ShopStockDeleteV2, '/shops/<int:shop_id>/inventory/<int:inventory_id>/deletev2')
# api.add_resource(BatchDetailsResourceV2, '/batch-detailsv2')
# api.add_resource(BatchDetailsResourceForShopV2, '/shop-batchdetailsv2')
# api.add_resource(AvailableBatchesResourceV2, '/batches/availablev2')
# api.add_resource(AvailableItemsByShopResourceV2, '/batches/available-by-shopv2')
# api.add_resource(GetAllStockV2, '/allstockv2')

# Inventory V2 endpoints
api.add_resource(AddInventoryV2, '/v2/newinventory')
api.add_resource(GetAllInventoryV2, '/v2/allinventories')
api.add_resource(InventoryResourceByIdV2, '/v2/inventory/<int:inventoryV2_id>')
api.add_resource(DeleteShopStockV2, '/v2/deleteshopstock/<int:stockv2_id>')
api.add_resource(GetInventoryByBatchV2, '/v2/inventory-by-batch')
api.add_resource(DistributeInventoryV2, '/v2/distribute-inventory')
api.add_resource(GetTransferV2, '/v2/transfers')
api.add_resource(GetTransferByIdV2, '/v2/transfer/<int:transferV2_id>')
api.add_resource(UpdateTransferV2, '/v2/transfer/<int:transferV2_id>')
api.add_resource(StockDeletionResourceV2, '/v2/stock/<int:stockV2_id>')
api.add_resource(ManualTransferV2, '/v2/manual-transfer')


#stockv2 endpoints
#Get stock
api.add_resource(GetShopStockV2, '/shopstockv2')
#Get stock by shopid
api.add_resource(GetShopStockByShopIdV2, '/shopstockv2/shop/<int:shop_id>')  
api.add_resource(ShopStockDeleteV2, '/shops/<int:shop_id>/inventory/<int:inventory_id>/deletev2')
api.add_resource(BatchDetailsResourceV2, '/batch-detailsv2')
api.add_resource(BatchDetailsResourceForShopV2, '/shop-batchdetailsv2')
api.add_resource(AvailableBatchesResourceV2, '/batches/availablev2')
api.add_resource(AvailableItemsByShopResourceV2, '/batches/available-by-shopv2')
api.add_resource(GetAllStockV2, '/allstockv2')
api.add_resource(ItemDetailsResourceForShopV2, '/shop-itemdetailsv2')
api.add_resource(TransferSystemStockV2, "/transfer-system-stock")
api.add_resource(StockReturns, "/stockreturns")


#Expensecategories
api.add_resource(PostExpenseCategory, '/add-expense-category')
api.add_resource(GetAllExpenseCategories, '/expensecategories')
api.add_resource(ExpenseCategoryResource, '/expensecategories/<int:category_id>')



#StockReport 
api.add_resource(SubmitStockReport, '/report-stock')
api.add_resource(ResetShopReportStatus, '/reset-report')
