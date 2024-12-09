import './App.css';
import { BrowserRouter as Router,Routes,Route  } from 'react-router-dom';
import Managerdashord from './Pages/Managerdashord';
import ScrollTotop from './Components/ScrollTotop';
import Navbar from './Components/Navbar';
import LoginPage from './Pages/LoginPage';
import ExpensePage from './Pages/ExpensePage';
import ShopsPage from './Pages/ShopsPage';
import AddExpensePage from './Pages/AddExpensePage';
import AddEmployeePage from './Pages/AddEmployeePage';
import EmployeesPage from './Pages/EmployeesPage';
import InventoryPage from './Pages/InventoryPage';
import AddInventory from './Components/AddInventory';
import AddSale from './Components/AddSale';
import BalanceSheet from './Components/Balancesheet';
import ProfitAndLoss from './Components/ProfitAndLoss';


// import ShopStockPage from './Pages/ShopStockPage';
import UserDisplay from './Components/UserDisplay';

import ShopStock from './Pages/ShopStockPage';
import SingleEmployeePage from './Pages/SingleEmployeePage';
import CustomersPage from './Pages/CustomersPage';
import TransfersPage from './Pages/TransfersPage';
import PurchasesPage from './Pages/PurchasesPage';
import SalesPage from './Pages/SalesPage';
import ClerkDashbord from './Pages/ClerkDashbord';
import SingleSalePage from './Pages/SingleSalePage';
import ShopSales from './Components/ClerkDashbord/ShopSales';
import ClerkNavbar from './Components/ClerkDashbord/ClerkNavbar';
import ShopCustomers from './Components/ClerkDashbord/ShopCustomers';
import SingleShopSale from './Components/ClerkDashbord/SingleShopSale';
import NotFound from './Components/NotFound';
import AnalyticsPage from './Pages/AnalyticsPage';
import ManageUsers from './Pages/ManageUsers';


const Layout = ({ children }) => {
  return(
    <>
    <div className='Page-continer'>
      <div className='navigation'>
        <Navbar/>
      </div>
      <div className='body-area'>
        <div className='body-header'>
        <UserDisplay />

        </div>
        <div className='page-area'>
        {children}
        </div>
       
        
      </div>
    
    </div>
    </>

  );

};
const ClerkLayout = ({ children }) => {
  return(
    <>
    <div className='Page-continer'>
      <div className='navigation'>
        <ClerkNavbar />
      </div>
      <div className='body-area'>
        <div className='body-header'>
        <UserDisplay />

        </div>
        <div className='page-area'>
        {children}
        </div>
       
        
      </div>
    
    </div>
    </>

  );

};

function App() {
  return (
    <div className="App">
      <Router>
        <ScrollTotop />
          <Routes>

            <Route path='/login' element={<LoginPage/>} ></Route>
            <Route path='/' element={<Layout><Managerdashord/></Layout>} ></Route>
            <Route path='/allexpenses' element={<Layout><ExpensePage/></Layout>} ></Route>
            <Route path='/allshops' element={<Layout><ShopsPage/></Layout>} ></Route>
            <Route path='/expenses' element={<Layout><ExpensePage/></Layout>} ></Route>
            <Route path='/addexpence' element={<Layout><AddExpensePage/></Layout>} ></Route>
            <Route path='/addemployee' element={<Layout><AddEmployeePage /></Layout>} ></Route>
            <Route path='/allemployees' element={<Layout><EmployeesPage/></Layout>} ></Route>
            <Route path='/allinventory' element={<Layout><InventoryPage/></Layout>} ></Route>
            <Route path='/newinventory' element={<Layout><AddInventory /></Layout>} ></Route>
            <Route path='/newsale' element={<Layout><AddSale /></Layout>} ></Route>
            <Route path='/shopstock' element={<Layout><ShopStock /></Layout>} ></Route>
            <Route path='/employee/:employee_id' element={<Layout><SingleEmployeePage /></Layout>} />
            <Route path='/allcustomers' element={<Layout><CustomersPage/></Layout>} ></Route>
            <Route path='/alltransfers' element={<Layout><TransfersPage/></Layout>} ></Route>
            <Route path='/purchases' element={<Layout><PurchasesPage/></Layout>} ></Route>
            <Route path='/sales' element={<Layout><SalesPage/></Layout>} ></Route>
            <Route path='/sale/:sale_id' element={<Layout><SingleSalePage /></Layout>} />
            <Route path='/clerk' element={<ClerkDashbord/>}></Route>
            <Route path='/shopsales' element={<ClerkLayout><ShopSales/></ClerkLayout>}></Route>
            <Route path='/shopcustomers' element={<ClerkLayout><ShopCustomers/></ClerkLayout>} ></Route>
            <Route path='/shopcustomers' element={<ClerkLayout><ShopCustomers/></ClerkLayout>} ></Route>
            <Route path='/shopsale' element={<ClerkLayout><SingleShopSale /></ClerkLayout>} ></Route>
            <Route path='/analytics' element={<Layout><AnalyticsPage/></Layout>}></Route>
            <Route path="*" element={<NotFound />} />
            <Route path='/balancesheet' element={<Layout><BalanceSheet/></Layout>} ></Route>
            <Route path='/ProfitAndLoss' element={<Layout><ProfitAndLoss/></Layout>} ></Route>
            <Route path='/allusers' element={<Layout><ManageUsers /></Layout>} />
 
          </Routes>
       
      </Router>
    </div>
  );
}

export default App;
