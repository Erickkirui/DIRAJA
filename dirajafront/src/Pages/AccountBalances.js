import React, { useState } from 'react'
import TransactionList from '../Components/AccountBalance/TransactionList'
import AccountsBalanceList from '../Components/AccountBalance/AccountsBalanceList'

function AccountBalances() {
  const [activeTab, setActiveTab] = useState('accounts') // default tab

  return (
    <>
      <h1>Accounts</h1>
      
      {/* Tabs */}
      <div className="tabs-container mb-4">
        <button 
          className={`tab-button ${activeTab === 'accounts' ? 'active' : ''}`} 
          onClick={() => setActiveTab('accounts')}
        >
          Accounts
        </button>
        <button 
          className={`tab-button ${activeTab === 'transactions' ? 'active' : ''}`} 
          onClick={() => setActiveTab('transactions')}
        >
          Transactions
        </button>
      </div>

      {/* Tab content */}
      <div className="tab-content">
        {activeTab === 'accounts' && <AccountsBalanceList />}
        {activeTab === 'transactions' && <TransactionList />}
      </div>
    </>
  )
}

export default AccountBalances
