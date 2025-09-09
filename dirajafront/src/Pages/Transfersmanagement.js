import React, { useState } from 'react';
import PendingFromShop from '../Components/ClerkDashbord/PendingFromshop'
import PendingTransfers from '../Components/ClerkDashbord/PendingTransfers';

function TransferManagement() {
  const [activeTab, setActiveTab] = useState('pendingTransfers');

  return (
    <div className="transfers-page-container">
      <div className="header-container">
        <h1>Stock Transfers</h1>
      </div>

      {/* Tabs */}
      <div className="tabs-container">
        
        <button
          className={`tab-button ${activeTab === 'pendingTransfers' ? 'active' : ''}`}
          onClick={() => setActiveTab('pendingTransfers')}
        >
          From store
        </button>
        <button
          className={`tab-button ${activeTab === 'pendingFromShop' ? 'active' : ''}`}
          onClick={() => setActiveTab('pendingFromShop')}
        >
          From shops
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'pendingTransfers' && <PendingTransfers />}
        {activeTab === 'pendingFromShop' && <PendingFromShop />}

      </div>
    </div>
  );
}

export default TransferManagement;