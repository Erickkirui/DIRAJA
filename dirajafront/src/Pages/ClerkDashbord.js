import React from 'react';
import ClerkNavbar from '../Components/ClerkDashbord/ClerkNavbar';
import UserDisplay from '../Components/UserDisplay';

import Totalcreditpershop from '../Components/ClerkDashbord/Totalcreditpershop'

import TotalCashSalesByUser from '../Components/ClerkDashbord/TotalCashSalesperuser';


import TotalMabandaSales from '../Components/ClerkDashbord/MabandaShop/Totalsalesmabanda';

import TotalShopSales from '../Components/ClerkDashbord/TotalSalesPershop';
import '../Styles/clerkpage.css';
import { Link } from 'react-router-dom';
import ShopNameDisplay from '../Components/ClerkDashbord/ShopNameDisplay';

function ClerkDashbord() {
  const designation = localStorage.getItem('designation'); // Retrieve the designation from localStorage
  const shopId = localStorage.getItem('shop_id')

  return (
    <div className='Page-continer'>
      <div className='navigation'>
        <ClerkNavbar />
      </div>
      <div className='body-area'>
        <div className='body-header'>
          <UserDisplay />
          
        </div>

        <div className='page-area'>
          <div className='nav-phone'>
          <ShopNameDisplay />
           {designation === "procurement" && (
              <Link className='clerk-button' to='/distribute-stock'>Distribute Stock</Link>
            )}
       
              {/* {
                shopId === "2" &&(
                  <Link className='clerk-button' to='/mabandasale'>New MSale</Link>
              )}

            <Link className='clerk-button' to='/shopsale'>New Sale</Link> */}
                {shopId === "12" && (
                  <Link className="clerk-button" to="/mabandasale">
                    New Sale
                  </Link>
                )}

                {shopId !== "12" && shopId !== "18" && (
                  <Link className="clerk-button" to="/shopsale">
                    New Sale
                  </Link>
                )}

                {shopId === "18" && (
                  <Link className="clerk-button" to="/promo-sale">
                    New Sale
                  </Link>
                )}

                {/* {shopId !== "12" && (
                  <Link className="clerk-button" to="/shopcustomers">
                    View Customers
                  </Link>
                )} */}

                
            {/* <Link className='clerk-button' to='/shopcustomers'>View Customers</Link> */}
              
              {/* {shopId !== "12" && (
                  <Link className="clerk-button" to="/managestock">
                    Manage Stock
                  </Link>
                )} */}
              {
                shopId === "2" &&(
                  <Link className='clerk-button' to='/managestock'>Manage Stock</Link>
              )}

              {shopId === "12" && (
                  <Link className="clerk-button" to="/mabandastock">
                    Add Stock
                  </Link>
                )}

              {shopId === "12" && (
                  <Link className="clerk-button" to="/mabandaexpense">
                    Add Expense
                  </Link>
                )}

              {shopId === "12" && (
                  <Link className="clerk-button" to="/mabandapurchase">
                    Add Purchase
                  </Link>
                )}

            
            {/* Conditionally render the button for relievers */}
            {designation === "reliever" && (
              <Link className='clerk-button' to='/relieversales'>Reliever Sales</Link>
            )}
            {designation === "procurement" && (
              <Link className='clerk-button' to='/distribute-stock'>Distribute Stock</Link>
            )}

                {shopId === "12" && (
                  <Link className="clerk-button" to="/mabandasales">
                    View Sales
                  </Link>
                )}

                {shopId !== "12" && shopId !== "18" && (
                  <Link className="clerk-button" to="/shopsales">
                    View Sales
                  </Link>
                )}

                {shopId !== "12" && shopId !== "18" && (
                  <Link className="clerk-button" to="/shopcredit">
                    View Credit Sales
                  </Link>
                )}

                {shopId !== "12" && shopId !== "18" && (
                  <Link className="clerk-button" to="/addspoiltstock">
                    Spoilt Stock
                  </Link>
                )}

                {shopId !== "12" && shopId !== "18" && (
                  <Link className="clerk-button" to="/depositcash">
                    Deposit cash
                  </Link>
                )}


            {/* <Link className='clerk-button' to='/shopsales'>View Sales</Link> */}
          </div>

          <div className="metrix-pair">
          <div className='analytics-clerk'>
            {shopId === "12" ? <TotalMabandaSales /> : <TotalShopSales />}
          </div>

          <div className='analytics-clerk'>
            <Totalcreditpershop />
           
          </div>
          
          <div className='analytics-clerk'>
            <TotalCashSalesByUser />
           
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClerkDashbord;
