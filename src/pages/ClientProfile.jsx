import React, { useState, useEffect, useRef } from 'react';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';
import {
  Building2,
  Globe,
  Mail,
  Phone,
  User,
  CheckCircle2,
  Share2,
  Plus,
  Trash2,
  Save,
  Palette,
  Languages,
  Target
} from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import Modal from '../components/common/Modal';
import { SOCIAL_PLATFORMS, INDUSTRY_OPTIONS, getPlatformMeta } from '../constants/platforms';

export default function ClientProfile() {
  const { clients, updateClientProfile } = useAppData();
  const { user, activeRole } = useAuth();

  // Find client record matching active session
  const userClient = clients.find(c =>
    (c.account_id && String(c.account_id) === String(user?.id)) ||
    (c.id && String(c.id) === String(user?.clientId)) ||
    (c.email && c.email.toLowerCase() === user?.email?.toLowerCase()) ||
    (c.name && c.name.toLowerCase() === user?.name?.toLowerCase())
  );

  const [selectedClientId, setSelectedClientId] = useState(() => {
    if (activeRole === 'client') {
      return userClient ? (userClient.id || userClient.account_id) : (user?.id || user?.clientId || 'current-client');
    }
    return clients[0]?.id || clients[0]?.account_id || (user?.id || 'current-client');
  });

  const currentClient = clients.find(c =>
    (c.id && String(c.id) === String(selectedClientId)) ||
    (c.account_id && String(c.account_id) === String(selectedClientId))
  ) || userClient || {
    id: selectedClientId,
    account_id: selectedClientId,
    business_name: user?.name || '',
    contactPerson: user?.name || '',
    contactEmail: user?.email || '',
    industry: INDUSTRY_OPTIONS[0],
    socialAccounts: []
  };

  // Controlled form states
  const [businessName, setBusinessName] = useState(() => currentClient.business_name || currentClient.name || user?.name || '');
  const [businessDescription, setBusinessDescription] = useState(() => currentClient.brandDescription || currentClient.brand_description || '');
  const [industry, setIndustry] = useState(() => currentClient.industry || currentClient.sector || INDUSTRY_OPTIONS[0]);
  const [website, setWebsite] = useState(() => currentClient.website || '');
  const [contactPerson, setContactPerson] = useState(() => currentClient.contactPerson || currentClient.contact_person || user?.name || '');
  const [contactEmail, setContactEmail] = useState(() => currentClient.contactEmail || currentClient.email || user?.email || '');
  const [contactPhone, setContactPhone] = useState(() => currentClient.contactPhone || currentClient.phone || '');
  const [productsOrServices, setProductsOrServices] = useState(() => currentClient.productsOrServices || '');
  const [targetAudience, setTargetAudience] = useState(() => currentClient.targetAudience || '');
  const [brandColors, setBrandColors] = useState(() => currentClient.brandColors || '#0F172A, #4F46E5, #38BDF8');
  const [preferredLanguage, setPreferredLanguage] = useState(() => currentClient.preferredLanguage || 'English');
  const [socialAccounts, setSocialAccounts] = useState(() => currentClient.socialAccounts || []);

  // Modal & notification states
  const [isAddSocialModalOpen, setIsAddSocialModalOpen] = useState(false);
  const [newSocPlatform, setNewSocPlatform] = useState('instagram');
  const [newSocAccountName, setNewSocAccountName] = useState('');
  const [newSocUsername, setNewSocUsername] = useState('');
  const [newSocStatus, setNewSocStatus] = useState('Active');
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);

  // Track the last loaded client ID so we ONLY sync when selected client changes (never on keystrokes!)
  const lastLoadedClientIdRef = useRef(null);

  useEffect(() => {
    const activeId = currentClient?.id || currentClient?.account_id;
    if (activeId && activeId !== lastLoadedClientIdRef.current) {
      lastLoadedClientIdRef.current = activeId;
      setBusinessName(currentClient.business_name || currentClient.name || '');
      setBusinessDescription(currentClient.brandDescription || currentClient.brand_description || '');
      setIndustry(currentClient.industry || currentClient.sector || INDUSTRY_OPTIONS[0]);
      setWebsite(currentClient.website || '');
      setContactPerson(currentClient.contactPerson || currentClient.contact_person || '');
      setContactEmail(currentClient.contactEmail || currentClient.email || '');
      setContactPhone(currentClient.contactPhone || currentClient.phone || '');
      setProductsOrServices(currentClient.productsOrServices || '');
      setTargetAudience(currentClient.targetAudience || '');
      setBrandColors(currentClient.brandColors || '#0F172A, #4F46E5, #38BDF8');
      setPreferredLanguage(currentClient.preferredLanguage || 'English');
      setSocialAccounts(currentClient.socialAccounts || []);
    }
  }, [selectedClientId, currentClient?.id, currentClient?.account_id]);

  const handleSaveProfile = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const targetId = currentClient.id || currentClient.account_id || selectedClientId;

    updateClientProfile(targetId, {
      name: businessName,
      business_name: businessName,
      brandDescription: businessDescription,
      brand_description: businessDescription,
      industry,
      sector: industry,
      website,
      contactPerson,
      contact_person: contactPerson,
      contactEmail,
      contactPhone,
      phone: contactPhone,
      productsOrServices,
      targetAudience,
      brandColors,
      preferredLanguage,
      socialAccounts
    });

    setSaveSuccessNotice(true);
    setTimeout(() => {
      setSaveSuccessNotice(false);
    }, 4000);
  };

  const handleAddSocialAccount = (e) => {
    e.preventDefault();
    if (!newSocAccountName.trim() || !newSocUsername.trim()) return;

    const formattedUsername = newSocUsername.trim().startsWith('@')
      ? newSocUsername.trim()
      : `@${newSocUsername.trim()}`;

    const newAcc = {
      id: `SOC-${Date.now()}`,
      platform: newSocPlatform,
      accountName: newSocAccountName.trim(),
      username: formattedUsername,
      status: newSocStatus
    };

    const updated = [...socialAccounts, newAcc];
    setSocialAccounts(updated);
    setIsAddSocialModalOpen(false);
    setNewSocAccountName('');
    setNewSocUsername('');
    setNewSocStatus('Active');
  };

  const handleRemoveSocialAccount = (accId) => {
    const updated = socialAccounts.filter(a => a.id !== accId);
    setSocialAccounts(updated);
  };

  return (
    <div className="page-wrapper">
      <PageHeader
        title="Client Business Profile & Social Accounts"
        description="Configure your official brand identity, target demographic, and connected social media profiles."
        badge="Brand Identity Hub"
        actions={
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {activeRole === 'admin' && clients.length > 1 && (
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="saas-input"
                style={{ width: 'auto', padding: '6px 12px', fontSize: '13px' }}
              >
                {clients.map(c => (
                  <option key={c.id || c.account_id} value={c.id || c.account_id}>
                    {c.name || c.business_name}
                  </option>
                ))}
              </select>
            )}
            <button type="button" onClick={handleSaveProfile} className="btn-primary">
              <Save size={15} />
              <span>Save Profile Changes</span>
            </button>
          </div>
        }
      />

      {saveSuccessNotice && (
        <div style={{
          backgroundColor: 'var(--success-subtle)',
          border: '1px solid var(--success-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '14px 18px',
          marginBottom: '22px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <CheckCircle2 size={18} color="var(--success)" />
          <div style={{ fontSize: '13px', color: 'var(--success-text)', fontWeight: 600 }}>
            Client business profile & connected social handles saved successfully!
          </div>
        </div>
      )}

      <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Section 1: Business Identity Information */}
        <div className="bento-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
            <Building2 size={18} color="var(--accent-primary)" />
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
              1. Business Information & Core Identity
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '18px' }}>
            <div className="saas-form-group">
              <label className="saas-label">Business / Brand Name <span style={{ color: 'var(--danger)' }}>*</span></label>
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="saas-input"
                placeholder="e.g. Chakankar Digital Innovations"
              />
            </div>

            <div className="saas-form-group">
              <label className="saas-label">Industry Classification <span style={{ color: 'var(--danger)' }}>*</span></label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="saas-input"
              >
                {INDUSTRY_OPTIONS.map((ind) => (
                  <option key={ind} value={ind}>{ind}</option>
                ))}
              </select>
            </div>

            <div className="saas-form-group">
              <label className="saas-label">Official Website URL</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="saas-input"
                  style={{ paddingLeft: '36px' }}
                  placeholder="https://yourbrand.com"
                />
                <Globe size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </div>

            <div className="saas-form-group">
              <label className="saas-label">Primary Contact Person</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  className="saas-input"
                  style={{ paddingLeft: '36px' }}
                  placeholder="e.g. Sai Chakankar"
                />
                <User size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </div>

            <div className="saas-form-group">
              <label className="saas-label">Contact Work Email</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="saas-input"
                  style={{ paddingLeft: '36px' }}
                  placeholder="saichakankar@gmail.com"
                />
                <Mail size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </div>

            <div className="saas-form-group">
              <label className="saas-label">Contact Phone / WhatsApp</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="saas-input"
                  style={{ paddingLeft: '36px' }}
                  placeholder="+91 98765 43210"
                />
                <Phone size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </div>
          </div>

          <div className="saas-form-group" style={{ marginTop: '12px' }}>
            <label className="saas-label">Business & Brand Description</label>
            <textarea
              rows={3}
              value={businessDescription}
              onChange={(e) => setBusinessDescription(e.target.value)}
              className="saas-input"
              placeholder="Describe your brand values, market positioning, and core value proposition..."
              style={{ resize: 'vertical' }}
            />
          </div>
        </div>

        {/* Section 2: Products, Audience & Brand Guidelines */}
        <div className="bento-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
            <Target size={18} color="var(--accent-blue)" />
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
              2. Target Demographic & Brand Guidelines
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '18px' }}>
            <div className="saas-form-group">
              <label className="saas-label">Products or Services Offered</label>
              <input
                type="text"
                value={productsOrServices}
                onChange={(e) => setProductsOrServices(e.target.value)}
                className="saas-input"
                placeholder="e.g. Cloud Automation & AI-Driven Infrastructure Solutions"
              />
            </div>

            <div className="saas-form-group">
              <label className="saas-label">Target Audience & Customer Persona</label>
              <input
                type="text"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                className="saas-input"
                placeholder="e.g. CTOs, DevOps Engineers, and Enterprise Leads aged 25-45"
              />
            </div>

            <div className="saas-form-group">
              <label className="saas-label">Primary Brand Colors (Hex Codes)</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={brandColors}
                  onChange={(e) => setBrandColors(e.target.value)}
                  className="saas-input"
                  style={{ paddingLeft: '36px' }}
                  placeholder="#0F172A, #4F46E5, #38BDF8"
                />
                <Palette size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </div>

            <div className="saas-form-group">
              <label className="saas-label">Preferred Content Language</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={preferredLanguage}
                  onChange={(e) => setPreferredLanguage(e.target.value)}
                  className="saas-input"
                  style={{ paddingLeft: '36px' }}
                  placeholder="e.g. English, Hindi, Bilingual"
                />
                <Languages size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Connected Social Media Accounts (The 7 Canonical Platforms) */}
        <div className="bento-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Share2 size={18} color="var(--accent-purple)" />
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  3. Associated Social Media Accounts
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Active profiles across the 7 supported agency platforms
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsAddSocialModalOpen(true)}
              className="btn-secondary"
              style={{ fontSize: '12.5px', padding: '6px 12px' }}
            >
              <Plus size={14} />
              <span>+ Associate Social Profile</span>
            </button>
          </div>

          {socialAccounts.length === 0 ? (
            <div style={{
              border: '1px dashed var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '32px 20px',
              textAlign: 'center',
              backgroundColor: 'var(--bg-subtle)'
            }}>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                No social profiles linked yet.
              </p>
              <p style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                Click "+ Associate Social Profile" above to connect Instagram, Facebook, YouTube, LinkedIn, WhatsApp Business, X, or Pinterest handles.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '14px' }}>
              {socialAccounts.map((acc) => {
                const pMeta = getPlatformMeta(acc.platform);
                return (
                  <div
                    key={acc.id}
                    style={{
                      padding: '14px 16px',
                      borderRadius: 'var(--radius-lg)',
                      border: '1px solid var(--border-subtle)',
                      backgroundColor: 'var(--bg-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: pMeta.color + '18',
                        color: pMeta.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '14px'
                      }}>
                        {pMeta.shortName.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {acc.accountName}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--accent-primary)', fontWeight: 500 }}>
                          {acc.username}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className={`badge ${acc.status === 'Active' ? 'badge-success' : 'badge-neutral'}`} style={{ fontSize: '10px' }}>
                        {acc.status}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSocialAccount(acc.id)}
                        className="btn-ghost"
                        style={{ padding: '4px', color: 'var(--danger-text)' }}
                        title="Remove Account"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Form Submit Row */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginBottom: '32px' }}>
          <button type="submit" className="btn-primary" style={{ padding: '12px 28px', fontSize: '14px' }}>
            <Save size={16} />
            <span>Save & Publish Brand Profile</span>
          </button>
        </div>
      </form>

      {/* Associate Social Account Modal */}
      <Modal
        isOpen={isAddSocialModalOpen}
        onClose={() => setIsAddSocialModalOpen(false)}
        title="Associate Social Account"
        subtitle="Connect one of the 7 official supported platforms"
      >
        <form onSubmit={handleAddSocialAccount} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="saas-form-group">
            <label className="saas-label">Social Platform</label>
            <select
              value={newSocPlatform}
              onChange={(e) => setNewSocPlatform(e.target.value)}
              className="saas-input"
            >
              {SOCIAL_PLATFORMS.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="saas-form-group">
            <label className="saas-label">Public Profile / Account Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Chakankar Digital Official"
              value={newSocAccountName}
              onChange={(e) => setNewSocAccountName(e.target.value)}
              className="saas-input"
            />
          </div>

          <div className="saas-form-group">
            <label className="saas-label">Username / Handle</label>
            <input
              type="text"
              required
              placeholder="e.g. @chakankardigital"
              value={newSocUsername}
              onChange={(e) => setNewSocUsername(e.target.value)}
              className="saas-input"
            />
          </div>

          <div className="saas-form-group">
            <label className="saas-label">Account Status</label>
            <select
              value={newSocStatus}
              onChange={(e) => setNewSocStatus(e.target.value)}
              className="saas-input"
            >
              <option value="Active">Active</option>
              <option value="Pending">Pending Verification</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button
              type="button"
              onClick={() => setIsAddSocialModalOpen(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
            >
              Link Account
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
