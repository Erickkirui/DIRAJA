import React, { useState } from 'react'
import ChartOfAccounts from '../Components/AccountLedgers/ChartOfAccounts'

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
      </div>

      {/* Tab content */}
      <div className="tab-content">
        {activeTab === 'chart' && <ChartOfAccounts />}
      </div>
    </div>
  )
}

export default AccountingLedgers
