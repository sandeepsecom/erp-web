'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { amcApi, contactsApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store/auth.store';

interface Props {
  onClose: () => void;
}

export default function NewAmcModal({ onClose }: Props) {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [form, setForm] = useState({
    contractNumber: '',
    contactId: '',
    startDate: '',
    endDate: '',
    monthlyValue: '',
    annualValue: '',
    sites: '',
    servicesCctv: false,
    servicesSecurity: false,
    servicesFire: false,
    renewalReminderDays: '30',
    notes: '',
  });
  const [error, setError] = useState('');

  const { data: contactsData } = useQuery({
    queryKey: ['contacts-all'],
    queryFn: () => contactsApi.list({ limit: 100 }),
  });

  const contacts = (contactsData as any)?.data || [];

  const mutation = useMutation({
    mutationFn: () =>
      amcApi.create({
        ...form,
        companyId: user?.activeCompany?.id,
        monthlyValue: parseFloat(form.monthlyValue) || 0,
        annualValue: parseFloat(form.annualValue) || 0,
        renewalReminderDays: parseInt(form.renewalReminderDays) || 30,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['amc'] });
      queryClient.invalidateQueries({ queryKey: ['amc-summary'] });
      onClose();
    },
    onError: (err: any) => setError(err.message),
  });

  const set = (field: string, value: any) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  // Auto calculate annual from monthly
  const handleMonthlyChange = (val: string) => {
    set('monthlyValue', val);
    const monthly = parseFloat(val) || 0;
    set('annualValue', (monthly * 12).toString());
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">New AMC Contract</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{error}</div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Contract Number *</label>
              <input
                value={form.contractNumber}
                onChange={(e) => set('contractNumber', e.target.value)}
                placeholder="e.g. AMC/2025-26/001"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Customer *</label>
              <select
                value={form.contactId}
                onChange={(e) => set('contactId', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select customer...</option>
                {contacts.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName || `${c.firstName} ${c.lastName || ''}`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Start Date *</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => set('startDate', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">End Date *</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => set('endDate', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Monthly Value (₹)</label>
              <input
                type="number"
                value={form.monthlyValue}
                onChange={(e) => handleMonthlyChange(e.target.value)}
                placeholder="0"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Annual Value (₹)</label>
              <input
                type="number"
                value={form.annualValue}
                onChange={(e) => set('annualValue', e.target.value)}
                placeholder="0"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Renewal Reminder (days)</label>
              <input
                type="number"
                value={form.renewalReminderDays}
                onChange={(e) => set('renewalReminderDays', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">Sites Covered</label>
            <input
              value={form.sites}
              onChange={(e) => set('sites', e.target.value)}
              placeholder="e.g. Main Office, Warehouse, Branch"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-2">Services Included</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.servicesCctv}
                  onChange={(e) => set('servicesCctv', e.target.checked)}
                  className="w-4 h-4 text-blue-900"
                />
                <span className="text-sm text-gray-700">CCTV</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.servicesSecurity}
                  onChange={(e) => set('servicesSecurity', e.target.checked)}
                  className="w-4 h-4 text-blue-900"
                />
                <span className="text-sm text-gray-700">Security</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.servicesFire}
                  onChange={(e) => set('servicesFire', e.target.checked)}
                  className="w-4 h-4 text-blue-900"
                />
                <span className="text-sm text-gray-700">Fire</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors">
            Cancel
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={!form.contractNumber || !form.contactId || !form.startDate || !form.endDate || mutation.isPending}
            className="px-6 py-2 bg-blue-900 text-white rounded-lg text-sm font-medium hover:bg-blue-800 disabled:opacity-50 transition-colors"
          >
            {mutation.isPending ? 'Creating...' : 'Create Contract'}
          </button>
        </div>
      </div>
    </div>
  );
}