'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { amcApi, contactsApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store/auth.store';

interface Props {
  onClose: () => void;
  quotationId?: string;
  contactId?: string;
  totalAmount?: number;
}

export default function NewAmcModal({ onClose, quotationId, contactId, totalAmount }: Props) {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const today = new Date().toISOString().split('T')[0];
  const oneYearLater = new Date();
  oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
  const defaultEndDate = oneYearLater.toISOString().split('T')[0];

  const monthlyFromTotal = totalAmount ? Math.round(totalAmount / 12) : 0;

  const [form, setForm] = useState({
    contactId: contactId || '',
    startDate: today,
    endDate: defaultEndDate,
    monthlyValue: monthlyFromTotal ? String(monthlyFromTotal) : '',
    annualValue: totalAmount ? String(Math.round(totalAmount)) : '',
    sites: '',
    servicesCctv: false,
    servicesFire: false,
    servicesAlarm: false,
    servicesSprinkler: false,
    servicesPa: false,
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
        quotationId: quotationId || undefined,
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

  const handleMonthlyChange = (val: string) => {
    set('monthlyValue', val);
    const monthly = parseFloat(val) || 0;
    set('annualValue', (monthly * 12).toString());
  };

  const handleAnnualChange = (val: string) => {
    set('annualValue', val);
    const annual = parseFloat(val) || 0;
    set('monthlyValue', Math.round(annual / 12).toString());
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            {quotationId ? 'Convert to AMC Contract' : 'New AMC Contract'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{error}</div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-700">Contract number will be auto-generated (e.g. AMC/2025-26/001)</p>
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">Customer *</label>
            <select
              value={form.contactId}
              onChange={(e) => set('contactId', e.target.value)}
              disabled={!!contactId}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
            >
              <option value="">Select customer...</option>
              {contacts.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.companyName || `${c.firstName} ${c.lastName || ''}`}
                </option>
              ))}
            </select>
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
                onChange={(e) => handleAnnualChange(e.target.value)}
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
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: 'servicesCctv', label: 'CCTV' },
                { key: 'servicesFire', label: 'Fire' },
                { key: 'servicesAlarm', label: 'Intrusion Alarm' },
                { key: 'servicesSprinkler', label: 'Sprinklers' },
                { key: 'servicesPa', label: 'PA System' },
              ].map((s) => (
                <label key={s.key} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(form as any)[s.key]}
                    onChange={(e) => set(s.key, e.target.checked)}
                    className="w-4 h-4 text-blue-900"
                  />
                  <span className="text-sm text-gray-700">{s.label}</span>
                </label>
              ))}
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
            disabled={!form.contactId || !form.startDate || !form.endDate || mutation.isPending}
            className="px-6 py-2 bg-blue-900 text-white rounded-lg text-sm font-medium hover:bg-blue-800 disabled:opacity-50 transition-colors"
          >
            {mutation.isPending ? 'Creating...' : quotationId ? 'Create AMC Contract' : 'Create Contract'}
          </button>
        </div>
      </div>
    </div>
  );
}