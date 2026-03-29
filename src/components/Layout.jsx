import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { Menu } from 'lucide-react';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggle = () => setSidebarOpen(v => !v);

  return (
    <div className="layout-root">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggle} />

      {/* Dark overlay on mobile when sidebar is open */}
      <div
        className={`sidebar-overlay${sidebarOpen ? ' overlay-visible' : ''}`}
        onClick={toggle}
      />

      {/* Main content */}
      <main className="layout-main">
        {/* Mobile top bar */}
        <div className="mobile-topbar">
          <span className="mobile-topbar-title">FoodAdmin</span>
          <button className="mobile-menu-btn" onClick={toggle} aria-label="Open menu">
            <Menu size={22} />
          </button>
        </div>

        {children}
      </main>
    </div>
  );
};

export default Layout;
