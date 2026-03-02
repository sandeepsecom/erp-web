'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { quotationsApi } from '@/lib/api';
import EditQuotationModal from './edit-quotation-modal';

interface Props {
  quotationId: string;
  onClose: () => void;
}

const STATE_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  SENT: 'bg-blue-100 text-blue-700',
  CONFIRMED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
  EXPIRED: 'bg-orange-100 text-orange-700',
};

function formatCurrency(value: any) {
  const num = Number(value) || 0;
  return `₹${num.toLocaleString('en-IN')}`;
}

function formatDate(date: string) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function QuotationPanel({ quotationId, onClose }: Props) {
  const queryClient = useQueryClient();
  const [showEdit, setShowEdit] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['quotation', quotationId],
    queryFn: () => quotationsApi.get(quotationId),
    refetchOnWindowFocus: true,
  });

  const sendMutation = useMutation({
    mutationFn: () => quotationsApi.send(quotationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      queryClient.invalidateQueries({ queryKey: ['quotation', quotationId] });
    },
  });

  const confirmMutation = useMutation({
    mutationFn: () => quotationsApi.confirm(quotationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      queryClient.invalidateQueries({ queryKey: ['quotation', quotationId] });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => quotationsApi.cancel(quotationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      queryClient.invalidateQueries({ queryKey: ['quotation', quotationId] });
    },
  });

  const q = (data as any)?.data;

  return (
    <>
      {showEdit && q && (
        <EditQuotationModal quotation={q} onClose={() => setShowEdit(false)} />
      )}

      <div className="fixed inset-0 z-40 flex">
        <div className="flex-1 bg-black/30" onClick={onClose} />
        <div className="w-full max-w-2xl bg-white shadow-2xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-gray-900">{q?.name || 'Quotation'}</h2>
              {q?.state && (
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATE_COLORS[q.state]}`}>
                  {q.state}
                </span>
              )}
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
          </div>

          {isLoading ? (
            <div className="flex-1 flex items-center justify-center text-gray-500">Loading...</div>
          ) : q ? (
            <div className="flex-1 overflow-y-auto">
              <div className="px-6 py-4 border-b bg-gray-50">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Customer</p>
                    <p className="text-sm font-medium text-gray-800 mt-0.5">
                      {q.contact?.companyName || `${q.contact?.firstName} ${q.contact?.lastName || ''}`}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Salesperson</p>
                    <p className="text-sm font-medium text-gray-800 mt-0.5">{q.salesperson?.fullName || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Created</p>
                    <p className="text-sm font-medium text-gray-800 mt-0.5">{formatDate(q.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Valid Until</p>
                    <p className="text-sm font-medium text-gray-800 mt-0.5">{formatDate(q.validUntil)}</p>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Line Items</h3>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left px-3 py-2 text-xs text-gray-500">Description</th>
                        <th className="text-right px-3 py-2 text-xs text-gray-500">Qty</th>
                        <th className="text-right px-3 py-2 text-xs text-gray-500">Unit Price</th>
                        <th className="text-right px-3 py-2 text-xs text-gray-500">Disc%</th>
                        <th className="text-right px-3 py-2 text-xs text-gray-500">Tax%</th>
                        <th className="text-right px-3 py-2 text-xs text-gray-500">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {q.lines?.map((line: any) => (
                        <tr key={line.id}>
                          <td className="px-3 py-2 text-sm text-gray-800">{line.description}</td>
                          <td className="px-3 py-2 text-sm text-right text-gray-600">{line.qty ?? line.quantity ?? 0}</td>
                          <td className="px-3 py-2 text-sm text-right text-gray-600">{formatCurrency(line.unitPrice)}</td>
                          <td className="px-3 py-2 text-sm text-right text-gray-600">{line.discountPct ?? line.discount ?? 0}%</td>
                          <td className="px-3 py-2 text-sm text-right text-gray-600">{line.taxPct ?? line.taxRate ?? 0}%</td>
                          <td className="px-3 py-2 text-sm text-right font-medium text-gray-800">{formatCurrency(line.lineTotal ?? line.totalAmount)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-gray-200 bg-gray-50">
                        <td colSpan={5} className="px-3 py-2 text-right text-xs text-gray-600">Subtotal</td>
                        <td className="px-3 py-2 text-right text-xs font-medium text-gray-800">{formatCurrency(q.subtotal ?? q.subtotalAmount)}</td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td colSpan={5} className="px-3 py-2 text-right text-xs text-gray-600">GST</td>
                        <td className="px-3 py-2 text-right text-xs font-medium text-gray-800">{formatCurrency(q.taxAmount)}</td>
                      </tr>
                      <tr className="bg-gray-50 border-t border-gray-200">
                        <td colSpan={5} className="px-3 py-2 text-right text-sm font-semibold text-gray-800">Grand Total</td>
                        <td className="px-3 py-2 text-right text-sm font-bold text-gray-900">{formatCurrency(q.totalAmount)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {q.notes && (
                <div className="px-6 py-4 border-t">
                  <p className="text-xs text-gray-500 mb-1">Notes</p>
                  <p className="text-sm text-gray-700">{q.notes}</p>
                </div>
              )}
            </div>
          ) : null}

          <div className="px-6 py-4 border-t bg-gray-50 flex gap-3">
            {q?.state === 'DRAFT' && (
              <button
                onClick={() => setShowEdit(true)}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                ✏️ Edit
              </button>
            )}
            {q?.state === 'DRAFT' && (
              <button
                onClick={() => sendMutation.mutate()}
                disabled={sendMutation.isPending}
                className="px-4 py-2 bg-blue-900 text-white rounded-lg text-sm font-medium hover:bg-blue-800 disabled:opacity-50 transition-colors"
              >
                {sendMutation.isPending ? 'Sending...' : 'Mark as Sent'}
              </button>
            )}
            {q?.state === 'SENT' && (
              <button
                onClick={() => confirmMutation.mutate()}
                disabled={confirmMutation.isPending}
                className="px-4 py-2 bg-green-700 text-white rounded-lg text-sm font-medium hover:bg-green-600 disabled:opacity-50 transition-colors"
              >
                {confirmMutation.isPending ? 'Confirming...' : 'Confirm Order'}
              </button>
            )}
            {(q?.state === 'DRAFT' || q?.state === 'SENT') && (
              <button
                onClick={() => cancelMutation.mutate()}
                disabled={cancelMutation.isPending}
                className="px-4 py-2 bg-red-50 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100 disabled:opacity-50 transition-colors"
              >
                {cancelMutation.isPending ? 'Cancelling...' : 'Cancel'}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}