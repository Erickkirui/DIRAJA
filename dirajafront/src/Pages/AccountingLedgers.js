import React, { useState } from 'react'
import ChartOfAccounts from '../Components/AccountLedgers/ChartOfAccounts'
import AccountTypes from '../Components/AccountLedgers/AccountTypes'
import Items from '../Components/AccountLedgers/Items'

function AccountingLedgers() {
  const [activeTab, setActiveTab] = useState('types');

  return (
    <div>
      <h1>Ledgers</h1>

      {/* Tabs */}
      <div className="tabs-container mb-4">
        <button 
          className={`tab-button ${activeTab === 'types' ? 'active' : ''}`} 
          onClick={() => setActiveTab('types')}
        >
          Account Types
        </button>
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
          Items
        </button>
      </div>

      {/* Tab content */}
      <div className="tab-content">
        {activeTab === 'types' && <AccountTypes />}
        {activeTab === 'chart' && <ChartOfAccounts />}
        {activeTab === 'items' && <Items />}
      </div>
    </div>
  )
}

export default AccountingLedgers;
