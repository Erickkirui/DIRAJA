import React, { useState } from 'react'
import TransactionList from '../Components/AccountBalance/TransactionList'
import AccountsBalanceList from '../Components/AccountBalance/AccountsBalanceList'

function AccountBalances() {
  const [activeTab, setActiveTab] = useState('Employees') // default tab

  return (
    <>
    <h1>Accounts </h1>
      {/* Tabs */}
      <div className="tabs-container mb-4">
        <button 
          className={`tab-button ${activeTab === 'Employees' ? 'active' : ''}`} 
          onClick={() => setActiveTab('Employees')}
        >
          Accounts
        </button>
        <button 
          className={`tab-button ${activeTab === 'employeesales' ? 'active' : ''}`} 
          onClick={() => setActiveTab('employeesales')}
        >
          Transactions
        </button>
      </div>

      {/* Tab content */}
      <div className="tab-content">
        {activeTab === 'Employees' && <AccountsBalanceList />}
        {activeTab === 'employeesales' && <TransactionList />}
      </div>
    </>
  )
}

export default AccountBalances
