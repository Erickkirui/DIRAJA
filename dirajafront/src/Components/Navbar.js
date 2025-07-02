import React from 'react';
import '../Styles/navigation.css';
import { NavLink } from 'react-router-dom';
import {
  FaTachometerAlt,
  FaBoxes,
  FaChartLine,
  FaMoneyBillWave,
  FaTractor,
  FaStore,
  FaUsers,
  FaUserTie,
  FaTruck,
  FaWarehouse,
  FaBoxOpen,
  FaTags,
  FaBalanceScale,
  FaBook,
  FaClipboardList
} from 'react-icons/fa';

function Navbar() {
  const username = localStorage.getItem('username');

  return (
    <div className='navigation-container'>
      <h1>DIRAJA SHOP</h1>

      <div className='main-menu'>
        <h4>MAIN MENU</h4>

        <ul>
          <NavLink exact to="/" className="menu-item" activeClassName="active">
            <FaTachometerAlt className="menu-icon" />
            <li>Dashboard</li>
          </NavLink>
          <NavLink to="/allinventory" className="menu-item" activeClassName="active">
            <FaBoxes className="menu-icon" />
            <li>Inventory</li>
          </NavLink>
          <NavLink to="/analytics" className="menu-item" activeClassName="active">
            <FaChartLine className="menu-icon" />
            <li>Sales Analytics</li>
          </NavLink>
          <NavLink to="/expenses" className="menu-item" activeClassName="active">
            <FaMoneyBillWave className="menu-icon" />
            <li>Expenses</li>
          </NavLink>
          <NavLink to="/mabandapage" className="menu-item" activeClassName="active">
            <FaTractor className="menu-icon" />
            <li>Mabanda Farm</li>
          </NavLink>
          <NavLink to="/allshops" className="menu-item" activeClassName="active">
            <FaStore className="menu-icon" />
            <li>Shops</li>
          </NavLink>
          <NavLink to="/allcustomers" className="menu-item" activeClassName="active">
            <FaUsers className="menu-icon" />
            <li>Customers</li>
          </NavLink>
          <NavLink to="/allemployees" className="menu-item" activeClassName="active">
            <FaUserTie className="menu-icon" />
            <li>Employees</li>
          </NavLink>
          <NavLink to="/supplier" className="menu-item" activeClassName="active">
            <FaTruck className="menu-icon" />
            <li>Suppliers</li>
          </NavLink>
          <NavLink exact to="/shopstock" className="menu-item" activeClassName="active">
            <FaWarehouse className="menu-icon" />
            <li>System Stocks</li>
          </NavLink>
          <NavLink exact to="/stockstatus" className="menu-item" activeClassName="active">
            <FaBoxOpen className="menu-icon" />
            <li>Shop Stocks</li>
          </NavLink>
          <NavLink to="/promo-sales-table" className="menu-item" activeClassName="active">
            <FaTags className="menu-icon" />
            <li>Promo Sales</li>
          </NavLink>

          {(username === 'Leo' || username === 'Namai' || username === 'External Auditor') && (
            <NavLink exact to='/accounts-balance' className="menu-item" activeClassName="active">
              <FaBalanceScale className="menu-icon" />
              <li>Account Balances</li>
            </NavLink>
          )}
        </ul>
      </div>

      <div className='accounting-menu'>
        <h4>ACCOUNTING</h4>
        <ul>
          <NavLink to="/ledgers" className="menu-item" activeClassName="active">
            <FaBook className="menu-icon" />
            <li>Ledgers Accounts</li>
          </NavLink>
          <NavLink to="/all-ledgers" className="menu-item" activeClassName="active">
            <FaClipboardList className="menu-icon" />
            <li>Ledgers</li>
          </NavLink>
        </ul>
      </div>
    </div>
  );
}

export default Navbar;
