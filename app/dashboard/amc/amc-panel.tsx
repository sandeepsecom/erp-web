'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { amcApi } from '@/lib/api';

interface Props {
  contractId: string;
  onClose: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  PENDING_RENEWAL: 'bg-yellow-100 text-yellow-700',
  RENEWED: 'bg-blue-100 text-blue-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Active',
  PENDING_RENEWAL: 'Pending Renewal',
  RENEWED: 'Renewed',
  CANCELLED: 'Cancelled',
};

function formatCurrency(value: any) {
  const num = Number(value) || 0;
  return `₹${num.toLocaleString('en-IN')}`;
}

function formatDate(date: string) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function daysUntil(date: string) {
  const diff = new Date(date).getTime() - new Date().getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function AmcPanel({ contractId, onClose }: Props) {
  const queryClient = useQueryClient();
  const [showRenew, setShowRenew] = useState(false);
  const [renewForm, setRenewForm] = useState({
    newEndDate: '',
    monthlyValue: '',
    annualValue: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['amc-contract', contractId],
    queryFn: () => amcApi.get(contractId),
  });

  const cancelMutation = useMutation({
    mutationFn: () => amcApi.cancel(contractId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['amc'] });
      queryClient.invalidateQueries({ queryKey: ['amc-summary'] });
      queryClient.invalidateQueries({ queryKey: ['amc-contract', contractId] });
    },
  });

  const renewMutation = useMutation({
    mutationFn: () =>
      amcApi.renew(contractId, {
        newEndDate: renewForm.newEndDate,
        monthlyValue: parseFloat(renewForm.monthlyValue) || c?.monthlyValue,
        annualValue: parseFloat(renewForm.annualValue) || c?.annualValue,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['amc'] });
      queryClient.invalidateQueries({ queryKey: ['amc-summary'] });
      queryClient.invalidateQueries({ queryKey: ['amc-contract', contractId] });
      setShowRenew(false);
    },
  });

  const c = (data as any)?.data;
  const days = c ? daysUntil(c.endDate) : 0;

  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="flex-1 bg-black/30" onClick={onClose} />
      <div className="w-full max-w-2xl bg-white shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-900">{c?.contractNumber || 'Contract'}</h2>
            {c?.status && (
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[c.status]}`}>
                {STATUS_LABELS[c.status]}
              </span>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center text-gray-500">Loading...</div>
        ) : c ? (
          <div className="flex-1 overflow-y-auto">

            {c.status === 'PENDING_RENEWAL' && (
              <div className="mx-6 mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800 font-medium">
                  ⚠️ {days > 0 ? `Expires in ${days} days` : 'Contract has expired'} — Renewal required
                </p>
              </div>
            )}

            <div className="px-6 py-4 border-b bg-gray-50">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Customer</p>
                  <p className="text-sm font-medium text-gray-800 mt-0.5">
                    {c.contact?.companyName || `${c.contact?.firstName} ${c.contact?.lastName || ''}`}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Sites Covered</p>
                  <p className="text-sm font-medium text-gray-800 mt-0.5">{c.sites || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Start Date</p>
                  <p className="text-sm font-medium text-gray-800 mt-0.5">{formatDate(c.startDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">End Date</p>
                  <p className="text-sm font-medium text-gray-800 mt-0.5">{formatDate(c.endDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Monthly Value</p>
                  <p className="text-sm font-medium text-gray-800 mt-0.5">{formatCurrency(c.monthlyValue)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Annual Value</p>
                  <p className="text-sm font-medium text-gray-800 mt-0.5">{formatCurrency(c.annualValue)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Renewal Reminder</p>
                  <p className="text-sm font-medium text-gray-800 mt-0.5">{c.renewalReminderDays} days before expiry</p>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-b">
              <p className="text-xs text-gray-500 mb-2">Services Included</p>
              <div className="flex gap-2">
                {c.servicesCctv && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">CCTV</span>}
                {c.servicesSecurity && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Security</span>}
                {c.servicesFire && <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">Fire</span>}
                {!c.servicesCctv && !c.servicesSecurity && !c.servicesFire && (
                  <span className="text-sm text-gray-400">No services selected</span>
                )}
              </div>
            </div>

            {c.notes && (
              <div className="px-6 py-4 border-b">
                <p className="text-xs text-gray-500 mb-1">Notes</p>
                <p className="text-sm text-gray-700">{c.notes}</p>
              </div>
            )}

            {showRenew && (
              <div className="px-6 py-4 border-b bg-blue-50">
                <p className="text-sm font-medium text-gray-800 mb-3">Renew Contract</p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">New End Date *</label>
                    <input
                      type="date"
                      value={renewForm.newEndDate}
                      onChange={(e) => setRenewForm((p) => ({ ...p, newEndDate: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Monthly Value (₹)</label>
                    <input
                      type="number"
                      value={renewForm.monthlyValue}
                      onChange={(e) => setRenewForm((p) => ({ ...p, monthlyValue: e.target.value }))}
                      placeholder={c.monthlyValue}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Annual Value (₹)</label>
                    <input
                      type="number"
                      value={renewForm.annualValue}
                      onChange={(e) => setRenewForm((p) => ({ ...p, annualValue: e.target.value }))}
                      placeholder={c.annualValue}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => renewMutation.mutate()}
                    disabled={!renewForm.newEndDate || renewMutation.isPending}
                    className="px-4 py-2 bg-blue-900 text-white rounded-lg text-sm font-medium hover:bg-blue-800 disabled:opacity-50 transition-colors"
                  >
                    {renewMutation.isPending ? 'Renewing...' : 'Confirm Renewal'}
                  </button>
                  <button
                    onClick={() => setShowRenew(false)}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : null}

        <div className="px-6 py-4 border-t bg-gray-50 flex gap-3">
          {c?.status !== 'CANCELLED' && !showRenew && (
            <button
              onClick={() => setShowRenew(true)}
              className="px-4 py-2 bg-blue-900 text-white rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors"
            >
              🔄 Renew
            </button>
          )}
          {c?.status !== 'CANCELLED' && (
            <button
              onClick={() => cancelMutation.mutate()}
              disabled={cancelMutation.isPending}
              className="px-4 py-2 bg-red-50 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100 disabled:opacity-50 transition-colors"
            >
              {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Contract'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}