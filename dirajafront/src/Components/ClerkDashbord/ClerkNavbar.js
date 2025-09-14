import React, { useState } from 'react';
import '../../Styles/navigation.css';
import { NavLink } from 'react-router-dom';
import {
  FaTachometerAlt,
  FaMoneyBillWave,
  FaUsers,
  FaBoxes,
  FaChevronDown,
  FaChevronRight,
} from "react-icons/fa";

function ClerkNavbar({ onMenuItemClick }) {
  const [openGroups, setOpenGroups] = useState({
    stock: true,
  });

  const toggleGroup = (group) => {
    setOpenGroups((prev) => ({
      ...prev,
      [group]: !prev[group],
    }));
  };

  return (
    <div className='navigation-container'>
      <h1 className="nav-title">DIRAJA SHOP</h1>

      <div className='main-menu'>
        <h4 className="section-label">MAIN MENU</h4>

        <ul>
          <NavLink 
            exact to="/clerk" 
            className="menu-item" 
            onClick={onMenuItemClick}
          >
            <FaTachometerAlt className="menu-icon" />
            <span>Dashboard</span>
          </NavLink>
          
          <NavLink 
            to="/shopsales" 
            className="menu-item" 
            onClick={onMenuItemClick}
          >
            <FaMoneyBillWave className="menu-icon" />
            <span>Sales</span>
          </NavLink>

          <NavLink 
            to="/shopcustomers" 
            className="menu-item" 
            onClick={onMenuItemClick}
          >
            <FaUsers className="menu-icon" />
            <span>Customers</span>
          </NavLink>
          
          {/* Stock Group */}
          <div className="menu-group">
            <button
              className="menu-item group-toggle"
              onClick={() => toggleGroup("stock")}
            >
              {openGroups.stock ? (
                <FaChevronDown className="chevron" />
              ) : (
                <FaChevronRight className="chevron" />
              )}
              <FaBoxes className="menu-icon" />
              <span>Stock</span>
            </button>
            {openGroups.stock && (
              
              <div className="submenu">
                <NavLink
                  to="/recieve-stock"
                  className="menu-item sub-item"
                  onClick={onMenuItemClick}
                >
                  <span>Manage Stock</span>
                </NavLink>
              </div>
              
            )}
          </div>
        </ul>
      </div>
    </div>
  );
}

export default ClerkNavbar;