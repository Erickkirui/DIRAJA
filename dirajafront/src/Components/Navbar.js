import React from 'react';
import '../Styles/navigation.css';
import { NavLink } from 'react-router-dom';

function Navbar() {
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
          <NavLink to="/sales" className="menu-item" activeClassName="active">
            <img src='/images/Sales.png' alt='menu-icon' />
            <li>Sales</li>
          </NavLink>
          <NavLink to="/expenses" className="menu-item" activeClassName="active">
            <img src='/images/Expenses.png' alt='menu-icon' />
            <li>Expenses</li>
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
          <NavLink exact to="/purchases" className="menu-item" activeClassName="active">
            <img src='/images/Dashbord.png' alt='menu-icon' />
            <li>Purchases</li>
          </NavLink>
          <NavLink exact to="/alltransfers" className="menu-item" activeClassName="active">
            <img src='/images/Dashbord.png' alt='menu-icon' />
            <li>Transefer</li>
          </NavLink>
          <NavLink exact to="/shopstock" className="menu-item" activeClassName="active">
            <img src='/images/Dashbord.png' alt='menu-icon' />
            <li>Shop Stock</li>
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

export default Navbar;
