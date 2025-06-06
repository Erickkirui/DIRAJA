import React, { useState } from 'react';
// import CashSales from '../Components/ManagerDashbord/CashSales';
import Sales from '../Components/Sales/GetSales';


function SalesPage() {
  const [activeTab, setActiveTab] = useState('allsales');
  return (
      <div>
        <h1>All Sales</h1>
        <Sales />
        
        {/* <h1>All Sales</h1>
        <div className="tabs-container">
          <button 
            className={`tab-button ${activeTab === 'allsales' ? 'active' : ''}`} 
            onClick={() => setActiveTab('allsales')}
          >
            Sales
          </button>
          <button 
            className={`tab-button ${activeTab === 'cashsales' ? 'active' : ''}`} 
            onClick={() => setActiveTab('cashsales')}
          >
            Cash Sales
          </button>
        </div>
  
        <div className="tab-content">
          {activeTab === 'allsales' && <Sales />}
          {activeTab === 'cashsales' && <CashSales />}
        </div> */}
      </div>
    );
  }
  

export default SalesPage;
