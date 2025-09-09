import React from 'react'
import { Link } from 'react-router-dom';
import GetProcurementInventory from '../Components/Inventory/GetProcurementInvntory';



function ProcurementTablePage() {
  return (
    <div>
        <div className='header-container'>
        <h1>Inventory</h1>
       <div>
        <Link className='add-button' to="/addprocurementitems">Add Items ＋ </Link>

         <Link className='add-button' to="/addprocurementinventory">Add inventory ＋ </Link>

       </div>
        </div>
        <GetProcurementInventory/>
        
        
    </div>
  )
}

export default ProcurementTablePage;