import React from 'react'
import CountShops from '../Components/ManagerDashbord/CountShops'
import CountEmployees from '../Components/ManagerDashbord/CountEmployees'
import TotalAmountPaidExpenses from '../Components/ManagerDashbord/TotalAmountPaidExpenses'
import TotalAmountPaidSales from '../Components/ManagerDashbord/TotalAmountPaidSales'

function Managerdashord() {
  return (
    <>
      <div className='test'>
   
        <CountShops />
        <CountEmployees />
        <TotalAmountPaidExpenses />
        <TotalAmountPaidSales />
      </div>
    </>
  )
}

export default Managerdashord