import React, { useState, useEffect } from "react";
import Navbar from "./Navbar";
import UserDisplay from "./UserDisplay";
import { FaBars, FaTimes } from "react-icons/fa"; // ✅ added X icon

const Layout = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Detect screen size on mount and resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      setIsCollapsed(mobile); // collapsed by default on mobile
    };

    handleResize(); // run once on mount
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Function that closes the sidebar ONLY on mobile
  const handleMenuClick = () => {
    if (isMobile) {
      setIsCollapsed(true);
    }
  };

  return (
    <div className="Page-continer">
      {/* Sidebar */}
      <div className={`navigation ${isCollapsed ? "collapsed" : ""}`}>
        {/* Show X button only on mobile when open */}
        {isMobile && !isCollapsed && (
          <button
            className="close-btn"
            onClick={() => setIsCollapsed(true)}
          >
            <FaTimes />
          </button>
        )}
        <Navbar onMenuItemClick={handleMenuClick} />
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
