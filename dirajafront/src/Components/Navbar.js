import React, { useState, useEffect } from "react";
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
  FaUserCheck,
  FaClipboardCheck,
  FaBalanceScale,
  FaBook,
  FaChevronDown,
  FaChevronRight,
  FaCog,
  FaWarehouse,
  FaExchangeAlt,
  FaChartBar,
  FaHistory,
  FaSyncAlt,
  FaChartPie,
} from "react-icons/fa";

function Navbar({ onMenuItemClick }) {
  const username = localStorage.getItem("username");
  const userId = localStorage.getItem("users_id");
  const [permissions, setPermissions] = useState(null);
  const [loading, setLoading] = useState(true);

  const [openGroups, setOpenGroups] = useState({
    stock: true,
    accounting: true,
  });

  // Define all available modules and their default permission state
  const allModules = {
    Dashboard: false,
    Stock: false,
    Sales_analytics: false,
    Expenses: false,
    Mabanda_Farm: false,
    Shops: false,
    Employess: false,
    Suppliers: false,
    Creditors: false,
    Task_manager: false,
    Accounting: false,
    Settings: false
  };

  useEffect(() => {
    fetchUserPermissions();
  }, []);

  const fetchUserPermissions = async () => {
    // Check if permissions are already stored in localStorage
    const storedPermissions = localStorage.getItem('user_permissions');
    
    if (storedPermissions) {
      try {
        const parsedPermissions = JSON.parse(storedPermissions);
        // Compare and update permissions with all available modules
        const updatedPermissions = compareAndUpdatePermissions(parsedPermissions);
        setPermissions(updatedPermissions);
      } catch (error) {
        console.error('Error parsing stored permissions:', error);
        // If parsing fails, fetch fresh permissions
        await fetchPermissionsFromAPI();
      }
    } else {
      // If not stored, fetch from API
      await fetchPermissionsFromAPI();
    }
    
    setLoading(false);
  };

  const fetchPermissionsFromAPI = async () => {
    try {
      const response = await fetch(`/api/diraja/permissions/user/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const userPermissions = data.permissions;
        
        // Compare and update permissions with all available modules
        const updatedPermissions = compareAndUpdatePermissions(userPermissions);
        
        // Store updated permissions in localStorage
        localStorage.setItem('user_permissions', JSON.stringify(updatedPermissions));
        setPermissions(updatedPermissions);
      } else {
        console.error('Failed to fetch permissions:', response.status);
        // Use all modules with false permissions if API fails
        setPermissions(allModules);
        localStorage.setItem('user_permissions', JSON.stringify(allModules));
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
      // Use all modules with false permissions on error
      setPermissions(allModules);
      localStorage.setItem('user_permissions', JSON.stringify(allModules));
    }
  };

  // Function to compare current permissions with existing modules and update
  const compareAndUpdatePermissions = (currentPermissions) => {
    const updatedPermissions = { ...allModules };
    
    // If we have current permissions, merge them with all modules
    if (currentPermissions && typeof currentPermissions === 'object') {
      Object.keys(currentPermissions).forEach(module => {
        if (updatedPermissions.hasOwnProperty(module)) {
          updatedPermissions[module] = currentPermissions[module];
        }
      });
      
      // Add any new modules from currentPermissions that aren't in allModules
      Object.keys(currentPermissions).forEach(module => {
        if (!updatedPermissions.hasOwnProperty(module)) {
          updatedPermissions[module] = currentPermissions[module];
        }
      });
    }
    
    return updatedPermissions;
  };

  // Function to get newly added modules (modules in allModules but not in current permissions)
  const getNewModules = (currentPermissions) => {
    const newModules = {};
    
    Object.keys(allModules).forEach(module => {
      if (!currentPermissions || !currentPermissions.hasOwnProperty(module)) {
        newModules[module] = allModules[module];
      }
    });
    
    return newModules;
  };

  // Function to get removed modules (modules in current permissions but not in allModules)
  const getRemovedModules = (currentPermissions) => {
    const removedModules = {};
    
    if (currentPermissions) {
      Object.keys(currentPermissions).forEach(module => {
        if (!allModules.hasOwnProperty(module)) {
          removedModules[module] = currentPermissions[module];
        }
      });
    }
    
    return removedModules;
  };

  // Function to refresh permissions (can be called from other components)
  const refreshPermissions = async () => {
    setLoading(true);
    // Clear cached permissions and fetch fresh ones
    localStorage.removeItem('user_permissions');
    await fetchPermissionsFromAPI();
    setLoading(false);
  };

  // Function to update permissions in localStorage and state
  const updatePermissions = (newPermissions) => {
    if (newPermissions && typeof newPermissions === 'object') {
      const updatedPermissions = compareAndUpdatePermissions(newPermissions);
      localStorage.setItem('user_permissions', JSON.stringify(updatedPermissions));
      setPermissions(updatedPermissions);
    }
  };

  // Function to check if permissions need updating (can be called periodically)
  const checkAndUpdatePermissions = async () => {
    try {
      const response = await fetch(`/api/diraja/permissions/user/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const currentPermissions = data.permissions;
        const storedPermissions = JSON.parse(localStorage.getItem('user_permissions') || '{}');
        
        // Compare both sets of permissions with all modules
        const updatedCurrentPermissions = compareAndUpdatePermissions(currentPermissions);
        const updatedStoredPermissions = compareAndUpdatePermissions(storedPermissions);
        
        // Check if permissions have changed
        if (JSON.stringify(updatedCurrentPermissions) !== JSON.stringify(updatedStoredPermissions)) {
          console.log('Permissions updated - refreshing...');
          updatePermissions(currentPermissions);
          return true; // Permissions were updated
        }
      }
      return false; // No update needed
    } catch (error) {
      console.error('Error checking permissions:', error);
      return false;
    }
  };

  // Function to sync permissions with server (useful when modules change)
  const syncPermissionsWithServer = async () => {
    try {
      const response = await fetch(`/api/diraja/permissions/user/${userId}`, {
        method: 'PUT', // or POST depending on your API
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({
          permissions: compareAndUpdatePermissions(permissions)
        })
      });

      if (response.ok) {
        console.log('Permissions synced with server successfully');
        return true;
      } else {
        console.error('Failed to sync permissions with server');
        return false;
      }
    } catch (error) {
      console.error('Error syncing permissions with server:', error);
      return false;
    }
  };

  const toggleGroup = (group) => {
    setOpenGroups((prev) => ({
      ...prev,
      [group]: !prev[group],
    }));
  };

  // Helper function to check if a menu item should be shown
  const shouldShowMenuItem = (permissionKey) => {
    if (loading || !permissions) return false;
    return permissions[permissionKey] === true;
  };

  // Don't render anything while loading permissions
  if (loading) {
    return <div className="navigation-container">Loading...</div>;
  }

  return (
    <div className="navigation-container">
      <h1 className="nav-title">DIRAJA</h1>

      <div className="main-menu">
        <h4 className="section-label">MAIN MENU</h4>
        <ul>
          {/* Dashboard */}
          {shouldShowMenuItem('Dashboard') && (
            <NavLink to="/" className="menu-item" onClick={onMenuItemClick}>
              <FaTachometerAlt className="menu-icon" />
              <span>Dashboard</span>
            </NavLink>
          )}

          {/* Stock Group */}
          {shouldShowMenuItem('Stock') && (
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
                    <FaWarehouse className="menu-icon" />
                    <span>Inventory</span>
                  </NavLink>
                  <NavLink
                    to="/shopstock"
                    className="menu-item sub-item"
                    onClick={onMenuItemClick}
                  >
                    <FaBoxes className="menu-icon" />
                    <span>System Stocks</span>
                  </NavLink>
                  <NavLink
                    to="/shoptransfers"
                    className="menu-item sub-item"
                    onClick={onMenuItemClick}
                  >
                    <FaExchangeAlt className="menu-icon" />
                    <span>Stock Transfers</span>
                  </NavLink>
                  <NavLink
                    to="/stockreport"
                    className="menu-item sub-item"
                    onClick={onMenuItemClick}
                  >
                    <FaChartBar className="menu-icon" />
                    <span>Stock Reports</span>
                  </NavLink>
                  <NavLink
                    to="/stock-movement"
                    className="menu-item sub-item"
                    onClick={onMenuItemClick}
                  >
                    <FaHistory className="menu-icon" />
                    <span>Stock Movement</span>
                  </NavLink>
                  <NavLink
                    to="/reconciliation"
                    className="menu-item sub-item"
                    onClick={onMenuItemClick}
                  >
                    <FaSyncAlt className="menu-icon" />
                    <span>Stock Reconciliation</span>
                  </NavLink>
                </div>
              )}
            </div>
          )}

          {/* Sales Analytics */}
          {shouldShowMenuItem('Sales_analytics') && (
            <NavLink to="/analytics" className="menu-item" onClick={onMenuItemClick}>
              <FaChartLine className="menu-icon" />
              <span>Sales Analytics</span>
            </NavLink>
          )}

          {/* Expenses */}
          {shouldShowMenuItem('Expenses') && (
            <NavLink to="/expenses" className="menu-item" onClick={onMenuItemClick}>
              <FaMoneyBillWave className="menu-icon" />
              <span>Expenses</span>
            </NavLink>
          )}

          {/* Mabanda Farm */}
          {shouldShowMenuItem('Mabanda_Farm') && (
            <NavLink to="/mabandapage" className="menu-item" onClick={onMenuItemClick}>
              <FaTractor className="menu-icon" />
              <span>Mabanda Farm</span>
            </NavLink>
          )}

          {/* Shops */}
          {shouldShowMenuItem('Shops') && (
            <NavLink to="/allshops" className="menu-item" onClick={onMenuItemClick}>
              <FaStore className="menu-icon" />
              <span>Shops</span>
            </NavLink>
          )}

          {/* Customers - Note: Using 'Employess' permission for Customers */}
          {shouldShowMenuItem('Employess') && (
            <NavLink to="/allcustomers" className="menu-item" onClick={onMenuItemClick}>
              <FaUsers className="menu-icon" />
              <span>Customers</span>
            </NavLink>
          )}

          {/* Employees */}
          {shouldShowMenuItem('Employess') && (
            <NavLink to="/allemployees" className="menu-item" onClick={onMenuItemClick}>
              <FaUserTie className="menu-icon" />
              <span>Employees</span>
            </NavLink>
          )}

          {/* Suppliers */}
          {shouldShowMenuItem('Suppliers') && (
            <NavLink to="/supplier" className="menu-item" onClick={onMenuItemClick}>
              <FaTruck className="menu-icon" />
              <span>Suppliers</span>
            </NavLink>
          )}

          {/* Creditors */}
          {shouldShowMenuItem('Creditors') && (
            <NavLink to="/creditors" className="menu-item" onClick={onMenuItemClick}>
              <FaUserCheck className="menu-icon" />
              <span>Creditors</span>
            </NavLink>
          )}

          {/* Task Manager */}
          {shouldShowMenuItem('Task_manager') && (
            <NavLink to="/task-manager" className="menu-item" onClick={onMenuItemClick}>
              <FaClipboardCheck className="menu-icon" />
              <span>Task Manager</span>
            </NavLink>
          )}

          {/* Account Balances */}
          {shouldShowMenuItem('Accounting') && (
            <NavLink to="/accounts-balance" className="menu-item" onClick={onMenuItemClick}>
              <FaBalanceScale className="menu-icon" />
              <span>Account Balances</span>
            </NavLink>
          )}

          {/* Compare Statement */}
          {shouldShowMenuItem('Accounting') && (
            <NavLink to="/transaction-analyse" className="menu-item" onClick={onMenuItemClick}>
              <FaChartPie className="menu-icon" />
              <span>Compare Statement</span>
            </NavLink>
          )}

          {/* Settings */}
          {shouldShowMenuItem('Settings') && (
            <NavLink to="/settings" className="menu-item" onClick={onMenuItemClick}>
              <FaCog className="menu-icon" />
              <span>Settings</span>
            </NavLink>
          )}
        </ul>
      </div>

      {/* Accounting Group */}
      {shouldShowMenuItem('Accounting') && (
        <div className="accounting-menu">
          <h4 className="section-label">ACCOUNTING</h4>
          <div className="menu-group">
            <NavLink to="/accounting" className="menu-item" onClick={onMenuItemClick}>
              <FaBook className="menu-icon" />
              <span>Accounting</span>
            </NavLink>
          </div>
        </div>
      )}
    </div>
  );
}

// Export the refresh and update functions for use in other components
export { Navbar };
export default Navbar;