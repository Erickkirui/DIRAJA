import React from 'react';
import ClerkNavbar from '../Components/ClerkDashbord/ClerkNavbar';
import UserDisplay from '../Components/UserDisplay';
import Totalcreditpershop from '../Components/ClerkDashbord/Totalcreditpershop';
import TotalCashSalesByUser from '../Components/ClerkDashbord/TotalCashSalesperuser';
import TotalMabandaSales from '../Components/ClerkDashbord/MabandaShop/Totalsalesmabanda';
import TotalShopSales from '../Components/ClerkDashbord/TotalSalesPershop';
import ShopNameDisplay from '../Components/ClerkDashbord/ShopNameDisplay';
import '../Styles/clerkpage.css';
import { Link } from 'react-router-dom';

// Icons
import {
  FaWarehouse,
  FaMoneyBillWave,
  FaCashRegister,
  FaEye,
  FaCreditCard,
  FaTrashAlt,
  FaPiggyBank,
  FaFileInvoiceDollar,
  FaTruck,
  FaTools,
   FaBoxes
} from 'react-icons/fa';
import ShopStockList from '../Components/ClerkDashbord/ShopStockList';

function ClerkDashbord() {
  const designation = localStorage.getItem('designation');
  const shopId = localStorage.getItem('shop_id');
  const isReliever = designation === "reliever";

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

            {/* NEW SALE BUTTON */}
            {shopId === '12' && (
              <Link className="clerk-button" to="/mabandasale">
                New Sale
              </Link>
            )}
            {shopId !== '12' && shopId !== '18' && (
              <Link className="clerk-button" to="/shopsale">
                New Sale
              </Link>
            )}
            {shopId === '18' && (
              <Link className="clerk-button" to="/promo-sale">
                New Sale
              </Link>
            )}

            <div className='icon-container'>

              {/* Procurement Group */}
              {designation === "procurement" && (
                <div className='icon-group'>
                  <Link className='clerk-icon-button' to='/distribute-stock'>
                    <FaTruck className="icon" />
                    <span>Distribute Stock</span>
                  </Link>
                  {/* Placeholder or another procurement icon could go here */}
                </div>
              )}

<<<<<<< HEAD
            {isReliever && (
              <Link className='clerk-button' to='/relieversales'>Reliever Sales</Link>
            )}

            {/* View Sales links - Relievers don't see regular view sales links */}
            {!isReliever && shopId === "12" && (
              <Link className="clerk-button" to="/mabandasales">
                View Sales
              </Link>
            )}

            {!isReliever && shopId !== "12" && shopId !== "18" && (
              <Link className="clerk-button" to="/shopsales">
                View Sales
              </Link>
            )}

            {/* Reliever-specific view sales link */}
            {isReliever && shopId !== "12" && shopId !== "18" && (
              <Link className="clerk-button" to="/reliever">
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

            {/* Updated deposit cash link based on designation */}
            {shopId !== "12" && shopId !== "18" && (
              isReliever ? (
                <Link className="clerk-button" to="/deposit">
                  Deposit Cash
                </Link>
              ) : (
                <Link className="clerk-button" to="/depositcash">
                  Deposit Cash
                </Link>
              )
            )}
=======
              {/* Shop 2 Group */}
              {shopId === '2' && (
                <div className='icon-group'>
                 
                   <Link className='clerk-icon-button' to='/shop-stock-level'>
                    <FaBoxes className="icon" />
                    <span>Stock</span>
                  </Link>

                  <Link className='clerk-icon-button' to='/managestock'>
                    <FaTools className="icon" />
                    <span>Manage Stock</span>
                  </Link>
                </div>
              )}

              {/* Mabanda Group */}
              {shopId === '12' && (
                <>
                  <div className='icon-group'>
                    <Link className="clerk-icon-button" to="/mabandastock">
                      <FaWarehouse className="icon" />
                      <span>Add Stock</span>
                    </Link>
                    <Link className="clerk-icon-button" to="/mabandaexpense">
                      <FaFileInvoiceDollar className="icon" />
                      <span>Add Expense</span>
                    </Link>
                  </div>
                  <div className='icon-group'>
                    <Link className="clerk-icon-button" to="/mabandapurchase">
                      <FaPiggyBank className="icon" />
                      <span>Add Purchase</span>
                    </Link>
                    <Link className="clerk-icon-button" to="/mabandasales">
                      <FaEye className="icon" />
                      <span>View Sales</span>
                    </Link>
                  </div>
                </>
              )}

              {/* Reliever Group */}
              {designation === "reliever" && (
                <div className='icon-group'>
                  <Link className='clerk-icon-button' to='/relieversales'>
                    <FaCashRegister className="icon" />
                    <span>Reliever Sales</span>
                  </Link>
                </div>
              )}

              {/* Regular Shop Clerk Group */}
              {shopId !== '12' && shopId !== '18' && (
                <>
                  <div className='icon-group'>
                    <Link className="clerk-icon-button" to="/shopsales">
                      <FaEye className="icon" />
                      <span>View Sales</span>
                    </Link>
                    <Link className="clerk-icon-button" to="/shopcredit">
                      <FaCreditCard className="icon" />
                      <span>Credit Sales</span>
                    </Link>
                  </div>
                  <div className='icon-group'>
                    <Link className="clerk-icon-button" to="/addspoiltstock">
                      <FaTrashAlt className="icon" />
                      <span>Spoilt Stock</span>
                    </Link>
                    {designation === 'reliever' ? (
                      <Link className="clerk-icon-button" to="/deposit">
                        <FaMoneyBillWave className="icon" />
                        <span>Deposit Cash</span>
                      </Link>
                    ) : (
                      <Link className="clerk-icon-button" to="/depositcash">
                        <FaMoneyBillWave className="icon" />
                        <span>Deposit Cash</span>
                      </Link>
                    )}
                  </div>
                </>
              )}
            </div>
>>>>>>> bb427c9e8c1e9ae608dbf5002ec57336d369daa2
          </div>

          {/* Dashboard Metrics */}
          <div className="metrix-pair">
            <div className='analytics-clerk'>
              {shopId === '12' ? <TotalMabandaSales /> : <TotalShopSales />}
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
