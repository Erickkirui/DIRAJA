import React from 'react'
import { Link } from 'react-router-dom';
import ShopStock from '../Components/SystemStock/GetShopStock'


function ShopStockPage() {
  return (
    <div>
    <div className='header-container'>
    <h1>System Stock</h1>
    </div>
      <ShopStock />
  
  </div>
  )
}

export default ShopStockPage