import React, { useEffect } from 'react';
import CountShops from '../Components/ManagerDashbord/CountShops';
import CountEmployees from '../Components/ManagerDashbord/CountEmployees';
import TotalAmountPaidExpenses from '../Components/ManagerDashbord/TotalAmountPaidExpenses';
import TotalAmountPaidSales from '../Components/ManagerDashbord/TotalAmountPaidSales';
import TotalAmountPaidPurchases from '../Components/ManagerDashbord/TotalAmountPaidPurchases';
import LowStockAlert from '../Components/StockAlert';
import { Link } from 'react-router-dom';

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
      <h2>Dashboard</h2>
      <p>Analytics</p>
      <div className="shortcuts">
        <Link to="/allusers" className="button">Manage Users</Link>
      </div>

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
              <CountShops />
              <div className="single-card">
                <TotalAmountPaidExpenses />
              </div>
            </div>
            <div>
              <CountEmployees />
            </div>
          </div>
        </div>
        <div>
          <LowStockAlert />
        </div>
      </div>
    </>
  );
}

export default Managerdashord;
