import React from 'react';
import Header from '../components/Header';
import {
  TrendingUp, Users, ShoppingBag, DollarSign,
  ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area
} from 'recharts';

const chartData = [
  { name: 'Mon', sales: 4000, orders: 240 },
  { name: 'Tue', sales: 3000, orders: 198 },
  { name: 'Wed', sales: 2000, orders: 980 },
  { name: 'Thu', sales: 2780, orders: 390 },
  { name: 'Fri', sales: 1890, orders: 480 },
  { name: 'Sat', sales: 2390, orders: 380 },
  { name: 'Sun', sales: 3490, orders: 430 },
];

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

const Dashboard = () => (
  <div className="animate-fade-in">
    <Header title="Dashboard Overview" />

    {/* KPI cards */}
    <div className="stat-grid">
      <StatCard title="Total Revenue" value="$24,500" icon={DollarSign} trend="up"   trendValue="+12.5%" color="orange" />
      <StatCard title="Total Orders"  value="1,240"   icon={ShoppingBag} trend="up"   trendValue="+8.2%"  color="blue"   />
      <StatCard title="Active Users"  value="850"     icon={Users}       trend="down" trendValue="-3.1%"  color="green"  />
      <StatCard title="Growth"        value="+15.2%"  icon={TrendingUp}  trend="up"   trendValue="+4.5%"  color="purple" />
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

export default Dashboard;
