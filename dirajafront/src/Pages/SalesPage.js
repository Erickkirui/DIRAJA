import React from 'react';
import { Link } from 'react-router-dom';
import Sales from '../Components/Sales/GetSales';


function SalesPage() {
  return (
    <>

          <div className="header-container">
            <h1>Sales</h1>
            
              <Link to="/newsale"  className='add-button' >Add Sale ＋</Link>
         
          </div>
          <Sales />
   
    </>
  );
}

export default SalesPage;
