import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingBag,
  UtensilsCrossed,
  Users,
  Settings,
  LogOut,
  X,
  LayoutGrid,
} from 'lucide-react';

const menuItems = [
  { icon: <LayoutDashboard size={20} />, label: 'Dashboard',  path: '/' },
  { icon: <ShoppingBag size={20} />,    label: 'Orders',     path: '/orders' },
   { icon: <LayoutGrid size={20} />,     label: 'Categories', path: '/categories' },
  { icon: <UtensilsCrossed size={20} />, label: 'Products',   path: '/products' },
  { icon: <Users size={20} />,          label: 'Customers',  path: '/customers' },
  { icon: <Settings size={20} />,       label: 'Settings',   path: '/settings' },
];

const Sidebar = ({ isOpen, toggleSidebar }) => (
  <aside className={`sidebar${isOpen ? ' sidebar-open' : ''}`}>
    {/* Brand */}
    <div className="sidebar-brand">
      <div className="sidebar-brand-inner">
        <div className="sidebar-logo">
          <UtensilsCrossed color="#fff" size={22} />
        </div>
        <span className="sidebar-title">FoodAdmin</span>
      </div>
      {/* Close button — mobile only, hidden via CSS on desktop */}
      <button className="sidebar-close-btn" onClick={toggleSidebar} aria-label="Close sidebar">
        <X size={20} />
      </button>
    </div>

    {/* Navigation */}
    <nav className="sidebar-nav">
      {menuItems.map(item => (
        <NavLink
          key={item.path}
          to={item.path}
          end={item.path === '/'}
          className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
          onClick={() => {
            // Close sidebar on mobile after navigation
            if (window.innerWidth < 768) toggleSidebar();
          }}
        >
          {item.icon}
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>

    {/* Logout */}
    <div className="sidebar-logout">
      <button className="sidebar-link" style={{ color: 'var(--text-muted)' }}
        onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
      >
        <LogOut size={20} />
        <span>Logout</span>
      </button>
    </div>
  </aside>
);

export default Sidebar;
