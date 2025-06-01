import React, { useEffect } from 'react';
import CountShops from '../Components/ManagerDashbord/CountShops';
import CountEmployees from '../Components/ManagerDashbord/CountEmployees';
import TotalAmountPaidExpenses from '../Components/ManagerDashbord/TotalAmountPaidExpenses';
import TotalAmountPaidSales from '../Components/ManagerDashbord/TotalAmountPaidSales';
import TotalAmountPaidPurchases from '../Components/ManagerDashbord/TotalAmountPaidPurchases';
import TotalAmountPurchasesInventory from '../Components/ManagerDashbord/TotalAmountPurchasesInventory';
import { Link } from 'react-router-dom';
// import BatchStockList from '../Components/ManagerDashbord/BatchStockList';
import TotalCreditSales from '../Components/ManagerDashbord/TotalCreditSales';
import MabandaProfitLoss from'../Components/ManagerDashbord/MabandaFarmP&L';
import ItemStockList from '../Components/ManagerDashbord/ItemStocklist';


function Managerdashord() {
  // Check the role in local storage
  useEffect(() => {
    const role = localStorage.getItem('role');
    // const user = localStorage.getItem('username')


    //  Auto logout if user ID is 2
    // if (user === 'Dancan') {
    //   localStorage.clear();
    //   window.location.href = '/login';
    //   return;
    // }


    if (role === 'clerk') {
      window.location.href = '/clerk';
    } else if (role === 'procurement') {
      window.location.href = '/procurement';
    }
  }, []);

  return (
    <>
      <div className='dashord-top-part'>
        <h2>Business Overview</h2>
        
        <div className="shortcuts">
          <Link to="/allusers"  >Manage Users</Link>
        </div>
       
      </div>
      <p>Analytics </p>

      <div className="top-row">
        <div className="metrix-card-container">
          <div className="metrix-pair">
            <div>
              <TotalAmountPaidSales />
            </div>
            <div>
              
              <TotalCreditSales />
            </div>
            <div>
                <TotalAmountPurchasesInventory />
                </div>
                <div>
                <TotalAmountPaidPurchases />
                </div>
            
          </div>

         
          <div className="metrix-pair">
           
           <div>
             <TotalAmountPaidExpenses />
           </div>
           <div className="metrix-pair">
           
           <div>
             <CountShops />
           </div>
       
           <div>
             <CountEmployees />
           </div>
           <div>
             <MabandaProfitLoss />
           </div>

           


       </div>
      
       </div>
       <div className='long-data-section'>
        {/* <BatchStockList /> */}
        <ItemStockList />
        
       </div>
          

          
       

        </div>

       
        

      </div>

      
      
    </>
  );
}

export default Managerdashord;
