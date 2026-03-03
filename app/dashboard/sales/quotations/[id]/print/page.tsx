'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { quotationsApi, api, setAccessToken } from '@/lib/api';

function formatCurrency(value: any) {
  const num = Number(value) || 0;
  return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
}

function formatDate(date: string) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
}

const TYPE_LABELS: Record<string, string> = {
  SALES: 'Sales Quotation',
  INSTALLATION: 'Installation Quotation',
  SALES_INSTALLATION: 'Sales & Installation Quotation',
  AMC: 'AMC Quotation',
};

export default function PrintQuotationPage() {
  const params = useParams();
  const id = params.id as string;
  const [quotation, setQuotation] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        // Ensure token is set from localStorage for new tab
        if (typeof window !== 'undefined') {
          const stored = localStorage.getItem('erp_auth');
          if (stored) {
            const parsed = JSON.parse(stored);
            const token = parsed?.state?.accessToken;
            if (token) setAccessToken(token);
          }
        }

        const [qRes, cRes] = await Promise.all([
          quotationsApi.get(id),
          api.get('/core/company'),
        ]);
        setQuotation((qRes as any)?.data);
        setCompany((cRes as any)?.data);
      } catch (err: any) {
        setError(err.message || 'Failed to load quotation');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <p className="text-gray-500">Loading quotation...</p>
    </div>
  );

  if (error || !quotation) return (
    <div className="flex items-center justify-center h-screen">
      <p className="text-red-500">{error || 'Quotation not found.'}</p>
    </div>
  );

  const contact = quotation.contact;
  const lines = quotation.lines || [];
  const quotationTitle = TYPE_LABELS[quotation.quotationType] || 'Quotation';

  return (
    <div className="bg-gray-100 min-h-screen">
      {/* Action bar - hidden when printing */}
      <div className="print:hidden bg-white border-b px-6 py-3 flex items-center gap-3 sticky top-0 z-10 shadow-sm">
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-blue-900 text-white rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors"
        >
          🖨️ Print / Save as PDF
        </button>
        <button
          onClick={() => window.close()}
          className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          ✕ Close
        </button>
        <span className="text-sm text-gray-500">Tip: Select "Save as PDF" in the print dialog to download</span>
      </div>

      {/* A4 Page */}
      <div className="max-w-4xl mx-auto my-8 print:my-0 bg-white shadow-lg print:shadow-none">
        <div className="p-10 print:p-8">

          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              {company?.logoUrl && (
                <img src={company.logoUrl} alt="Logo" className="h-14 mb-3 object-contain" />
              )}
              <h1 className="text-2xl font-bold text-blue-900">{company?.name}</h1>
              {company?.legalName && <p className="text-sm text-gray-500">{company.legalName}</p>}
              {company?.addressLine1 && <p className="text-sm text-gray-600 mt-1">{company.addressLine1}</p>}
              {(company?.city || company?.state) && (
                <p className="text-sm text-gray-600">
                  {[company.city, company.state, company.pincode].filter(Boolean).join(', ')}
                </p>
              )}
              {company?.phone && <p className="text-sm text-gray-600">📞 {company.phone}</p>}
              {company?.email && <p className="text-sm text-gray-600">✉️ {company.email}</p>}
              {company?.gstin && (
                <p className="text-sm text-gray-600 mt-1">GSTIN: <span className="font-medium">{company.gstin}</span></p>
              )}
            </div>
            <div className="text-right">
              <h2 className="text-xl font-bold text-gray-800 uppercase tracking-wide">{quotationTitle}</h2>
              <p className="text-2xl font-bold text-blue-900 mt-1">{quotation.name}</p>
              <div className="mt-3 text-sm text-gray-600 space-y-1">
                <p>Date: <span className="font-medium text-gray-800">{formatDate(quotation.createdAt)}</span></p>
                {quotation.validUntil && (
                  <p>Valid Until: <span className="font-medium text-gray-800">{formatDate(quotation.validUntil)}</span></p>
                )}
                <p>Status: <span className={`font-medium ${quotation.state === 'CONFIRMED' ? 'text-green-700' : 'text-gray-800'}`}>{quotation.state}</span></p>
              </div>
            </div>
          </div>

          <hr className="border-gray-200 mb-6" />

          {/* Customer Details */}
          <div className="mb-8">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Bill To</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-base font-semibold text-gray-800">
                {contact?.companyName || `${contact?.firstName} ${contact?.lastName || ''}`}
              </p>
              {contact?.companyName && (
                <p className="text-sm text-gray-600">{contact.firstName} {contact.lastName}</p>
              )}
              {contact?.email && <p className="text-sm text-gray-600">✉️ {contact.email}</p>}
              {contact?.phone && <p className="text-sm text-gray-600">📞 {contact.phone}</p>}
              {contact?.gstin && <p className="text-sm text-gray-600">GSTIN: {contact.gstin}</p>}
            </div>
          </div>

          {/* Line Items */}
          <div className="mb-8">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Items & Services</h3>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-blue-900 text-white">
                  <th className="text-left px-4 py-3 text-xs font-semibold rounded-tl-lg">#</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold">Description</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold">Qty</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold">Unit Price</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold">Disc%</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold">Tax%</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold rounded-tr-lg">Amount</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line: any, idx: number) => (
                  <tr key={line.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-3 text-sm text-gray-500">{idx + 1}</td>
                    <td className="px-4 py-3 text-sm text-gray-800">{line.description}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-600">{line.qty ?? line.quantity}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-600">{formatCurrency(line.unitPrice)}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-600">{line.discountPct ?? 0}%</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-600">{line.taxPct ?? 0}%</td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-gray-800">{formatCurrency(line.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-gray-200">
                  <td colSpan={6} className="px-4 py-2 text-right text-sm text-gray-600">Subtotal</td>
                  <td className="px-4 py-2 text-right text-sm font-medium text-gray-800">{formatCurrency(quotation.subtotal)}</td>
                </tr>
                <tr>
                  <td colSpan={6} className="px-4 py-2 text-right text-sm text-gray-600">GST</td>
                  <td className="px-4 py-2 text-right text-sm font-medium text-gray-800">{formatCurrency(quotation.taxAmount)}</td>
                </tr>
                <tr className="bg-blue-900 text-white">
                  <td colSpan={6} className="px-4 py-3 text-right text-sm font-bold rounded-bl-lg">Grand Total</td>
                  <td className="px-4 py-3 text-right text-sm font-bold rounded-br-lg">{formatCurrency(quotation.totalAmount)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Notes / Terms */}
          {quotation.notes && (
            <div className="mb-8">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Terms & Conditions</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-700 whitespace-pre-line">{quotation.notes}</p>
              </div>
            </div>
          )}

          {/* Bank Details */}
          <div className="mb-8">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Bank Details</h3>
            <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Bank Name</p>
                <p className="text-sm font-medium text-gray-800">—</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Account Number</p>
                <p className="text-sm font-medium text-gray-800">—</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">IFSC Code</p>
                <p className="text-sm font-medium text-gray-800">—</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Account Name</p>
                <p className="text-sm font-medium text-gray-800">{company?.legalName || company?.name}</p>
              </div>
            </div>
          </div>

          {/* Signature */}
          <div className="mt-12 grid grid-cols-2 gap-8">
            <div>
              <div className="border-t-2 border-gray-300 pt-2">
                <p className="text-xs text-gray-500">Customer Signature & Stamp</p>
                <p className="text-sm text-gray-700 mt-1">
                  {contact?.companyName || `${contact?.firstName} ${contact?.lastName || ''}`}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="border-t-2 border-gray-300 pt-2">
                <p className="text-xs text-gray-500">For {company?.name}</p>
                <p className="text-sm text-gray-700 mt-1">Authorised Signatory</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-10 text-center text-xs text-gray-400 border-t pt-4">
            <p>This is a computer-generated quotation. Thank you for your business.</p>
          </div>

        </div>
      </div>
    </div>
  );
}