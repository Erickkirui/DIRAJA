import React, { useState } from 'react';
import ChartOfAccounts from '../Components/AccountLedgers/ChartOfAccounts';
import ItemsList from '../Components/AccountLedgers/ItemsList';
import BankAccountsTable from '../Components/AccountLedgers/BakAccountsTable';
import Suppliers from './Suppliers';

function AccountingLedgers() {
  // ✅ Default tab is chart
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

        <button
          className={`tab-button ${activeTab === 'bank' ? 'active' : ''}`}
          onClick={() => setActiveTab('bank')}
        >
          Bank Accounts
        </button>

        <button
          className={`tab-button ${activeTab === 'suppliers' ? 'active' : ''}`}
          onClick={() => setActiveTab('suppliers')}
        >
          Suppliers
        </button>
      </div>

      {/* Tab content */}
      <div className="tab-content">
        {activeTab === 'chart' && <ChartOfAccounts />}
        {activeTab === 'items' && <ItemsList />}
        {activeTab === 'bank' && <BankAccountsTable />} 
        {activeTab === 'suppliers' && <Suppliers />}
      </div>
    </div>
  );
}

export default AccountingLedgers;
