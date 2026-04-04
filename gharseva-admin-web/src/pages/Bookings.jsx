import React, { useEffect, useState } from 'react';
import { Search, Eye, Clock, MapPin, User, Briefcase, DollarSign, Calendar, Image as ImageIcon, ChevronRight, X, Phone, CheckCircle, AlertCircle, Download, FileText } from 'lucide-react';
import api, { getImageUrl } from '../services/api';
import Modal from '../components/Modal';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import './Bookings.css';

const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedBooking, setSelectedBooking] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const res = await api.get('admin/bookings');
      setBookings(res.data.data);
    } catch (err) {
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetails = (booking) => {
    setSelectedBooking(booking);
    setDetailsModalOpen(true);
  };

  const exportToExcel = () => {
    try {
      const data = filteredBookings.map(b => ({
        'Booking ID': b.bookingId || b._id,
        'Customer': b.userId?.name || 'N/A',
        'Contact': b.userId?.phoneNumber || 'N/A',
        'Service': b.serviceId?.name || b.serviceName || 'Home Service',
        'Technician': b.assignedWorkerId?.name || 'N/A',
        'Total Amount': b.totalAmount,
        'Platform Fee (User)': b.platformFee || 0,
        'Commission Fee (Worker)': b.commissionFee || 0,
        'Worker Net': b.workerEarnings || 0,
        'Commission (%)': b.commissionApplied || 0,
        'Status': b.status,
        'Date': b.completedAt ? new Date(b.completedAt).toLocaleDateString() : 'N/A',
        'Time': b.completedAt ? new Date(b.completedAt).toLocaleTimeString() : 'N/A'
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "GlobalHistory");
      XLSX.writeFile(wb, `GharSeva_Full_History_${Date.now()}.xlsx`);
    } catch (err) {
      alert('Excel export failed');
    }
  };

  const exportToPDF = () => {
    setExporting(true);
    try {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      
      // Premium Branding Header
      doc.setFillColor(79, 70, 229); // Indigo 600
      doc.rect(0, 0, 297, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('GharSeva', 14, 20);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('PLATFORM BUSINESS INTELLIGENCE REPORT', 14, 28);
      doc.text(`DATE PERIMETER: ${new Date().toLocaleDateString()} | STATUS: AUDITED`, 14, 34);

      const tableData = filteredBookings.map(b => [
        (b.bookingId || b._id?.slice(-8)).toUpperCase() || 'N/A',
        b.userId?.name || 'Anonymous',
        b.serviceId?.name || b.serviceName || 'Service',
        b.assignedWorkerId?.name || 'Awaiting Partner',
        `Rs. ${b.totalAmount || 0}`,
        `Rs. ${(b.platformFee || 0) + (b.commissionFee || 0)}`,
        `Rs. ${b.workerEarnings || 0}`,
        `${b.commissionApplied || 0}%`,
        b.status.toUpperCase(),
        b.createdAt ? new Date(b.createdAt).toLocaleDateString() : 'N/A'
      ]);

      autoTable(doc, {
        startY: 50,
        head: [['LEDGER ID', 'CUSTOMER', 'SERVICE', 'PARTNER', 'GROSS (USER)', 'PLATFORM NET', 'PAYOUT', 'COMM %', 'STATUS', 'POSTED DATE']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontSize: 9, fontStyle: 'bold' },
        bodyStyles: { fontSize: 8, textColor: [51, 65, 85] },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { top: 50 },
        columnStyles: {
          4: { fontStyle: 'bold' },
          5: { fontStyle: 'bold', textColor: [79, 70, 229] },
          6: { fontStyle: 'bold', textColor: [16, 185, 129] }
        }
      });

      // Simple footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(`GharSeva Internal Audit Trail | Page ${i} of ${pageCount} | Automated Business Ledger`, 14, 200);
      }

      doc.save(`GharSeva_Internal_Audit_${Date.now()}.pdf`);
    } catch (err) {
      console.error('PDF Error:', err);
      alert('Professional PDF generation failed');
    } finally {
      setExporting(false);
    }
  };

  const filteredBookings = bookings.filter(b => 
    b.bookingId?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    b._id?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    b.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.assignedWorkerId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.serviceId?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle size={14} />;
      case 'cancelled': return <AlertCircle size={14} />;
      default: return <Clock size={14} />;
    }
  };

  return (
    <div className="bookings-page">
      <div className="page-header">
        <div>
          <h1>Global Bookings</h1>
          <p>Real-time oversight of all platform jobs and service fulfillment.</p>
        </div>
        <div className="flex gap-3">
          <button className="btn-outline" onClick={exportToExcel} disabled={loading}>
            <Download size={18} className="mr-1" /> Excel
          </button>
          <button className="btn-primary" onClick={exportToPDF} disabled={loading || exporting}>
            <FileText size={18} className="mr-1" /> {exporting ? 'Processing...' : 'Download PDF'}
          </button>
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <h4>Total Jobs</h4>
          <h2>{bookings.length}</h2>
        </div>
        <div className="stat-card success-card">
          <h4>Completed</h4>
          <h2>{bookings.filter(b => b.status === 'completed').length}</h2>
        </div>
        <div className="stat-card warning-card">
          <h4>Active</h4>
          <h2>{bookings.filter(b => !['completed', 'cancelled'].includes(b.status)).length}</h2>
        </div>
        <div className="stat-card danger-card">
          <h4>Cancelled</h4>
          <h2>{bookings.filter(b => b.status === 'cancelled').length}</h2>
        </div>
      </div>

      <div className="content-card">
        <div className="table-header">
          <h3>Transaction History</h3>
          <div className="table-actions">
            <div className="search-input">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search ID, Customer, or Pro..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="loading-state">Synchronizing platform transactions...</div>
        ) : (
          <div className="table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Customer</th>
                  <th>Service</th>
                  <th>Technician</th>
                  <th>Total (User)</th>
                  <th>Fees/Comm</th>
                  <th>Worker Net</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((booking) => (
                  <tr key={booking._id}>
                    <td>
                      <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest">{booking.bookingId || `#${booking._id.slice(-8)}`}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{new Date(booking.createdAt).toLocaleDateString()}</p>
                    </td>
                    <td>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800">{booking.userId?.name || 'Anonymous'}</span>
                        <span className="text-xs text-slate-500">{booking.userId?.phoneNumber}</span>
                      </div>
                    </td>
                    <td>
                      <span className="font-semibold text-slate-700">{booking.serviceId?.name || booking.serviceName || 'Home Service'}</span>
                    </td>
                    <td>
                      {booking.assignedWorkerId ? (
                        <div className="flex flex-col">
                          <span className="font-semibold text-indigo-600">{booking.assignedWorkerId.name}</span>
                          <span className="text-[10px] text-slate-400">Net: ₹{booking.workerEarnings}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-sm">Awaiting Pro...</span>
                      )}
                    </td>
                    <td>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800">₹{booking.totalAmount}</span>
                        <span className="text-[10px] text-indigo-600">Incl. ₹{booking.platformFee} Fee</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-col">
                         <span className="text-xs font-bold text-rose-500">₹{booking.commissionFee || 0}</span>
                         <span className="text-[10px] text-slate-400">({booking.commissionApplied}%)</span>
                      </div>
                    </td>
                    <td>
                       <span className="font-bold text-emerald-600">₹{booking.workerEarnings}</span>
                    </td>
                    <td>
                      <span className={`status-pill ${booking.status}`}>
                        {getStatusIcon(booking.status)}
                        {booking.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <button className="btn-icon" onClick={() => handleOpenDetails(booking)} title="View Full Details">
                        <Eye size={20} color="#6366F1" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredBookings.length === 0 && (
              <div className="empty-state">
                <AlertCircle size={40} />
                <p>No transactions found matching your criteria.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Detailed Modal */}
      <Modal
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        title={`Oversight: ${selectedBooking?.bookingId || selectedBooking?._id.slice(-8).toUpperCase()}`}
        footer={
          <div className="flex justify-between w-full">
            <button className="btn-outline" onClick={() => {
              const doc = new jsPDF();
              doc.setFontSize(22); doc.setTextColor(79, 70, 229); doc.text('GharSeva Receipt', 14, 20);
              doc.setFontSize(10); doc.setTextColor(100); doc.text(`Platform Ledger: ${selectedBooking.bookingId}`, 14, 28);
              autoTable(doc, { 
                startY: 35, 
                head: [['Detail', 'Value']], 
                body: [
                  ['Service', selectedBooking.serviceId?.name],
                  ['Customer', selectedBooking.userId?.name],
                  ['Technician', selectedBooking.assignedWorkerId?.name],
                  ['Base Price', `Rs. ${selectedBooking.price}`],
                  ['Platform Fee', `Rs. ${selectedBooking.platformFee}`],
                  ['Total Amount', `Rs. ${selectedBooking.totalAmount}`],
                  ['Status', selectedBooking.status.toUpperCase()],
                  ['Date', new Date(selectedBooking.createdAt).toLocaleString()]
                ],
                theme: 'striped',
                headStyles: { fillColor: [79, 70, 229] }
              });
              doc.save(`GharSeva_Receipt_${selectedBooking.bookingId}.pdf`);
            }}>
              <Download size={16} className="mr-1" /> Download Receipt
            </button>
            <button className="btn-primary" onClick={() => setDetailsModalOpen(false)}>Close Oversight</button>
          </div>
        }
      >
        {selectedBooking && (
          <div className="booking-details-modal">
            <div className="modal-section-v2">
              <div className="section-head"><User size={16} color="#6366F1" /> <h4>Customer & Location</h4></div>
              <div className="info-grid">
                <div className="info-item">
                  <label>Full Name</label>
                  <p>{selectedBooking.userId?.name}</p>
                </div>
                <div className="info-item">
                  <label>Contact</label>
                  <p>{selectedBooking.userId?.phoneNumber}</p>
                </div>
                <div className="info-item" style={{ gridColumn: 'span 2' }}>
                  <label>Service Address</label>
                  <p><MapPin size={14} className="inline mr-1" /> {selectedBooking.address} (PIN: {selectedBooking.pincode})</p>
                </div>
              </div>
            </div>

            <div className="modal-section-v2">
              <div className="section-head"><Briefcase size={16} color="#6366F1" /> <h4>Service Information</h4></div>
              <div className="info-grid">
                <div className="info-item">
                  <label>Category/Package</label>
                  <p>{selectedBooking.serviceId?.name || selectedBooking.serviceName}</p>
                </div>
                <div className="info-item">
                  <label>Technician</label>
                  <p>{selectedBooking.assignedWorkerId?.name || 'Searching for partner...'}</p>
                </div>
                <div className="info-item">
                  <label>Scheduled For</label>
                  <p><Calendar size={14} className="inline mr-1" /> {new Date(selectedBooking.schedule).toLocaleString()}</p>
                </div>
                <div className="info-item">
                  <label>Reference Token</label>
                  <p style={{ letterSpacing: 2 }}>{selectedBooking.completionOtp}</p>
                </div>
              </div>
            </div>

            <div className="modal-section-v2">
              <div className="section-head"><DollarSign size={16} color="#10B981" /> <h4>Financial Breakdown</h4></div>
                <div className="info-grid">
                  <div className="info-item">
                     <label>Service Price</label>
                     <p>₹{selectedBooking.price}</p>
                  </div>
                  <div className="info-item">
                     <label>Platform Fee (Paid by User)</label>
                     <p className="text-indigo-600 font-bold">₹{selectedBooking.platformFee}</p>
                  </div>
                  <div className="info-item">
                     <label>Commission Fee (Worker Cut)</label>
                     <p className="text-rose-500 font-bold">₹{selectedBooking.commissionFee || 0} ({selectedBooking.commissionApplied}%)</p>
                  </div>
                  <div className="info-item">
                     <label>Worker Net Payout</label>
                     <p className="text-emerald-600 font-bold">₹{selectedBooking.workerEarnings}</p>
                  </div>
                  <div className="info-item" style={{ gridColumn: 'span 2', borderTop: '1px solid #E2E8F0', paddingTop: '10px', marginTop: '5px' }}>
                     <label>Total Admin Revenue (Fee + Commission)</label>
                     <p className="text-indigo-900 font-black">₹{(selectedBooking.platformFee || 0) + (selectedBooking.commissionFee || 0)}</p>
                  </div>
                </div>
            </div>

            <div className="modal-section-v2">
              <div className="section-head"><Clock size={16} color="#6366F1" /> <h4>Lifecycle Audit</h4></div>
              <div className="info-grid">
                <div className="info-item">
                  <label>Created</label>
                  <p>{new Date(selectedBooking.createdAt).toLocaleString()}</p>
                </div>
                <div className="info-item">
                  <label>Completed/Finalized</label>
                  <p>{selectedBooking.completedAt ? new Date(selectedBooking.completedAt).toLocaleString() : '-- -- --'}</p>
                </div>
              </div>
            </div>

            <div className="modal-section-v2">
              <div className="section-head"><ImageIcon size={16} color="#6366F1" /> <h4>Service Evidence</h4></div>
              <div className="doc-preview-grid">
                <div className="doc-slot">
                  <p>Before Service</p>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {selectedBooking.beforeServiceImages?.length > 0 ? selectedBooking.beforeServiceImages.map((img, i) => (
                      <img
                        key={i}
                        src={getImageUrl(img)}
                        className="doc-image-preview"
                        onClick={() => setPreviewImage(getImageUrl(img))}
                      />
                    )) : <span className="text-xs text-slate-400 italic">No images uploaded</span>}
                  </div>
                </div>
                <div className="doc-slot">
                  <p>After Service</p>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {selectedBooking.afterServiceImages?.length > 0 ? selectedBooking.afterServiceImages.map((img, i) => (
                      <img
                        key={i}
                        src={getImageUrl(img)}
                        className="doc-image-preview"
                        onClick={() => setPreviewImage(getImageUrl(img))}
                      />
                    )) : <span className="text-xs text-slate-400 italic">No images uploaded</span>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Image Preview Lightbox */}
      {previewImage && (
        <div className="image-lightbox-overlay" onClick={() => setPreviewImage(null)}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-close" onClick={() => setPreviewImage(null)}><X size={24} /></button>
            <img src={previewImage} alt="Preview Full" />
          </div>
        </div>
      )}
    </div>
  );
};

export default Bookings;
