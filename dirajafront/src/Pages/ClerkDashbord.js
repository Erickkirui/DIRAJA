import React from 'react'
import ClerkNavbar from '../Components/ClerkDashbord/ClerkNavbar'
import UserDisplay from '../Components/UserDisplay'

import ShopTodaySales from '../Components/ClerkDashbord/ShopTodaySales'
import TotalShopSales from '../Components/ClerkDashbord/TotalSalesPershop'


function ClerkDashbord() {
  return (
    <div className='Page-continer'>
        <div className='navigation'>
            <ClerkNavbar/>
        </div>
        <div className='body-area'>
            <div className='body-header'>
                <UserDisplay />

            </div>
            <div className='page-area'>
                <ShopTodaySales />
                <TotalShopSales />
             

            </div>


        </div>
            
      
    </div>
  )
}

export default ClerkDashbord
