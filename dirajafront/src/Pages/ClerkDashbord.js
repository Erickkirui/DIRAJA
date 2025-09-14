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
  FaBoxes,
  FaExchangeAlt
} from 'react-icons/fa';
import ShopStockList from '../Components/ClerkDashbord/ShopStockList';
import ItemStockList from '../Components/ManagerDashbord/ItemStocklist';

function ClerkDashbord() {
  const designation = localStorage.getItem('designation');
  const shopId = localStorage.getItem('shop_id');
  const isReliever = designation === "reliever";
  const isProcurement = designation === "procurement";

  return (
    <div >
     
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
              <Link className="clerk-button" to={isReliever ? "/relieversales" : "/shopsale"}>
                New Sale
              </Link>
            )}
            {shopId === '18' && (
              <Link className="clerk-button" to="/promo-sale">
                New Sale
              </Link>
            )}
            <Link className='clerk-button' to="/recieve-stock">
            Receive Stock
            </Link>

            <div className='icon-container'>

              {/* Procurement Group */}
              {isProcurement && (
                <div className='icon-group'>
                  <Link className='clerk-icon-button' to='/procurementinventory'>
                    <FaTruck className="icon" />
                    <span>Distribute Stock</span>
                  </Link>
                </div>
              )}

              
              {shopId !== '12' && shopId !== '18' && (
                <div className='icon-group'>
                  {/* Use /inventorycount for procurement, /shop-stock-level for others */}
                  <Link className='clerk-icon-button' to={isProcurement ? '/inventorycount' : '/shop-stock-level'}>
                    <FaBoxes className="icon" />
                    <span>Stock</span>
                  </Link>
                  {/* Use Shop to Shop button for procurement, Sold Items for others */}
                  {isProcurement ? (
                    <Link className='clerk-icon-button' to='/proctransfers'>
                      <FaExchangeAlt className="icon" />
                      <span>Shop to Shop</span>
                    </Link>
                  ) : (
                    <Link className='clerk-icon-button' to='/sold-items'>
                      <FaTools className="icon" />
                      <span>Sold Items</span>
                    </Link>
                  )}
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
                    <Link className="clerk-icon-button" to={isReliever ? "/reliever" : "/mabandasales"}>
                      <FaEye className="icon" />
                      <span>View Sales</span>
                    </Link>
                  </div>
                </>
              )}

              {/* Regular Shop Clerk Group */}
              {shopId !== '12' && shopId !== '18' && (
                <>
                  <div className='icon-group'>
                    <Link className="clerk-icon-button" to={isReliever ? "/reliever" : "/shopsales"}>
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
                    {/* Use /procpurchases for procurement, /stock-shop-move for others */}
                    <Link className="clerk-icon-button" to={isProcurement ? "/procpurchases" : "/stock-shop-move"}>
                      <FaTruck className="icon" />
                      <span>Stock Transfers</span>
                    </Link>
                   
                    <Link className="clerk-icon-button" to={isReliever ? "/deposit" : "/depositcash"}>
                      <FaMoneyBillWave className="icon" />
                      <span>Deposit Cash</span>
                    </Link>
                  </div>
                </>
              )}
            </div>
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

          {/* Show ShopStockList for procurement users */}
          {isProcurement && (
            <div className="shop-stock-list-section">
              <ItemStockList />
            </div>
          )}
        </div>
      </div>
    
  );
}

export default ClerkDashbord;