import React from 'react'
import Inventory from '../Components/GetInventory'
import { Link } from 'react-router-dom';
import DistributeInventory from '../Components/DistributeInventory';

function InventoryPage() {
  return (
    <div>
        <h1>Inventory</h1>
        <button><Link to="/newinventory">Add inventory</Link></button>
        <Inventory/>
        <DistributeInventory />
    </div>
  )
}

export default InventoryPage