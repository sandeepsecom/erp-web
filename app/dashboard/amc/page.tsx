'use client';

import { useQuery } from '@tanstack/react-query';
import { amcApi } from '@/lib/api';
import { useState } from 'react';
import NewAmcModal from './new-amc-modal';
import AmcPanel from './amc-panel';

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

const SERVICES = [
  { key: 'servicesCctv', label: 'CCTV', color: 'bg-purple-100 text-purple-700' },
  { key: 'servicesFire', label: 'Fire', color: 'bg-red-100 text-red-700' },
  { key: 'servicesAlarm', label: 'Alarm', color: 'bg-orange-100 text-orange-700' },
  { key: 'servicesSprinkler', label: 'Sprinkler', color: 'bg-blue-100 text-blue-700' },
  { key: 'servicesPa', label: 'PA', color: 'bg-green-100 text-green-700' },
];

function formatCurrency(value: any) {
  const num = Number(value) || 0;
  if (num >= 100000) return `₹${(num / 100000).toFixed(1)}L`;
  if (num >= 1000) return `₹${(num / 1000).toFixed(0)}K`;
  return `₹${num}`;
}

function formatDate(date: string) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function daysUntil(date: string) {
  const diff = new Date(date).getTime() - new Date().getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function AmcPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['amc', search, status],
    queryFn: () => amcApi.list({ search, status }),
  });

  const { data: summaryData } = useQuery({
    queryKey: ['amc-summary'],
    queryFn: () => amcApi.summary(),
  });

  const contracts = (data as any)?.data || [];
  const summary = (summaryData as any)?.data;

  return (
    <div className="h-full flex flex-col">
      {showNew && <NewAmcModal onClose={() => setShowNew(false)} />}
      {selectedId && <AmcPanel contractId={selectedId} onClose={() => setSelectedId(null)} />}

      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">AMC Contracts</h1>
          {summary && (
            <p className="text-sm text-gray-500 mt-0.5">
              {summary.active} active · {summary.pendingRenewal} pending renewal · ₹{Number(summary.totalMonthly).toLocaleString('en-IN')}/month
            </p>
          )}
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="bg-blue-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors"
        >
          + New Contract
        </button>
      </div>

      {summary && (
        <div className="bg-white border-b px-6 py-3 grid grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-700">{summary.active}</p>
            <p className="text-xs text-gray-500 mt-0.5">Active</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-600">{summary.pendingRenewal}</p>
            <p className="text-xs text-gray-500 mt-0.5">Pending Renewal</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-700">{summary.renewed}</p>
            <p className="text-xs text-gray-500 mt-0.5">Renewed</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-700">{formatCurrency(summary.totalMonthly)}</p>
            <p className="text-xs text-gray-500 mt-0.5">Monthly Revenue</p>
          </div>
        </div>
      )}

      <div className="bg-white border-b px-6 py-3 flex gap-3">
        <input
          type="text"
          placeholder="Search contracts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="PENDING_RENEWAL">Pending Renewal</option>
          <option value="RENEWED">Renewed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Loading contracts...</div>
        ) : contracts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No contracts found</div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Contract No</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Services</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">End Date</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Monthly</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Annual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {contracts.map((c: any) => {
                  const days = daysUntil(c.endDate);
                  const activeServices = SERVICES.filter((s) => c[s.key]);
                  return (
                    <tr
                      key={c.id}
                      onClick={() => setSelectedId(c.id)}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-blue-700">{c.contractNumber}</span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-800">
                          {c.contact?.companyName || `${c.contact?.firstName} ${c.contact?.lastName || ''}`}
                        </p>
                        {c.sites && <p className="text-xs text-gray-400 mt-0.5">{c.sites}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {activeServices.map((s) => (
                            <span key={s.key} className={`text-xs px-1.5 py-0.5 rounded font-medium ${s.color}`}>
                              {s.label}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[c.status]}`}>
                          {STATUS_LABELS[c.status]}
                        </span>
                        {c.status === 'PENDING_RENEWAL' && days > 0 && (
                          <p className="text-xs text-yellow-600 mt-0.5">{days} days left</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-600">{formatDate(c.endDate)}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-medium text-gray-800">{formatCurrency(c.monthlyValue)}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-medium text-gray-800">{formatCurrency(c.annualValue)}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}