import React from 'react';
import { Bell, Search, User } from 'lucide-react';

const Header = ({ title }) => (
  <header className="glass page-header">
    <h2 className="page-header-title">{title}</h2>

    <div className="page-header-actions">
      {/* Search — desktop only via CSS */}
      <div className="header-search glass">
        <Search size={16} color="var(--text-muted)" />
        <input type="text" placeholder="Search everything…" />
      </div>

      {/* Notifications */}
      <button className="header-notif-btn" aria-label="Notifications">
        <Bell size={20} />
        <span className="notif-dot" />
      </button>

      {/* User info */}
      <div className="header-user">
        <div className="header-user-text">
          <span className="header-user-name">Admin User</span>
          <span className="header-user-role">Super Admin</span>
        </div>
        <div className="header-avatar">
          <User size={20} />
        </div>
      </div>
    </div>
  </header>
);

export default Header;
