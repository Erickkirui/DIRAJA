import React from 'react'
import CountShops from '../Components/ManagerDashbord/CountShops'
import CountEmployees from '../Components/ManagerDashbord/CountEmployees'
import TotalAmountPaidExpenses from '../Components/ManagerDashbord/TotalAmountPaidExpenses'
import TotalAmountPaidSales from '../Components/ManagerDashbord/TotalAmountPaidSales'

function Managerdashord() {
  return (
    <>
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
    </>
  )
}

export default Managerdashord