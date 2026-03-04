// @ts-nocheck
'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { purchaseOrdersApi, vendorsApi, productsApi } from '@/lib/api';

const STATUS_COLORS = {
  DRAFT: 'bg-gray-100 text-gray-700',
  SENT: 'bg-blue-100 text-blue-700',
  CONFIRMED: 'bg-yellow-100 text-yellow-700',
  RECEIVED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

const STATUS_FLOW = {
  DRAFT: ['SENT', 'CANCELLED'],
  SENT: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['RECEIVED', 'CANCELLED'],
  RECEIVED: [],
  CANCELLED: [],
};

function formatCurrency(v: any) { return '₹' + (Number(v) || 0).toLocaleString('en-IN'); }

function PriceHistoryPopup({ productId, onClose }: any) {
  const { data, isLoading } = useQuery({
    queryKey: ['price-history', productId],
    queryFn: () => purchaseOrdersApi.priceHistory(productId),
    enabled: !!productId,
  });
  const history = (data as any)?.data || [];
  return (
    <div className="absolute z-50 top-8 left-0 bg-white border border-gray-200 rounded-xl shadow-xl w-72 p-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-gray-700">Last 5 Purchase Prices</p>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xs">X</button>
      </div>
      {isLoading ? <p className="text-xs text-gray-400">Loading...</p> : history.length === 0 ? (
        <p className="text-xs text-gray-400">No purchase history yet</p>
      ) : (
        <div className="space-y-1">
          {history.map((h: any, i: number) => (
            <div key={i} className="flex justify-between items-center text-xs py-1 border-b border-gray-100">
              <div><div className="font-medium text-gray-800">{h.vendor?.name}</div><div className="text-gray-400">{new Date(h.date).toLocaleDateString('en-IN')} · {h.purchaseOrder?.name}</div></div>
              <div className="font-semibold text-blue-900">{formatCurrency(h.unitPrice)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PurchaseOrdersPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [priceHistoryProductId, setPriceHistoryProductId] = useState(null);
  const [priceHistoryIndex, setPriceHistoryIndex] = useState(null);
  const [form, setForm] = useState({ vendorId: '', salesOrderId: '', amcContractId: '', expectedDate: '', notes: '', lines: [] });

  const { data, isLoading } = useQuery({
    queryKey: ['purchase-orders', filterStatus],
    queryFn: () => purchaseOrdersApi.list({ status: filterStatus || undefined }),
  });
  const { data: selectedData } = useQuery({
    queryKey: ['purchase-order', selected?.id],
    queryFn: () => purchaseOrdersApi.get(selected.id),
    enabled: !!selected?.id,
  });
  const { data: vendorsData } = useQuery({ queryKey: ['vendors-all'], queryFn: () => vendorsApi.list() });
  const { data: productsData } = useQuery({ queryKey: ['products-all'], queryFn: () => productsApi.list() });

  const pos = (data as any)?.data || [];
  const poDetail = (selectedData as any)?.data;
  const vendors = (vendorsData as any)?.data || [];
  const products = (productsData as any)?.data || [];

  const saveMutation = useMutation({
    mutationFn: (d: any) => purchaseOrdersApi.create(d),
    onSuccess: (res: any) => { queryClient.invalidateQueries({ queryKey: ['purchase-orders'] }); setShowModal(false); setSelected((res as any).data); resetForm(); },
  });
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: any) => purchaseOrdersApi.updateStatus(id, status),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['purchase-orders'] }); queryClient.invalidateQueries({ queryKey: ['purchase-order', selected?.id] }); },
  });

  const resetForm = () => setForm({ vendorId: '', salesOrderId: '', amcContractId: '', expectedDate: '', notes: '', lines: [] });

  const addLine = () => setForm((f) => ({ ...f, lines: [...f.lines, { productId: '', description: '', qty: 1, uom: 'NOS', unitPrice: 0, taxPct: 18 }] }));

  const setLine = (i: number, field: string, value: any) => {
    setForm((f) => {
      const lines = [...f.lines];
      lines[i] = { ...lines[i], [field]: value };
      if (field === 'productId' && value) {
        const p = products.find((p: any) => p.id === value);
        if (p) { lines[i].description = p.name; lines[i].unitPrice = Number(p.costPrice); lines[i].taxPct = Number(p.inputTaxRate || p.taxRate || 18); lines[i].uom = p.uom; }
      }
      return { ...f, lines };
    });
  };

  const getLineTotal = (l: any) => Number(l.qty) * Number(l.unitPrice) * (1 + Number(l.taxPct) / 100);
  const grandTotal = form.lines.reduce((s, l) => s + getLineTotal(l), 0);

  return (
    <div className="flex h-full">
      <div className="flex-1 p-6 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <div><h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1><p className="text-sm text-gray-500 mt-1">{pos.length} orders</p></div>
          <button onClick={() => { resetForm(); setShowModal(true); }} className="px-4 py-2 bg-blue-900 text-white rounded-lg text-sm font-semibold hover:bg-blue-800">+ New PO</button>
        </div>
        <div className="flex gap-2 mb-4">
          {['', 'DRAFT', 'SENT', 'CONFIRMED', 'RECEIVED', 'CANCELLED'].map((s) => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={'px-3 py-1.5 rounded-lg text-xs font-medium ' + (filterStatus === s ? 'bg-blue-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50')}>
              {s || 'All'}
            </button>
          ))}
        </div>
        {isLoading ? <div className="text-center py-12 text-gray-500">Loading...</div> : pos.length === 0 ? (
          <div className="text-center py-12 text-gray-500"><p className="text-4xl mb-3">📦</p><p className="font-medium">No purchase orders</p></div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead><tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">PO Number</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Vendor</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Sales Order Ref</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Total</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Date</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                {pos.map((po: any) => (
                  <tr key={po.id} onClick={() => setSelected(po)} className={'cursor-pointer hover:bg-gray-50 ' + (selected?.id === po.id ? 'bg-blue-50' : '')}>
                    <td className="px-4 py-3 font-mono text-sm font-medium text-blue-900">{po.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{po.vendor?.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{po.salesOrder?.name || '—'}</td>
                    <td className="px-4 py-3"><span className={'text-xs px-2 py-1 rounded-full font-medium ' + (STATUS_COLORS[po.status] || '')}>{po.status}</span></td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">{formatCurrency(po.totalAmount)}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{new Date(po.createdAt).toLocaleDateString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && poDetail && (
        <div className="w-96 bg-white border-l border-gray-200 flex flex-col overflow-hidden">
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <div><p className="font-semibold text-gray-900 font-mono">{poDetail.name}</p><span className={'text-xs px-2 py-0.5 rounded-full ' + (STATUS_COLORS[poDetail.status] || '')}>{poDetail.status}</span></div>
            <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">X</button>
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Vendor</span><span className="font-medium">{poDetail.vendor?.name}</span></div>
              {poDetail.salesOrder && <div className="flex justify-between"><span className="text-gray-500">Sales Order</span><span className="font-medium text-blue-700">{poDetail.salesOrder?.name}</span></div>}
              {poDetail.amcContract && <div className="flex justify-between"><span className="text-gray-500">AMC Contract</span><span className="font-medium">{poDetail.amcContract?.contractNumber}</span></div>}
              {poDetail.expectedDate && <div className="flex justify-between"><span className="text-gray-500">Expected</span><span>{new Date(poDetail.expectedDate).toLocaleDateString('en-IN')}</span></div>}
            </div>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-xs">
                <thead><tr className="bg-gray-50 border-b"><th className="text-left px-3 py-2 text-gray-500">Item</th><th className="text-right px-3 py-2 text-gray-500">Qty</th><th className="text-right px-3 py-2 text-gray-500">Price</th><th className="text-right px-3 py-2 text-gray-500">Total</th></tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {poDetail.lines?.map((l: any) => (
                    <tr key={l.id}>
                      <td className="px-3 py-2 text-gray-900">{l.description}</td>
                      <td className="px-3 py-2 text-right text-gray-600">{Number(l.qty)} {l.uom}</td>
                      <td className="px-3 py-2 text-right text-gray-600">{formatCurrency(l.unitPrice)}</td>
                      <td className="px-3 py-2 text-right font-medium">{formatCurrency(l.lineTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{formatCurrency(poDetail.subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">GST</span><span>{formatCurrency(poDetail.taxAmount)}</span></div>
              <div className="flex justify-between font-bold text-base pt-1 border-t"><span>Total</span><span>{formatCurrency(poDetail.totalAmount)}</span></div>
            </div>
            {poDetail.notes && <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{poDetail.notes}</div>}

            {STATUS_FLOW[poDetail.status]?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2">Move to:</p>
                <div className="flex gap-2 flex-wrap">
                  {STATUS_FLOW[poDetail.status].map((s: string) => (
                    <button key={s} onClick={() => statusMutation.mutate({ id: poDetail.id, status: s })}
                      className={'px-3 py-1.5 rounded-lg text-xs font-medium border ' + (s === 'CANCELLED' ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-blue-200 text-blue-700 hover:bg-blue-50')}>
                      {s === 'RECEIVED' ? '✅ Mark Received' : s === 'SENT' ? '📤 Mark Sent' : s === 'CONFIRMED' ? '✔ Confirm' : s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-screen overflow-y-auto">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">New Purchase Order</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 text-xl">X</button>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Vendor *</label>
                  <select value={form.vendorId} onChange={(e) => setForm((f) => ({ ...f, vendorId: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Select vendor...</option>
                    {vendors.map((v: any) => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Sales Order Ref (optional)</label>
                  <input value={form.salesOrderId} onChange={(e) => setForm((f) => ({ ...f, salesOrderId: e.target.value }))} placeholder="Paste Sales Order ID"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Expected Delivery</label>
                  <input type="date" value={form.expectedDate} onChange={(e) => setForm((f) => ({ ...f, expectedDate: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-700">Line Items</h3>
                  <button onClick={addLine} className="text-xs text-blue-700 hover:text-blue-900 font-medium">+ Add Item</button>
                </div>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead><tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-3 py-2 text-xs text-gray-500">Product</th>
                      <th className="text-left px-3 py-2 text-xs text-gray-500">Description</th>
                      <th className="text-right px-3 py-2 text-xs text-gray-500">Qty</th>
                      <th className="text-right px-3 py-2 text-xs text-gray-500">Unit Price</th>
                      <th className="text-right px-3 py-2 text-xs text-gray-500">GST%</th>
                      <th className="text-right px-3 py-2 text-xs text-gray-500">Total</th>
                      <th className="px-3 py-2 text-xs text-gray-500"></th>
                    </tr></thead>
                    <tbody className="divide-y divide-gray-100">
                      {form.lines.length === 0 ? (
                        <tr><td colSpan={7} className="text-center py-6 text-sm text-gray-400">No items. Click + Add Item</td></tr>
                      ) : form.lines.map((line: any, i: number) => (
                        <tr key={i}>
                          <td className="px-3 py-2 relative">
                            <div className="flex items-center gap-1">
                              <select value={line.productId} onChange={(e) => setLine(i, 'productId', e.target.value)}
                                className="w-36 border border-gray-200 rounded px-2 py-1 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500">
                                <option value="">Custom</option>
                                {products.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                              </select>
                              {line.productId && (
                                <div className="relative">
                                  <button onClick={() => { setPriceHistoryProductId(line.productId); setPriceHistoryIndex(i); }}
                                    className="text-xs text-blue-600 hover:text-blue-800" title="View price history">📊</button>
                                  {priceHistoryProductId === line.productId && priceHistoryIndex === i && (
                                    <PriceHistoryPopup productId={line.productId} onClose={() => { setPriceHistoryProductId(null); setPriceHistoryIndex(null); }} />
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2"><input value={line.description} onChange={(e) => setLine(i, 'description', e.target.value)} placeholder="Description" className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" /></td>
                          <td className="px-3 py-2"><input type="number" value={line.qty} onChange={(e) => setLine(i, 'qty', e.target.value)} className="w-16 border border-gray-200 rounded px-2 py-1 text-xs text-right focus:outline-none focus:ring-1 focus:ring-blue-500" /></td>
                          <td className="px-3 py-2"><input type="number" value={line.unitPrice} onChange={(e) => setLine(i, 'unitPrice', e.target.value)} className="w-24 border border-gray-200 rounded px-2 py-1 text-xs text-right focus:outline-none focus:ring-1 focus:ring-blue-500" /></td>
                          <td className="px-3 py-2"><input type="number" value={line.taxPct} onChange={(e) => setLine(i, 'taxPct', e.target.value)} className="w-14 border border-gray-200 rounded px-2 py-1 text-xs text-right focus:outline-none focus:ring-1 focus:ring-blue-500" /></td>
                          <td className="px-3 py-2 text-right text-xs font-medium text-gray-900">{formatCurrency(getLineTotal(line))}</td>
                          <td className="px-3 py-2"><button onClick={() => setForm((f) => ({ ...f, lines: f.lines.filter((_: any, j: number) => j !== i) }))} className="text-red-400 hover:text-red-600 text-xs">✕</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {form.lines.length > 0 && (
                  <div className="text-right mt-2 text-sm font-bold text-gray-900">Grand Total: {formatCurrency(grandTotal)}</div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm">Cancel</button>
              <button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending || !form.vendorId || form.lines.length === 0}
                className="px-5 py-2 bg-blue-900 text-white rounded-lg text-sm font-semibold disabled:opacity-50">
                {saveMutation.isPending ? 'Creating...' : 'Create Purchase Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
