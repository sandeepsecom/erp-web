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
  const [currentUser, setCurrentUser] = useState<any>(null);
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
            setCurrentUser(parsed?.state?.user);
          }
        }
        const [qRes, cRes] = await Promise.all([
          quotationsApi.get(id),
          api.get('/core/company'),
        ]);
        const q = (qRes as any)?.data;
        setQuotation(q);
        setCompany((cRes as any)?.data);
        // Set page title for PDF filename
        if (q?.name) document.title = q.name;
      } catch (err: any) {
        setError(err.message || 'Failed to load quotation');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'Arial' }}>
      <p style={{ color: '#6b7280' }}>Loading quotation...</p>
    </div>
  );

  if (error || !quotation) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'Arial' }}>
      <p style={{ color: '#ef4444' }}>{error || 'Quotation not found.'}</p>
    </div>
  );

  const contact = quotation.contact;
  const lines = quotation.lines || [];
  const quotationTitle = TYPE_LABELS[quotation.quotationType] || 'Quotation';
  const signatoryName = currentUser?.fullName || quotation.salesperson?.fullName || 'Authorised Signatory';

  // Calculate totals from lines
  const subtotal = lines.reduce((sum: number, l: any) => {
    const qty = Number(l.qty || l.quantity || 0);
    const price = Number(l.unitPrice || 0);
    const disc = Number(l.discountPct || 0);
    const lineSubtotal = qty * price * (1 - disc / 100);
    return sum + lineSubtotal;
  }, 0);
  const totalTax = lines.reduce((sum: number, l: any) => {
    const qty = Number(l.qty || l.quantity || 0);
    const price = Number(l.unitPrice || 0);
    const disc = Number(l.discountPct || 0);
    const tax = Number(l.taxPct || 0);
    const lineSubtotal = qty * price * (1 - disc / 100);
    return sum + lineSubtotal * tax / 100;
  }, 0);
  const grandTotal = subtotal + totalTax;

  return (
    <>
      <style>{`
        @media print {
          @page { size: A4; margin: 8mm; }
          body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; background: white !important; }
          .no-print { display: none !important; }
          .a4-page { box-shadow: none !important; margin: 0 !important; max-width: 100% !important; border-radius: 0 !important; }
          a[href]:after { content: none !important; }
        }
      `}</style>

      {/* Action bar */}
      <div className="no-print" style={{ backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', padding: '10px 24px', display: 'flex', alignItems: 'center', gap: '12px', position: 'sticky', top: 0, zIndex: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <button onClick={() => window.print()} style={{ padding: '8px 16px', backgroundColor: '#1e3a5f', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
          🖨️ Print / Save as PDF
        </button>
        <button onClick={() => window.close()} style={{ padding: '8px 16px', backgroundColor: 'white', color: '#374151', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}>
          ✕ Close
        </button>
        <span style={{ fontSize: '12px', color: '#9ca3af' }}>PDF will be saved as {quotation.name}.pdf</span>
      </div>

      <div style={{ backgroundColor: '#f3f4f6', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
        <div className="a4-page" style={{ maxWidth: '860px', margin: '24px auto', backgroundColor: 'white', boxShadow: '0 4px 24px rgba(0,0,0,0.12)', borderRadius: '4px' }}>
          <div style={{ padding: '36px' }}>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div>
                {company?.logoUrl && (
                  <img src={company.logoUrl} alt="Logo" style={{ height: '50px', marginBottom: '10px', objectFit: 'contain' }} />
                )}
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e3a5f' }}>{company?.name}</div>
                {company?.legalName && <div style={{ fontSize: '11px', color: '#4b5563' }}>{company.legalName}</div>}
                <div style={{ fontSize: '11px', color: '#4b5563', lineHeight: '1.7', marginTop: '2px' }}>
                  {company?.addressLine1 && <div>{company.addressLine1}</div>}
                  <div>{[company?.city, company?.state, company?.pincode].filter(Boolean).join(', ')}{company?.country ? `, ${company.country}` : ''}</div>
                  {company?.phone && <div>📞 {company.phone}</div>}
                  {company?.email && <div>✉️ {company.email}</div>}
                  {company?.gstin && <div style={{ marginTop: '3px' }}>GSTIN: <strong>{company.gstin}</strong></div>}
                  {company?.pan && <div>PAN: <strong>{company.pan}</strong></div>}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#374151', textTransform: 'uppercase', letterSpacing: '1px' }}>{quotationTitle}</div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e3a5f', marginTop: '4px' }}>{quotation.name}</div>
                <div style={{ fontSize: '11px', color: '#4b5563', textAlign: 'right', lineHeight: '1.8', marginTop: '6px' }}>
                  <div>Date: <strong style={{ color: '#111827' }}>{formatDate(quotation.createdAt)}</strong></div>
                  {quotation.validUntil && <div>Valid Until: <strong style={{ color: '#111827' }}>{formatDate(quotation.validUntil)}</strong></div>}
                  <div>Status: <strong style={{ color: quotation.state === 'CONFIRMED' ? '#15803d' : '#111827' }}>{quotation.state}</strong></div>
                </div>
              </div>
            </div>

            <div style={{ borderTop: '2px solid #1e3a5f', marginBottom: '20px' }} />

            {/* Bill To */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '10px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Bill To</div>
              <div style={{ backgroundColor: '#f9fafb', borderRadius: '6px', padding: '12px', border: '1px solid #e5e7eb' }}>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#111827' }}>
                  {contact?.companyName || `${contact?.firstName} ${contact?.lastName || ''}`}
                </div>
                <div style={{ fontSize: '11px', color: '#4b5563', lineHeight: '1.7', marginTop: '2px' }}>
                  {contact?.companyName && <div>{contact.firstName} {contact.lastName}</div>}
                  {contact?.email && <div>✉️ {contact.email}</div>}
                  {contact?.phone && <div>📞 {contact.phone}</div>}
                  {contact?.gstin && <div>GSTIN: <strong>{contact.gstin}</strong></div>}
                </div>
              </div>
            </div>

            {/* Line Items */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '10px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Items & Services</div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#1e3a5f' }}>
                    <th style={{ padding: '8px 10px', fontSize: '11px', fontWeight: '700', color: 'white', textAlign: 'left' }}>#</th>
                    <th style={{ padding: '8px 10px', fontSize: '11px', fontWeight: '700', color: 'white', textAlign: 'left' }}>Description</th>
                    <th style={{ padding: '8px 10px', fontSize: '11px', fontWeight: '700', color: 'white', textAlign: 'right' }}>Qty</th>
                    <th style={{ padding: '8px 10px', fontSize: '11px', fontWeight: '700', color: 'white', textAlign: 'right' }}>Unit Price</th>
                    <th style={{ padding: '8px 10px', fontSize: '11px', fontWeight: '700', color: 'white', textAlign: 'right' }}>Disc%</th>
                    <th style={{ padding: '8px 10px', fontSize: '11px', fontWeight: '700', color: 'white', textAlign: 'right' }}>Tax%</th>
                    <th style={{ padding: '8px 10px', fontSize: '11px', fontWeight: '700', color: 'white', textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line: any, idx: number) => (
                    <tr key={line.id} style={{ backgroundColor: idx % 2 === 0 ? 'white' : '#fafafa' }}>
                      <td style={{ padding: '8px 10px', fontSize: '12px', color: '#6b7280', borderBottom: '1px solid #f3f4f6' }}>{idx + 1}</td>
                      <td style={{ padding: '8px 10px', fontSize: '12px', color: '#111827', borderBottom: '1px solid #f3f4f6' }}>{line.description}</td>
                      <td style={{ padding: '8px 10px', fontSize: '12px', color: '#374151', textAlign: 'right', borderBottom: '1px solid #f3f4f6' }}>{line.qty ?? line.quantity}</td>
                      <td style={{ padding: '8px 10px', fontSize: '12px', color: '#374151', textAlign: 'right', borderBottom: '1px solid #f3f4f6' }}>{formatCurrency(line.unitPrice)}</td>
                      <td style={{ padding: '8px 10px', fontSize: '12px', color: '#374151', textAlign: 'right', borderBottom: '1px solid #f3f4f6' }}>{line.discountPct ?? 0}%</td>
                      <td style={{ padding: '8px 10px', fontSize: '12px', color: '#374151', textAlign: 'right', borderBottom: '1px solid #f3f4f6' }}>{line.taxPct ?? 0}%</td>
                      <td style={{ padding: '8px 10px', fontSize: '12px', fontWeight: '600', color: '#111827', textAlign: 'right', borderBottom: '1px solid #f3f4f6' }}>{formatCurrency(line.lineTotal || (Number(line.qty || line.quantity || 0) * Number(line.unitPrice || 0) * (1 - Number(line.discountPct || 0) / 100) * (1 + Number(line.taxPct || 0) / 100)))}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={6} style={{ padding: '6px 10px', textAlign: 'right', fontSize: '12px', color: '#4b5563', borderTop: '2px solid #e5e7eb' }}>Subtotal</td>
                    <td style={{ padding: '6px 10px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#111827', borderTop: '2px solid #e5e7eb' }}>{formatCurrency(Number(quotation.subtotal) || subtotal)}</td>
                  </tr>
                  <tr>
                    <td colSpan={6} style={{ padding: '6px 10px', textAlign: 'right', fontSize: '12px', color: '#4b5563' }}>GST</td>
                    <td style={{ padding: '6px 10px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#111827' }}>{formatCurrency(Number(quotation.taxAmount) || totalTax)}</td>
                  </tr>
                  <tr style={{ backgroundColor: '#1e3a5f' }}>
                    <td colSpan={6} style={{ padding: '10px', textAlign: 'right', fontSize: '13px', fontWeight: 'bold', color: 'white' }}>Grand Total</td>
                    <td style={{ padding: '10px', textAlign: 'right', fontSize: '13px', fontWeight: 'bold', color: 'white' }}>{formatCurrency(Number(quotation.totalAmount) || grandTotal)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Notes */}
            {quotation.notes && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '10px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Terms & Conditions</div>
                <div style={{ backgroundColor: '#f9fafb', borderRadius: '6px', padding: '10px', border: '1px solid #e5e7eb' }}>
                  <p style={{ fontSize: '11px', color: '#374151', whiteSpace: 'pre-line', margin: 0 }}>{quotation.notes}</p>
                </div>
              </div>
            )}

            {/* Bank Details - compact single row */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '10px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Bank Details</div>
              <div style={{ backgroundColor: '#f9fafb', borderRadius: '6px', padding: '10px 14px', border: '1px solid #e5e7eb', display: 'flex', gap: '32px', flexWrap: 'wrap' as const }}>
                <div>
                  <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '2px' }}>Bank Name</div>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#111827' }}>{company?.bankName || '—'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '2px' }}>Account Number</div>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#111827' }}>{company?.bankAccountNumber || '—'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '2px' }}>IFSC Code</div>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#111827' }}>{company?.bankIfsc || '—'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '2px' }}>Branch</div>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#111827' }}>{company?.bankBranch || '—'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '2px' }}>Account Name</div>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#111827' }}>{company?.bankAccountName || company?.legalName || company?.name}</div>
                </div>
              </div>
            </div>

            {/* Signature */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginTop: '32px' }}>
              <div>
                <div style={{ borderTop: '2px solid #d1d5db', paddingTop: '8px' }}>
                  <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '4px' }}>Customer Signature & Stamp</div>
                  <div style={{ fontSize: '12px', color: '#374151', fontWeight: '500' }}>
                    {contact?.companyName || `${contact?.firstName} ${contact?.lastName || ''}`}
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ borderTop: '2px solid #d1d5db', paddingTop: '8px' }}>
                  <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '4px' }}>For {company?.name}</div>
                  <div style={{ fontSize: '12px', color: '#374151', fontWeight: '500' }}>{signatoryName}</div>
                  <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '2px' }}>Authorised Signatory</div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '10px', color: '#9ca3af', borderTop: '1px solid #e5e7eb', paddingTop: '12px' }}>
              This is a computer-generated quotation. Thank you for your business.
            </div>

          </div>
        </div>
      </div>
    </>
  );
}