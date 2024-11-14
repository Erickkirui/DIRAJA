import React from 'react'
import CountShops from '../Components/ManagerDashbord/CountShops'
import CountEmployees from '../Components/ManagerDashbord/CountEmployees'
import TotalAmountPaidExpenses from '../Components/ManagerDashbord/TotalAmountPaidExpenses'
import TotalAmountPaidSales from '../Components/ManagerDashbord/TotalAmountPaidSales'
import TodaysSales from '../Components/ManagerDashbord/TodaysSales'

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
     
        
    
    </>
  )
}

export default Managerdashord