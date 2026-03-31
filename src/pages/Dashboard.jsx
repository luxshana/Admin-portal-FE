import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { useGetDashboardStatsQuery } from '../api/categoriesApi';
import {
  TrendingUp, Users, ShoppingBag, DollarSign,
  ArrowUpRight, ArrowDownRight, Loader2
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area
} from 'recharts';

const iconColors = {
  orange: { bg: 'rgba(249,115,22,0.12)', color: '#f97316' },
  blue:   { bg: 'rgba(56,189,248,0.12)',  color: '#38bdf8' },
  green:  { bg: 'rgba(74,222,128,0.12)',  color: '#4ade80' },
  purple: { bg: 'rgba(167,139,250,0.12)', color: '#a78bfa' },
};

const StatCard = ({ title, value, icon: Icon, trend, trendValue, color }) => {
  const { bg, color: clr } = iconColors[color] || iconColors.orange;
  return (
    <div className="glass stat-card glass-hover animate-fade-in">
      <div className="stat-card-top">
        <div className="stat-icon" style={{ background: bg }}>
          <Icon size={22} color={clr} />
        </div>
        <div className={`stat-trend ${trend}`}>
          {trend === 'up'
            ? <ArrowUpRight size={15} />
            : <ArrowDownRight size={15} />}
          {trendValue}
        </div>
      </div>
      <p className="stat-label">{title}</p>
      <p className="stat-value">{value}</p>
    </div>
  );
};

const tooltipStyle = {
  contentStyle: {
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '8px',
    color: '#f8fafc',
    fontSize: '12px',
  },
};

const Dashboard = () => {
  const { data, isLoading, isError } = useGetDashboardStatsQuery();
  const stats = data?.data || data;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-orange-500" size={40} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="glass" style={{ padding: '1.5rem', color: '#f87171', borderLeft: '4px solid #f87171', margin: '2rem' }}>
        <h4 style={{ margin: '0 0 0.5rem 0' }}>Failed to load dashboard statistics</h4>
        <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.9 }}>
          Please try again later.
        </p>
      </div>
    );
  }

  const { 
    totalRevenue = 0, 
    totalOrders = 0, 
    activeUsers = 0, 
    revenueGrowth = 0, 
    ordersGrowth = 0, 
    usersGrowth = 0, 
    chartData = [] 
  } = stats || {};

  return (
    <div className="animate-fade-in">
      <Header title="Dashboard Overview" />

      {/* KPI cards */}
      <div className="stat-grid">
        <StatCard 
          title="Total Revenue" 
          value={`$${totalRevenue?.toLocaleString()}`} 
          icon={DollarSign} 
          trend={revenueGrowth >= 0 ? 'up' : 'down'}   
          trendValue={`${revenueGrowth >= 0 ? '+' : ''}${revenueGrowth}%`} 
          color="orange" 
        />
        <StatCard 
          title="Total Orders"  
          value={totalOrders?.toLocaleString()}   
          icon={ShoppingBag} 
          trend={ordersGrowth >= 0 ? 'up' : 'down'}   
          trendValue={`${ordersGrowth >= 0 ? '+' : ''}${ordersGrowth}%`} 
          color="blue"   
        />
        <StatCard 
          title="Active Users"  
          value={activeUsers?.toLocaleString()}     
          icon={Users}       
          trend={usersGrowth >= 0 ? 'up' : 'down'}   
          trendValue={`${usersGrowth >= 0 ? '+' : ''}${usersGrowth}%`} 
          color="green"  
        />
        <StatCard 
          title="Growth (Revenue)"        
          value={`${revenueGrowth}%`}  
          icon={TrendingUp}  
          trend={revenueGrowth >= 0 ? 'up' : 'down'}   
          trendValue={`${revenueGrowth >= 0 ? '+' : ''}${revenueGrowth}%`}  
          color="purple" 
        />
      </div>

      {/* Charts */}
      <div className="chart-grid">
        <div className="glass chart-card">
          <h3 className="section-title">Revenue Analysis</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#f97316" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} width={38} />
                <Tooltip {...tooltipStyle} itemStyle={{ color: '#f97316' }} />
                <Area type="monotone" dataKey="sales" stroke="#f97316" fill="url(#colorSales)" strokeWidth={2.5} fillOpacity={1} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass chart-card">
          <h3 className="section-title">Order Volume</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} width={38} />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.04)' }} {...tooltipStyle} />
                <Bar dataKey="orders" fill="#38bdf8" radius={[5, 5, 0, 0]} barSize={26} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
