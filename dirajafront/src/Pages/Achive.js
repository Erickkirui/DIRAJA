
import React, { useState } from 'react';
import InventoryAchive from '../Components/Archive/GetInventoryAchive'
import ShopStock from '../Components/SystemStock/GetShopStock';

function ArchivePage() {
  const [activeTab, setActiveTab] = useState('Inventory');
  return (
  <>
  <h1>Archive</h1>
  
    {/* Tabs */}
    <div className="tabs-container">
    <button 
      className={`tab-button ${activeTab === 'Inventory' ? 'active' : ''}`} 
      onClick={() => setActiveTab('Inventory')}
    >
      Inventory
    </button>
    <button 
      className={`tab-button ${activeTab === 'ShopStock' ? 'active' : ''}`} 
      onClick={() => setActiveTab('ShopStock')}
    >
      Shopstock
    </button>
  </div>


  {/* Tab content */}
  <div className="tab-content">
    {activeTab === 'Inventory' && <InventoryAchive />}
    {activeTab === 'ShopStock' && <ShopStock />}
  </div>
</>
  )
}

export default ArchivePage