import React, { useState } from 'react'
import ChartOfAccounts from '../Components/AccountLedgers/ChartOfAccounts'
import ItemsList from '../Components/AccountLedgers/ItemsList';

function AccountingLedgers() {
  // ✅ Set default tab to "chart"
  const [activeTab, setActiveTab] = useState('chart');

  return (
    <div>
      <h3>Accounting</h3>

      {/* Tabs */}
      <div className="tabs-container mb-4">
        <button 
          className={`tab-button ${activeTab === 'chart' ? 'active' : ''}`} 
          onClick={() => setActiveTab('chart')}
        >
          Chart of Accounts
        </button>

        <button 
          className={`tab-button ${activeTab === 'items' ? 'active' : ''}`} 
          onClick={() => setActiveTab('items')}
        >
          Items List
        </button>
      </div>

      {/* Tab content */}
      <div className="tab-content">
        {activeTab === 'chart' && <ChartOfAccounts />}
        {activeTab === 'items' && <ItemsList />}
      </div>
    </div>
  )
}

export default AccountingLedgers
