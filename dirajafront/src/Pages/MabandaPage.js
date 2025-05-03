import React, { useState } from 'react';
import MabandaSalesDetails from '../Components/Singlemabandasale';
import MabandaExpenseDetails from '../Components/Singlemabandaexpenses'
import Expenses from '../Components/ClerkDashbord/MabandaShop/GetMabandaExpenses';

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
        {/* <button 
          className={`tab-button ${activeTab === 'totalmabandaexpenses' ? 'active' : ''}`} 
          onClick={() => setActiveTab('totalmabandaexpenses')}
        >
          Expenses
        </button> */}
      </div>

      <div className="tab-content">
        {activeTab === 'totalmabandasales' && <MabandaSalesDetails />}
        {/* {activeTab === 'totalmabandaexpenses' && <MabandaExpenseDetails />} */}
      </div>
    </div>
  );
}

export default MabandaPage;
