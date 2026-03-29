import React, { useState } from 'react';
import Header from '../components/Header';
import { Search, Eye, MoreVertical, Clock, CheckCircle, Truck, AlertCircle, Loader, X, ShoppingBag, MapPin, CreditCard, Package } from 'lucide-react';
import { useGetOrdersQuery, useGetUserQuery, useUpdateOrderMutation, useGetOrderByIdQuery } from '../api/categoriesApi';

/* ── Status maps ─────────────────────────────────────────── */
const statusBadge = {
  Delivered:       'badge badge-green',
  delivered:       'badge badge-green',
  Pending:         'badge badge-orange',
  pending:         'badge badge-orange',
  Processing:      'badge badge-blue',
  processing:      'badge badge-blue',
  Shipped:         'badge badge-purple',
  shipped:         'badge badge-purple',
  'Ready to Pick': 'badge badge-blue',
};

const statusIcon = {
  Delivered:       <CheckCircle size={13} />,
  delivered:       <CheckCircle size={13} />,
  Pending:         <Clock size={13} />,
  pending:         <Clock size={13} />,
  Processing:      <AlertCircle size={13} />,
  processing:      <AlertCircle size={13} />,
  Shipped:         <Truck size={13} />,
  shipped:         <Truck size={13} />,
  'Ready to Pick': <AlertCircle size={13} />,
};

/* ── Receipt Modal ───────────────────────────────────────── */
const ReceiptModal = ({ order: initialOrder, onClose, onUpdateStatus }) => {
  const { data: orderDetailsData, isLoading: detailsLoading } = useGetOrderByIdQuery(initialOrder.id);
  
  // Merge initial order with detailed order data
  const detailedOrder = orderDetailsData?.data || orderDetailsData?.order || orderDetailsData || {};
  const order = { ...initialOrder, ...detailedOrder };

  const [updating, setUpdating] = useState(false);
  const handleStatusChange = async (e) => {
    try {
      setUpdating(true);
      await onUpdateStatus(order.id, e.target.value);
    } catch (err) {
      console.error('Failed to update status', err);
    } finally {
      setUpdating(false);
    }
  };
  const customerName = order?.user?.name || order?.customer_name || `User #${order?.user_id}` || 'Guest';
  const items        = order?.items || order?.order_items || [];
  const subtotal     = items.reduce((s, i) => s + Number(i.price || i.unit_price || 0) * Number(i.quantity || 1), 0);
  const delivery     = Number(order?.delivery_fee || 0);
  const total        = Number(order?.total_amount || order?.total || subtotal + delivery);

  const payLabel = {
    cod:         'Cash on Delivery',
    card:        'Card',
    credit_card: 'Credit Card',
    paypal:      'PayPal',
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem',
        }}
      >
        {/* Modal card – stop click propagation so clicking inside doesn't close */}
        <div
          onClick={e => e.stopPropagation()}
          style={{
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            border: '1px solid rgba(99,102,241,0.25)',
            borderRadius: 16,
            width: '100%', maxWidth: 520,
            maxHeight: '90vh', overflowY: 'auto',
            boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
            position: 'relative',
          }}
        >
          {/* Header bar */}
          <div style={{
            background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
            padding: '1.25rem 1.5rem',
            borderRadius: '16px 16px 0 0',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <ShoppingBag size={20} color="#fff" />
              <span style={{ color: '#fff', fontWeight: 700, fontSize: '1rem' }}>
                Order Receipt
              </span>
              <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>
                #ORD-{order?.id}
              </span>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8,
                color: '#fff', cursor: 'pointer', padding: '0.35rem',
                display: 'flex', alignItems: 'center', transition: 'background 0.2s',
              }}
              onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
              onMouseOut={e  => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div style={{ padding: '1.5rem' }}>
            {order && (
              <>
                {/* Customer + meta row */}
                <div style={{
                  display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem',
                  marginBottom: '1.25rem',
                }}>
                  <InfoCard icon={<MapPin size={15} />} label="Customer" value={customerName} />
                  <InfoCard icon={<CreditCard size={15} />} label="Payment" value={payLabel[order.payment_method] || order.payment_method || '—'} />
                  <InfoCard icon={<Clock size={15} />} label="Date" value={order.created_at ? new Date(order.created_at).toLocaleString() : '—'} />
                  <InfoCard
                    icon={statusIcon[order.status]}
                    label="Status"
                    value={
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <select 
                          value={(order?.status || 'pending').toLowerCase()} 
                          onChange={handleStatusChange}
                          disabled={updating}
                          style={{
                            background: 'rgba(0,0,0,0.2)', 
                            color: '#fff', 
                            border: '1px solid rgba(255,255,255,0.2)', 
                            borderRadius: 4, 
                            padding: '2px 4px',
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            outline: 'none',
                          }}
                        >
                          <option value="pending" style={{ color: '#000' }}>Pending</option>
                          <option value="processing" style={{ color: '#000' }}>Processing</option>
                          <option value="shipped" style={{ color: '#000' }}>Shipped</option>
                          <option value="delivered" style={{ color: '#000' }}>Delivered</option>
                        </select>
                        {updating && <Loader size={12} className="animate-spin" />}
                      </div>
                    }
                  />
                </div>

                {/* Divider */}
                <div style={{ borderTop: '1px dashed rgba(99,102,241,0.25)', margin: '1rem 0' }} />

                {/* Items table */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <Package size={15} color="#6366f1" />
                  <span style={{ fontWeight: 600, color: '#e2e8f0', fontSize: '0.9rem' }}>Items</span>
                  {detailsLoading && <Loader size={14} className="animate-spin" style={{ marginLeft: 'auto', color: '#6366f1' }} />}
                </div>

                {items.length === 0 ? (
                  <div style={{
                    textAlign: 'center', padding: '1.5rem',
                    color: 'var(--text-muted)', fontSize: '0.85rem',
                    background: 'rgba(255,255,255,0.03)', borderRadius: 8,
                  }}>
                    No item details available for this order.
                  </div>
                ) : (
                  <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
                    {/* Items header */}
                    <div style={{
                      display: 'grid', gridTemplateColumns: '1fr auto auto',
                      gap: '0.75rem', padding: '0.6rem 0.9rem',
                      background: 'rgba(99,102,241,0.12)',
                      fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600,
                      textTransform: 'uppercase', letterSpacing: '0.05em',
                    }}>
                      <span>Item</span>
                      <span style={{ textAlign: 'center' }}>Qty</span>
                      <span style={{ textAlign: 'right' }}>Price</span>
                    </div>
                    {items.map((item, idx) => (
                      <div
                        key={item.id || idx}
                        style={{
                          display: 'grid', gridTemplateColumns: '1fr auto auto',
                          gap: '0.75rem', padding: '0.65rem 0.9rem',
                          borderTop: idx > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                          background: idx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
                        }}
                      >
                        <span style={{ color: '#e2e8f0', fontSize: '0.88rem' }}>
                          {item.product?.name || item.name || item.product_name || `Item #${item.product_id || item.id}`}
                        </span>
                        <span style={{ color: '#94a3b8', fontSize: '0.88rem', textAlign: 'center' }}>
                          ×{item.quantity || 1}
                        </span>
                        <span style={{ color: '#fff', fontWeight: 600, fontSize: '0.88rem', textAlign: 'right' }}>
                          ${Number((item.price || item.unit_price || 0) * (item.quantity || 1)).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Divider */}
                <div style={{ borderTop: '1px dashed rgba(99,102,241,0.25)', margin: '1.25rem 0 1rem' }} />

                {/* Totals */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {items.length > 0 && (
                    <TotalRow label="Subtotal" value={`$${subtotal.toFixed(2)}`} />
                  )}
                  <TotalRow label="Delivery Fee" value={delivery === 0 ? 'Free' : `$${delivery.toFixed(2)}`} />
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    marginTop: '0.25rem', padding: '0.75rem 1rem',
                    background: 'linear-gradient(90deg,rgba(99,102,241,0.15),rgba(139,92,246,0.15))',
                    borderRadius: 10, border: '1px solid rgba(99,102,241,0.2)',
                  }}>
                    <span style={{ fontWeight: 700, color: '#e2e8f0', fontSize: '1rem' }}>Total</span>
                    <span style={{ fontWeight: 800, color: '#a5b4fc', fontSize: '1.15rem' }}>${total.toFixed(2)}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

const InfoCard = ({ icon, label, value }) => (
  <div style={{
    background: 'rgba(255,255,255,0.04)', borderRadius: 10,
    padding: '0.65rem 0.85rem', border: '1px solid rgba(255,255,255,0.06)',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#6366f1', marginBottom: '0.25rem' }}>
      {icon}
      <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', fontWeight: 600 }}>{label}</span>
    </div>
    <div style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '0.88rem' }}>{value}</div>
  </div>
);

const TotalRow = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.2rem 0.25rem', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
    <span>{label}</span>
    <span style={{ color: '#cbd5e1' }}>{value}</span>
  </div>
);

/* ── Main Orders page ────────────────────────────────────── */
const Orders = () => {
  const { data: ordersData, isLoading, isError, error } = useGetOrdersQuery();
  const { data: usersData } = useGetUserQuery();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updateOrder] = useUpdateOrderMutation();

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await updateOrder({ id, status: newStatus }).unwrap();
      setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  const usersList = Array.isArray(usersData) ? usersData : (usersData?.data_user_list?.data || usersData?.data || []);
  const userMap = (usersList || []).reduce((acc, user) => {
    acc[user.id] = user.name;
    return acc;
  }, {});

  const orders = ordersData?.data ||
    ordersData?.data_order_list?.data ||
    (Array.isArray(ordersData) ? ordersData : (ordersData?.orders || []));

  const getCustomerName = (o) => {
    if (o.user?.name) return o.user.name;
    if (o.customer_name) return o.customer_name;
    if (o.user_id && userMap[o.user_id]) return userMap[o.user_id];
    return o.user_id ? `User #${o.user_id}` : 'Guest';
  };

  return (
    <div className="animate-fade-in">
      <Header title="Order Management" />

      {/* Search */}
      <div className="page-toolbar">
        <div className="toolbar-left">
          <div className="glass search-bar" style={{ marginBottom: 0 }}>
            <Search size={17} color="var(--text-muted)" style={{ flexShrink: 0 }} />
            <input type="text" placeholder="Search orders by ID or customer…" />
          </div>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px', color: 'var(--text-muted)' }}>
          <Loader size={24} className="animate-spin" style={{ marginRight: '0.75rem' }} />
          Loading orders...
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="glass" style={{ padding: '1.5rem', color: '#f87171', borderLeft: '4px solid #f87171', marginBottom: '1.5rem' }}>
          <h4 style={{ margin: '0 0 0.5rem 0' }}>Failed to load orders</h4>
          <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.9 }}>
            {error?.data?.message || error?.message || (error?.status ? `Error ${error.status}` : 'Unknown network error')}
          </p>
        </div>
      )}

      {/* Table */}
      {!isLoading && !isError && (
        <div className="glass" style={{ overflow: 'hidden' }}>
          <div className="table-wrapper">
            <table className="responsive-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th className="col-sm">Date</th>
                  <th className="col-md">Items</th>
                  <th>Total</th>
                  <th className="col-sm">Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.length > 0 ? (
                  orders.map(o => (
                    <tr key={o.id}>
                      <td style={{ fontFamily: 'monospace', color: 'var(--primary)', fontWeight: 600 }}>#ORD-{o.id}</td>
                      <td style={{ fontWeight: 600, color: '#fff' }}>{getCustomerName(o)}</td>
                      <td className="col-sm" style={{ color: 'var(--text-muted)' }}>
                        {o.created_at ? new Date(o.created_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="col-md" style={{ color: '#cbd5e1', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={
                        (o.order_items || o.items || []).length > 0
                          ? (o.order_items || o.items).map(i => i.product?.name || i.name || i.product_name || `Item #${i.product_id || i.id}`).join(', ')
                          : `${o.order_items_count ?? 0} items`
                      }>
                        {(o.order_items || o.items || []).length > 0 
                          ? (o.order_items || o.items).map(i => i.product?.name || i.name || i.product_name || `Item #${i.product_id || i.id}`).join(', ') 
                          : `${o.order_items_count ?? 0} items`}
                      </td>
                      <td style={{ color: '#fff', fontWeight: 700 }}>
                        ${Number(o.total_amount || o.total || 0).toFixed(2)}
                      </td>
                      <td className="col-sm">
                        <span className={statusBadge[o.status] || 'badge'}>
                          {statusIcon[o.status]}
                          {o.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn-icon"
                          title="View Receipt"
                          style={{ display: 'inline-flex', marginRight: '0.25rem' }}
                          onClick={() => setSelectedOrder(o)}
                        >
                          <Eye size={16} />
                        </button>
                        <button className="btn-icon" style={{ display: 'inline-flex' }}>
                          <MoreVertical size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                      No orders found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Receipt popup */}
      {selectedOrder && (
        <ReceiptModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdateStatus={handleUpdateStatus}
        />
      )}
    </div>
  );
};

export default Orders;
