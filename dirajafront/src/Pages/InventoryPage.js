import React from 'react'
import Inventory from '../Components/GetInventory'
import { Link } from 'react-router-dom';


function InventoryPage() {
  return (
    <div>
        <div className='header-container'>
        <h1>Inventory</h1>
        <button className='add-button'><Link to="/newinventory">Add inventory ＋ </Link></button>
        </div>
        <Inventory/>
        
    </div>
  )
}

export default InventoryPage