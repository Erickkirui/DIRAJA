import React, { useState } from 'react';
import MabandaSalesDetails from '../Components/Singlemabandasale';
import Expenses from '../Components/ClerkDashbord/MabandaShop/GetMabandaExpenses';

function MabandaPage() {
  const [activeTab, setActiveTab] = useState('totalmabandasales');

  return (
    <div>
      <h1>Mabanda Farm</h1>
      <div className="tabs-container">
        <button 
          className={`tab-button ${activeTab === 'unpaidSales' ? 'active' : ''}`} 
          onClick={() => setActiveTab('totalmabandasales')}
        >
          Sales
        </button>
        <button 
          className={`tab-button ${activeTab === 'creditHistory' ? 'active' : ''}`} 
          onClick={() => setActiveTab('getmabandaexpense')}
        >
          Expenses
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'totalmabandasales' && <MabandaSalesDetails />}
        {activeTab === '/newmabandaexpense' && <Expenses />}
      </div>
    </div>
  );
}

export default MabandaPage;
