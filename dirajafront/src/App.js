import './App.css';
import { BrowserRouter as Router,Routes,Route  } from 'react-router-dom';
import Managerdashord from './Pages/Managerdashord';
import ScrollTotop from './Components/ScrollTotop';
import Navbar from './Components/Navbar';
import LoginPage from './Pages/LoginPage';
import NewShopPage from './Pages/NewShopPage';
import ExpensePage from './Pages/ExpensePage';
import ShopsPage from './Pages/ShopsPage';
import AddExpensePage from './Pages/AddExpensePage';
import AddEmployeePage from './Pages/AddEmployeePage';
import EmployeesPage from './Pages/EmployeesPage';
import InventoryPage from './Pages/InventoryPage';
import AddInventory from './Components/AddInventory';

import ShopStockPage from './Pages/ShopStockPage';
import UserDisplay from './Components/UserDisplay';

import ShopStock from './Pages/ShopStockPage';
import SingleEmployeePage from './Pages/SingleEmployeePage';
import CustomersPage from './Pages/CustomersPage';







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


function App() {
  return (
    <div className="App">
      <Router>
        <ScrollTotop />
          <Routes>

            <Route path='/login' element={<LoginPage/>} ></Route>
            <Route path='/' element={<Layout><Managerdashord/></Layout>} ></Route>
            <Route path='/newshop' element={<Layout><NewShopPage/></Layout>} ></Route>
            <Route path='/allexpenses' element={<Layout><ExpensePage/></Layout>} ></Route>
            <Route path='/allshops' element={<Layout><ShopsPage/></Layout>} ></Route>
            <Route path='/expenses' element={<Layout><ExpensePage/></Layout>} ></Route>
            <Route path='/addexpence' element={<Layout><AddExpensePage/></Layout>} ></Route>
            <Route path='/addemployee' element={<Layout><AddEmployeePage /></Layout>} ></Route>
            <Route path='/allemployees' element={<Layout><EmployeesPage/></Layout>} ></Route>
            <Route path='/allinventory' element={<Layout><InventoryPage/></Layout>} ></Route>
            <Route path='/newinventory' element={<Layout><AddInventory /></Layout>} ></Route>
            <Route path='/shopstock' element={<Layout><ShopStock /></Layout>} ></Route>
            <Route path='/employee/:employee_id' element={<Layout><SingleEmployeePage /></Layout>} />
            <Route path='/allcustomers' element={<Layout><CustomersPage/></Layout>} ></Route>

            
          
          </Routes>
       
      </Router>
    </div>
  );
}

export default App;
