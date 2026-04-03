import React, { useEffect, useState } from 'react';
import { Settings as SettingsIcon, Save, Shield, Percent, Zap, Crown } from 'lucide-react';
import api from '../services/api';
import Input from '../components/Input';
import './Settings.css';

const Settings = () => {
  const [settings, setSettings] = useState({
    platformFeeType: 'fixed',
    platformFeeValue: 29,
    proCommission: 0,
    isPremiumEnabled: false,
    isLuxuryEnabled: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get('admin/settings');
      if (res.data.data) {
        setSettings(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch('admin/settings', settings);
      alert('Global configuration updated successfully!');
    } catch (err) {
      alert('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading-state">Loading global configurations...</div>;

  return (
    <div className="settings-page">
      <div className="page-header">
        <div>
          <h1>Platform Settings</h1>
          <p>Configure global fees, commission models, and service availability.</p>
        </div>
        <button className="btn-primary" onClick={handleSave} disabled={saving}>
          <Save size={20} />
          <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
        </button>
      </div>

      <div className="settings-grid">
        <div className="settings-section premium-config-card">
          <div className="section-header">
            <Percent size={20} color="#10B981" />
            <h3>Fee Management</h3>
          </div>
          <div className="section-content">
            <div className="billing-model-selector mb-6">
               <label className="block text-sm font-bold text-slate-700 mb-3">Billing Calculation Model</label>
               <div className="model-toggle-group">
                  <button 
                    className={`model-btn ${settings.platformFeeType === 'fixed' ? 'active' : ''}`}
                    onClick={() => setSettings({...settings, platformFeeType: 'fixed'})}
                  >
                    Fixed
                  </button>
                  <button 
                    className={`model-btn ${settings.platformFeeType === 'percentage' ? 'active' : ''}`}
                    onClick={() => setSettings({...settings, platformFeeType: 'percentage'})}
                  >
                    Variable %
                  </button>
               </div>
            </div>

            <div className="active-fee-input mb-4">
               <Input 
                 label={settings.platformFeeType === 'fixed' ? "Flat Platform Fee (₹)" : "Variable Fee Percentage (%)"} 
                 type="number"
                 value={settings.platformFeeValue}
                 onChange={(e) => setSettings({
                   ...settings, 
                   platformFeeValue: Number(e.target.value)
                 })}
                 placeholder={settings.platformFeeType === 'fixed' ? "e.g. 29" : "e.g. 10"}
               />
            </div>

            <hr className="my-6 border-slate-100" />

            <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <Input 
                  label="Technician Commission (%)" 
                  type="number"
                  value={settings.workerCommissionPercentage}
                  onChange={(e) => setSettings({...settings, workerCommissionPercentage: Number(e.target.value)})}
                  placeholder="e.g. 10"
                />
                <Input 
                  label="Daily Job Threshold" 
                  type="number"
                  value={settings.minJobsForCommission}
                  onChange={(e) => setSettings({...settings, minJobsForCommission: Number(e.target.value)})}
                  placeholder="e.g. 10"
                />
            </div>
            <p className="setting-hint">Commission will ONLY be deducted after the professional completes {settings.minJobsForCommission || 10} jobs in a day.</p>
          </div>
        </div>

        <div className="settings-section">
          <div className="section-header">
            <Shield size={20} color="#10B981" />
            <h3>Service Accessibility</h3>
          </div>
          <div className="section-content">
            <div className="toggle-item">
              <div className="toggle-info">
                <p className="toggle-label font-bold"><Crown size={16} color="#F59E0B" /> Enable Premium Tier (Packages)</p>
                <p className="toggle-desc">Toggle visibility for premium household subscription packages.</p>
              </div>
              <label className="switch">
                <input 
                  type="checkbox" 
                  checked={settings.isPremiumEnabled}
                  onChange={(e) => setSettings({...settings, isPremiumEnabled: e.target.checked})}
                />
                <span className="slider round"></span>
              </label>
            </div>

            <div className="toggle-item">
              <div className="toggle-info">
                <p className="toggle-label font-bold"><Zap size={16} color="#7C3AED" /> Enable Luxury Tier (Packages)</p>
                <p className="toggle-desc">Toggle visibility for luxury subscription plans.</p>
              </div>
              <label className="switch">
                <input 
                  type="checkbox" 
                  checked={settings.isLuxuryEnabled}
                  onChange={(e) => setSettings({...settings, isLuxuryEnabled: e.target.checked})}
                />
                <span className="slider round"></span>
              </label>
            </div>
          </div>
        </div>

        <div className="settings-section">
             <div className="section-header">
                <Zap size={20} color="#F59E0B" />
                <h3>System Information</h3>
             </div>
             <div className="section-content">
                <div className="info-row">
                   <span>Server Status</span>
                   <span className="status-indicator online">Connected</span>
                </div>
                <div className="info-row">
                   <span>Environment</span>
                   <span className="status-indicator">Production</span>
                </div>
             </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
