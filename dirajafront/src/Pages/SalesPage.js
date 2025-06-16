import React, { useState } from 'react';
import Sales from '../Components/Sales/GetSales';
import { Link } from 'react-router-dom';

function SalesPage() {
  const [activeTab, setActiveTab] = useState('allsales');

  return (
    <div>
      <h1>All Sales</h1>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <Link to="/sale-reports" style={{ textDecoration: 'none' }}>
          <button
            style={{
              backgroundColor: 'transparent',
              padding: '10px',
              border: '1px solid #ccc',
              display: 'flex',
              alignItems: 'center',
              borderRadius: '5px',
              cursor: 'pointer',
            }}
          >
            Generate Excel Report
            <img
              src="/images/office365.png"
              alt="Export Icon"
              style={{
                width: '20px',
                height: '20px',
                marginLeft: '5px',
              }}
            />
          </button>
        </Link>

        <Link className='add-button' to="/newsale">Add Sale </Link>
        
      </div>

        <Sales />
       
        
        {/* <h1>All Sales</h1>
        <div className="tabs-container">
          <button 
            className={`tab-button ${activeTab === 'allsales' ? 'active' : ''}`} 
            onClick={() => setActiveTab('allsales')}
          >
            Sales
          </button>
          <button 
            className={`tab-button ${activeTab === 'cashsales' ? 'active' : ''}`} 
            onClick={() => setActiveTab('cashsales')}
          >
            Cash Sales
          </button>
        </div>
  
        <div className="tab-content">
          {activeTab === 'allsales' && <Sales />}
          {activeTab === 'cashsales' && <CashSales />}
        </div> */}
      </div>
    );
  }
  

export default SalesPage;
