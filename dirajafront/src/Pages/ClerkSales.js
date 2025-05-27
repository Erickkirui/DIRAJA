import React, { useState } from 'react';
import UnpaidSales from '../Components/CreditSales/UnpaidSales';
import CreditHistory from '../Components/CreditSales/CreditHistory';
import ShopSales from '../Components/ClerkDashbord/ShopSales';
import EmployeeSales from '../Components/ClerkDashbord/EmployeeSales';
import CashSalesByUser from '../Components/ClerkDashbord/EmployeeCashSale';

function ClerkSales() {
  const [activeTab, setActiveTab] = useState('unpaidSales');

  return (
    <div>
      <h1>Sales</h1>
      <div className="tabs-container">
        <button 
          className={`tab-button ${activeTab === 'unpaidSales' ? 'active' : ''}`} 
          onClick={() => setActiveTab('unpaidSales')}
        >
          Shop Sales
        </button>
        <button 
          className={`tab-button ${activeTab === 'creditHistory' ? 'active' : ''}`} 
          onClick={() => setActiveTab('creditHistory')}
        >
          My sales
        </button>
        <button 
          className={`tab-button ${activeTab === 'cashsales' ? 'active' : ''}`} 
          onClick={() => setActiveTab('cashsales')}
        >
          My cash sales
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'unpaidSales' && <ShopSales />}
        {activeTab === 'creditHistory' && <EmployeeSales />}
        {activeTab === 'cashsales' && <CashSalesByUser />}
      </div>
    </div>
  );
}

export default ClerkSales;
