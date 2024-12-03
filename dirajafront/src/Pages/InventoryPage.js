import React from 'react'
import Inventory from '../Components/GetInventory'
import { Link } from 'react-router-dom';


function InventoryPage() {
  return (
    <div>
        <div className='header-container'>
        <h1>Inventory</h1>
        <Link className='add-button' to="/newinventory">Add inventory ＋ </Link>
        </div>
        <Inventory/>
        
    </div>
  )
}

export default InventoryPage