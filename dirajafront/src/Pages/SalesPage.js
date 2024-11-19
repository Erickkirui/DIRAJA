import React from 'react';
import { Link } from 'react-router-dom';
import Sales from '../Components/GetSales';


function SalesPage() {
  return (
    <>

          <div className="header-container">
            <h1>Sales</h1>
            <button className="add-button">
              <Link to="/newsale">Add Sale ＋</Link>
            </button>
          </div>
          <Sales />
   
    </>
  );
}

export default SalesPage;
