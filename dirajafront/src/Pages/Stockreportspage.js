import React from 'react'
import StockReports from '../Components/ManagerDashbord/StockReports';
import { Link } from 'react-router-dom';



function StockReportPage() {
  return (
    <div>
        <div className='header-container'>
        <h1>Stock Reports</h1>
       <div>
        <Link className='add-button' to="/stockstatus">Make report for a shop ＋ </Link>

       </div>
        </div>
        <StockReports/>
        
        
    </div>
  )
}

export default StockReportPage