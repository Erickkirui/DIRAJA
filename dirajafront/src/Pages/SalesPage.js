import React from 'react';
import { Link } from 'react-router-dom';
import Sales from '../Components/GetSales';
import TotalPaidSales from '../Components/TotalPaidSales'; 

function SalesPage() {
  return (
    <><h1>Sales</h1>
      <p>Analytics</p>
      <div className="top-row">
        <div className="metrix-card-container">
          {/* Analytics Section */}
          <div className="metrix-pair">
            <TotalPaidSales />
          </div>

          {/* Sales Table Section */}
          <div className="header-container">
            <button className="add-button">
              <Link to="/newsale">Add Sale ＋</Link>
            </button>
          </div>
          <Sales />
        </div>
      </div>
    </>
  );
}

export default SalesPage;
