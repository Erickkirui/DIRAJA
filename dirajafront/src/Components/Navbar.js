import React from 'react';
import '../Styles/navigation.css';
import { NavLink } from 'react-router-dom';

function Navbar() {
  // Get the username from localStorage
  const username = localStorage.getItem('username');

  return (
    <div className='navigation-container'>
      <h1>DIRAJA SHOP</h1>

      <div className='main-menu'>
        <h4>MAIN MENU</h4>

        <ul>
          <NavLink exact to="/" className="menu-item" activeClassName="active">
            <img src='/images/Dashbord.png' alt='menu-icon' />
            <li>Dashboard</li>
          </NavLink>
          <NavLink to="/allinventory" className="menu-item" activeClassName="active">
            <img src='/images/Sales.png' alt='menu-icon' />
            <li>Inventory</li>
          </NavLink>
          <NavLink to="/analytics" className="menu-item" activeClassName="active">
            <img src='/images/Sales.png' alt='menu-icon' />
            <li>Sales Analytics</li>
          </NavLink>
          <NavLink to=" /promo-sales-table" className="menu-item" activeClassName="active">
            <img src='/images/Sales.png' alt='menu-icon' />
            <li>Promo Sales</li>
          </NavLink>
         
          <NavLink to="/expenses" className="menu-item" activeClassName="active">
            <img src='/images/Expenses.png' alt='menu-icon' />
            <li>Expenses</li>
          </NavLink>
          <NavLink to="/mabandapage" className="menu-item" activeClassName="active">
            <img src='/images/Expenses.png' alt='menu-icon' />
            <li>Mabanda farm</li>
          </NavLink>
          <NavLink to="/allshops" className="menu-item" activeClassName="active">
            <img src='/images/Shop.png' alt='menu-icon' />
            <li>Shops</li>
          </NavLink>
          <NavLink to="/allcustomers" className="menu-item" activeClassName="active">
            <img src='/images/Customers.png' alt='menu-icon' />
            <li>Customers</li>
          </NavLink>
          <NavLink to="/allemployees" className="menu-item" activeClassName="active">
            <img src='/images/Employees.png' alt='menu-icon' />
            <li>Employees</li>
          </NavLink>
          <NavLink exact to="/shopstock" className="menu-item" activeClassName="active">
            <img src='/images/Shop.png' alt='menu-icon' />
            <li>System Stocks</li>
          </NavLink>
          <NavLink exact to="/stockstatus" className="menu-item" activeClassName="active">
            <img src='/images/Shop.png' alt='menu-icon' />
            <li>Shop Stocks</li>
          </NavLink>

          {/* ✅ Conditional rendering based on localStorage username */}
          {(username === 'Leo' || username === 'Namai' || username === 'External Auditor') && (
            <NavLink exact to='/accounts-balance' className="menu-item" activeClassName="active">
              <img src='/images/Shop.png' alt='menu-icon' />
              <li>Account Balances</li>
            </NavLink>
          )}
        </ul>
      </div>

      <div className='accounting-menu'>
        <h4>ACCOUNTING</h4>
        <ul>
          <NavLink to="/ledgers" className="menu-item" activeClassName="active">
            <li>Ledgers Accounts </li>
          </NavLink>
          <NavLink to="/all-ledgers" className="menu-item" activeClassName="active">
            <li>Ledgers </li>
          </NavLink>
        </ul>
      </div>
    </div>
  );
}

export default Navbar;
