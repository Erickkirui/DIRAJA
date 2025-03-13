import React, { useEffect } from 'react';
import CountShops from '../Components/ManagerDashbord/CountShops';
import CountEmployees from '../Components/ManagerDashbord/CountEmployees';
import TotalAmountPaidExpenses from '../Components/ManagerDashbord/TotalAmountPaidExpenses';
import TotalAmountPaidSales from '../Components/ManagerDashbord/TotalAmountPaidSales';
import TotalAmountPaidPurchases from '../Components/ManagerDashbord/TotalAmountPaidPurchases';
import { Link } from 'react-router-dom';
import BatchStockList from '../Components/BatchStockList';
import TotalCreditSales from '../Components/ManagerDashbord/TotalCreditSales';


function Managerdashord() {
  // Check the role in local storage
  useEffect(() => {
    const role = localStorage.getItem('role');
    if (role === 'clerk') {
      window.location.href = '/clerk'; // Redirect to the clerk route
    }
  }, []);

  return (
    <>
      <div className='dashord-top-part'>
        <h2>Dashboard</h2>
        
        <div className="shortcuts">
          <Link to="/allusers" className="button">Manage Users</Link>
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
              <TotalAmountPaidPurchases />
            </div>
          </div>

         

          <div className="metrix-pair"> 
              
                <div>
                <TotalAmountPaidExpenses />
                </div>
                <div>
                <TotalCreditSales />
                </div>
              
          </div>

          <div className="metrix-pair">
           
           <div>
             <CountShops />
           </div>
       
           <div>
             <CountEmployees />
           </div>
       </div>

        </div>
        <div>
          <BatchStockList />
        </div>
      </div>
      
      
    </>
  );
}

export default Managerdashord;
