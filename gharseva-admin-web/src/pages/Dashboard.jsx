import React, { useEffect, useState } from 'react';
import { Users, ShoppingBag, CheckCircle, Clock, TrendingUp, DollarSign, Download, FileText, BarChart2 } from 'lucide-react';
import { 
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import api from '../services/api';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalBookings: 0,
    completedBookings: 0,
    totalRevenue: 0,
    dailyRevenue: 0,
    charts: { weekly: [], yearly: [] }
  });
  const [settings, setSettings] = useState({
    platformFeeType: 'fixed',
    platformFeeValue: 29
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, settingsRes, bookingsRes] = await Promise.all([
        api.get('admin/stats'),
        api.get('admin/settings'),
        api.get('admin/bookings')
      ]);
      
      setStats(statsRes.data.data);
      setSettings(settingsRes.data.data);
      setRecentBookings(bookingsRes.data.data?.slice(0, 5) || []);
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
      alert('Platform Fee settings updated successfully!');
    } catch (err) {
      alert('Failed to update settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const exportToExcel = async () => {
    setExporting(true);
    try {
      const res = await api.get('admin/export');
      const data = res.data.data.map(b => ({
        'Booking ID': b._id,
        'Customer': b.userId?.name || 'N/A',
        'Service': b.serviceName,
        'Technician': b.assignedWorkerId?.name || 'N/A',
        'Platform Fee': b.platformFee,
        'Total Amount': b.totalAmount,
        'Date': new Date(b.completedAt).toLocaleDateString()
      }));
      
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Revenue Report');
      XLSX.writeFile(wb, `GharSeva_Revenue_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (err) {
      alert('Export failed');
    } finally {
      setExporting(false);
    }
  };

  const exportToPDF = async () => {
    setExporting(true);
    try {
      const res = await api.get('admin/export');
      const doc = new jsPDF();
      
      doc.setFontSize(18);
      doc.text('GharSeva Platform Revenue Report', 14, 22);
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

      const tableData = res.data.data.map(b => [
        b._id.slice(-8).toUpperCase(),
        b.serviceName,
        `Rs. ${b.platformFee}`,
        new Date(b.completedAt).toLocaleDateString()
      ]);

      doc.autoTable({
        startY: 40,
        head: [['ID', 'Service', 'Fee', 'Date']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229] }
      });

      doc.save(`GharSeva_Report_${Date.now()}.pdf`);
    } catch (err) {
      alert('PDF generation failed');
    } finally {
      setExporting(false);
    }
  };

  const chartData = stats.charts?.weekly?.map(d => ({
    name: d._id.split('-').slice(1).join('/'),
    revenue: d.revenue
  })) || [];

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <h1>Platform Intelligence</h1>
          <p>Real-time revenue tracking and performance analytics.</p>
        </div>
        <div className="header-actions">
           <button className="btn-outline" onClick={exportToExcel} disabled={exporting}>
              <Download size={16} /> Export Excel
           </button>
           <button className="btn-primary" onClick={exportToPDF} disabled={exporting}>
              <FileText size={16} /> Download PDF
           </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card accent-blue">
          <div className="stat-icon-wrapper">
            <ShoppingBag size={24} color="#3B82F6" />
          </div>
          <div className="stat-info">
            <h4>Total Bookings</h4>
            <h2>{stats.totalBookings}</h2>
            <p className="stat-sub">{stats.completedBookings} Successful completions</p>
          </div>
        </div>

        <div className="stat-card accent-green">
          <div className="stat-icon-wrapper">
            <TrendingUp size={24} color="#10B981" />
          </div>
          <div className="stat-info">
            <h4>Lifetime Profit</h4>
            <h2>₹{stats.totalRevenue.toLocaleString()}</h2>
            <p className="stat-sub">Aggregated platform fees</p>
          </div>
        </div>

        <div className="stat-card accent-purple">
          <div className="stat-icon-wrapper">
            <DollarSign size={24} color="#8B5CF6" />
          </div>
          <div className="stat-info">
            <h4>24h Revenue</h4>
            <h2>₹{stats.dailyRevenue.toLocaleString()}</h2>
            <p className="stat-sub">From new completions</p>
          </div>
        </div>

        <div className="stat-card accent-orange">
          <div className="stat-icon-wrapper">
            <CheckCircle size={24} color="#F59E0B" />
          </div>
          <div className="stat-info">
            <h4>Success Rate</h4>
            <h2>{stats.totalBookings > 0 ? Math.round((stats.completedBookings / stats.totalBookings) * 100) : 0}%</h2>
            <p className="stat-sub">Service delivery efficiency</p>
          </div>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="analytics-section">
        <div className="content-card chart-card">
           <div className="card-header">
              <div className="title-box">
                 <BarChart2 size={20} color="#6366F1" />
                 <h3>Weekly Revenue Trend (Platform Fee)</h3>
              </div>
           </div>
           <div className="chart-container">
             <ResponsiveContainer width="100%" height={300}>
               <AreaChart data={chartData}>
                 <defs>
                   <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#6366F1" stopOpacity={0.1}/>
                     <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                   </linearGradient>
                 </defs>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 12}} />
                 <YAxis axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 12}} />
                 <Tooltip 
                   contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                 />
                 <Area type="monotone" dataKey="revenue" stroke="#6366F1" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
               </AreaChart>
             </ResponsiveContainer>
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
                      <p className="svc-name">{booking.serviceId?.name || 'Home Service'}</p>
                      <p className="svc-time">{new Date(booking.schedule).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                  <div className="booking-status">
                    <span className={`status-pill ${booking.status}`}>{booking.status.replace('_', ' ')}</span>
                  </div>
                  <div className="booking-amount">
                    <p className="amt">₹{booking.totalAmount}</p>
                    <p className="method">FEE: ₹{booking.platformFee}</p>
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
                     onClick={() => setSettings({...settings, platformFeeType: 'fixed'})}
                   >
                     Fixed
                   </button>
                   <button 
                     className={settings.platformFeeType === 'percentage' ? 'active' : ''} 
                     onClick={() => setSettings({...settings, platformFeeType: 'percentage'})}
                   >
                     Variable %
                   </button>
                </div>
             </div>

             <div className="form-group">
                <label>{settings.platformFeeType === 'fixed' ? 'Fixed Amount per Booking (₹)' : 'Variable Fee Percentage (%)'}</label>
                <input 
                  type="number" 
                  value={settings.platformFeeValue} 
                  onChange={(e) => setSettings({...settings, platformFeeValue: Number(e.target.value)})}
                  className="fee-input"
                />
             </div>

             <button className="save-settings-btn" onClick={handleUpdateSettings} disabled={savingSettings}>
                {savingSettings ? 'Applying Changes...' : 'Save Global Config'}
             </button>
          </div>

          <div className="config-footer">
             <p>Changes will apply to all new scheduled services.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
