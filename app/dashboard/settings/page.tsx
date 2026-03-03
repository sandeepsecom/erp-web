'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/lib/store/auth.store';
import { api } from '@/lib/api';

const STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Puducherry',
];

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState('company');
  const [logoUploading, setLogoUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: '',
    legalName: '',
    gstin: '',
    pan: '',
    phone: '',
    email: '',
    addressLine1: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    logoUrl: '',
    bankName: '',
    bankAccountNumber: '',
    bankIfsc: '',
    bankAccountName: '',
    bankBranch: '',
    sendgridApiKey: '',
    emailFromAddress: '',
    emailFromName: '',
    internalEmailCC: '',
  });

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get('/core/company');
        const c = (res as any)?.data;
        if (c) {
          setForm({
            name: c.name || '',
            legalName: c.legalName || '',
            gstin: c.gstin || '',
            pan: c.pan || '',
            phone: c.phone || '',
            email: c.email || '',
            addressLine1: c.addressLine1 || '',
            city: c.city || '',
            state: c.state || '',
            pincode: c.pincode || '',
            country: c.country || 'India',
            logoUrl: c.logoUrl || '',
            bankName: c.bankName || '',
            bankAccountNumber: c.bankAccountNumber || '',
            bankIfsc: c.bankIfsc || '',
            bankAccountName: c.bankAccountName || '',
            bankBranch: c.bankBranch || '',
            sendgridApiKey: c.sendgridApiKey || '',
            emailFromAddress: c.emailFromAddress || '',
            emailFromName: c.emailFromName || '',
            internalEmailCC: (c.internalEmailCC || []).join(', '),
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user?.activeCompany?.id]);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: any = { ...form };
      payload.internalEmailCC = form.internalEmailCC
        .split(',')
        .map((e) => e.trim())
        .filter(Boolean);
      await api.patch('/core/company', payload);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoUploading(true);
    try {
      // Convert to base64 for preview (in production use a proper upload service)
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        setForm((prev) => ({ ...prev, logoUrl: dataUrl }));
        setLogoUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setLogoUploading(false);
    }
  };

  const tabs = [
    { id: 'company', label: '🏢 Company Info' },
    { id: 'bank', label: '🏦 Bank Details' },
    { id: 'email', label: '✉️ Email Config' },
  ];

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-gray-500">Loading settings...</p>
    </div>
  );

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Company Settings</h1>
          <p className="text-sm text-gray-500 mt-1">{user?.activeCompany?.name}</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2 bg-blue-900 text-white rounded-lg text-sm font-semibold hover:bg-blue-800 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving...' : saved ? '✅ Saved!' : 'Save Changes'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-blue-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Company Info Tab */}
      {activeTab === 'company' && (
        <div className="space-y-5">
          {/* Logo */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Company Logo</h3>
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50">
                {form.logoUrl ? (
                  <img src={form.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <span className="text-3xl">🏢</span>
                )}
              </div>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={logoUploading}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                >
                  {logoUploading ? 'Uploading...' : '📁 Upload Logo'}
                </button>
                <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 2MB</p>
                {form.logoUrl && (
                  <button
                    onClick={() => setForm((prev) => ({ ...prev, logoUrl: '' }))}
                    className="text-xs text-red-500 hover:text-red-700 mt-1 block"
                  >
                    Remove logo
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Basic Info */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Company Name *</label>
                <input
                  value={form.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Legal Name</label>
                <input
                  value={form.legalName}
                  onChange={(e) => handleChange('legalName', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">GSTIN</label>
                <input
                  value={form.gstin}
                  onChange={(e) => handleChange('gstin', e.target.value.toUpperCase())}
                  placeholder="27AABCS1234A1Z5"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">PAN</label>
                <input
                  value={form.pan}
                  onChange={(e) => handleChange('pan', e.target.value.toUpperCase())}
                  placeholder="AABCS1234A"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Phone</label>
                <input
                  value={form.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Address</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Address Line 1</label>
                <input
                  value={form.addressLine1}
                  onChange={(e) => handleChange('addressLine1', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">City</label>
                  <input
                    value={form.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">State</label>
                  <select
                    value={form.state}
                    onChange={(e) => handleChange('state', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  >
                    <option value="">Select state</option>
                    {STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Pincode</label>
                  <input
                    value={form.pincode}
                    onChange={(e) => handleChange('pincode', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bank Details Tab */}
      {activeTab === 'bank' && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Bank Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Bank Name</label>
              <input
                value={form.bankName}
                onChange={(e) => handleChange('bankName', e.target.value)}
                placeholder="Kotak Mahindra Bank"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Account Name</label>
              <input
                value={form.bankAccountName}
                onChange={(e) => handleChange('bankAccountName', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Account Number</label>
              <input
                value={form.bankAccountNumber}
                onChange={(e) => handleChange('bankAccountNumber', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">IFSC Code</label>
              <input
                value={form.bankIfsc}
                onChange={(e) => handleChange('bankIfsc', e.target.value.toUpperCase())}
                placeholder="KKBK0000651"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-mono"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-500 mb-1">Branch</label>
              <input
                value={form.bankBranch}
                onChange={(e) => handleChange('bankBranch', e.target.value)}
                placeholder="Andheri East, Mumbai"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
            </div>
          </div>
        </div>
      )}

      {/* Email Config Tab */}
      {activeTab === 'email' && (
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-1">SendGrid Configuration</h3>
            <p className="text-xs text-gray-500 mb-4">Used for AMC renewal reminders and other automated emails.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">SendGrid API Key</label>
                <input
                  type="password"
                  value={form.sendgridApiKey}
                  onChange={(e) => handleChange('sendgridApiKey', e.target.value)}
                  placeholder="SG.xxxxxxxx"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">From Email Address</label>
                  <input
                    type="email"
                    value={form.emailFromAddress}
                    onChange={(e) => handleChange('emailFromAddress', e.target.value)}
                    placeholder="info@yourcompany.com"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">From Name</label>
                  <input
                    value={form.emailFromName}
                    onChange={(e) => handleChange('emailFromName', e.target.value)}
                    placeholder="Securizen"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Internal Team Emails (CC)</label>
                <input
                  value={form.internalEmailCC}
                  onChange={(e) => handleChange('internalEmailCC', e.target.value)}
                  placeholder="manager@company.com, ceo@company.com"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
                <p className="text-xs text-gray-400 mt-1">Separate multiple emails with commas</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
            <p className="text-xs text-blue-800 font-medium">💡 How to get a SendGrid API Key</p>
            <ol className="text-xs text-blue-700 mt-2 space-y-1 list-decimal list-inside">
              <li>Go to sendgrid.com and sign in</li>
              <li>Navigate to Settings → API Keys</li>
              <li>Click Create API Key → Full Access</li>
              <li>Copy and paste the key above</li>
              <li>Make sure your From Email is verified in SendGrid</li>
            </ol>
          </div>
        </div>
      )}

      {/* Save button at bottom */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-blue-900 text-white rounded-lg text-sm font-semibold hover:bg-blue-800 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving...' : saved ? '✅ Saved!' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}