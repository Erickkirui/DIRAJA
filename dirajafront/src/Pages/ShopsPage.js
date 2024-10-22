import React from 'react'
import Shops from '../Components/GetAllShops'
import { Link } from 'react-router-dom'

function ShopsPage() {
  return (
    <div>
      <h1>All Shops</h1>
      <button><Link to="/newshop">Add Shop</Link></button>
        <Shops/>
    </div>
  )
}

export default ShopsPage