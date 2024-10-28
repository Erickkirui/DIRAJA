import React from 'react'
import ClerkNavbar from '../Components/ClerkDashbord/ClerkNavbar'
import UserDisplay from '../Components/UserDisplay'
import Sales from '../Components/GetSales'
import ShopTodaySales from '../Components/ClerkDashbord/ShopTodaySales'
import ShopSales from '../Components/ClerkDashbord/ShopSales'

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
             

            </div>


        </div>
            
      
    </div>
  )
}

export default ClerkDashbord
