import React from 'react';
import Header from '../components/Header';
import { Search, Mail, Phone, Calendar, UserCheck } from 'lucide-react';
import { useGetUserQuery } from '../api/categoriesApi';

const Customers = () => {
  const { data: usersData = [], isLoading, isError, error } = useGetUserQuery();
  
  // Debug: log the response structure
  console.log('User API Response:', usersData);
  
  // Handle different response structures
  const customers = Array.isArray(usersData) ? usersData : (usersData?.data_user_list?.data || usersData?.data || []);

  if (isLoading) return <div className="animate-fade-in"><Header title="Customer Database" /><p>Loading...</p></div>;
  if (isError) return <div className="animate-fade-in"><Header title="Customer Database" /><p>Error: {error?.message}</p></div>;
  
  // Check if customers array is empty
  if (!customers || customers.length === 0) {
    return <div className="animate-fade-in"><Header title="Customer Database" /><p>No customers found</p></div>;
  }

  return (
  <div className="animate-fade-in">
    <Header title="Customer Database" />

    {/* Search */}
    <div className="glass search-bar" style={{ marginBottom: '1.5rem' }}>
      <Search size={17} color="var(--text-muted)" style={{ flexShrink: 0 }} />
      <input type="text" placeholder="Search customers…" />
    </div>

    {/* Card grid */}
    <div className="customer-grid">
      {customers.map(c => (
        <div key={c.id} className="glass customer-card glass-hover">
          {/* Header */}
          <div className="customer-card-header">
            <div className="customer-brand">
              <div className="customer-avatar">{c.name.charAt(0)}</div>
              <div>
                <div className="customer-name">{c.name}</div>
                <div className="customer-id">ID: #CUST-{c.id}00</div>
              </div>
            </div>
            <span className="badge badge-green">
              <UserCheck size={11} /> Active
            </span>
          </div>

          {/* Info rows */}
          <div className="customer-info">
            <div className="customer-info-row">
              <Mail size={14} color="#64748b" style={{ flexShrink: 0 }} />
              <span>{c.email || 'N/A'}</span>
            </div>
            <div className="customer-info-row">
              <Phone size={14} color="#64748b" style={{ flexShrink: 0 }} />
              <span>{c.phone || 'N/A'}</span>
            </div>
            <div className="customer-info-row">
              <Calendar size={14} color="#64748b" style={{ flexShrink: 0 }} />
              <span>Joined {c.joined || (c.created_at ? new Date(c.created_at).toLocaleDateString() : 'N/A')}</span>
            </div>
          </div>

          {/* Stats */}
          <div className="customer-stats">
            <div>
              <div className="customer-stat-label">Total Orders</div>
              <div className="customer-stat-value">{c.orders || 0}</div>
            </div>
            <div>
              <div className="customer-stat-label">Total Spent</div>
              <div className="customer-stat-value accent">${Number(c.spent || 0).toFixed(2)}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
  );
};

export default Customers;
