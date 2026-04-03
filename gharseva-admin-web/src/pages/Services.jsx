import React, { useEffect, useState } from 'react';
import { Plus, Search, Edit3, Trash2, Crown, Zap, Layers, Grid, X } from 'lucide-react';
import api, { getImageUrl } from '../services/api';
import Modal from '../components/Modal';
import Input from '../components/Input';
import LucideIcon from '../components/LucideIcon';
import './Services.css';

const Services = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [serviceUpsertModalOpen, setServiceUpsertModalOpen] = useState(false);
  const [selectedCat, setSelectedCat] = useState(null);
  
  const [catForm, setCatForm] = useState({ name: '', icon: 'ShoppingBag', bg: '#EEF2FF', iconColor: '#4F46E5', image: '' });
  const [serviceForm, setServiceForm] = useState({ name: '', basePrice: '', duration: '1 hr', priceType: 'fixed', description: '', image: '', isActive: true });
  const [categoryServices, setCategoryServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleImageUpload = (e, type = 'category') => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'category') {
          setCatForm({ ...catForm, image: reader.result });
        } else {
          setServiceForm({ ...serviceForm, image: reader.result });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await api.get('categories');
      setCategories(res.data.data);
    } catch (err) {
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleTier = async (cat, tier) => {
    try {
      await api.patch(`categories/${cat._id}`, { [tier]: !cat[tier] });
      fetchData();
    } catch (err) {
      alert('Failed to update category tier');
    }
  };

  const handleOpenCatModal = (cat = null) => {
    if (cat) {
      setCatForm({ name: cat.name, icon: cat.icon, bg: cat.bg, iconColor: cat.iconColor });
      setSelectedCat(cat);
    } else {
      setCatForm({ name: '', icon: 'ShoppingBag', bg: '#EEF2FF', iconColor: '#4F46E5' });
      setSelectedCat(null);
    }
    setCatModalOpen(true);
  };

  const handleSaveCategory = async () => {
    setSaving(true);
    try {
      if (selectedCat) {
        await api.patch(`categories/${selectedCat._id}`, catForm);
      } else {
        await api.post('categories', catForm);
      }
      setCatModalOpen(false);
      fetchData();
    } catch (err) {
      alert('Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const handleViewServices = (cat) => {
    setSelectedCat(cat);
    fetchCategoryServices(cat._id);
    setServiceModalOpen(true);
  };

  const fetchCategoryServices = async (catId) => {
    setLoadingServices(true);
    try {
      const res = await api.get(`services?categoryId=${catId}`);
      setCategoryServices(res.data.data);
    } catch (err) {
      console.error('Error fetching services:', err);
    } finally {
      setLoadingServices(false);
    }
  };

  const handleOpenServiceModal = (service = null) => {
    if (service) {
        setSelectedService(service);
        setServiceForm({
            name: service.name,
            basePrice: service.basePrice,
            duration: service.duration,
            priceType: service.priceType || 'fixed',
            description: service.description || '',
            image: service.image || '',
            isActive: service.isActive
        });
    } else {
        setSelectedService(null);
        setServiceForm({ name: '', basePrice: '', duration: '1 hr', priceType: 'fixed', description: '', image: '', isActive: true });
    }
    setCatModalOpen(false); 
    setServiceUpsertModalOpen(true);
  };

  const handleSaveService = async () => {
    if (!serviceForm.name || !serviceForm.basePrice || !serviceForm.duration) {
      return alert('Please fill in all required fields');
    }
    setSaving(true);
    try {
      const payload = { ...serviceForm, categoryId: selectedCat._id };
      if (selectedService) {
        await api.patch(`services/${selectedService._id}`, payload);
      } else {
        await api.post('services', payload);
      }
      setServiceUpsertModalOpen(false);
      fetchCategoryServices(selectedCat._id);
    } catch (err) {
      alert('Failed to save service');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteService = async (id) => {
    if (!window.confirm('Are you sure you want to delete this service?')) return;
    try {
      await api.delete(`services/${id}`);
      fetchCategoryServices(selectedCat._id);
    } catch (err) {
      alert('Failed to delete service');
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Delete category and all its services?')) return;
    try {
      await api.delete(`categories/${id}`);
      fetchData();
    } catch (err) {
      alert('Failed to delete');
    }
  };

  return (
    <div className="services-page">
      <div className="page-header">
        <div>
          <h1>Service Architecture</h1>
          <p>Configure the categories and specific services available to customers.</p>
        </div>
        <button className="btn-primary" onClick={() => handleOpenCatModal()}>
          <Plus size={20} />
          <span>Add New Category</span>
        </button>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <h4>Total Categories</h4>
          <h2>{categories.length}</h2>
        </div>
        <div className="stat-card">
          <h4>Active Services</h4>
          <h2>{categories.reduce((acc, cat) => acc + (cat.serviceCount || 0), 0)}</h2>
        </div>
        <div className="stat-card premium-config-card">
           <h4>Tier Configuration</h4>
           <div className="tier-status-list">
              <div className="tier-status-item">
                 <Crown size={14} color="#F59E0B" />
                 <span>PREMIUM TIER:</span>
                 <span className="status-label">ACTIVE</span>
              </div>
              <div className="tier-status-item">
                 <Zap size={14} color="#7C3AED" />
                 <span>LUXURY TIER:</span>
                 <span className="status-label">ACTIVE</span>
              </div>
           </div>
           <p className="text-xs text-slate-400 mt-2">Manage these in Platform Settings</p>
        </div>
      </div>

      <div className="content-card">
        <div className="table-header">
          <h3>All Categories</h3>
          <div className="table-actions">
            <div className="search-input">
              <Search size={18} />
              <input type="text" placeholder="Filter categories..." />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="loading-state">Synchronizing services...</div>
        ) : (
          <div className="table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Category Name</th>
                  <th>Icon</th>
                  <th>Premium Tier</th>
                  <th>Services</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => (
                  <tr key={cat._id}>
                    <td className="font-bold">{cat.name}</td>
                    <td>
                      <div className="category-image-preview">
                        {cat.image ? (
                          <img src={cat.image} alt={cat.name} className="w-12 h-12 rounded-lg object-cover" />
                        ) : (
                          <div className="category-icon-fallback" style={{ backgroundColor: cat.bg || '#F3F4F6' }}>
                             <LucideIcon name={cat.icon} color={cat.iconColor} size={20} />
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="tier-badges">
                        {cat.isPremium && <span className="mini-badge premium">PREMIUM</span>}
                        {cat.isLuxury && <span className="mini-badge luxury">LUXURY</span>}
                        {!cat.isPremium && !cat.isLuxury && <span className="text-xs text-slate-400">Regular</span>}
                      </div>
                    </td>
                    <td>
                      <button className="btn-text-sm" onClick={() => handleViewServices(cat)}>
                        <Layers size={14} /> {cat.serviceCount || 0} services
                      </button>
                    </td>
                    <td>
                      <div className="action-btns">
                        <button className="btn-icon" onClick={() => toggleTier(cat, 'isPremium')} title="Toggle Premium">
                           <Crown size={16} color={cat.isPremium ? '#F59E0B' : '#94A3B8'} />
                        </button>
                        <button className="btn-icon" onClick={() => toggleTier(cat, 'isLuxury')} title="Toggle Luxury">
                           <Zap size={16} color={cat.isLuxury ? '#7C3AED' : '#94A3B8'} />
                        </button>
                        <button className="btn-icon" onClick={() => handleOpenCatModal(cat)}><Edit3 size={18} /></button>
                        <button className="btn-icon btn-danger" onClick={() => handleDeleteCategory(cat._id)}><Trash2 size={18} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Category Modal */}
      <Modal
        isOpen={catModalOpen}
        onClose={() => setCatModalOpen(false)}
        title={selectedCat ? 'Edit Category' : 'Create New Category'}
        footer={
          <>
            <button className="btn-outline" onClick={() => setCatModalOpen(false)}>Cancel</button>
            <button className="btn-primary" onClick={handleSaveCategory} disabled={saving}>
              {saving ? 'Saving...' : (selectedCat ? 'Update Category' : 'Create Category')}
            </button>
          </>
        }
      >
        <Input 
          label="Category Name" 
          value={catForm.name} 
          onChange={(e) => setCatForm({...catForm, name: e.target.value})}
          placeholder="e.g. Deep Cleaning"
        />
        <div className="form-group mb-4">
          <label className="block text-sm font-bold mb-2">Category Image (Premium)</label>
          <div className="flex items-center gap-4">
            {catForm.image && <img src={catForm.image} className="w-16 h-16 rounded-xl object-cover border" alt="Preview" />}
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleImageUpload}
              className="text-xs file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" 
            />
          </div>
        </div>
        <div className="form-row">
           <Input 
             label="Display Subtitle/Tagline" 
             value={catForm.icon} 
             onChange={(e) => setCatForm({...catForm, icon: e.target.value})}
             placeholder="e.g. Lowest Price Guaranteed"
           />
        </div>
      </Modal>

      {/* Service Explorer Modal */}
      <Modal
        isOpen={serviceModalOpen}
        onClose={() => setServiceModalOpen(false)}
        title={`Services: ${selectedCat?.name}`}
        footer={<button className="btn-primary" onClick={() => setServiceModalOpen(false)}>Close Explorer</button>}
      >
        <div className="service-explorer">
          <div className="explorer-header">
             <h4>Nested Service List</h4>
             <button className="btn-text-primary" onClick={() => handleOpenServiceModal()}><Plus size={14} /> Add Service</button>
          </div>
          <div className="service-list-mini">
            {loadingServices ? (
               <div className="text-center py-4 text-xs text-slate-400">Loading sub-services...</div>
            ) : categoryServices.length > 0 ? (
              categoryServices.map((svc, idx) => (
                <div key={idx} className="svc-mini-item">
                   <div className="svc-info">
                      <p className="font-bold">{svc.name}</p>
                      <p className="text-xs text-slate-500">{svc.priceType.toUpperCase()}: ₹{svc.basePrice} ({svc.duration})</p>
                   </div>
                   <div className="svc-actions">
                      <button className="btn-icon-sm" onClick={() => handleOpenServiceModal(svc)}><Edit3 size={14} /></button>
                      <button className="btn-icon-sm btn-danger-sm" onClick={() => handleDeleteService(svc._id)}><Trash2 size={14} /></button>
                   </div>
                </div>
              ))
            ) : (
              <div className="empty-pincodes text-center py-8">
                <Grid size={32} color="#CBD5E1" />
                <p className="text-sm text-slate-400 mt-2">No services defined for this category.</p>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Service Upsert Modal */}
      <Modal
        isOpen={serviceUpsertModalOpen}
        onClose={() => setServiceUpsertModalOpen(false)}
        title={selectedService ? 'Edit Service' : 'Add New Service'}
        footer={
          <>
            <button className="btn-outline" onClick={() => setServiceUpsertModalOpen(false)}>Cancel</button>
            <button className="btn-primary" onClick={handleSaveService} disabled={saving}>
              {saving ? 'Saving...' : (selectedService ? 'Update Service' : 'Create Service')}
            </button>
          </>
        }
      >
        <Input 
          label="Service Name" 
          value={serviceForm.name} 
          onChange={(e) => setServiceForm({...serviceForm, name: e.target.value})}
          placeholder="e.g. Child Care (4 Hours)"
        />
        <div className="form-row">
           <Input 
             label="Base Price (₹)" 
             type="number"
             value={serviceForm.basePrice} 
             onChange={(e) => setServiceForm({...serviceForm, basePrice: e.target.value})}
             placeholder="e.g. 599"
           />
           <Input 
             label="Duration" 
             value={serviceForm.duration} 
             onChange={(e) => setServiceForm({...serviceForm, duration: e.target.value})}
             placeholder="e.g. 4 hrs"
           />
        </div>
        <div className="form-group mb-4">
           <label className="block text-sm font-bold mb-2">Price Type</label>
           <select 
             className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm"
             value={serviceForm.priceType}
             onChange={(e) => setServiceForm({...serviceForm, priceType: e.target.value})}
           >
             <option value="fixed">Fixed Rate</option>
             <option value="hourly">Hourly Rate</option>
             <option value="visit">Per Visit</option>
           </select>
        </div>
        <div className="form-group mb-4">
           <label className="block text-sm font-bold mb-2">Service Description</label>
           <textarea 
             className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm"
             rows="3"
             style={{ outline: 'none' }}
             value={serviceForm.description}
             onChange={(e) => setServiceForm({...serviceForm, description: e.target.value})}
             placeholder="Describe what is included in this service..."
           ></textarea>
        </div>
        <div className="form-group mb-6">
          <label className="block text-sm font-bold mb-3">Service Image</label>
          <div className="flex items-center gap-5 p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
            <div className="w-20 h-20 rounded-xl overflow-hidden border bg-white flex items-center justify-center">
              {serviceForm.image ? (
                <img src={getImageUrl(serviceForm.image)} className="w-full h-full object-cover" alt="Preview" />
              ) : (
                <Grid size={24} color="#CBD5E1" />
              )}
            </div>
            <div className="flex-1">
              <input 
                type="file" 
                id="svc-img-upload"
                hidden
                accept="image/*" 
                onChange={(e) => handleImageUpload(e, 'service')}
              />
              <label htmlFor="svc-img-upload" className="btn-text-sm cursor-pointer inline-flex">
                 Change Image
              </label>
              <p className="text-[10px] text-slate-400 mt-2">Recommended: 800x800px JPG/PNG</p>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Services;
