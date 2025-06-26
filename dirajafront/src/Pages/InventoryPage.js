import React from 'react'
import Inventory from '../Components/Inventory/GetInventory'
import { Link } from 'react-router-dom';



function InventoryPage() {
  return (
    <div>
        <div className='header-container'>
        <h1>Inventory</h1>
       <div>
        <Link className='add-button' to="/stock-items">Add Items ＋ </Link>

         <Link className='add-button' to="/newinventory">Add inventory ＋ </Link>

       </div>
        </div>
        <Inventory/>
        
        
    </div>
  )
}

export default InventoryPage