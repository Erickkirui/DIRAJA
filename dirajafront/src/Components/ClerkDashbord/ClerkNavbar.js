import React from 'react';
import '../../Styles/navigation.css';
import { NavLink } from 'react-router-dom';

function ClerkNavbar() {
  return (
    <div className='navigation-container'>
      <h1>DIRAJA SHOP</h1>

      <div className='main-menu'>
        <h4>MAIN MENU</h4>

        <ul>
          <NavLink exact to="/clerk" className="menu-item" activeClassName="active">
            <img src='/images/Dashbord.png' alt='menu-icon' />
            <li>Dashboard</li>
          </NavLink>
          <NavLink to="/sales" className="menu-item" activeClassName="active">
            <img src='/images/Sales.png' alt='menu-icon' />
            <li>Sales</li>
          </NavLink>

          <NavLink to="/allcustomers" className="menu-item" activeClassName="active">
            <img src='/images/Customers.png' alt='menu-icon' />
            <li>Customers</li>
          </NavLink>
          
        </ul>
      </div>

      <div className='accounting-menu'>
        <h4>ACCOUNTING</h4>
        <ul>
          <li>Balance Sheet</li>
          <li>Cash Flow</li>
          <li>Profit and Loss</li>
        </ul>
      </div>
    </div>
  );
}

export default ClerkNavbar;
