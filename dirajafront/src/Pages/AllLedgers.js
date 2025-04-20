
import React, { useState } from 'react'
import SalesLedger from '../Components/Ledgers/SalesLedger'

function AllLedgers() {
 const [activeTab, setActiveTab] = useState('sales') 

  return (
    <div>
      <h1>All ledgers</h1>

      <div>
      <div className="tabs-container mb-4">
        <button 
          className={`tab-button ${activeTab === 'sales' ? 'active' : ''}`} 
          onClick={() => setActiveTab('sales')}
        >
          Sales Ledger
        </button>
        <button 
          className={`tab-button ${activeTab === 'purchases' ? 'active' : ''}`} 
          onClick={() => setActiveTab('purchases')}
        >
          Purchses Ledger
        </button>
      </div>
      </div>

      <div className='tab-content'>
        {activeTab === 'sales' && <SalesLedger />}
        {activeTab === 'purchases' && <SalesLedger />}

      </div>
    </div>
  )
}

export default AllLedgers

