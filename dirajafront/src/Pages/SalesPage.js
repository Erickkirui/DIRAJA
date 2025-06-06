import React, { useState } from 'react';
// import CashSales from '../Components/ManagerDashbord/CashSales';
import Sales from '../Components/Sales/GetSales';
import { Link } from 'react-router-dom';


function SalesPage() {
  const [activeTab, setActiveTab] = useState('allsales');
  return (
      <div>
        <h1>All Sales</h1>
        <Link to="/sale-reports">
  <button
    style={{
      backgroundColor: 'transparent', // No background color
      padding: '10px', // Padding of 10px
      border: '1px solid #ccc', // 1px solid border with color #ccc
      display: 'flex', // Flex to align items
      alignItems: 'center', // Center items vertically
      borderRadius: '5px',
      cursor: 'pointer', // Pointer cursor on hover
    }}
  >
    Generate Excel Report 
    <img 
      src='/images/office365.png' 
      alt="Export Icon"
      style={{
        width: '20px', // Width of 20px
        height: '20px', // Height of 20px
        marginLeft: '5px', // Margin to space the image from the text
      }} 
    />
  </button>
</Link>

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
