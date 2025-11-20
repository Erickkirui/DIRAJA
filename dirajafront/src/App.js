import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Managerdashord from './Pages/Managerdashord';
import ScrollTotop from './Components/ScrollTotop';
import LoginPage from './Pages/LoginPage';
import ExpensePage from './Pages/ExpensePage';
import ShopsPage from './Pages/ShopsPage';
import AddExpensePage from './Pages/AddExpensePage';
import AddEmployeePage from './Pages/AddEmployeePage';
import EmployeesPage from './Pages/EmployeesPage';
import InventoryPage from './Pages/InventoryPage';
import AddInventory from './Components/Inventory/AddInventory';
import AddSale from './Components/AddSale';
import BalanceSheet from './Components/Balancesheet';
import ProfitAndLoss from './Components/ProfitAndLoss';
import CashFlowStatement from './Components/CashFlow';
import ShopStock from './Pages/ShopStockPage';
import SingleEmployeePage from './Pages/SingleEmployeePage';
import CustomersPage from './Pages/CustomersPage';
import TransfersPage from './Pages/TransfersPage';
import PurchasesPage from './Pages/PurchasesPage';
import SalesPage from './Pages/SalesPage';
import ClerkDashbord from './Pages/ClerkDashbord';
import ShopCustomers from './Components/ClerkDashbord/ShopCustomers';
import SingleShopSale from './Components/ClerkDashbord/SingleShopSale';
import NotFound from './Components/NotFound';
import AnalyticsPage from './Pages/AnalyticsPage';
import ManageUsers from './Pages/ManageUsers';
import ManualTransfer from './Pages/AddStockPage';
import ClerkStockManagement from './Components/StockManagement/ClerkStockManagement';
import ShopSalesDetails from './Components/SingleShopSales';
import CreditsalePage from './Pages/CreditsalePage';
import ClerkSales from './Pages/ClerkSales';
import MabandaPage from './Pages/MabandaPage';
import SalesSummaryTable from './Components/ManagerDashbord/SalesSummeryTable';
import Procurement from './Pages/Procurement';
import ProcurementInventory from './Components/Procurement/ProcurementInventory';
import AllSales from './Components/Sales/GetSale';
import AccountBalances from './Pages/AccountBalances';
import AccountingLedgers from './Pages/AccountingLedgers';
import AllLedgers from './Pages/AllLedgers';
import AddSpoiltStock from './Components/StockManagement/AddSpoiltStock';
import SpoiltStockTable from './Components/StockManagement/GetSpoiltStock';
import TotalCashSalesByUser from './Components/ClerkDashbord/TotalCashSalesperuser';
import AddCashDeposit from './Components/ClerkDashbord/CashDeposit';
import CreateInventoryItems from './Components/Inventory/CreateInventoryItems';
import AddStockItems from './Components/Inventory/AddStockItems';
import CashSalesByUser from './Components/ClerkDashbord/EmployeeCashSale';
import CashSalesPage from './Pages/CashSalesPage';
import GennarateSalesReport from './Components/Reports/GennarateSalesReport';
import SingleSale from './Components/Sales/SingleSale';
import AddPromoSales from './Components/PromotionSales/AddPromoSales';
import AddMeritPoints from './Components/Employees/Merit&Demerit';
import AssignMeritForm from './Components/Employees/Assignmerit';
import MeritRecords from './Components/Employees/MeritRecords';
import MeritPointsTable from './Components/MeritPoints';
import AddSuppliers from './Components/Suppliers/AddSuppliers';
import Suppliers from './Pages/Suppliers';
import AddShopStock from './Components/AddShopStock';
import ShopStockV2 from './Components/Archive/GetShopStockV2';
import PurchasesV2 from './Components/Purchases/GetPurchasesV2';
import Achive from './Pages/Achive';
import AddExpenseCategory from './Components/AddExpenseCategory';
import CashDeposit from './Components/Cashdeposits';
import RelieverSales from './Components/ClerkDashbord/RelieverSales';
import ShopStockList from './Components/ClerkDashbord/ShopStockList';
import ShopSoldItems from './Components/ClerkDashbord/ShopSoldItems';
import ShopToShopTransfer from './Components/ClerkDashbord/StockTransfer';
import ManagerReportStock from './Components/ManagerDashbord/ManagerStockReport';
import StockMovementList from './Components/ManagerDashbord/StockMovementList';
import AllShopTransfers from './Components/ManagerDashbord/ShopTransfers';
import ShopStockMovement from './Components/ClerkDashbord/ShopStockMovement';
import Layout from './Components/Layout';
import ClerkLayout from './Components/ClerkLayout';
import AddMSale from './Components/ClerkDashbord/MabandaShop/Newsale';
import AddMExpense from './Components/ClerkDashbord/MabandaShop/Newexpense';
import AddMPurchase from './Components/ClerkDashbord/MabandaShop/Newpurchase';
import AddMStock from './Components/ClerkDashbord/MabandaShop/Newstock';
import Sales from './Components/ClerkDashbord/MabandaShop/GetMabandasales';
import Purchases from './Components/ClerkDashbord/MabandaShop/GetMabandaPurchase';
import Stock from './Components/ClerkDashbord/MabandaShop/GetMabandaStock';
import Expenses from './Components/ClerkDashbord/MabandaShop/GetMabandaExpenses';
import GetUnpaidSalesByClerk from './Components/ClerkDashbord/Creditsales';
import SingleSaleShop from './Components/ClerkDashbord/SingleSaleShops';
import StockReportPage from './Pages/Stockreportspage';
import SingleStockReport from './Components/ManagerDashbord/SingleStockReport';
import ChatAI from './Components/Analytics/ChatAI';
import ProcurementTablePage from './Pages/Procurementtablepage';
import ProcurementStock from './Components/Inventory/ProcurementStock';
import ProcurementItems from './Components/Inventory/ProcurementItems';
import InventoryCount from './Components/SystemStock/InventoryCount';
import ProcPurchases from './Components/Purchases/ProcurementPurchases';
import AllProcShopTransfers from './Components/ClerkDashbord/Proctransfers';
import CSVUploader from './Components/Reports/CSVUploader';
import TransferManagement from './Pages/Transfersmanagement';
import NewsaleFormat from './Components/ClerkDashbord/Newsaleformat';
import BrokenEggsReclassify from './Components/ClerkDashbord/BrokenEggs';
import NotificationPrompt from './Components/Notifications';
import SupplierDetails from './Components/Suppliers/SupplierDetails';
import CookedItems from './Components/ClerkDashbord/CookedItems';
import TaskPageManager from './Pages/TaskPageManager';
import CreditorPage from './Pages/CreditorPage';
import AddTask from './Components/TaskManager/AddTask';
import UserPendingTasks from './Components/TaskManager/UserPendingTasks';
import ManualStockReport from './Components/ClerkDashbord/ManualStockReport';
import StockReconciliationList from './Components/SystemStock/StockReconciliationList';
import PendingReturns from './Components/Inventory/PendingReturns';
import PendingReturnsButton from './Components/Inventory/Pendingbutton';
import PendingSpoiltStock from './Components/SystemStock/PendingSpoilt';
import PendingSpoiltStockButton from './Components/SystemStock/SpoiltButton';
import EmployeeProfile from './Components/ClerkDashbord/EmployeeProfile';

function App() {
  return (
    <div className="App">
      <NotificationPrompt />
      <Router>
        <ScrollTotop />
        <Routes>
          <Route path='/login' element={<LoginPage />}></Route>
          <Route path='/' element={<Layout><Managerdashord /></Layout>}></Route>
          <Route path='/allexpenses' element={<Layout><ExpensePage /></Layout>}></Route>
          <Route path='/allshops' element={<Layout><ShopsPage /></Layout>}></Route>
          <Route path='/expenses' element={<Layout><ExpensePage /></Layout>}></Route>
          <Route path='/addexpence' element={<Layout><AddExpensePage /></Layout>}></Route>
          <Route path='/addstock' element={<Layout><ManualTransfer /></Layout>}></Route>
          <Route path='/addemployee' element={<Layout><AddEmployeePage /></Layout>}></Route>
          <Route path='/allemployees' element={<Layout><EmployeesPage /></Layout>}></Route>
          <Route path='/allinventory' element={<Layout><InventoryPage /></Layout>}></Route>
          <Route path='/newinventory' element={<Layout><AddInventory /></Layout>}></Route>
          <Route path='/newsale' element={<Layout><AddSale /></Layout>}></Route>
          <Route path='/shopstock' element={<Layout><ShopStock /></Layout>}></Route>
          <Route path='/employee/:employee_id' element={<Layout><SingleEmployeePage /></Layout>} />
          <Route path='/allcustomers' element={<Layout><CustomersPage /></Layout>}></Route>
          <Route path='/alltransfers' element={<Layout><TransfersPage /></Layout>}></Route>
          <Route path='/purchases' element={<Layout><PurchasesPage /></Layout>}></Route>
          <Route path='/sales' element={<Layout><SalesPage /></Layout>}></Route>
          <Route path='/salescash' element={<Layout><CashSalesPage /></Layout>}></Route>
          <Route path='/allsales' element={<Layout><AllSales /></Layout>}></Route>
          <Route path='/sale/:sale_id' element={<Layout><SingleSale /></Layout>} />
          <Route path='/clerk' element={<ClerkLayout><ClerkDashbord /></ClerkLayout>}></Route>
          <Route path='/cashsales' element={<ClerkLayout><CashSalesByUser /></ClerkLayout>}></Route>
          <Route path='/procurement' element={<ClerkLayout><Procurement /></ClerkLayout>}></Route>
          <Route path='/distribute' element={<ClerkDashbord><ProcurementInventory /> </ClerkDashbord>}></Route>
          <Route path='/shopsales' element={<ClerkLayout><ClerkSales /></ClerkLayout>}></Route>
          <Route path='/reliever' element={<ClerkLayout><RelieverSales /></ClerkLayout>}></Route>
          <Route path='/shopcustomers' element={<ClerkLayout><ShopCustomers /></ClerkLayout>}></Route>
          <Route path='/relieversales' element={<ClerkLayout><AddSale /></ClerkLayout>}></Route>
          <Route path='/shopsale' element={<ClerkLayout><SingleShopSale /></ClerkLayout>}></Route>
          <Route path='/analytics' element={<Layout><AnalyticsPage /></Layout>}></Route>
          <Route path="*" element={<NotFound />} />
          <Route path='/balancesheet' element={<Layout><BalanceSheet /></Layout>}></Route>
          <Route path='/ProfitAndLoss' element={<Layout><ProfitAndLoss /></Layout>}></Route>
          <Route path='/CashFlowStatement' element={<Layout><CashFlowStatement /></Layout>}></Route>
          <Route path='/allusers' element={<Layout><ManageUsers /></Layout>} />
          <Route path='/managestock' element={<ClerkLayout><ClerkStockManagement /></ClerkLayout>}></Route>
          <Route path='/stockstatus' element={<Layout><ManagerReportStock /></Layout>}></Route>
          <Route path='/salesbyshop/:shop_id' element={<Layout><ShopSalesDetails /></Layout>}></Route>
          <Route path='/credit-sale' element={<Layout><CreditsalePage /></Layout>}></Route>
          <Route path='/Salesumery' element={<Layout><SalesSummaryTable /></Layout>}></Route>
          <Route path='/mabandapage' element={<Layout><MabandaPage /></Layout>}></Route>
          <Route path='/mabandasale' element={<ClerkLayout><AddMSale /></ClerkLayout>}></Route>
          <Route path='/mabandaexpense' element={<ClerkLayout><AddMExpense /></ClerkLayout>}></Route>
          <Route path='/mabandapurchase' element={<Layout><AddMPurchase /></Layout>}></Route>
          <Route path='/mabandastock' element={<ClerkLayout><AddMStock /></ClerkLayout>}></Route>
          <Route path='/mabandasales' element={<ClerkLayout><Sales /></ClerkLayout>}></Route>
          <Route path='/mabandasalesmanager' element={<Layout><Sales /></Layout>}></Route>
          <Route path='/mabandapurchases' element={<ClerkLayout><Purchases /></ClerkLayout>}></Route>
          <Route path='/mabandapurchasesmanager' element={<Layout><Purchases /></Layout>}></Route>
          <Route path='/mabandastocks' element={<ClerkLayout><Stock /></ClerkLayout>}></Route>
          <Route path='/mabandastocksmanager' element={<Layout><Stock /></Layout>}></Route>
          <Route path='/mabandaexpenses' element={<ClerkLayout><Expenses /></ClerkLayout>}></Route>
          <Route path='/mabandaexpensesmanager' element={<Layout><Expenses /></Layout>}></Route>
          <Route path='/shopcredit' element={<ClerkLayout><GetUnpaidSalesByClerk /></ClerkLayout>}></Route>
          <Route path='/sale/:shopId/:salesId' element={<ClerkLayout><SingleSaleShop /></ClerkLayout>}></Route>
          <Route path='/cashsales' element={<ClerkLayout><TotalCashSalesByUser /></ClerkLayout>}></Route>
          <Route path='/accounts-balance' element={<Layout><AccountBalances /></Layout>}></Route>
          <Route path='/accounting' element={<Layout><AccountingLedgers /></Layout>}></Route>
          <Route path='/all-ledgers' element={<Layout><AllLedgers /></Layout>}></Route>
          <Route path='/addspoiltstock' element={<ClerkLayout><AddSpoiltStock /></ClerkLayout>}></Route>
          <Route path='/depositcash' element={<ClerkLayout><AddCashDeposit /></ClerkLayout>}></Route>
          <Route path='/spoilt-stock' element={<Layout><SpoiltStockTable /></Layout>}></Route>
          <Route path='/create-inventory-items' element={<Layout><CreateInventoryItems /></Layout>}></Route>
          <Route path='/stock-items' element={<Layout><AddStockItems /></Layout>}></Route>
          <Route path='/sale-reports' element={<Layout><GennarateSalesReport /></Layout>}></Route>
          <Route path='/promo-sale' element={<ClerkLayout><AddPromoSales /></ClerkLayout>}></Route>
          <Route path='/assignmeritpoint' element={<Layout><AssignMeritForm /></Layout>}></Route>
          <Route path='/newmeritpoint' element={<Layout><AddMeritPoints /></Layout>}></Route>
          <Route path='/meritrecords' element={<Layout><MeritRecords /></Layout>}></Route>
          <Route path='/meritpoints' element={<Layout><MeritPointsTable /></Layout>}></Route>
          <Route path='/addshopstock' element={<Layout><AddShopStock /></Layout>}></Route>
          <Route path='/distribute-stock' element={<ClerkLayout><ProcurementTablePage /></ClerkLayout>}></Route>
          <Route path="/add-suplier" element={<Layout><AddSuppliers /></Layout>}></Route>
          <Route path='/supplier' element={<Layout><Suppliers /></Layout>}></Route>
          <Route path="/suppliers/:id" element={<Layout><SupplierDetails /></Layout>}></Route>
          <Route path='/addexpensecategory' element={<Layout><AddExpenseCategory /></Layout>}></Route>
          <Route path='/allpurchases' element={<Layout><PurchasesV2 /></Layout>}></Route>
          <Route path='/deposit' element={<Layout><CashDeposit /></Layout>}></Route>
          <Route path='/archive' element={<Layout><Achive /></Layout>}></Route>
          <Route path="/stockreport" element={<Layout><StockReportPage /></Layout>}></Route>
          <Route path="/stockreport/:id" element={<Layout><SingleStockReport /></Layout>}></Route>
          <Route path="/shopstockv2" element={<Layout><ShopStockV2 /></Layout>}></Route>
          <Route path='/shop-stock-level' element={<ClerkLayout><ShopStockList /></ClerkLayout>}></Route>
          <Route path='/sold-items' element={<ClerkLayout><ShopSoldItems /></ClerkLayout>}></Route>
          <Route path="/stock-movement" element={<Layout><StockMovementList /></Layout>}></Route>
          <Route path='/transfer' element={<ClerkLayout><ShopToShopTransfer /></ClerkLayout>}></Route>
          <Route path="/shoptransfers" element={<Layout><AllShopTransfers /></Layout>}></Route>
          <Route path='/stock-shop-move' element={<ClerkLayout><ShopStockMovement /></ClerkLayout>}></Route>
          <Route path='/dirajaAI' element={<Layout><ChatAI /></Layout>}></Route>
          <Route path='/procurementinventory' element={<ClerkLayout><ProcurementTablePage /></ClerkLayout>}></Route>
          <Route path='/addprocurementinventory' element={<ClerkLayout><ProcurementStock /></ClerkLayout>}></Route>
          <Route path='/addprocurementitems' element={<ClerkLayout><ProcurementItems /></ClerkLayout>}></Route>
          <Route path='/inventorycount' element={<ClerkLayout><InventoryCount /></ClerkLayout>}></Route>
          <Route path='/procpurchases' element={<ClerkLayout><ProcPurchases /></ClerkLayout>}></Route>
          <Route path='/proctransfers' element={<ClerkLayout><AllProcShopTransfers /></ClerkLayout>}></Route>
          <Route path='/transaction-analyse' element={<Layout><CSVUploader /></Layout>}></Route>
          <Route path='/recieve-stock' element={<ClerkLayout><TransferManagement /></ClerkLayout>}></Route>
          <Route path='/custom-sale' element={<ClerkLayout><NewsaleFormat /></ClerkLayout>}></Route>
          <Route path='/broken-eggs' element={<ClerkLayout><BrokenEggsReclassify /></ClerkLayout>}></Route>
          <Route path='/cooked' element={<ClerkLayout><CookedItems /></ClerkLayout>}></Route>
          <Route path='/task-manager' element={<Layout><TaskPageManager /></Layout>}></Route>
          <Route path='/create-task' element={<Layout><AddTask /></Layout>}></Route>
          <Route path='/creditors' element={<Layout><CreditorPage /></Layout>}></Route>
          <Route path='/pending-tasks' element={<Layout><UserPendingTasks /></Layout>}></Route>
          <Route path='/pending-clerk-tasks' element={<ClerkLayout><UserPendingTasks /></ClerkLayout>}></Route>
          <Route path='/report-stock-page' element={<ClerkLayout><ManualStockReport /></ClerkLayout>} ></Route>
          <Route path='/reconciliation' element={<Layout><StockReconciliationList /></Layout>} ></Route>
          <Route path='/pending-returns' element={<Layout><PendingReturns /></Layout>} ></Route>
          <Route path='/pending-button' element={<Layout><PendingReturnsButton /></Layout>} ></Route>
          <Route path='/pending-spoilt' element={<Layout><PendingSpoiltStock /></Layout>} ></Route>
          <Route path='/pending-button' element={<Layout><PendingSpoiltStockButton /></Layout>} ></Route>

          <Route path='/profile' element={<ClerkLayout><EmployeeProfile /></ClerkLayout>} ></Route>
        </Routes>
      </Router>
    </div>
  );
}

export default App;