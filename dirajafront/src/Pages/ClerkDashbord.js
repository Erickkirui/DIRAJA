import React from 'react'
import ClerkNavbar from '../Components/ClerkDashbord/ClerkNavbar'
import UserDisplay from '../Components/UserDisplay'

import ShopTodaySales from '../Components/ClerkDashbord/ShopTodaySales'
import TotalShopSales from '../Components/ClerkDashbord/TotalSalesPershop'
import '../Styles/clerkpage.css'
import { Link } from 'react-router-dom'


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
                <div className='nav-phone'>
                <Link  className='clerk-button' to='/shopsale'> New Sale</Link>
                <Link  className='clerk-button' to='/shopcustomers'> View Customers</Link>
                <Link   className='clerk-button' to='/shopsales'> View Sales</Link>
                </div>
                <div className='analytics-clerk'>
                    <TotalShopSales />
                    <ShopTodaySales />
                    
                </div>
                
                
              

            </div>


        </div>
            
      
    </div>
  )
}

export default ClerkDashbord
