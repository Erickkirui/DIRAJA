import React from 'react';
import { Link } from 'react-router-dom';
import Sales from '../Components/GetSales';
import TotalPaidSales from '../Components/TotalPaidSales'; 

function SalesPage() {
  return (
    <>
      <p>Analytics</p>
      <div className="top-row">
        <div className="metrix-card-container">
          <div className="metrix-pair">
            <div>
              <TotalPaidSales />
            </div>
            <div>
              <div className="header-container">
                <h1>Sales</h1>
                <button className="add-button">
                  <Link to="/newsale">Add Sale ＋</Link>
                </button>
              </div>
              <Sales />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default SalesPage;
