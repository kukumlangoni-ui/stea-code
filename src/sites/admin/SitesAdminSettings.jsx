import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth.js';
import { logAdminActivity } from '../../utils/siteAnalytics.js';

const DEFAULT_SETTINGS = {
  general_productName: 'STEA',
  general_publicDescription: 'Discover the best websites on the internet.',
  general_maintenanceNotice: '',
  general_contactEmail: 'hello@stea.africa',
  
  discovery_popularEnabled: true,
  discovery_recentEnabled: true,
  discovery_trendingEnabled: true,
  discovery_maxPopularItems: 16,
  
  members_registrationEnabled: true,
  members_googleSignIn: true,
  members_emailSignIn: true,
  
  submissions_enabled: true,
  submissions_requireSignIn: true,
  submissions_autoNotify: false,
  
  monetization_adsEnabled: false,
  monetization_sponsoredListings: false,
  
  pwa_installBannerEnabled: true,
  pwa_bannerCooldownDays: 3
};

export default function SitesAdminSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchSettings = async () => {
      try {
        const { getFirebaseDb, doc, getDoc } = await import('../../firebase.js');
        const db = getFirebaseDb();
        const snap = await getDoc(doc(db, "sites_config", "main"));
        if (!isMounted) return;
        if (snap.exists()) {
          setSettings({ ...DEFAULT_SETTINGS, ...snap.data() });
        }
      } catch (e) {
        console.error("Failed to fetch settings, using defaults", e);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchSettings();
    return () => { isMounted = false; };
  }, []);

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { getFirebaseDb, doc, setDoc } = await import('../../firebase.js');
      const db = getFirebaseDb();
      await setDoc(doc(db, "sites_config", "main"), settings, { merge: true });
      await logAdminActivity(user, 'settings_updated', 'config', 'main', {});
      alert("Settings saved successfully.");
    } catch (e) {
      alert("Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  const Section = ({ title, children }) => (
    <div style={{ marginBottom: 32, background: 'rgba(255,255,255,0.02)', padding: 24, borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)' }}>
      <h2 style={{ fontSize: 18, marginBottom: 16, color: '#F5A623' }}>{title}</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
        {children}
      </div>
    </div>
  );

  const InputRow = ({ label, type = "text", id, ...props }) => (
    <div>
      <label style={{ display: 'block', fontSize: 12, marginBottom: 4, color: 'rgba(255,255,255,0.6)' }}>{label}</label>
      {type === 'checkbox' ? (
        <div style={{ display: 'flex', alignItems: 'center', height: 40 }}>
          <input type="checkbox" id={id} checked={settings[id]} onChange={e => handleChange(id, e.target.checked)} {...props} />
          <span style={{ marginLeft: 8 }}>Enabled</span>
        </div>
      ) : (
        <input 
          type={type} 
          id={id} 
          value={settings[id]} 
          onChange={e => handleChange(id, type === 'number' ? Number(e.target.value) : e.target.value)} 
          style={{ width: '100%', padding: '10px', background: '#111', color: '#fff', border: '1px solid #333', borderRadius: 8 }} 
          {...props} 
        />
      )}
    </div>
  );

  return (
    <div style={{ color: '#F0F2F5', maxWidth: 1000 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, margin: 0 }}>Sites Settings</h1>
        <button onClick={handleSave} disabled={saving || loading} style={{ padding: '8px 24px', background: '#F5A623', color: '#000', border: 'none', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer' }}>
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
      
      {loading ? <p>Loading settings...</p> : (
        <form onSubmit={handleSave}>
          <Section title="General">
            <InputRow label="Product Name" id="general_productName" />
            <InputRow label="Public Description" id="general_publicDescription" />
            <InputRow label="Maintenance Notice (Empty to disable)" id="general_maintenanceNotice" />
            <InputRow label="Contact Email" type="email" id="general_contactEmail" />
          </Section>
          
          <Section title="Discovery Features">
            <InputRow label="Popular Section" type="checkbox" id="discovery_popularEnabled" />
            <InputRow label="Recently Added Section" type="checkbox" id="discovery_recentEnabled" />
            <InputRow label="Trending Section" type="checkbox" id="discovery_trendingEnabled" />
            <InputRow label="Max Popular Items" type="number" id="discovery_maxPopularItems" />
          </Section>
          
          <Section title="Members & Authentication">
            <InputRow label="Allow Registration" type="checkbox" id="members_registrationEnabled" />
            <InputRow label="Google Sign-In" type="checkbox" id="members_googleSignIn" />
            <InputRow label="Email Sign-In" type="checkbox" id="members_emailSignIn" />
          </Section>
          
          <Section title="Submissions">
            <InputRow label="Accept Submissions" type="checkbox" id="submissions_enabled" />
            <InputRow label="Require Sign-In to Submit" type="checkbox" id="submissions_requireSignIn" />
          </Section>
          
          <Section title="Monetization">
            <InputRow label="Display Ads" type="checkbox" id="monetization_adsEnabled" />
            <InputRow label="Sponsored Listings" type="checkbox" id="monetization_sponsoredListings" />
          </Section>
          
          <Section title="PWA & Mobile">
            <InputRow label="Install Banner" type="checkbox" id="pwa_installBannerEnabled" />
            <InputRow label="Banner Cooldown (Days)" type="number" id="pwa_bannerCooldownDays" />
          </Section>
        </form>
      )}
    </div>
  );
}
