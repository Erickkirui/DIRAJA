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
                <button className='button'> <Link  to='/shopsale'> New Sale</Link></button>
                <button className='button'> <Link  to='/shopcustomers'> View Customers</Link></button>
                <button className='button'> <Link  to='/shopsales'> View Sales</Link></button>
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
