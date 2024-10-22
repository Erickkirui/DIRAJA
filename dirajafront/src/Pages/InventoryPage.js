import React from 'react'
import Inventory from '../Components/GetInventory'
import { Link } from 'react-router-dom';

function InventoryPage() {
  return (
    <div>
        <h1>Inventory</h1>
        <button><Link to="/addinventory">Add inventory</Link></button>
        <Inventory/>
    </div>
  )
}

export default InventoryPage