import React, { useState } from "react";
import Navbar from "./Navbar";
import UserDisplay from "./UserDisplay";
import { FaBars } from "react-icons/fa"; // hamburger icon

const Layout = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Function that closes the sidebar ONLY on mobile
  const handleMenuClick = () => {
    if (window.innerWidth <= 768 ) {  // ✅ mobile check
      setIsCollapsed(true);
    }
  };

  return (
    <div className="Page-continer">
      {/* Sidebar */}
      <div className={`navigation ${isCollapsed ? "collapsed" : ""}`}>
        <Navbar onMenuClick={handleMenuClick} />
      </div>

      {/* Main content */}
      <div className="body-area">
        <div className="body-header">
          {/* Hamburger icon */}
          <button
            className="hamburger"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            <FaBars />
          </button>
          <UserDisplay />
        </div>

        <div className="page-area">{children}</div>
      </div>
    </div>
  );
};

export default Layout;
