import React, { useState } from 'react';
import UnpaidSales from '../Components/CreditSales/UnpaidSales';
import CreditHistory from '../Components/CreditSales/CreditHistory';

function CreditsalePage() {
  const [activeTab, setActiveTab] = useState('unpaidSales');

  return (
    <div>
      <h1>Credits</h1>
      <div className="tabs-container">
        <button 
          className={`tab-button ${activeTab === 'unpaidSales' ? 'active' : ''}`} 
          onClick={() => setActiveTab('unpaidSales')}
        >
          Credit Sales
        </button>
        <button 
          className={`tab-button ${activeTab === 'creditHistory' ? 'active' : ''}`} 
          onClick={() => setActiveTab('creditHistory')}
        >
          Credit History
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'unpaidSales' && <UnpaidSales />}
        {activeTab === 'creditHistory' && <CreditHistory />}
      </div>
    </div>
  );
}

export default CreditsalePage;
