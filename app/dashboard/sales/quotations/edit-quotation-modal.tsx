'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { quotationsApi, contactsApi, productsApi } from '@/lib/api';

interface LineItem {
  id?: string;
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
}

interface Props {
  quotation: any;
  onClose: () => void;
}

const TAX_RATES = [
  { label: 'No Tax (0%)', value: 0 },
  { label: 'GST 5%', value: 5 },
  { label: 'GST 12%', value: 12 },
  { label: 'GST 18%', value: 18 },
  { label: 'GST 28%', value: 28 },
];

export default function EditQuotationModal({ quotation, onClose }: Props) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    contactId: quotation.contact?.id || '',
    validUntil: quotation.validUntil ? quotation.validUntil.split('T')[0] : '',
    notes: quotation.notes || '',
  });
  const [items, setItems] = useState<LineItem[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (quotation.lines?.length > 0) {
      setItems(quotation.lines.map((l: any) => ({
        id: l.id,
        productId: l.productId || '',
        description: l.description,
        quantity: Number(l.quantity),
        unitPrice: Number(l.unitPrice),
        discount: Number(l.discount),
        taxRate: Number(l.taxRate),
      })));
    } else {
      setItems([{ description: '', quantity: 1, unitPrice: 0, discount: 0, taxRate: 18 }]);
    }
  }, [quotation]);

  const { data: contactsData } = useQuery({
    queryKey: ['contacts-all'],
    queryFn: () => contactsApi.list({ limit: 100 }),
  });

  const { data: productsData } = useQuery({
    queryKey: ['products-all'],
    queryFn: () => productsApi.list({ limit: 100 }),
  });

  const contacts = (contactsData as any)?.data || [];
  const products = (productsData as any)?.data || [];

  const mutation = useMutation({
    mutationFn: () =>
      quotationsApi.update(quotation.id, {
        contactId: form.contactId,
        validUntil: form.validUntil || undefined,
        notes: form.notes,
        lines: items
          .filter((i) => i.description)
          .map((i) => ({
            id: i.id,
            productId: i.productId || undefined,
            description: i.description,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            discount: i.discount,
            taxRate: i.taxRate,
          })),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      queryClient.removeQueries({ queryKey: ['quotation', quotation.id] });
      onClose();
    },
    onError: (err: any) => setError(err.message),
  });

  const setField = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const setItem = (index: number, field: keyof LineItem, value: any) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      if (field === 'productId' && value) {
        const product = products.find((p: any) => p.id === value);
        if (product) {
          updated[index].description = product.name;
          updated[index].unitPrice = Number(product.salePrice);
        }
      }
      return updated;
    });
  };

  const addItem = () =>
    setItems((prev) => [...prev, { description: '', quantity: 1, unitPrice: 0, discount: 0, taxRate: 18 }]);

  const removeItem = (index: number) =>
    setItems((prev) => prev.filter((_, i) => i !== index));

  const getLineSubtotal = (item: LineItem) => {
    const subtotal = item.quantity * item.unitPrice;
    return subtotal - (subtotal * item.discount) / 100;
  };

  const getLineTax = (item: LineItem) => (getLineSubtotal(item) * item.taxRate) / 100;
  const getLineTotal = (item: LineItem) => getLineSubtotal(item) + getLineTax(item);

  const subtotal = items.reduce((sum, item) => sum + getLineSubtotal(item), 0);
  const totalTax = items.reduce((sum, item) => sum + getLineTax(item), 0);
  const grandTotal = subtotal + totalTax;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Edit {quotation.name}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{error}</div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Customer *</label>
              <select
                value={form.contactId}
                onChange={(e) => setField('contactId', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select customer...</option>
                {contacts.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName || `${c.firstName} ${c.lastName || ''}`}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Valid Until</label>
              <input
                type="date"
                value={form.validUntil}
                onChange={(e) => setField('validUntil', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-700">Line Items</h3>
              <button onClick={addItem} className="text-xs text-blue-700 hover:text-blue-900 font-medium">
                + Add Item
              </button>
            </div>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-3 py-2 text-xs text-gray-500">Product</th>
                    <th className="text-left px-3 py-2 text-xs text-gray-500">Description</th>
                    <th className="text-right px-3 py-2 text-xs text-gray-500">Qty</th>
                    <th className="text-right px-3 py-2 text-xs text-gray-500">Unit Price</th>
                    <th className="text-right px-3 py-2 text-xs text-gray-500">Disc%</th>
                    <th className="text-right px-3 py-2 text-xs text-gray-500">Tax</th>
                    <th className="text-right px-3 py-2 text-xs text-gray-500">Total</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-3 py-2">
                        <select
                          value={item.productId || ''}
                          onChange={(e) => setItem(index, 'productId', e.target.value)}
                          className="w-28 border border-gray-200 rounded px-2 py-1 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="">Custom</option>
                          {products.map((p: any) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          value={item.description}
                          onChange={(e) => setItem(index, 'description', e.target.value)}
                          placeholder="Description"
                          className="w-full border border-gray-200 rounded px-2 py-1 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => setItem(index, 'quantity', Number(e.target.value))}
                          className="w-14 border border-gray-200 rounded px-2 py-1 text-xs text-right text-gray-900 focus:outline-none"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min="0"
                          value={item.unitPrice}
                          onChange={(e) => setItem(index, 'unitPrice', Number(e.target.value))}
                          className="w-24 border border-gray-200 rounded px-2 py-1 text-xs text-right text-gray-900 focus:outline-none"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={item.discount}
                          onChange={(e) => setItem(index, 'discount', Number(e.target.value))}
                          className="w-14 border border-gray-200 rounded px-2 py-1 text-xs text-right text-gray-900 focus:outline-none"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={item.taxRate}
                          onChange={(e) => setItem(index, 'taxRate', Number(e.target.value))}
                          className="w-24 border border-gray-200 rounded px-2 py-1 text-xs text-gray-900 focus:outline-none"
                        >
                          {TAX_RATES.map((t) => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2 text-right text-xs font-medium text-gray-800">
                        ₹{getLineTotal(item).toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-2">
                        {items.length > 1 && (
                          <button onClick={() => removeItem(index)} className="text-red-400 hover:text-red-600 text-lg leading-none">&times;</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-gray-200 bg-gray-50">
                    <td colSpan={6} className="px-3 py-2 text-right text-xs text-gray-600">Subtotal</td>
                    <td className="px-3 py-2 text-right text-xs font-medium text-gray-800">₹{subtotal.toLocaleString('en-IN')}</td>
                    <td></td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td colSpan={6} className="px-3 py-2 text-right text-xs text-gray-600">GST</td>
                    <td className="px-3 py-2 text-right text-xs font-medium text-gray-800">₹{totalTax.toLocaleString('en-IN')}</td>
                    <td></td>
                  </tr>
                  <tr className="bg-gray-50 border-t border-gray-200">
                    <td colSpan={6} className="px-3 py-2 text-right text-sm font-semibold text-gray-800">Grand Total</td>
                    <td className="px-3 py-2 text-right text-sm font-bold text-gray-900">₹{grandTotal.toLocaleString('en-IN')}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setField('notes', e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors">
            Cancel
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={!form.contactId || mutation.isPending}
            className="px-6 py-2 bg-blue-900 text-white rounded-lg text-sm font-medium hover:bg-blue-800 disabled:opacity-50 transition-colors"
          >
            {mutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}