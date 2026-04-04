import React, { useEffect, useState } from 'react';
import { Users, ShoppingBag, CheckCircle, Clock, TrendingUp, DollarSign, Download, FileText, BarChart2 } from 'lucide-react';
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, Legend
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
  const [specificYear, setSpecificYear] = useState('all');
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange, specificYear]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, settingsRes] = await Promise.all([
        api.get(`admin/stats?range=${timeRange}&specificYear=${specificYear}`),
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
    if (!id) return 'Unknown';
    if (timeRange === 'day') return `${id}:00`;
    if (timeRange === 'year') {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return months[Number(id) - 1] || id;
    }
    return String(id).includes('-') ? String(id).split('-').slice(1).join('/') : String(id);
  };

  const chartData = stats.chartData?.map(d => ({
    name: getTimeLabel(d._id),
    revenue: d.revenue,
    volume: d.volume
  })) || [];

  const pieData = stats.serviceDistribution?.map(d => ({
    name: d.name,
    value: d.revenue || (d.count ? 0.01 : 0), // Fallback to tiny value to show slice if revenue is 0 but count exists
    count: d.count
  })).filter(d => d.value > 0 || d.count > 0) || [];

  const COLORS = ['#FBBF24', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#06B6D4'];

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
          <div className="flex items-center gap-4 mb-2">
             <h1>Platform Intelligence</h1>
             <div className="luxury-clock-container">
                <div className="luxury-clock-glass">
                   <Clock size={14} className="luxury-clock-icon" />
                   <span className="luxury-clock-time">
                      {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                   </span>
                   <div className="luxury-clock-glow"></div>
                </div>
             </div>
          </div>
          <p className="subtitle-premium">Analyzing {timeRange}ly growth and financial velocity.</p>
        </div>
        <div className="header-actions">
           {timeRange === 'year' && (
             <select 
               className="bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl px-4 py-2 mr-2 outline-none shadow-sm focus:border-indigo-500 transition-colors"
               value={specificYear}
               onChange={(e) => setSpecificYear(e.target.value)}
             >
               <option value="all">All Years</option>
               {Array.from({ length: Math.max(1, new Date().getFullYear() - 2024) }, (_, i) => 2025 + i).map(y => (
                 <option key={y} value={y}>{y}</option>
               ))}
             </select>
           )}
           <div className="time-pivot-bar mr-4">
              {['day', 'week', 'month', 'year'].map(r => (
                <button 
                  key={r} 
                  className={`pivot-btn ${timeRange === r ? 'active' : ''}`}
                  onClick={() => { setTimeRange(r); if (r !== 'year') setSpecificYear('all'); }}
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
      <div className="analytics-section flex gap-6 mt-6 mb-8">
        <div className="content-card chart-card flex-[2]">
          <div className="card-header border-b border-slate-50 pb-4 mb-4 flex items-center justify-between">
            <div className="title-box">
              <BarChart2 size={20} className="text-indigo-600" />
              <h3>Financial Velocity</h3>
            </div>
            <div className="date-indicator">Real-time Stream</div>
          </div>
          <div className="chart-container">
            {loading ? (
              <div className="loading-chart h-[300px] flex items-center justify-center text-xs text-slate-300 font-bold tracking-widest animate-pulse">SYNCHRONIZING BUSINESS DATA...</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#818CF8" stopOpacity={1} />
                      <stop offset="100%" stopColor="#4F46E5" stopOpacity={1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }} dx={-10} tickFormatter={(val) => `₹${val}`} />
                  <Tooltip 
                    cursor={{fill: '#f8fafc', radius: 4}}
                    contentStyle={{ borderRadius: '14px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', padding: '16px', fontWeight: 'bold', fontSize: '12px' }}
                    formatter={(value) => [`₹${value.toLocaleString()}`, 'Platform Revenue']}
                  />
                  <Bar dataKey="revenue" fill="url(#barGradient)" radius={[6, 6, 0, 0]} maxBarSize={36} animationDuration={1500} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="content-card chart-card flex-1">
          <div className="card-header border-b border-slate-50 pb-4 mb-4">
            <div className="title-box">
              <TrendingUp size={20} className="text-amber-500" />
              <h3>Market Share</h3>
            </div>
          </div>
          <div className="chart-container relative flex items-center justify-center">
            {loading ? (
              <div className="loading-chart h-[300px] flex items-center justify-center text-xs text-slate-300 font-bold tracking-widest animate-pulse">ANALYZING DISTRIBUTIONS...</div>
            ) : pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={75}
                    outerRadius={100}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                    animationBegin={200}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} cornerRadius={4} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', padding: '12px', fontWeight: 'bold' }}
                    formatter={(value, name, props) => [
                      props.payload.count ? `${props.payload.count} Bookings` : `₹${value.toLocaleString()}`,
                      name
                    ]}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: '700', color: '#64748b' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
                <div className="empty-chart-fallback h-[300px] flex flex-col items-center justify-center">
                   <div className="w-40 h-40 rounded-full border-4 border-dashed border-slate-100 flex items-center justify-center">
                      <TrendingUp size={32} className="text-slate-200" />
                   </div>
                   <p className="text-[10px] text-slate-400 font-bold mt-4 uppercase tracking-widest">No matching transactional data</p>
                </div>
            )}
            {pieData.length > 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                 <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Growth</span>
                 <span className="text-lg font-black text-slate-900">Live</span>
              </div>
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
                <div key={booking._id} className="booking-item card-hover">
                  <div className="booking-service">
                    <div className="svc-icon-premium">
                      <Clock size={18} className="text-indigo-500" />
                    </div>
                    <div>
                      <p className="svc-name-bold">{booking.bookingId || `#${booking._id.slice(-6)}`} • {booking.serviceId?.name || 'Service'}</p>
                      <p className="svc-time-mini">{new Date(booking.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</p>
                    </div>
                  </div>
                  <div className="booking-status-box">
                    <span className={`status-badge-premium ${booking.status}`}>{booking.status.replace('_', ' ')}</span>
                    {booking.completionOtp && (
                       <div className="pin-pill-luxury">
                          <span className="label">SECURE PIN:</span>
                          <span className="value">{booking.completionOtp}</span>
                       </div>
                    )}
                  </div>
                  <div className="booking-financials">
                    <p className="amt-primary">₹{booking.totalAmount}</p>
                    <p className="amt-secondary">Node Fee: ₹{(booking.platformFee || 0) + (booking.commissionFee || 0)}</p>
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

            <div className="form-group">
              <label>{settings.platformFeeType === 'fixed' ? 'Fixed Amount per Booking (₹)' : 'Variable Fee Percentage (%)'}</label>
              <input
                type="number"
                value={settings.platformFeeValue || 0}
                onChange={(e) => setSettings({ ...settings, platformFeeValue: Number(e.target.value) })}
                className="fee-input"
              />
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
