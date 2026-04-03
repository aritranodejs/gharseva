import React, { useEffect, useState } from 'react';
import { Plus, MapPin, Trash2, Edit3, Globe, Search, X } from 'lucide-react';
import api from '../services/api';
import Modal from '../components/Modal';
import Input from '../components/Input';
import './Areas.css';

const Areas = () => {
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState('add'); // 'add' or 'edit'
  const [currentArea, setCurrentArea] = useState(null);
  
  // Form State
  const [cityName, setCityName] = useState('');
  const [pincodeInput, setPincodeInput] = useState('');
  const [pincodes, setPincodes] = useState([]);

  useEffect(() => {
    fetchAreas();
  }, []);

  const fetchAreas = async () => {
    try {
      const res = await api.get('areas');
      setAreas(res.data.data);
    } catch (err) {
      console.error('Error fetching areas:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setModalType('add');
    setCurrentArea(null);
    setCityName('');
    setPincodes([]);
    setModalOpen(true);
  };

  const handleOpenEdit = (area) => {
    setModalType('edit');
    setCurrentArea(area);
    setCityName(area.cityName);
    setPincodes([...area.pincodes]);
    setModalOpen(true);
  };

  const handleAddPincode = (e) => {
    if (e.key === 'Enter' && pincodeInput.trim()) {
      if (!pincodes.includes(pincodeInput.trim())) {
        setPincodes([...pincodes, pincodeInput.trim()]);
      }
      setPincodeInput('');
    }
  };

  const removePincode = (pin) => {
    setPincodes(pincodes.filter(p => p !== pin));
  };

  const handleSubmit = async () => {
    if (!cityName) return alert('City name is required');
    try {
      if (modalType === 'add') {
        await api.post('areas', { cityName, pincodes });
      } else {
        await api.put(`areas/${currentArea._id}`, { cityName, pincodes });
      }
      setModalOpen(false);
      fetchAreas();
    } catch (err) {
      alert('Failed to save area');
    }
  };

  const handleDeleteArea = async (id) => {
    if (!window.confirm('Are you sure you want to remove this service area?')) return;
    try {
      await api.delete(`areas/${id}`);
      fetchAreas();
    } catch (err) {
      alert('Failed to delete area');
    }
  };

  return (
    <div className="areas-page">
      <div className="page-header">
        <div>
          <h1>Serviceable Areas</h1>
          <p>Manage the cities and specific pincodes where GharSeva operates.</p>
        </div>
        <button className="btn-primary" onClick={handleOpenAdd}>
          <Plus size={20} />
          <span>Add New City</span>
        </button>
      </div>

      <div className="content-grid">
        {loading ? (
          <div className="loading-state">Loading areas...</div>
        ) : (
          areas.map((area) => (
            <div key={area._id} className="area-card">
              <div className="area-card-header">
                <div className="city-info">
                  <div className="city-icon">
                    <Globe size={24} color="#4F46E5" />
                  </div>
                  <div>
                    <h3>{area.cityName}</h3>
                    <p>{area.pincodes?.length || 0} active pincodes</p>
                  </div>
                </div>
                <div className="area-actions">
                  <button className="btn-icon-sm" onClick={() => handleOpenEdit(area)} title="Manage Pincodes"><Edit3 size={16} /></button>
                  <button className="btn-icon-sm btn-danger-sm" onClick={() => handleDeleteArea(area._id)} title="Delete Area"><Trash2 size={16} /></button>
                </div>
              </div>

              <div className="pincode-grid">
                {area.pincodes?.map((pin, idx) => (
                  <div key={idx} className="pincode-badge">
                    <MapPin size={12} />
                    <span>{pin}</span>
                  </div>
                ))}
              </div>

              <div className="area-card-footer">
                <span className="status-indicator online">Service Active</span>
                <button className="btn-text-primary" onClick={() => handleOpenEdit(area)}>Add/Remove Pincodes</button>
              </div>
            </div>
          ))
        )}

        {!loading && areas.length === 0 && (
          <div className="empty-state">
            <MapPin size={48} color="#CBD5E1" />
            <h3>No Serviceable Areas</h3>
            <p>Start by adding a city and its serviceable pincodes.</p>
            <button className="btn-secondary" onClick={handleOpenAdd}>Add Your First Area</button>
          </div>
        )}
      </div>

      <Modal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        title={modalType === 'add' ? 'Add Serviceable City' : 'Manage Service Area'}
        footer={
          <>
            <button className="btn-outline" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn-primary" onClick={handleSubmit}>
              {modalType === 'add' ? 'Create Area' : 'Save Changes'}
            </button>
          </>
        }
      >
        <div className="city-input-group">
          <div className="flex-1">
            <Input 
              label="City Name" 
              value={cityName} 
              onChange={(e) => setCityName(e.target.value)} 
              placeholder="e.g. Kolkata"
            />
          </div>
          <button 
            className="btn-fetch-pincodes" 
            title="Auto-fetch Pincodes"
            onClick={async () => {
                if(!cityName) return alert('Enter city name first');
                try {
                    const response = await fetch(`https://api.postalpincode.in/postoffice/${cityName.trim()}`);
                    const data = await response.json();
                    
                    if (data[0] && data[0].Status === 'Success') {
                        const fetchedPins = data[0].PostOffice.map(po => po.Pincode);
                        const uniquePins = [...new Set([...pincodes, ...fetchedPins])];
                        setPincodes(uniquePins);
                    } else {
                        alert(`No pincodes found for "${cityName}". Please add manually.`);
                    }
                } catch (err) {
                    alert('Error connecting to Pincode API');
                }
            }}
          >
            <Globe size={18} />
            <span>Smart Fetch</span>
          </button>
        </div>
        
        <div className="pincode-manager">
          <label>Manage Pincodes</label>
          <div className="pincode-input-wrapper">
             <input 
               type="text" 
               value={pincodeInput} 
               onChange={(e) => setPincodeInput(e.target.value)}
               onKeyDown={handleAddPincode}
               placeholder="Type pincode and press Enter"
             />
             <button className="add-pin-btn" onClick={() => handleAddPincode({key: 'Enter'})}><Plus size={16} /></button>
          </div>
          
          <div className="pincode-tags">
            {pincodes.map((pin, idx) => (
              <div key={idx} className="pin-tag">
                <span>{pin}</span>
                <button onClick={() => removePincode(pin)}><X size={12} /></button>
              </div>
            ))}
            {pincodes.length === 0 && <p className="text-xs text-slate-400 mt-2">No pincodes added yet.</p>}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Areas;
