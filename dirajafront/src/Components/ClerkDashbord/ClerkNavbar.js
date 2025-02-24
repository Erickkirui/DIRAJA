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
          <NavLink to="/shopsales" className="menu-item" activeClassName="active">
            <img src='/images/Sales.png' alt='menu-icon' />
            <li>Sales</li>
          </NavLink>

          <NavLink to="/shopcustomers" className="menu-item" activeClassName="active">
            <img src='/images/Customers.png' alt='menu-icon' />
            <li>Customers</li>
          </NavLink>
          {/* <NavLink to="/managestock" className="menu-item" activeClassName="active">
            <img src='/images/Shop.png' alt='menu-icon' />
            <li> Stock </li>
          </NavLink> */}
          
        </ul>
      </div>

    
    </div>
  );
}

export default ClerkNavbar;
