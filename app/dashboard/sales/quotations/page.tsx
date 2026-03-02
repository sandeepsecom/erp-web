'use client';

import { useQuery } from '@tanstack/react-query';
import { quotationsApi } from '@/lib/api';
import { useState } from 'react';
import NewQuotationModal from './new-quotation-modal';

const STATE_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  SENT: 'bg-blue-100 text-blue-700',
  CONFIRMED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
  EXPIRED: 'bg-orange-100 text-orange-700',
};

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

export default function QuotationsPage() {
  const [search, setSearch] = useState('');
  const [state, setState] = useState('');
  const [showNewQuotation, setShowNewQuotation] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['quotations', search, state],
    queryFn: () => quotationsApi.list({ search, state }),
  });

  const quotations = (data as any)?.data || [];
  const meta = (data as any)?.meta;

  return (
    <div className="h-full flex flex-col">
      {showNewQuotation && <NewQuotationModal onClose={() => setShowNewQuotation(false)} />}

      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Quotations</h1>
          {meta && <p className="text-sm text-gray-500 mt-0.5">{meta.total} total</p>}
        </div>
        <button
          onClick={() => setShowNewQuotation(true)}
          className="bg-blue-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors"
        >
          + New Quotation
        </button>
      </div>

      <div className="bg-white border-b px-6 py-3 flex gap-3">
        <input
          type="text"
          placeholder="Search quotations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
        />
        <select
          value={state}
          onChange={(e) => setState(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All States</option>
          <option value="DRAFT">Draft</option>
          <option value="SENT">Sent</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Loading quotations...</div>
        ) : quotations.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No quotations found</div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Number</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">State</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Valid Until</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Salesperson</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {quotations.map((q: any) => (
                  <tr key={q.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-blue-700">{q.name}</span>
                      {q.version > 1 && (
                        <span className="ml-1 text-xs text-gray-400">v{q.version}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-800">
                        {q.contact?.companyName || `${q.contact?.firstName} ${q.contact?.lastName || ''}`}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATE_COLORS[q.state]}`}>
                        {q.state}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-medium text-gray-800">
                        {formatCurrency(q.totalAmount)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600">{formatDate(q.validUntil)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600">{q.salesperson?.fullName || '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {q.state === 'DRAFT' && (
                          <button className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded hover:bg-blue-100 transition-colors">
                            Send
                          </button>
                        )}
                        {q.state === 'SENT' && (
                          <button className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded hover:bg-green-100 transition-colors">
                            Confirm
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}