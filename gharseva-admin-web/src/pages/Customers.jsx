import React, { useEffect, useState } from 'react';
import { Search, User as UserIcon, Mail, Phone, Calendar, Trash2, Eye, UserX, AlertCircle, ShoppingBag, ArrowRight, ShieldCheck, History, Edit3 } from 'lucide-react';
import api, { getImageUrl } from '../services/api';
import Modal from '../components/Modal';
import Input from '../components/Input';
import './Customers.css';

const Customers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedUser, setSelectedUser] = useState(null);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [userBookings, setUserBookings] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [updating, setUpdating] = useState(false);

  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phoneNumber: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('admin/users');
      setUsers(res.data.data);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (user) => {
    setSelectedUser(user);
    setEditForm({
      name: user.name || '',
      email: user.email || '',
      phoneNumber: user.phoneNumber || ''
    });
    setEditModalOpen(true);
  };

  const handleUpdateUser = async () => {
    setUpdating(true);
    try {
      const formData = new FormData();
      formData.append('name', editForm.name);
      formData.append('email', editForm.email);
      formData.append('phoneNumber', editForm.phoneNumber);
      
      if (editForm.newImage) {
        formData.append('profilePicture', editForm.newImage);
      }

      await api.patch(`admin/users/${selectedUser._id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      alert('Profile synchronized successfully');
      setEditModalOpen(false);
      fetchUsers();
    } catch (err) {
      alert('Update failed');
    } finally {
      setUpdating(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditForm({ ...editForm, newImage: file });
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('IRREVERSIBLE ACTION: Purge this account?')) return;
    try {
      await api.delete(`admin/users/${id}`);
      setUsers(users.filter(u => u._id !== id));
      alert('Account purged successfully');
    } catch (err) {
      alert('Purge failed');
    }
  };

  const handleViewHistory = async (user) => {
    setSelectedUser(user);
    setHistoryModalOpen(true);
    setLoadingHistory(true);
    try {
      const res = await api.get(`admin/bookings`);
      const filtered = res.data.data.filter(b => (b.userId?._id || b.userId) === user._id);
      setUserBookings(filtered);
    } catch (err) {
      console.error('Error fetching user history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.phoneNumber?.includes(searchTerm)
  );

  return (
    <div className="customers-dashboard">
      <div className="page-header">
        <div>
          <h1>Customer Oversight</h1>
          <p>Analyzing behavior, history, and loyalty for all registered users.</p>
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <h4>Total Registrations</h4>
          <h2>{users.length}</h2>
        </div>
        <div className="stat-card">
          <h4>Platform Status</h4>
          <h2 className="text-secondary text-lg">Active Fleet</h2>
        </div>
      </div>

      <div className="content-card">
        <div className="table-header">
          <h3>Customer Registry</h3>
          <div className="table-actions">
            <div className="search-input">
              <Search size={18} />
              <input 
                type="text" 
                placeholder="Search by name, email, or phone..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="loading-state">Synchronizing user database...</div>
        ) : (
          <div className="table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Customer Profile</th>
                  <th>Contact Registry</th>
                  <th>Retention Info</th>
                  <th>Audit Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user._id}>
                    <td>
                      <div className="customer-avatar-cell">
                        <div className="customer-avatar">
                          <img 
                            src={getImageUrl(user.profilePicture) || 'https://via.placeholder.com/48'} 
                            alt={user.name} 
                          />
                        </div>
                        <div className="customer-info-main">
                          <span className="name">{user.name}</span>
                          <span className="id">#{user._id.slice(-8)}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="contact-pill-box">
                        <div className="contact-pill">
                          <Mail size={12} /> {user.email || 'N/A'}
                        </div>
                        <div className="contact-pill">
                          <Phone size={12} /> {user.phoneNumber}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="join-date-cell">
                        <Calendar size={14} /> 
                        <span>{new Date(user.createdAt).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td>
                      <div className="action-btns">
                        <button className="btn-icon" onClick={() => handleViewHistory(user)} title="Oversight History">
                          <Eye size={18} />
                        </button>
                        <button className="btn-icon" onClick={() => handleOpenEdit(user)} title="Edit Profile">
                          <Edit3 size={18} />
                        </button>
                        <button className="btn-icon btn-danger" onClick={() => handleDeleteUser(user._id)} title="Purge Account">
                          <UserX size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredUsers.length === 0 && (
              <div className="empty-state">
                <AlertCircle size={40} />
                <p>No customers found matching your search.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Customer Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Override Customer Profile"
        footer={
          <>
            <button className="btn-outline" onClick={() => setEditModalOpen(false)}>Cancel</button>
            <button className="btn-primary" onClick={handleUpdateUser} disabled={updating}>
              {updating ? 'Saving...' : 'Sync Changes'}
            </button>
          </>
        }
      >
        <div className="upsert-form p-4">
           {/* Premium Avatar Sync UI - Strict Constraints Updated */}
           <div className="flex items-center gap-6 mb-8 bg-slate-50 p-6 rounded-3xl border border-slate-100">
              <div className="relative w-16 h-16 flex-shrink-0">
                 <img 
                  src={editForm.newImage ? URL.createObjectURL(editForm.newImage) : getImageUrl(selectedUser?.profilePicture) || 'https://via.placeholder.com/80'} 
                  alt="Preview" 
                  style={{ width: '64px', height: '64px', minWidth: '64px', minHeight: '64px', borderRadius: '50%', objectFit: 'cover' }}
                  className="border-2 border-indigo-100 shadow-md ring-4 ring-white"
                 />
                 <label className="absolute -bottom-1 -right-1 bg-indigo-600 text-white p-1 rounded-full cursor-pointer shadow-lg hover:bg-indigo-700 transition-transform active:scale-90 z-10">
                    <Edit3 size={14} />
                    <input type="file" hidden onChange={handleImageChange} accept="image/*" />
                 </label>
              </div>
              <div className="flex-1 overflow-hidden">
                 <p className="text-[11px] font-black text-indigo-600 uppercase tracking-widest mb-0.5">Asset synchronization</p>
                 <p className="text-sm font-bold text-slate-800 truncate">Unified Platform Avatar</p>
              </div>
           </div>

           <Input 
            label="Full Name" 
            value={editForm.name} 
            onChange={(e) => setEditForm({...editForm, name: e.target.value})} 
           />
           <Input 
            label="Email Address" 
            value={editForm.email} 
            onChange={(e) => setEditForm({...editForm, email: e.target.value})} 
           />
           <Input 
            label="Phone Number" 
            value={editForm.phoneNumber} 
            onChange={(e) => setEditForm({...editForm, phoneNumber: e.target.value})} 
           />
        </div>
      </Modal>

      {/* Premium History Modal */}
      <Modal
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        title={`Audit Report: ${selectedUser?.name}`}
        footer={<button className="btn-primary" onClick={() => setHistoryModalOpen(false)}>Close Oversight</button>}
      >
        {selectedUser && (
          <div className="audit-explorer">
            <div className="audit-header-card">
              <div className="audit-header-avatar">
                <img 
                  src={getImageUrl(selectedUser?.profilePicture) || 'https://via.placeholder.com/80'} 
                  alt="Profile"
                />
              </div>
              <div className="audit-header-info">
                 <h4>{selectedUser?.name}</h4>
                 <p className="sub-text">{selectedUser?.email} • {selectedUser?.phoneNumber}</p>
                 <div className="flex items-center gap-2 mt-2 text-[10px] uppercase font-black text-indigo-500">
                    <ShieldCheck size={12} /> Secure Platform User
                 </div>
              </div>
            </div>

            <div className="audit-stats-grid">
               <div className="audit-stat-mini">
                  <span>Gross Transactions</span>
                  <p>{userBookings.length}</p>
               </div>
               <div className="audit-stat-mini">
                  <span>Economic Value</span>
                  <p className="text-secondary">₹{userBookings.reduce((sum, b) => sum + b.totalAmount, 0)}</p>
               </div>
            </div>

            <h5 className="audit-section-title">Digital Receipt Timeline</h5>
            
            <div className="audit-booking-list">
              {loadingHistory ? (
                <div className="text-center py-8 text-xs text-slate-400 tracking-widest animate-pulse">SYNCHRONIZING AUDIT TRAIL...</div>
              ) : userBookings.length > 0 ? (
                userBookings.map((bk, idx) => (
                  <div key={idx} className="audit-receipt-item p-5 bg-white border border-slate-100 rounded-3xl mb-4 shadow-sm hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-4">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                             <History size={20} />
                          </div>
                          <div>
                            <span className="block font-black text-slate-900 text-sm">{bk.serviceId?.name || bk.serviceName}</span>
                            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">{bk.bookingId || `#${bk._id.slice(-6)}`}</span>
                          </div>
                       </div>
                       <span className={`status-badge-mini ${bk.status?.toLowerCase()}`}>
                          {bk.status?.replace('_', ' ')}
                       </span>
                    </div>

                    <div className="receipt-detailed-split grid grid-cols-2 gap-4 border-t border-b border-dashed border-slate-100 py-4 mb-4">
                       <div className="price-ledger">
                          <p className="flex justify-between text-[11px] mb-1">
                             <span className="text-slate-400 font-bold uppercase tracking-tighter">Base Rate:</span> 
                             <span className="font-black text-slate-700">₹{bk.price}</span>
                          </p>
                          <p className="flex justify-between text-[11px] mb-2">
                             <span className="text-slate-400 font-bold uppercase tracking-tighter">Platform Fee:</span> 
                             <span className="font-black text-indigo-500">+₹{bk.platformFee}</span>
                          </p>
                          <div className="flex justify-between items-center bg-indigo-600 text-white p-2 rounded-lg mt-2">
                             <span className="text-[9px] font-black uppercase">Grand Total:</span>
                             <span className="font-black text-sm">₹{bk.totalAmount}</span>
                          </div>
                       </div>
                       <div className="staff-ledger border-l border-slate-100 pl-4">
                          <span className="block text-[9px] font-black text-slate-400 uppercase mb-2">Technician Report</span>
                          <div className="flex items-center gap-2 mb-2">
                             <div className="w-6 h-6 bg-slate-100 rounded-full overflow-hidden border border-white shadow-sm">
                                <img src={getImageUrl(bk.assignedWorkerId?.profilePicture) || 'https://via.placeholder.com/24'} alt="" className="w-full h-full object-cover" />
                             </div>
                             <span className="text-[11px] font-black text-slate-800">{bk.assignedWorkerId?.name || 'Awaiting Match'}</span>
                          </div>
                          <p className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                             <Phone size={10} /> {bk.assignedWorkerId?.phoneNumber || 'Contact Unavailable'}
                          </p>
                       </div>
                    </div>

                    <div className="receipt-footer flex justify-between items-center">
                       <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold">
                          <Calendar size={12} /> {new Date(bk.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                       </div>
                       <div className="flex items-center gap-1.5 text-[10.5px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                          <span className="opacity-50 text-[9px]">PARTNER PAY:</span> ₹{bk.workerEarnings}
                       </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-16 text-slate-300 italic text-sm font-bold tracking-tight">PLATFORM OVERSIGHT: NO ATTESTED TRANSACTIONS FOR THIS UNIT.</div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Customers;
