'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { leadsApi, contactsApi } from '@/lib/api';

interface Props {
  onClose: () => void;
}

export default function NewLeadModal({ onClose }: Props) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    title: '',
    expectedValue: '',
    probability: '50',
    stage: 'NEW',
    description: '',
    contactFirstName: '',
    contactLastName: '',
    contactCompany: '',
    contactEmail: '',
    contactPhone: '',
  });
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: async () => {
      let contactId: string | undefined;
      if (form.contactFirstName) {
        const contactRes: any = await contactsApi.create({
          firstName: form.contactFirstName,
          lastName: form.contactLastName,
          companyName: form.contactCompany,
          email: form.contactEmail,
          phone: form.contactPhone,
          type: 'LEAD',
        });
        contactId = contactRes.data.id;
      }
      return leadsApi.create({
        title: form.title,
        expectedValue: form.expectedValue ? parseFloat(form.expectedValue) : undefined,
        probability: parseInt(form.probability),
        stage: form.stage,
        description: form.description,
        contactId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads-kanban'] });
      queryClient.invalidateQueries({ queryKey: ['pipeline-summary'] });
      onClose();
    },
    onError: (err: any) => setError(err.message),
  });

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">New Lead</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{error}</div>
          )}

          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Lead Details</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Title *</label>
                <input
                  value={form.title}
                  onChange={(e) => set('title', e.target.value)}
                  placeholder="e.g. CCTV Installation — ABC Company"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Expected Value (₹)</label>
                  <input
                    type="number"
                    value={form.expectedValue}
                    onChange={(e) => set('expectedValue', e.target.value)}
                    placeholder="0"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Probability (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={form.probability}
                    onChange={(e) => set('probability', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Stage</label>
                  <select
                    value={form.stage}
                    onChange={(e) => set('stage', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="NEW">New</option>
                    <option value="CONTACTED">Contacted</option>
                    <option value="QUALIFIED">Qualified</option>
                    <option value="PROPOSAL">Proposal</option>
                    <option value="NEGOTIATION">Negotiation</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  rows={3}
                  placeholder="Notes about this lead..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Contact (optional)</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">First Name</label>
                  <input
                    value={form.contactFirstName}
                    onChange={(e) => set('contactFirstName', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Last Name</label>
                  <input
                    value={form.contactLastName}
                    onChange={(e) => set('contactLastName', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Company Name</label>
                <input
                  value={form.contactCompany}
                  onChange={(e) => set('contactCompany', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Email</label>
                  <input
                    type="email"
                    value={form.contactEmail}
                    onChange={(e) => set('contactEmail', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Phone</label>
                  <input
                    value={form.contactPhone}
                    onChange={(e) => set('contactPhone', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={!form.title || mutation.isPending}
            className="px-6 py-2 bg-blue-900 text-white rounded-lg text-sm font-medium hover:bg-blue-800 disabled:opacity-50 transition-colors"
          >
            {mutation.isPending ? 'Creating...' : 'Create Lead'}
          </button>
        </div>
      </div>
    </div>
  );
}