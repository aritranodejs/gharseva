import React, { useEffect, useState } from 'react';
import { Users, Search, Edit3, Trash2, CheckCircle, XCircle, Shield, Phone, Mail, FileText, ExternalLink, Image as ImageIcon, Plus, History, Briefcase, MapPin, Layers, Clock, X } from 'lucide-react';
import api, { getImageUrl } from '../services/api';
import Modal from '../components/Modal';
import Input from '../components/Input';
import './Workers.css';

const Workers = () => {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals State
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [upsertModalOpen, setUpsertModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [workerHistory, setWorkerHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [updating, setUpdating] = useState(false);
  
  const [categories, setCategories] = useState([]);
  const [serviceableAreas, setServiceableAreas] = useState([]);

  useEffect(() => {
    fetchWorkers();
    fetchSupportData();
  }, []);

  const fetchSupportData = async () => {
    try {
      const [cats, areas] = await Promise.all([
        api.get('categories'),
        api.get('areas')
      ]);
      setCategories(cats.data.data || []);
      
      // Flatten all pincodes from all cities — extract pincode strings from objects
      const allPins = (areas.data.data || []).reduce((acc, city) => {
        const pins = (city.pincodes || []).map(p => (typeof p === 'object' ? p.pincode : p));
        return [...acc, ...pins];
      }, []);
      const uniquePins = [...new Set(allPins)].filter(Boolean).sort();
      setServiceableAreas(uniquePins);
    } catch (err) {
      console.error('Error fetching support data:', err);
    }
  };

  const fetchWorkers = async () => {
    try {
      const res = await api.get('admin/workers');
      setWorkers(res.data.data);
    } catch (err) {
      console.error('Error fetching workers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenVerify = (worker) => {
    setSelectedWorker(worker);
    setVerifyModalOpen(true);
  };

  // Form State for Add/Edit
  const [workerForm, setWorkerForm] = useState({
    name: '',
    phoneNumber: '',
    password: '',
    skills: [],
    pincodes: []
  });

  const handleOpenUpsert = (worker = null) => {
    if (worker) {
      setSelectedWorker(worker);
      setWorkerForm({
        name: worker.name,
        phoneNumber: worker.phoneNumber,
        password: '', 
        skills: worker.skills || [],
        // Normalize pincodes to strings in case they're stored as objects
        pincodes: (worker.pincodes || []).map(p => (typeof p === 'object' ? p.pincode : p)).filter(Boolean)
      });
    } else {
      setSelectedWorker(null);
      setWorkerForm({ name: '', phoneNumber: '', password: '', skills: [], pincodes: [] });
    }
    setUpsertModalOpen(true);
  };

  const handleOpenHistory = async (worker) => {
    setSelectedWorker(worker);
    setHistoryModalOpen(true);
    setLoadingHistory(true);
    try {
      // We use the admin/bookings endpoint and filter manually for now or use a worker-specific one
      const res = await api.get(`admin/bookings`); 
      const filtered = res.data.data.filter(b => b.assignedWorkerId?._id === worker._id);
      setWorkerHistory(filtered);
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleVerifyAction = async (newStatus) => {
    setUpdating(true);
    try {
      await api.patch(`admin/workers/${selectedWorker._id}`, { 
        status: newStatus,
        aadhaarNumber: selectedWorker.aadhaarNumber,
        panNumber: selectedWorker.panNumber
      });
      setVerifyModalOpen(false);
      fetchWorkers();
    } catch (err) {
      alert('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handleDocUpload = async (field, e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUpdating(true);
    try {
      const formData = new FormData();
      formData.append(field, file);
      
      await api.patch(`admin/workers/${selectedWorker._id}`, formData, {
         headers: { 'Content-Type': 'multipart/form-data' }
      });
      const res = await api.get('admin/workers');
      setWorkers(res.data.data);
      const updated = res.data.data.find(w => w._id === selectedWorker._id);
      setSelectedWorker(updated);
    } catch (err) {
      alert('Upload failed');
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveWorker = async () => {
    setUpdating(true);
    try {
      const sanitizedForm = {
        ...workerForm,
        skills: [...new Set(workerForm.skills)],
        pincodes: [...new Set(workerForm.pincodes)]
      };
      
      if (selectedWorker) {
        await api.patch(`admin/workers/${selectedWorker._id}`, sanitizedForm);
      } else {
        await api.post('workers/register', sanitizedForm); 
      }
      setUpsertModalOpen(false);
      fetchWorkers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save worker');
    } finally {
      setUpdating(false);
    }
  };

  const filteredWorkers = workers.filter(w => 
    w.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    w.phoneNumber?.includes(searchTerm)
  );

  return (
    <div className="workers-page">
      <div className="page-header">
        <div>
          <h1>Service Professionals</h1>
          <p>Verify documents, review history, and manage partner accounts.</p>
        </div>
        <button className="btn-primary" onClick={() => handleOpenUpsert()}>
          <Plus size={20} />
          <span>Add New Partner</span>
        </button>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <h4>Total Fleet</h4>
          <h2>{workers.length}</h2>
        </div>
        <div className="stat-card success-card">
          <h4>Approved Pro</h4>
          <h2>{workers.filter(w => w.status === 'approved').length}</h2>
        </div>
        <div className="stat-card warning-card">
          <h4>Waiting Review</h4>
          <h2>{workers.filter(w => w.status === 'pending').length}</h2>
        </div>
      </div>

      <div className="content-card">
        <div className="table-header">
          <h3>Active Fleet</h3>
          <div className="table-actions">
            <div className="search-input">
              <Search size={18} />
              <input 
                type="text" 
                placeholder="Search name, phone or skill..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="loading-state">Synchronizing professional accounts...</div>
        ) : (
          <div className="table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Professional</th>
                  <th>Contact & Areas</th>
                  <th>Rating & Stats</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredWorkers.map((worker) => (
                  <tr key={worker._id}>
                    <td>
                      <div className="worker-name-cell">
                        <div className="worker-avatar-small" style={{ background: worker.status === 'approved' ? '#ECFDF5' : '#F1F5F9' }}>
                          {worker.profilePicture ? <img src={getImageUrl(worker.profilePicture)} alt="" /> : (worker.name?.charAt(0) || 'W')}
                        </div>
                        <div>
                           <p className="font-bold text-slate-800">{worker.name || 'Anonymous'}</p>
                           <p className="text-xs text-slate-500 uppercase tracking-wider">PRO-{worker._id.slice(-6)}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="contact-cell">
                        <p className="flex items-center gap-1"><Phone size={12} color="#6366F1" /> {worker.phoneNumber}</p>
                        <p className="flex items-center gap-1 text-xs text-slate-500"><MapPin size={10} /> {worker.pincodes?.slice(0, 2).map(p => typeof p === 'object' ? p.pincode : p).join(', ')}{worker.pincodes?.length > 2 ? '...' : ''}</p>
                      </div>
                    </td>
                    <td>
                      <div className="stats-cell">
                         <span className="rating-badge">★ {worker.rating || '4.5'}</span>
                         <p className="text-xs text-slate-500 mt-1">{worker.activeBookingsCount || 0} active jobs</p>
                      </div>
                    </td>
                    <td>
                      <span className={`status-pill ${worker.status}`}>
                        {worker.status === 'approved' ? <CheckCircle size={14} /> : worker.status === 'rejected' ? <XCircle size={14} /> : <Clock size={14} />}
                        {worker.status.charAt(0).toUpperCase() + worker.status.slice(1)}
                      </span>
                    </td>
                    <td>
                      <div className="action-btns">
                        <button className="btn-icon" onClick={() => handleOpenVerify(worker)} title="Verify Documents">
                           <Shield size={18} color={worker.status === 'approved' ? '#10B981' : '#94A3B8'} />
                        </button>
                        <button className="btn-icon" onClick={() => handleOpenHistory(worker)} title="View Job History">
                           <History size={18} color="#6366F1" />
                        </button>
                        <button className="btn-icon" onClick={() => handleOpenUpsert(worker)} title="Edit Account">
                           <Edit3 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Verification Modal */}
      <Modal
        isOpen={verifyModalOpen}
        onClose={() => setVerifyModalOpen(false)}
        title="Identity & Trust Verification"
        footer={
          <>
            <button className="btn-outline" onClick={() => setVerifyModalOpen(false)}>Cancel</button>
            <button 
              className="btn-danger" 
              onClick={() => handleVerifyAction('rejected')}
              disabled={updating || selectedWorker?.status === 'rejected'}
            >
              Reject Partner
            </button>
            <button 
              className="btn-primary" 
              onClick={() => handleVerifyAction('approved')}
              disabled={updating || selectedWorker?.status === 'approved'}
            >
              {updating ? 'Processing...' : 'Approve for Live Jobs'}
            </button>
          </>
        }
      >
        {selectedWorker && (
          <div className="worker-details-modal">
            <div className="modal-section-v2">
              <div className="section-head"><Users size={16}/> <h4>KYC Information</h4></div>
              <div className="info-cards">
                <div className="info-card-mini">
                  <Input 
                    label="Aadhaar ID" 
                    value={selectedWorker.aadhaarNumber || ''} 
                    onChange={(e) => setSelectedWorker({...selectedWorker, aadhaarNumber: e.target.value})}
                  />
                </div>
                <div className="info-card-mini">
                  <Input 
                    label="PAN Number" 
                    value={selectedWorker.panNumber || ''} 
                    onChange={(e) => setSelectedWorker({...selectedWorker, panNumber: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="modal-section-v2">
              <div className="section-head"><ImageIcon size={16}/> <h4>Identity Verification</h4></div>
              <div className="doc-preview-grid">
                <div className="doc-slot">
                  <p>National ID (Aadhaar)</p>
                  <div className="flex flex-col gap-2">
                    {selectedWorker.aadhaarImage ? (
                      <a href={getImageUrl(selectedWorker.aadhaarImage)} target="_blank" className="doc-btn-premium">
                        <ImageIcon size={20} /> Preview Aadhaar
                      </a>
                    ) : <div className="missing-tag">Missing Document</div>}
                    <label className="btn-text-primary text-xs cursor-pointer text-center">
                      {selectedWorker.aadhaarImage ? 'Replace Aadhaar' : 'Upload Aadhaar'}
                      <input type="file" hidden onChange={(e) => handleDocUpload('aadhaarImage', e)} />
                    </label>
                  </div>
                </div>
                <div className="doc-slot">
                  <p>Tax ID (PAN Card)</p>
                  <div className="flex flex-col gap-2">
                    {selectedWorker.panImage ? (
                      <a href={getImageUrl(selectedWorker.panImage)} target="_blank" className="doc-btn-premium">
                        <ImageIcon size={20} /> Preview PAN
                      </a>
                    ) : <div className="missing-tag">Missing Document</div>}
                    <label className="btn-text-primary text-xs cursor-pointer text-center">
                      {selectedWorker.panImage ? 'Replace PAN' : 'Upload PAN'}
                      <input type="file" hidden onChange={(e) => handleDocUpload('panImage', e)} />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-section-v2">
              <div className="section-head"><Shield size={16}/> <h4>Background & Certification</h4></div>
              <div className="doc-preview-grid">
                <div className="doc-slot">
                  <p>Professional Certification</p>
                  <div className="flex flex-col gap-2">
                    {selectedWorker.certification ? (
                      <a href={getImageUrl(selectedWorker.certification)} target="_blank" className="doc-btn-premium alt">
                        <FileText size={20} /> View Credentials
                      </a>
                    ) : <div className="missing-tag">No Certification</div>}
                    <label className="btn-text-primary text-xs cursor-pointer text-center">
                      {selectedWorker.certification ? 'Replace Certificate' : 'Upload Certificate'}
                      <input type="file" hidden onChange={(e) => handleDocUpload('certification', e)} />
                    </label>
                  </div>
                </div>
                <div className="doc-slot">
                  <p>Police Verification</p>
                  <div className="flex flex-col gap-2">
                    {selectedWorker.policeVerification ? (
                      <a href={getImageUrl(selectedWorker.policeVerification)} target="_blank" className="doc-btn-premium alt">
                        <Shield size={20} /> View Clearance
                      </a>
                    ) : <div className="missing-tag">Incomplete Background</div>}
                    <label className="btn-text-primary text-xs cursor-pointer text-center">
                      {selectedWorker.policeVerification ? 'Replace Clearance' : 'Upload Clearance'}
                      <input type="file" hidden onChange={(e) => handleDocUpload('policeVerification', e)} />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-section-v2">
              <div className="section-head"><Layers size={16}/> <h4>Additional Proofs & Docs</h4></div>
              <div className="doc-preview-grid">
                {selectedWorker.documents?.map((doc, idx) => (
                  <div key={idx} className="doc-slot">
                    <p>Misc Doc #{idx + 1}</p>
                    <div className="doc-button-row">
                        <a href={getImageUrl(doc)} target="_blank" className="doc-btn-premium alt">
                           <FileText size={18} /> View Doc
                        </a>
                        <button 
                            className="btn-icon-xs btn-danger-sm" 
                            onClick={async () => {
                                if(!window.confirm('Remove this document?')) return;
                                const newDocs = selectedWorker.documents.filter((_, i) => i !== idx);
                                await api.patch(`admin/workers/${selectedWorker._id}`, { documents: newDocs });
                                const res = await api.get('admin/workers');
                                setWorkers(res.data.data);
                                const updated = res.data.data.find(w => w._id === selectedWorker._id);
                                setSelectedWorker(updated);
                            }}
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                  </div>
                ))}
                
                <div className="doc-slot">
                  <p>Add New Proof</p>
                  <label className="doc-btn-premium cursor-pointer">
                    <Plus size={20} /> Attachment
                    <input 
                        type="file" 
                        hidden 
                        onChange={async (e) => {
                            const file = e.target.files[0];
                            if (!file) return;
                            setUpdating(true);
                            try {
                                const formData = new FormData();
                                formData.append('documents', file);
                                
                                // Pass existing documents to avoid overriding them if backend requires it
                                // Or backend can just append it automatically
                                const currentDocs = selectedWorker.documents || [];
                                formData.append('existingDocuments', JSON.stringify(currentDocs));

                                await api.patch(`admin/workers/${selectedWorker._id}`, formData, {
                                    headers: { 'Content-Type': 'multipart/form-data' }
                                });
                                const res = await api.get('admin/workers');
                                setWorkers(res.data.data);
                                const updated = res.data.data.find(w => w._id === selectedWorker._id);
                                setSelectedWorker(updated);
                            } catch (err) {
                                alert('Upload failed');
                            } finally {
                                setUpdating(false);
                            }
                        }} 
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={upsertModalOpen}
        onClose={() => setUpsertModalOpen(false)}
        title={selectedWorker ? 'Update Professional Profile' : 'Register New Professional'}
        footer={
          <>
            <button className="btn-outline" onClick={() => setUpsertModalOpen(false)}>Cancel</button>
            <button className="btn-primary" onClick={handleSaveWorker} disabled={updating}>
              {updating ? 'Saving...' : (selectedWorker ? 'Update Account' : 'Create Account')}
            </button>
          </>
        }
      >
        <div className="upsert-form">
           <Input label="Full Name" value={workerForm.name} onChange={(e) => setWorkerForm({...workerForm, name: e.target.value})} />
           <Input label="Phone Number" value={workerForm.phoneNumber} onChange={(e) => setWorkerForm({...workerForm, phoneNumber: e.target.value})} />
           {!selectedWorker && <Input label="Initial Password" type="password" value={workerForm.password} onChange={(e) => setWorkerForm({...workerForm, password: e.target.value})} />}
           
           <div className="multi-select-section mb-6">
              <label className="block text-sm font-bold text-slate-700 mb-3">Professional Skills (Select Categories)</label>
              <div className="selection-grid">
                 {categories.map(cat => (
                   <div 
                    key={cat._id} 
                    className={`selection-tag ${workerForm.skills.some(s => s.trim().toLowerCase() === cat.name.trim().toLowerCase()) ? 'active' : ''}`}
                    onClick={() => {
                        const exists = workerForm.skills.some(s => s.trim().toLowerCase() === cat.name.trim().toLowerCase());
                        const newSkills = exists
                          ? workerForm.skills.filter(s => s.trim().toLowerCase() !== cat.name.trim().toLowerCase())
                          : [...workerForm.skills, cat.name];
                        setWorkerForm({...workerForm, skills: newSkills});
                    }}
                   >
                     {cat.name}
                   </div>
                 ))}
              </div>
           </div>

           <div className="multi-select-section mb-6">
              <label className="block text-sm font-bold text-slate-700 mb-3">Serviceable Pincodes (Select Areas)</label>
              <div className="selection-grid">
                 {serviceableAreas.map(pin => (
                   <div 
                    key={pin} 
                    className={`selection-tag ${workerForm.pincodes.includes(pin) ? 'active' : ''}`}
                    onClick={() => {
                        const newPins = workerForm.pincodes.includes(pin) 
                          ? workerForm.pincodes.filter(p => p !== pin)
                          : [...workerForm.pincodes, pin];
                        setWorkerForm({...workerForm, pincodes: newPins});
                    }}
                   >
                     {pin}
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </Modal>

      {/* History Modal */}
      <Modal
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        title={`Job History: ${selectedWorker?.name}`}
        footer={<button className="btn-primary" onClick={() => setHistoryModalOpen(false)}>Close History</button>}
      >
        <div className="history-viewer">
          {loadingHistory ? (
            <div className="loading-state">Fetching performance data...</div>
          ) : workerHistory.length > 0 ? (
            <div className="history-timeline">
              {workerHistory.map((job) => (
                <div key={job._id} className="history-job-card">
                  <div className="job-header">
                    <span className="job-date">{new Date(job.createdAt).toLocaleDateString()}</span>
                    <span className={`status-pill-small ${job.status}`}>{job.status.replace('_', ' ')}</span>
                  </div>
                  <div className="job-body">
                    <p className="job-title">{job.bookingId || `#${job._id.slice(-6)}`} - {job.serviceName || 'Home Service'}</p>
                    <p className="job-price">₹{job.totalAmount} <span className="text-xs text-slate-400">(Earnings: ₹{job.workerEarnings})</span></p>
                    
                    {/* Before/After Gallery */}
                    {(job.beforeServiceImages?.length > 0 || job.afterServiceImages?.length > 0) && (
                      <div className="job-gallery-mini">
                         {job.beforeServiceImages?.map((img, i) => (
                           <div key={i} className="gallery-item-v2" onClick={() => setPreviewImage(getImageUrl(img))}>
                             <img src={getImageUrl(img)} alt="Before" />
                             <span className="img-label">Before</span>
                           </div>
                         ))}
                         {job.afterServiceImages?.map((img, i) => (
                           <div key={i} className="gallery-item-v2" onClick={() => setPreviewImage(getImageUrl(img))}>
                             <img src={getImageUrl(img)} alt="After" />
                             <span className="img-label">After</span>
                           </div>
                         ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-history">
              <Briefcase size={40} color="#CBD5E1" />
              <p>No job completions yet for this professional.</p>
            </div>
          )}
        </div>
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

export default Workers;
