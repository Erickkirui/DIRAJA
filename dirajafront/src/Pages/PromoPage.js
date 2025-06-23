import React, { useState } from 'react';
import PromotionSales from '../Components/PromotionSales/PromotionSales';
import PromoSalesRank from '../Components/PromotionSales/PromoSalesRank';

function PromoPage() {
  const [activeTab, setActiveTab] = useState('PromotionSales');

  return (
    <div className="promo-page-container">
      <div className="header-container">
        <h1>Promo Sales</h1>
      </div>

      {/* Tabs */}
      <div className="tabs-container">
        <button
          className={`tab-button ${activeTab === 'PromotionSales' ? 'active' : ''}`}
          onClick={() => setActiveTab('PromotionSales')}
        >
          Department Sales
        </button>
        <button
          className={`tab-button ${activeTab === 'PromoSalesRank' ? 'active' : ''}`}
          onClick={() => setActiveTab('PromoSalesRank')}
        >
          Leaderboard
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'PromotionSales' && <PromotionSales />}
        {activeTab === 'PromoSalesRank' && <PromoSalesRank />}
      </div>
    </div>
  );
}

export default PromoPage;
