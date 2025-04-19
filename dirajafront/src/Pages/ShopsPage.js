import React from 'react'
import Shops from '../Components/Shops /GetAllShops'
import AddShop from '../Components/Shops /Shops'

function ShopsPage() {
  return (
    <div>
      <h1>Shops</h1>
      <p>Add a new shop</p>
      <AddShop />
        <Shops/>
    </div>
  )
}

export default ShopsPage