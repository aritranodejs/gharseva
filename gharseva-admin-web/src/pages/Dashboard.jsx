import React, { useEffect, useState } from 'react';
import { Users, ShoppingBag, CheckCircle, Clock, TrendingUp, DollarSign, Download, FileText, BarChart2 } from 'lucide-react';
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import api from '../services/api';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalBookings: 0,
    completedBookings: 0,
    activeWorkers: 0,
    usersCount: 0,
    totalRevenue: 0,
    platformProfit: 0,
    workerPayouts: 0,
    chartData: []
  });
  const [settings, setSettings] = useState({
    platformFeeType: 'fixed',
    platformFeeValue: 29,
    acceptCOD: true,
    acceptUPI: true,
    acceptCard: true,
    acceptBank: true
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [timeRange, setTimeRange] = useState('week');
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, settingsRes] = await Promise.all([
        api.get(`admin/stats?range=${timeRange}`),
        api.get('admin/settings')
      ]);
      setStats(statsRes.data.data);
      setSettings(settingsRes.data.data);
      setRecentBookings(statsRes.data.data.recentBookings || []);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSettings = async () => {
    setSavingSettings(true);
    try {
      await api.patch('admin/settings', settings);
      alert('Platform configuration synchronized!');
    } catch (err) {
      alert('Failed to update settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const getTimeLabel = (id) => {
    if (timeRange === 'day') return `${id}:00`;
    if (timeRange === 'year') {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return months[id - 1];
    }
    return id.split('-').slice(1).join('/');
  };

  const chartData = stats.chartData?.map(d => ({
    name: getTimeLabel(d._id),
    revenue: d.revenue,
    volume: d.volume
  })) || [];

  const handleExportExcel = () => {
    try {
      const data = stats.recentBookings?.map(b => ({
        'Booking ID': b.bookingId || b._id,
        'Service': b.serviceId?.name || 'Home Service',
        'Customer': b.userId?.name || 'Anonymous',
        'Schedule': new Date(b.schedule).toLocaleString(),
        'Total Amount': b.totalAmount,
        'Admin Earnings': (b.platformFee || 0) + (b.commissionFee || 0),
        'Status': b.status
      })) || [];

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "DashboardSummary");
      XLSX.writeFile(wb, `GharSeva_Business_Report_${timeRange.toUpperCase()}_${Date.now()}.xlsx`);
    } catch (err) {
      alert('Report generation failed');
    }
  };

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <h1>Platform Intelligence</h1>
          <p>Analyzing {timeRange}ly growth and financial velocity.</p>
        </div>
        <div className="header-actions">
           <div className="time-pivot-bar mr-4">
              {['day', 'week', 'month', 'year'].map(r => (
                <button 
                  key={r} 
                  className={`pivot-btn ${timeRange === r ? 'active' : ''}`}
                  onClick={() => setTimeRange(r)}
                >
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </button>
              ))}
           </div>
          <button className="btn-primary" onClick={handleExportExcel}>
            <Download size={16} className="mr-1" /> Business Report
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card accent-blue">
          <div className="stat-icon-wrapper">
            <ShoppingBag size={24} color="#3B82F6" />
          </div>
          <div className="stat-info">
            <h4>{timeRange.toUpperCase()} Volume</h4>
            <h2>{stats.chartData?.reduce((acc, d) => acc + d.volume, 0) || 0}</h2>
            <p className="stat-sub">{stats.totalBookings} Total registrations</p>
          </div>
        </div>

        <div className="stat-card accent-green">
          <div className="stat-icon-wrapper">
            <TrendingUp size={24} color="#10B981" />
          </div>
          <div className="stat-info">
            <h4>Platform Net (Profit)</h4>
            <h2 className="text-emerald-600">₹{(stats.platformProfit || 0).toLocaleString()}</h2>
            <p className="stat-sub">From {timeRange} completions</p>
          </div>
        </div>

        <div className="stat-card accent-purple">
          <div className="stat-icon-wrapper">
            <DollarSign size={24} color="#8B5CF6" />
          </div>
          <div className="stat-info">
            <h4>Fleet Net (Payouts)</h4>
            <h2 className="text-indigo-600">₹{(stats.workerPayouts || 0).toLocaleString()}</h2>
            <p className="stat-sub">Paid to professionals</p>
          </div>
        </div>

        <div className="stat-card accent-orange">
          <div className="stat-icon-wrapper">
            <CheckCircle size={24} color="#F59E0B" />
          </div>
          <div className="stat-info">
            <h4>Active Fleet</h4>
            <h2>{stats.activeWorkers}</h2>
            <p className="stat-sub">{stats.usersCount} Trusted users</p>
          </div>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="analytics-section">
        <div className="content-card chart-card">
          <div className="card-header">
            <div className="title-box">
              <BarChart2 size={20} color="#6366F1" />
              <h3>{timeRange.toUpperCase()}ly Financial Velocity</h3>
            </div>
          </div>
          <div className="chart-container">
            {loading ? (
              <div className="loading-chart h-[300px] flex items-center justify-center text-xs text-slate-300 font-black tracking-widest animate-pulse">AGREGRATING TEMPORAL DATA...</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', padding: '12px' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#6366F1" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="dashboard-main">
        <div className="content-card recent-bookings">
          <div className="card-header">
            <h3>Recent Platform Activity</h3>
            <button className="btn-text">Live Monitoring</button>
          </div>
          <div className="booking-list">
            {loading ? (
              <div className="loading-state">Synchronizing with node...</div>
            ) : (
              recentBookings.map((booking) => (
                <div key={booking._id} className="booking-item">
                  <div className="booking-service">
                    <div className="svc-icon-small">
                      <Clock size={16} color="#6366F1" />
                    </div>
                    <div>
                      <p className="svc-name">{booking.bookingId || `#${booking._id.slice(-6)}`} - {booking.serviceId?.name || 'Home Service'}</p>
                      <p className="svc-time">{new Date(booking.schedule).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                  <div className="booking-status">
                    <span className={`status-pill ${booking.status}`}>{booking.status.replace('_', ' ')}</span>
                  </div>
                  <div className="booking-amount">
                    <p className="amt">₹{booking.totalAmount}</p>
                    <p className="method">Admin: ₹{(booking.platformFee || 0) + (booking.commissionFee || 0)}</p>
                  </div>
                </div>
              ))
            )}
            {!loading && recentBookings.length === 0 && (
              <div className="empty-bookings">No live bookings yet.</div>
            )}
          </div>
        </div>

        <div className="content-card config-panel">
          <div className="card-header">
            <div className="title-box">
              <DollarSign size={20} color="#10B981" />
              <h3>Fee Management</h3>
            </div>
          </div>

          <div className="config-form">
            <div className="form-group">
              <label>Billing Calculation Model</label>
              <div className="fee-toggle">
                <button
                  className={settings.platformFeeType === 'fixed' ? 'active' : ''}
                  onClick={() => setSettings({ ...settings, platformFeeType: 'fixed' })}
                >
                  Fixed
                </button>
                <button
                  className={settings.platformFeeType === 'percentage' ? 'active' : ''}
                  onClick={() => setSettings({ ...settings, platformFeeType: 'percentage' })}
                >
                  Variable %
                </button>
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '24px' }}>
              <label>Global Payment Orchestration</label>
              <div className="payment-grid">
                {[
                  { id: 'acceptCOD', label: 'Cash on Delivery', icon: '💵' },
                  { id: 'acceptUPI', label: 'UPI / QR Payments', icon: '📱' },
                  { id: 'acceptCard', label: 'Credit / Debit Cards', icon: '💳' },
                  { id: 'acceptBank', label: 'Direct Bank Transfer', icon: '🏦' }
                ].map(method => (
                  <button
                    key={method.id}
                    className={`payment-toggle-card ${settings[method.id] ? 'active' : ''}`}
                    onClick={() => setSettings({ ...settings, [method.id]: !settings[method.id] })}
                  >
                    <span className="method-icon">{method.icon}</span>
                    <span className="method-label">{method.label}</span>
                    <div className="toggle-switch">
                      <div className="switch-knob"></div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <button className="save-settings-btn" onClick={handleUpdateSettings} disabled={savingSettings}>
              {savingSettings ? 'Synchronizing Node...' : 'Save Global Configuration'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
