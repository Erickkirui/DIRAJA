import React, { useState } from 'react';
import MabandaSalesDetails from '../Components/Singlemabandasale';
import Expenses from '../Components/ClerkDashbord/MabandaShop/GetMabandaExpenses';
import Purchases from '../Components/ClerkDashbord/MabandaShop/GetMabandaPurchase';

function MabandaPage() {
  const [activeTab, setActiveTab] = useState('totalmabandasales');

  return (
    <div>
      <h1>Mabanda Farm</h1>
      <div className="tabs-container">
        <button 
          className={`tab-button ${activeTab === 'totalmabandasales' ? 'active' : ''}`} 
          onClick={() => setActiveTab('totalmabandasales')}
        >
          Sales
        </button>
        <button 
          className={`tab-button ${activeTab === 'mabandapurchases' ? 'active' : ''}`} 
          onClick={() => setActiveTab('mabandapurchases')}
        >
          Purchases
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'totalmabandasales' && <MabandaSalesDetails />}
        {activeTab === 'mabandapurchases' && <Purchases />}
      </div>
    </div>
  );
}

export default MabandaPage;
