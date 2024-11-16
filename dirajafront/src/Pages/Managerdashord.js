import React from 'react'
import CountShops from '../Components/ManagerDashbord/CountShops'
import CountEmployees from '../Components/ManagerDashbord/CountEmployees'
import TotalAmountPaidExpenses from '../Components/ManagerDashbord/TotalAmountPaidExpenses'
import TotalAmountPaidSales from '../Components/ManagerDashbord/TotalAmountPaidSales'
import TotalAmountPaidPurchases from '../Components/ManagerDashbord/TotalAmountPaidPurchases'
import TodaysSales from '../Components/ManagerDashbord/TodaysSales'
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
            <div>
            <TotalAmountPaidExpenses />
            </div>
          </div>
    
          <div className='metrix-pair'>
            <div>
              <CountShops />

            </div>
            <div>
              <CountEmployees />
            </div>
          </div>
        </div>
        <div>
          <TodaysSales />
        </div>
      </div>
     
      <div>
        <LowStockAlert />
      </div>
    
    </>
  )
}

export default Managerdashord