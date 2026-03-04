// @ts-nocheck
'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { productsApi } from '@/lib/api';

const DEFAULT_CATEGORIES = ['CCTV', 'Fire', 'Alarm', 'Access Control', 'Networking', 'AMC', 'Installation', 'Other'];
const DEFAULT_UOM = ['NOS', 'MTR', 'SQF', 'KG', 'LTR', 'SET', 'PAIR', 'BOX', 'ROLL'];
const GST_RATES = [0, 5, 12, 18, 28];

function formatCurrency(value: any) {
  const num = Number(value) || 0;
  return '₹' + num.toLocaleString('en-IN');
}

const STATUS_COLORS = {
  IN_STOCK: 'bg-green-100 text-green-700',
  SOLD: 'bg-gray-100 text-gray-700',
  DISPATCHED: 'bg-blue-100 text-blue-700',
  DEFECTIVE: 'bg-red-100 text-red-700',
  RETURNED: 'bg-orange-100 text-orange-700',
};

const defaultForm = {
  name: '', sku: '', description: '', category: '', uom: 'NOS',
  costPrice: '', salePrice: '', inputTaxRate: 18, outputTaxRate: 18,
  hsnCode: '', sacCode: '', isService: false, isStorable: true, trackSerial: false,
};

function AddOptionBtn({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className="ml-1 w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold hover:bg-blue-200 flex items-center justify-center flex-shrink-0"
      title="Add new option">+</button>
  );
}

function AddOptionModal({ label, onAdd, onClose }: { label: string; onAdd: (val: string) => void; onClose: () => void }) {
  const [value, setValue] = useState('');
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-xl shadow-xl w-80 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Add New {label}</h3>
        <input autoFocus value={value} onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && value.trim()) { onAdd(value.trim()); onClose(); } }}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder={label === 'Category' ? 'e.g. Biometrics' : 'e.g. RFT'} />
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-3 py-1.5 text-sm text-gray-600">Cancel</button>
          <button onClick={() => { if (value.trim()) { onAdd(value.trim()); onClose(); } }}
            className="px-4 py-1.5 bg-blue-900 text-white rounded-lg text-sm font-medium">Add</button>
        </div>
      </div>
    </div>
  );
}

function HsnSacSearch({ isService, onSelect }: { isService: boolean; onSelect: (code: string) => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Array<{code: string; description: string; rate: string}>>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const doSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const prompt = isService
        ? `Find top 5 SAC codes under India GST for: "${query}". Return ONLY a JSON array: [{"code":"998311","description":"Service description","rate":"18%"}]. No other text.`
        : `Find top 5 HSN codes under India GST for: "${query}". Return ONLY a JSON array: [{"code":"85258090","description":"Product description","rate":"18%"}]. No other text.`;
      const response = await fetch('/api/hsn-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, isService }),
      });
      const data = await response.json();
      setResults(data.results || []);
    } catch (e) {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border border-blue-200 rounded-lg p-3 bg-blue-50">
      <p className="text-xs font-semibold text-blue-800 mb-2">AI {isService ? 'SAC' : 'HSN'} Code Search</p>
      <div className="flex gap-2">
        <input value={query} onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') doSearch(); }}
          placeholder={isService ? 'e.g. Annual Maintenance, Security Services' : 'e.g. CCTV Camera, Fire Alarm Panel'}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
        <button onClick={doSearch} disabled={loading || !query.trim()}
          className="px-3 py-2 bg-blue-900 text-white rounded-lg text-sm font-medium disabled:opacity-50 whitespace-nowrap">
          {loading ? '...' : 'Search'}
        </button>
      </div>
      {loading && <p className="text-xs text-blue-600 mt-2 animate-pulse">Finding best codes...</p>}
      {searched && !loading && results.length === 0 && <p className="text-xs text-gray-500 mt-2">No results. Try different terms.</p>}
      {results.length > 0 && (
        <div className="mt-2 space-y-1">
          {results.map((r, i) => (
            <button key={i} onClick={() => { onSelect(r.code); setResults([]); setQuery(''); setSearched(false); }}
              className="w-full text-left px-3 py-2 bg-white rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-sm font-mono font-bold text-blue-900">{r.code}</span>
                <span className="text-xs text-green-700 font-medium">{r.rate} GST</span>
              </div>
              <p className="text-xs text-gray-600 mt-0.5">{r.description}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterType, setFilterType] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState<any>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showSerialModal, setShowSerialModal] = useState(false);
  const [serialInput, setSerialInput] = useState('');
  const [form, setForm] = useState(defaultForm);
  const [showHsnSearch, setShowHsnSearch] = useState(false);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [uomList, setUomList] = useState(DEFAULT_UOM);
  const [addingCategory, setAddingCategory] = useState(false);
  const [addingUom, setAddingUom] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['products', search, filterCategory, filterType],
    queryFn: () => productsApi.list({ search: search || undefined, category: filterCategory || undefined, isService: filterType === 'service' ? 'true' : filterType === 'product' ? 'false' : undefined }),
  });
  const { data: selectedData } = useQuery({
    queryKey: ['product', selectedProduct?.id],
    queryFn: () => productsApi.get(selectedProduct.id),
    enabled: !!selectedProduct?.id,
  });

  const products = (data)?.data || [];
  const productDetail = (selectedData)?.data;

  const saveMutation = useMutation({
    mutationFn: (data) => editProduct ? productsApi.update(editProduct.id, data) : productsApi.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['products'] }); setShowModal(false); setEditProduct(null); setForm(defaultForm); setShowHsnSearch(false); },
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => productsApi.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['products'] }); setSelectedProduct(null); },
  });
  const addSerialMutation = useMutation({
    mutationFn: ({ productId, serials }) => productsApi.addSerials(productId, { serialNumbers: serials }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['product', selectedProduct?.id] }); queryClient.invalidateQueries({ queryKey: ['products'] }); setShowSerialModal(false); setSerialInput(''); },
  });

  const openEdit = (product) => {
    setForm({ name: product.name || '', sku: product.sku || '', description: product.description || '', category: product.category || '', uom: product.uom || 'NOS', costPrice: product.costPrice || '', salePrice: product.salePrice || '', inputTaxRate: Number(product.inputTaxRate) || 18, outputTaxRate: Number(product.outputTaxRate) || 18, hsnCode: product.hsnCode || '', sacCode: product.sacCode || '', isService: product.isService || false, isStorable: product.isStorable ?? true, trackSerial: product.trackSerial || false });
    setEditProduct(product);
    setShowModal(true);
    setShowHsnSearch(false);
  };

  const handleHsnSelect = (code) => {
    if (form.isService) { setForm((f) => ({ ...f, sacCode: code })); } else { setForm((f) => ({ ...f, hsnCode: code })); }
    setShowHsnSearch(false);
  };

  return (
    <div className="flex h-full">
      {addingCategory && <AddOptionModal label="Category" onAdd={(val) => { setCategories((c) => [...c, val]); setForm((f) => ({ ...f, category: val })); }} onClose={() => setAddingCategory(false)} />}
      {addingUom && <AddOptionModal label="Unit of Measure" onAdd={(val) => { setUomList((u) => [...u, val.toUpperCase()]); setForm((f) => ({ ...f, uom: val.toUpperCase() })); }} onClose={() => setAddingUom(false)} />}

      <div className="flex-1 p-6 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <div><h1 className="text-2xl font-bold text-gray-900">Products &amp; Services</h1><p className="text-sm text-gray-500 mt-1">{products.length} items</p></div>
          <button onClick={() => { setEditProduct(null); setForm(defaultForm); setShowModal(true); setShowHsnSearch(false); }} className="px-4 py-2 bg-blue-900 text-white rounded-lg text-sm font-semibold hover:bg-blue-800 transition-colors">+ New Product</button>
        </div>
        <div className="flex gap-3 mb-5">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products..." className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All Categories</option>{categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All Types</option><option value="product">Products</option><option value="service">Services</option>
          </select>
        </div>
        {isLoading ? <div className="text-center py-12 text-gray-500">Loading...</div> : products.length === 0 ? (
          <div className="text-center py-12 text-gray-500"><p className="text-4xl mb-3">📦</p><p className="font-medium">No products yet</p><p className="text-sm">Click "New Product" to add your first product</p></div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead><tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Product</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Category</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Type</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Cost</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Price</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">GST%</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Stock</th>
                <th className="px-4 py-3"></th>
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((p) => (
                  <tr key={p.id} onClick={() => setSelectedProduct(p)} className={'cursor-pointer hover:bg-gray-50 transition-colors ' + (selectedProduct?.id === p.id ? 'bg-blue-50' : '')}>
                    <td className="px-4 py-3"><div className="font-medium text-sm text-gray-900">{p.name}</div>{p.sku && <div className="text-xs text-gray-500">SKU: {p.sku}</div>}</td>
                    <td className="px-4 py-3">{p.category && <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full">{p.category}</span>}</td>
                    <td className="px-4 py-3"><span className={'text-xs px-2 py-1 rounded-full ' + (p.isService ? 'bg-purple-50 text-purple-700' : 'bg-green-50 text-green-700')}>{p.isService ? 'Service' : 'Product'}</span></td>
                    <td className="px-4 py-3 text-right text-sm text-gray-600">{formatCurrency(p.costPrice)}</td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">{formatCurrency(p.salePrice)}</td>
                    <td className="px-4 py-3 text-right text-sm text-gray-600">{Number(p.outputTaxRate || p.taxRate)}%</td>
                    <td className="px-4 py-3 text-right">{!p.isService && <span className={'text-xs font-medium ' + (p.currentStock > 0 ? 'text-green-700' : 'text-red-600')}>{p.currentStock}</span>}</td>
                    <td className="px-4 py-3 text-right"><button onClick={(e) => { e.stopPropagation(); openEdit(p); }} className="text-xs text-blue-600 hover:text-blue-800">Edit</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedProduct && productDetail && (
        <div className="w-80 bg-white border-l border-gray-200 flex flex-col overflow-hidden">
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 text-sm">Product Details</h3>
            <button onClick={() => setSelectedProduct(null)} className="text-gray-400 hover:text-gray-600">X</button>
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <div><p className="text-lg font-bold text-gray-900">{productDetail.name}</p>{productDetail.sku && <p className="text-xs text-gray-500">SKU: {productDetail.sku}</p>}{productDetail.description && <p className="text-sm text-gray-600 mt-2">{productDetail.description}</p>}</div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-500">Cost Price</p><p className="text-sm font-semibold text-gray-900">{formatCurrency(productDetail.costPrice)}</p></div>
              <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-500">Sale Price</p><p className="text-sm font-semibold text-gray-900">{formatCurrency(productDetail.salePrice)}</p></div>
              <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-500">Input GST</p><p className="text-sm font-semibold text-gray-900">{Number(productDetail.inputTaxRate)}%</p></div>
              <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-500">Output GST</p><p className="text-sm font-semibold text-gray-900">{Number(productDetail.outputTaxRate)}%</p></div>
            </div>
            <div className="space-y-2">
              {productDetail.category && <div className="flex justify-between text-sm"><span className="text-gray-500">Category</span><span className="text-gray-900">{productDetail.category}</span></div>}
              <div className="flex justify-between text-sm"><span className="text-gray-500">UOM</span><span className="text-gray-900">{productDetail.uom}</span></div>
              {productDetail.hsnCode && <div className="flex justify-between text-sm"><span className="text-gray-500">HSN</span><span className="text-gray-900 font-mono">{productDetail.hsnCode}</span></div>}
              {productDetail.sacCode && <div className="flex justify-between text-sm"><span className="text-gray-500">SAC</span><span className="text-gray-900 font-mono">{productDetail.sacCode}</span></div>}
              {!productDetail.isService && <div className="flex justify-between text-sm"><span className="text-gray-500">Stock</span><span className={'font-semibold ' + (productDetail.currentStock > 0 ? 'text-green-700' : 'text-red-600')}>{productDetail.currentStock} {productDetail.uom}</span></div>}
            </div>
            {productDetail.trackSerial && (
              <div>
                <div className="flex items-center justify-between mb-2"><p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Serial Numbers</p><button onClick={() => setShowSerialModal(true)} className="text-xs text-blue-600 hover:text-blue-800">+ Add</button></div>
                {productDetail.serialNumbers?.length === 0 ? <p className="text-xs text-gray-500">No serials added yet</p> : (
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {productDetail.serialNumbers?.map((s) => (
                      <div key={s.id} className="flex items-center justify-between bg-gray-50 rounded px-3 py-2">
                        <span className="text-xs font-mono text-gray-800">{s.serialNo}</span>
                        <span className={'text-xs px-2 py-0.5 rounded-full ' + (STATUS_COLORS[s.status] || 'bg-gray-100 text-gray-600')}>{s.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="px-5 py-3 border-t flex gap-2">
            <button onClick={() => openEdit(productDetail)} className="flex-1 px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50">Edit</button>
            <button onClick={() => { if (confirm('Delete this product?')) deleteMutation.mutate(productDetail.id); }} className="px-3 py-2 bg-red-50 text-red-600 rounded-lg text-sm hover:bg-red-100">Delete</button>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-screen overflow-y-auto">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">{editProduct ? 'Edit Product' : 'New Product'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">X</button>
            </div>
            <div className="p-6 space-y-5">
              <div className="flex gap-3">
                <button onClick={() => setForm((f) => ({ ...f, isService: false }))} className={'flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ' + (!form.isService ? 'bg-blue-900 text-white border-blue-900' : 'bg-white text-gray-600 border-gray-300')}>Product</button>
                <button onClick={() => setForm((f) => ({ ...f, isService: true }))} className={'flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ' + (form.isService ? 'bg-purple-700 text-white border-purple-700' : 'bg-white text-gray-600 border-gray-300')}>Service</button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2"><label className="block text-xs font-medium text-gray-500 mb-1">Product Name *</label><input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Hikvision 4MP Dome Camera" /></div>
                <div><label className="block text-xs font-medium text-gray-500 mb-1">SKU / Product Code</label><input value={form.sku} onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="HIK-4MP-DOME" /></div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
                  <div className="flex items-center">
                    <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Select category</option>{categories.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <AddOptionBtn onClick={() => setAddingCategory(true)} />
                  </div>
                </div>
                <div className="col-span-2"><label className="block text-xs font-medium text-gray-500 mb-1">Description</label><textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="block text-xs font-medium text-gray-500 mb-1">Purchase Price (Cost)</label><input type="number" value={form.costPrice} onChange={(e) => setForm((f) => ({ ...f, costPrice: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="0.00" /></div>
                <div><label className="block text-xs font-medium text-gray-500 mb-1">Sales Price</label><input type="number" value={form.salePrice} onChange={(e) => setForm((f) => ({ ...f, salePrice: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="0.00" /></div>
                <div><label className="block text-xs font-medium text-gray-500 mb-1">Input GST Rate %</label><select value={form.inputTaxRate} onChange={(e) => setForm((f) => ({ ...f, inputTaxRate: Number(e.target.value) }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">{GST_RATES.map((r) => <option key={r} value={r}>{r}%</option>)}</select></div>
                <div><label className="block text-xs font-medium text-gray-500 mb-1">Output GST Rate %</label><select value={form.outputTaxRate} onChange={(e) => setForm((f) => ({ ...f, outputTaxRate: Number(e.target.value) }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">{GST_RATES.map((r) => <option key={r} value={r}>{r}%</option>)}</select></div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-gray-500">{form.isService ? 'SAC Code' : 'HSN Code'}</label>
                    <button onClick={() => setShowHsnSearch((v) => !v)} className="text-xs text-blue-600 hover:text-blue-800 font-medium">{showHsnSearch ? 'Hide' : 'AI Search'}</button>
                  </div>
                  <input value={form.isService ? form.sacCode : form.hsnCode} onChange={(e) => setForm((f) => form.isService ? ({ ...f, sacCode: e.target.value }) : ({ ...f, hsnCode: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder={form.isService ? '998313' : '85258090'} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Unit of Measure</label>
                  <div className="flex items-center">
                    <select value={form.uom} onChange={(e) => setForm((f) => ({ ...f, uom: e.target.value }))} className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
                      {uomList.map((u) => <option key={u} value={u}>{u}</option>)}
                    </select>
                    <AddOptionBtn onClick={() => setAddingUom(true)} />
                  </div>
                </div>
              </div>
              {showHsnSearch && <HsnSacSearch isService={form.isService} onSelect={handleHsnSelect} />}
              {!form.isService && (
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.trackSerial} onChange={(e) => setForm((f) => ({ ...f, trackSerial: e.target.checked }))} className="w-4 h-4 text-blue-600" /><span className="text-sm text-gray-700">Track Serial Numbers</span></label>
                  <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.isStorable} onChange={(e) => setForm((f) => ({ ...f, isStorable: e.target.checked }))} className="w-4 h-4 text-blue-600" /><span className="text-sm text-gray-700">Track Inventory</span></label>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending || !form.name} className="px-5 py-2 bg-blue-900 text-white rounded-lg text-sm font-semibold hover:bg-blue-800 disabled:opacity-50">
                {saveMutation.isPending ? 'Saving...' : editProduct ? 'Update Product' : 'Create Product'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showSerialModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-4 border-b flex items-center justify-between"><h2 className="text-lg font-semibold text-gray-900">Add Serial Numbers</h2><button onClick={() => setShowSerialModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">X</button></div>
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-3">Enter one serial number per line</p>
              <textarea value={serialInput} onChange={(e) => setSerialInput(e.target.value)} rows={6} placeholder="SN001" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <p className="text-xs text-gray-400 mt-1">{serialInput.split('\n').filter((s) => s.trim()).length} serial numbers to add</p>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <button onClick={() => setShowSerialModal(false)} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm">Cancel</button>
              <button onClick={() => { const serials = serialInput.split('\n').map((s) => s.trim()).filter(Boolean); if (serials.length) addSerialMutation.mutate({ productId: selectedProduct.id, serials }); }}
                disabled={addSerialMutation.isPending || !serialInput.trim()} className="px-5 py-2 bg-blue-900 text-white rounded-lg text-sm font-semibold disabled:opacity-50">
                {addSerialMutation.isPending ? 'Adding...' : 'Add Serials'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
