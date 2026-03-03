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
    <>
      <style>{`
        @media print {
          @page { size: A4; margin: 15mm; }
          body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .no-print { display: none !important; }
          .page { box-shadow: none !important; margin: 0 !important; }
          .thead-dark { background-color: #1e3a5f !important; color: white !important; }
          .thead-dark th { color: white !important; }
          .grand-total-row { background-color: #1e3a5f !important; color: white !important; }
          .grand-total-row td { color: white !important; }
        }
      `}</style>

      {/* Action bar */}
      <div className="no-print bg-white border-b px-6 py-3 flex items-center gap-3 sticky top-0 z-10 shadow-sm">
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
      <div className="page max-w-4xl mx-auto my-8 bg-white shadow-lg" style={{ fontFamily: 'Arial, sans-serif' }}>
        <div style={{ padding: '40px' }}>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}>
            <div>
              {company?.logoUrl && (
                <img src={company.logoUrl} alt="Logo" style={{ height: '56px', marginBottom: '12px', objectFit: 'contain' }} />
              )}
              <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#1e3a5f' }}>{company?.name}</div>
              {company?.legalName && <div style={{ fontSize: '12px', color: '#6b7280' }}>{company.legalName}</div>}
              {company?.addressLine1 && <div style={{ fontSize: '12px', color: '#4b5563', marginTop: '4px' }}>{company.addressLine1}</div>}
              {(company?.city || company?.state) && (
                <div style={{ fontSize: '12px', color: '#4b5563' }}>
                  {[company.city, company.state, company.pincode].filter(Boolean).join(', ')}
                </div>
              )}
              {company?.phone && <div style={{ fontSize: '12px', color: '#4b5563' }}>📞 {company.phone}</div>}
              {company?.email && <div style={{ fontSize: '12px', color: '#4b5563' }}>✉️ {company.email}</div>}
              {company?.gstin && <div style={{ fontSize: '12px', color: '#4b5563', marginTop: '4px' }}>GSTIN: <strong>{company.gstin}</strong></div>}
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#374151', textTransform: 'uppercase', letterSpacing: '1px' }}>{quotationTitle}</div>
              <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#1e3a5f', marginTop: '4px' }}>{quotation.name}</div>
              <div style={{ marginTop: '12px', fontSize: '13px', color: '#4b5563' }}>
                <div>Date: <strong style={{ color: '#111827' }}>{formatDate(quotation.createdAt)}</strong></div>
                {quotation.validUntil && <div>Valid Until: <strong style={{ color: '#111827' }}>{formatDate(quotation.validUntil)}</strong></div>}
                <div>Status: <strong style={{ color: quotation.state === 'CONFIRMED' ? '#15803d' : '#111827' }}>{quotation.state}</strong></div>
              </div>
            </div>
          </div>

          <hr style={{ borderColor: '#e5e7eb', marginBottom: '24px' }} />

          {/* Customer Details */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Bill To</div>
            <div style={{ backgroundColor: '#f9fafb', borderRadius: '8px', padding: '16px' }}>
              <div style={{ fontSize: '15px', fontWeight: '600', color: '#111827' }}>
                {contact?.companyName || `${contact?.firstName} ${contact?.lastName || ''}`}
              </div>
              {contact?.companyName && <div style={{ fontSize: '13px', color: '#4b5563' }}>{contact.firstName} {contact.lastName}</div>}
              {contact?.email && <div style={{ fontSize: '13px', color: '#4b5563' }}>✉️ {contact.email}</div>}
              {contact?.phone && <div style={{ fontSize: '13px', color: '#4b5563' }}>📞 {contact.phone}</div>}
              {contact?.gstin && <div style={{ fontSize: '13px', color: '#4b5563' }}>GSTIN: {contact.gstin}</div>}
            </div>
          </div>

          {/* Line Items */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Items & Services</div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr className="thead-dark" style={{ backgroundColor: '#1e3a5f', color: 'white' }}>
                  <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: '12px', fontWeight: '600', color: 'white' }}>#</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: '12px', fontWeight: '600', color: 'white' }}>Description</th>
                  <th style={{ textAlign: 'right', padding: '10px 12px', fontSize: '12px', fontWeight: '600', color: 'white' }}>Qty</th>
                  <th style={{ textAlign: 'right', padding: '10px 12px', fontSize: '12px', fontWeight: '600', color: 'white' }}>Unit Price</th>
                  <th style={{ textAlign: 'right', padding: '10px 12px', fontSize: '12px', fontWeight: '600', color: 'white' }}>Disc%</th>
                  <th style={{ textAlign: 'right', padding: '10px 12px', fontSize: '12px', fontWeight: '600', color: 'white' }}>Tax%</th>
                  <th style={{ textAlign: 'right', padding: '10px 12px', fontSize: '12px', fontWeight: '600', color: 'white' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line: any, idx: number) => (
                  <tr key={line.id} style={{ backgroundColor: idx % 2 === 0 ? 'white' : '#f9fafb' }}>
                    <td style={{ padding: '10px 12px', fontSize: '13px', color: '#6b7280', borderBottom: '1px solid #f3f4f6' }}>{idx + 1}</td>
                    <td style={{ padding: '10px 12px', fontSize: '13px', color: '#111827', borderBottom: '1px solid #f3f4f6' }}>{line.description}</td>
                    <td style={{ padding: '10px 12px', fontSize: '13px', color: '#4b5563', textAlign: 'right', borderBottom: '1px solid #f3f4f6' }}>{line.qty ?? line.quantity}</td>
                    <td style={{ padding: '10px 12px', fontSize: '13px', color: '#4b5563', textAlign: 'right', borderBottom: '1px solid #f3f4f6' }}>{formatCurrency(line.unitPrice)}</td>
                    <td style={{ padding: '10px 12px', fontSize: '13px', color: '#4b5563', textAlign: 'right', borderBottom: '1px solid #f3f4f6' }}>{line.discountPct ?? 0}%</td>
                    <td style={{ padding: '10px 12px', fontSize: '13px', color: '#4b5563', textAlign: 'right', borderBottom: '1px solid #f3f4f6' }}>{line.taxPct ?? 0}%</td>
                    <td style={{ padding: '10px 12px', fontSize: '13px', fontWeight: '500', color: '#111827', textAlign: 'right', borderBottom: '1px solid #f3f4f6' }}>{formatCurrency(line.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={6} style={{ padding: '8px 12px', textAlign: 'right', fontSize: '13px', color: '#4b5563', borderTop: '1px solid #e5e7eb' }}>Subtotal</td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', fontSize: '13px', fontWeight: '500', color: '#111827', borderTop: '1px solid #e5e7eb' }}>{formatCurrency(quotation.subtotal)}</td>
                </tr>
                <tr>
                  <td colSpan={6} style={{ padding: '8px 12px', textAlign: 'right', fontSize: '13px', color: '#4b5563' }}>GST</td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', fontSize: '13px', fontWeight: '500', color: '#111827' }}>{formatCurrency(quotation.taxAmount)}</td>
                </tr>
                <tr className="grand-total-row" style={{ backgroundColor: '#1e3a5f' }}>
                  <td colSpan={6} style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: 'bold', color: 'white', borderRadius: '0 0 0 8px' }}>Grand Total</td>
                  <td style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: 'bold', color: 'white', borderRadius: '0 0 8px 0' }}>{formatCurrency(quotation.totalAmount)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Notes / Terms */}
          {quotation.notes && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Terms & Conditions</div>
              <div style={{ backgroundColor: '#f9fafb', borderRadius: '8px', padding: '16px' }}>
                <p style={{ fontSize: '13px', color: '#374151', whiteSpace: 'pre-line', margin: 0 }}>{quotation.notes}</p>
              </div>
            </div>
          )}

          {/* Bank Details */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Bank Details</div>
            <div style={{ backgroundColor: '#f9fafb', borderRadius: '8px', padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#6b7280' }}>Bank Name</div>
                <div style={{ fontSize: '13px', fontWeight: '500', color: '#111827' }}>—</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#6b7280' }}>Account Number</div>
                <div style={{ fontSize: '13px', fontWeight: '500', color: '#111827' }}>—</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#6b7280' }}>IFSC Code</div>
                <div style={{ fontSize: '13px', fontWeight: '500', color: '#111827' }}>—</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#6b7280' }}>Account Name</div>
                <div style={{ fontSize: '13px', fontWeight: '500', color: '#111827' }}>{company?.legalName || company?.name}</div>
              </div>
            </div>
          </div>

          {/* Signature */}
          <div style={{ marginTop: '48px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
            <div>
              <div style={{ borderTop: '2px solid #d1d5db', paddingTop: '8px' }}>
                <div style={{ fontSize: '11px', color: '#6b7280' }}>Customer Signature & Stamp</div>
                <div style={{ fontSize: '13px', color: '#374151', marginTop: '4px' }}>
                  {contact?.companyName || `${contact?.firstName} ${contact?.lastName || ''}`}
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ borderTop: '2px solid #d1d5db', paddingTop: '8px' }}>
                <div style={{ fontSize: '11px', color: '#6b7280' }}>For {company?.name}</div>
                <div style={{ fontSize: '13px', color: '#374151', marginTop: '4px' }}>Authorised Signatory</div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ marginTop: '40px', textAlign: 'center', fontSize: '11px', color: '#9ca3af', borderTop: '1px solid #e5e7eb', paddingTop: '16px' }}>
            This is a computer-generated quotation. Thank you for your business.
          </div>

        </div>
      </div>
    </>
  );
}
