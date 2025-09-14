import React, { useState } from "react";
import "../Styles/navigation.css";
import { NavLink } from "react-router-dom";
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
  FaTags,
  FaBalanceScale,
  FaBook,
  FaChevronDown,
  FaChevronRight,
} from "react-icons/fa";

function Navbar({ onMenuItemClick }) {
  const username = localStorage.getItem("username");

  const [openGroups, setOpenGroups] = useState({
    stock: true,
    accounting: true,
  });

  const toggleGroup = (group) => {
    setOpenGroups((prev) => ({
      ...prev,
      [group]: !prev[group],
    }));
  };

  return (
    <div className="navigation-container">
      <h1 className="nav-title">DIRAJA</h1>

      <div className="main-menu">
        <h4 className="section-label">MAIN MENU</h4>
        <ul>
          <NavLink to="/" className="menu-item" onClick={onMenuItemClick}>
            <FaTachometerAlt className="menu-icon" />
            <span>Dashboard</span>
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
                  to="/allinventory"
                  className="menu-item sub-item"
                  onClick={onMenuItemClick}
                >
                  <span>Inventory</span>
                </NavLink>
                <NavLink
                  to="/shopstock"
                  className="menu-item sub-item"
                  onClick={onMenuItemClick}
                >
                  <span>System Stocks</span>
                </NavLink>
                <NavLink
                  to="/shoptransfers"
                  className="menu-item sub-item"
                  onClick={onMenuItemClick}
                >
                  <span>Stock Transfers</span>
                </NavLink>
                <NavLink
                  to="/stockstatus"
                  className="menu-item sub-item"
                  onClick={onMenuItemClick}
                >
                  <span>Stock Reports</span>
                </NavLink>
                <NavLink
                  to="/stock-movement"
                  className="menu-item sub-item"
                  onClick={onMenuItemClick}
                >
                  <span>Stock Movement</span>
                </NavLink>
              </div>
            )}
          </div>

          <NavLink to="/analytics" className="menu-item" onClick={onMenuItemClick}>
            <FaChartLine className="menu-icon" />
            <span>Sales Analytics</span>
          </NavLink>

          <NavLink to="/expenses" className="menu-item" onClick={onMenuItemClick}>
            <FaMoneyBillWave className="menu-icon" />
            <span>Expenses</span>
          </NavLink>

          <NavLink to="/mabandapage" className="menu-item" onClick={onMenuItemClick}>
            <FaTractor className="menu-icon" />
            <span>Mabanda Farm</span>
          </NavLink>

          <NavLink to="/allshops" className="menu-item" onClick={onMenuItemClick}>
            <FaStore className="menu-icon" />
            <span>Shops</span>
          </NavLink>

          <NavLink to="/allcustomers" className="menu-item" onClick={onMenuItemClick}>
            <FaUsers className="menu-icon" />
            <span>Customers</span>
          </NavLink>

          <NavLink to="/allemployees" className="menu-item" onClick={onMenuItemClick}>
            <FaUserTie className="menu-icon" />
            <span>Employees</span>
          </NavLink>

          <NavLink to="/supplier" className="menu-item" onClick={onMenuItemClick}>
            <FaTruck className="menu-icon" />
            <span>Suppliers</span>
          </NavLink>

          <NavLink to="/promo-sales-table" className="menu-item" onClick={onMenuItemClick}>
            <FaTags className="menu-icon" />
            <span>Promo Sales</span>
          </NavLink>

          {(username === "Leo" ||
            username === "Namai" ||
            username === "External Auditor") && (
            <NavLink to="/accounts-balance" className="menu-item" onClick={onMenuItemClick}>
              <FaBalanceScale className="menu-icon" />
              <span>Account Balances</span>
            </NavLink>
          )}
          <NavLink to="/transaction-analyse" className="menu-item" onClick={onMenuItemClick}>
            <FaTags className="menu-icon" />
            <span>Compare statement</span>
          </NavLink>
        </ul>
      </div>

      {/* Accounting Group */}
      <div className="accounting-menu">
        <h4 className="section-label">ACCOUNTING</h4>
        <div className="menu-group">
          <button
            className="menu-item group-toggle"
            onClick={() => toggleGroup("accounting")}
          >
            {openGroups.accounting ? (
              <FaChevronDown className="chevron" />
            ) : (
              <FaChevronRight className="chevron" />
            )}
            <FaBook className="menu-icon" />
            <span>Accounting</span>
          </button>
          {openGroups.accounting && (
            <div className="submenu">
              <NavLink to="/ledgers" className="menu-item sub-item" onClick={onMenuItemClick}>
                <span>Ledgers Accounts</span>
              </NavLink>
              <NavLink to="/all-ledgers" className="menu-item sub-item" onClick={onMenuItemClick}>
                <span>Ledgers</span>
              </NavLink>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Navbar;