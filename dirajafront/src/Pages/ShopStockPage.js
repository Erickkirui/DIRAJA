
import React, { useState } from 'react';
import ShopStockV2 from '../Components/Archive/GetShopStockV2';
import SpoiltStockTable from '../Components/StockManagement/GetSpoiltStock';


function ShopStockPage() {
  const [activeTab, setActiveTab] = useState('SystemStock');
  return (
  <>
  <h1>Stock</h1>
  
    {/* Tabs */}
    <div className="tabs-container">
    <button 
      className={`tab-button ${activeTab === 'SystemStock' ? 'active' : ''}`} 
      onClick={() => setActiveTab('SystemStock')}
    >
      System Stock
    </button>
    <button 
      className={`tab-button ${activeTab === 'spoiltstock' ? 'active' : ''}`} 
      onClick={() => setActiveTab('spoiltstock')}
    >
      Spoilt Stock
    </button>
  </div>


  {/* Tab content */}
  <div className="tab-content">
    {activeTab === 'SystemStock' && <ShopStockV2 />}
    {activeTab === 'spoiltstock' && <SpoiltStockTable />}
  </div>
</>
  )
}

export default ShopStockPage