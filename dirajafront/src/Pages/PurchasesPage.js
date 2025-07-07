import React from 'react'
import { Link } from 'react-router-dom';
import PurchasesV2 from '../Components/Purchases/GetPurchasesV2';
function PurchasesPage() {
  return (
    <div>
      <div className='header-container'>
          <h1>Purchases</h1>
          </div>
        <PurchasesV2/>
    </div>
  )
}

export default PurchasesPage