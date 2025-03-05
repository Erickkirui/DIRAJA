import React from 'react'
import { Link } from 'react-router-dom';
import Purchases from '../Components/GetPurchases'
function PurchasesPage() {
  return (
    <div>
      <div className='header-container'>
          <h1>Purchases</h1>
          </div>
        <Purchases/>
    </div>
  )
}

export default PurchasesPage