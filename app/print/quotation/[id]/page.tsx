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
            // Get user from store
            setCurrentUser(parsed?.state?.user);
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

  const s: Record<string, any> = {
    page: { fontFamily: 'Arial, sans-serif', fontSize: '13px', color: '#111827', backgroundColor: '#f3f4f6', minHeight: '100vh' },
    actionBar: { backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '12px', position: 'sticky' as const, top: 0, zIndex: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
    printBtn: { padding: '8px 16px', backgroundColor: '#1e3a5f', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
    closeBtn: { padding: '8px 16px', backgroundColor: 'white', color: '#374151', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' },
    a4: { maxWidth: '900px', margin: '32px auto', backgroundColor: 'white', boxShadow: '0 4px 24px rgba(0,0,0,0.12)', borderRadius: '4px' },
    inner: { padding: '48px' },
    // Header
    headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' },
    companyName: { fontSize: '24px', fontWeight: 'bold', color: '#1e3a5f', marginBottom: '4px' },
    companyDetail: { fontSize: '12px', color: '#4b5563', lineHeight: '1.6' },
    quotationTitle: { fontSize: '16px', fontWeight: 'bold', color: '#374151', textTransform: 'uppercase' as const, letterSpacing: '1px', textAlign: 'right' as const },
    quotationNumber: { fontSize: '22px', fontWeight: 'bold', color: '#1e3a5f', textAlign: 'right' as const, marginTop: '4px' },
    metaText: { fontSize: '12px', color: '#4b5563', textAlign: 'right' as const, lineHeight: '1.8', marginTop: '8px' },
    // Divider
    divider: { borderTop: '2px solid #1e3a5f', marginBottom: '24px' },
    // Section label
    sectionLabel: { fontSize: '10px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase' as const, letterSpacing: '1.5px', marginBottom: '8px' },
    // Bill to
    billBox: { backgroundColor: '#f9fafb', borderRadius: '8px', padding: '16px', marginBottom: '24px', border: '1px solid #e5e7eb' },
    billName: { fontSize: '15px', fontWeight: '700', color: '#111827', marginBottom: '4px' },
    billDetail: { fontSize: '12px', color: '#4b5563', lineHeight: '1.7' },
    // Table
    table: { width: '100%', borderCollapse: 'collapse' as const, marginBottom: '0' },
    th: { padding: '10px 12px', fontSize: '11px', fontWeight: '700', color: 'white', backgroundColor: '#1e3a5f', textAlign: 'left' as const },
    thRight: { padding: '10px 12px', fontSize: '11px', fontWeight: '700', color: 'white', backgroundColor: '#1e3a5f', textAlign: 'right' as const },
    td: { padding: '10px 12px', fontSize: '13px', color: '#374151', borderBottom: '1px solid #f3f4f6' },
    tdRight: { padding: '10px 12px', fontSize: '13px', color: '#374151', textAlign: 'right' as const, borderBottom: '1px solid #f3f4f6' },
    tdTotal: { padding: '8px 12px', fontSize: '13px', color: '#374151', textAlign: 'right' as const },
    grandTotalTd: { padding: '12px', fontSize: '14px', fontWeight: 'bold', color: 'white', textAlign: 'right' as const, backgroundColor: '#1e3a5f' },
    // Info grid
    infoGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
    infoBox: { backgroundColor: '#f9fafb', borderRadius: '8px', padding: '16px', border: '1px solid #e5e7eb' },
    infoLabel: { fontSize: '10px', color: '#6b7280', marginBottom: '4px', fontWeight: '600' },
    infoValue: { fontSize: '13px', fontWeight: '600', color: '#111827' },
    // Signature
    sigGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginTop: '48px' },
    sigLine: { borderTop: '2px solid #d1d5db', paddingTop: '8px' },
    sigLabel: { fontSize: '11px', color: '#6b7280', marginBottom: '4px' },
    sigName: { fontSize: '13px', color: '#374151', fontWeight: '500' },
    footer: { marginTop: '32px', textAlign: 'center' as const, fontSize: '11px', color: '#9ca3af', borderTop: '1px solid #e5e7eb', paddingTop: '16px' },
  };

  return (
    <>
      <style>{`
  @media print {
    @page { size: A4; margin: 8mm; }
    body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; background: white !important; }
    .no-print { display: none !important; }
    .a4-page { box-shadow: none !important; margin: 0 !important; max-width: 100% !important; border-radius: 0 !important; }
    a[href]:after { content: none !important; }
    * { -webkit-print-color-adjust: exact !important; }
  }
`}</style>

      {/* Action bar - hidden in print */}
      <div className="no-print" style={s.actionBar}>
        <button onClick={() => window.print()} style={s.printBtn}>🖨️ Print / Save as PDF</button>
        <button onClick={() => window.close()} style={s.closeBtn}>✕ Close</button>
        <span style={{ fontSize: '12px', color: '#9ca3af' }}>Tip: Select "Save as PDF" in the print dialog</span>
      </div>

      <div style={s.page}>
        <div className="a4-page" style={s.a4}>
          <div style={s.inner}>

            {/* Header */}
            <div style={s.headerRow}>
              <div>
                {company?.logoUrl && (
                  <img src={company.logoUrl} alt="Logo" style={{ height: '60px', marginBottom: '12px', objectFit: 'contain' }} />
                )}
                <div style={s.companyName}>{company?.name}</div>
                {company?.legalName && <div style={s.companyDetail}>{company.legalName}</div>}
                {company?.addressLine1 && <div style={s.companyDetail}>{company.addressLine1}</div>}
                <div style={s.companyDetail}>
                  {[company?.city, company?.state, company?.pincode].filter(Boolean).join(', ')}
                  {company?.country ? `, ${company.country}` : ''}
                </div>
                {company?.phone && <div style={s.companyDetail}>📞 {company.phone}</div>}
                {company?.email && <div style={s.companyDetail}>✉️ {company.email}</div>}
                {company?.gstin && <div style={{ ...s.companyDetail, marginTop: '6px' }}>GSTIN: <strong>{company.gstin}</strong></div>}
                {company?.pan && <div style={s.companyDetail}>PAN: <strong>{company.pan}</strong></div>}
              </div>
              <div>
                <div style={s.quotationTitle}>{quotationTitle}</div>
                <div style={s.quotationNumber}>{quotation.name}</div>
                <div style={s.metaText}>
                  <div>Date: <strong style={{ color: '#111827' }}>{formatDate(quotation.createdAt)}</strong></div>
                  {quotation.validUntil && <div>Valid Until: <strong style={{ color: '#111827' }}>{formatDate(quotation.validUntil)}</strong></div>}
                  <div>Status: <strong style={{ color: quotation.state === 'CONFIRMED' ? '#15803d' : '#111827' }}>{quotation.state}</strong></div>
                </div>
              </div>
            </div>

            <div style={s.divider} />

            {/* Bill To */}
            <div style={{ marginBottom: '24px' }}>
              <div style={s.sectionLabel}>Bill To</div>
              <div style={s.billBox}>
                <div style={s.billName}>
                  {contact?.companyName || `${contact?.firstName} ${contact?.lastName || ''}`}
                </div>
                {contact?.companyName && (
                  <div style={s.billDetail}>{contact.firstName} {contact.lastName}</div>
                )}
                {contact?.email && <div style={s.billDetail}>✉️ {contact.email}</div>}
                {contact?.phone && <div style={s.billDetail}>📞 {contact.phone}</div>}
                {contact?.gstin && <div style={s.billDetail}>GSTIN: <strong>{contact.gstin}</strong></div>}
              </div>
            </div>

            {/* Line Items */}
            <div style={{ marginBottom: '24px' }}>
              <div style={s.sectionLabel}>Items & Services</div>
              <table style={s.table}>
                <thead>
                  <tr>
                    <th style={s.th}>#</th>
                    <th style={s.th}>Description</th>
                    <th style={s.thRight}>Qty</th>
                    <th style={s.thRight}>Unit Price</th>
                    <th style={s.thRight}>Disc%</th>
                    <th style={s.thRight}>Tax%</th>
                    <th style={s.thRight}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line: any, idx: number) => (
                    <tr key={line.id} style={{ backgroundColor: idx % 2 === 0 ? 'white' : '#fafafa' }}>
                      <td style={s.td}>{idx + 1}</td>
                      <td style={s.td}>{line.description}</td>
                      <td style={s.tdRight}>{line.qty ?? line.quantity}</td>
                      <td style={s.tdRight}>{formatCurrency(line.unitPrice)}</td>
                      <td style={s.tdRight}>{line.discountPct ?? 0}%</td>
                      <td style={s.tdRight}>{line.taxPct ?? 0}%</td>
                      <td style={{ ...s.tdRight, fontWeight: '600' }}>{formatCurrency(line.lineTotal)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={6} style={{ ...s.tdTotal, borderTop: '2px solid #e5e7eb' }}>Subtotal</td>
                    <td style={{ ...s.tdTotal, fontWeight: '600', borderTop: '2px solid #e5e7eb' }}>{formatCurrency(quotation.subtotal)}</td>
                  </tr>
                  <tr>
                    <td colSpan={6} style={s.tdTotal}>GST</td>
                    <td style={{ ...s.tdTotal, fontWeight: '600' }}>{formatCurrency(quotation.taxAmount)}</td>
                  </tr>
                  <tr>
                    <td colSpan={6} style={s.grandTotalTd}>Grand Total</td>
                    <td style={s.grandTotalTd}>{formatCurrency(quotation.totalAmount)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Notes / Terms */}
            {quotation.notes && (
              <div style={{ marginBottom: '24px' }}>
                <div style={s.sectionLabel}>Terms & Conditions</div>
                <div style={s.billBox}>
                  <p style={{ fontSize: '12px', color: '#374151', whiteSpace: 'pre-line', margin: 0 }}>{quotation.notes}</p>
                </div>
              </div>
            )}

            {/* Bank Details */}
            <div style={{ marginBottom: '24px' }}>
              <div style={s.sectionLabel}>Bank Details</div>
              <div style={s.infoGrid}>
                <div style={s.infoBox}>
                  <div style={s.infoLabel}>Bank Name</div>
                  <div style={s.infoValue}>{company?.bankName || '—'}</div>
                </div>
                <div style={s.infoBox}>
                  <div style={s.infoLabel}>Account Number</div>
                  <div style={s.infoValue}>{company?.bankAccountNumber || '—'}</div>
                </div>
                <div style={s.infoBox}>
                  <div style={s.infoLabel}>IFSC Code</div>
                  <div style={s.infoValue}>{company?.bankIfsc || '—'}</div>
                </div>
                <div style={s.infoBox}>
                  <div style={s.infoLabel}>Account Name</div>
                  <div style={s.infoValue}>{company?.bankAccountName || company?.legalName || company?.name}</div>
                </div>
                {company?.bankBranch && (
                  <div style={s.infoBox}>
                    <div style={s.infoLabel}>Branch</div>
                    <div style={s.infoValue}>{company.bankBranch}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Signature */}
            <div style={s.sigGrid}>
              <div>
                <div style={s.sigLine}>
                  <div style={s.sigLabel}>Customer Signature & Stamp</div>
                  <div style={s.sigName}>
                    {contact?.companyName || `${contact?.firstName} ${contact?.lastName || ''}`}
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ ...s.sigLine, display: 'flex', flexDirection: 'column' as const, alignItems: 'flex-end' }}>
                  <div style={s.sigLabel}>For {company?.name}</div>
                  <div style={s.sigName}>{signatoryName}</div>
                  <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>Authorised Signatory</div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={s.footer}>
              This is a computer-generated quotation. Thank you for your business.
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
