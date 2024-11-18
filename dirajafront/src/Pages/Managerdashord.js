import React from 'react'
import CountShops from '../Components/ManagerDashbord/CountShops'
import CountEmployees from '../Components/ManagerDashbord/CountEmployees'
import TotalAmountPaidExpenses from '../Components/ManagerDashbord/TotalAmountPaidExpenses'
import TotalAmountPaidSales from '../Components/ManagerDashbord/TotalAmountPaidSales'
import TotalAmountPaidPurchases from '../Components/ManagerDashbord/TotalAmountPaidPurchases'

import LowStockAlert from '../Components/StockAlert'

function Managerdashord() {
  return (
    <>
    <h2>Dashboard</h2>
    <p>Analytics</p>
      <div className='top-row'>
        <div className='metrix-card-container'>
          <div className='metrix-pair'>
            <div>
              <TotalAmountPaidSales />
            </div>
            <div>
            <TotalAmountPaidPurchases />
            </div>
            
            
          </div>
    
          <div className='metrix-pair'>
            <div>
              <CountShops />
              <div className='single-card'>
                <TotalAmountPaidExpenses />
              </div>
              

            </div>
            <div>
              <CountEmployees />
            </div>
            
          </div>
          
        </div>
        
        <div>
              <LowStockAlert />
          </div>
        
      </div>
     
     
    
    </>
  )
}

export default Managerdashord