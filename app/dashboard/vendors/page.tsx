// @ts-nocheck
'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vendorsApi } from '@/lib/api';

const defaultForm = {
  name: '', contactPerson: '', email: '', phone: '', whatsapp: '',
  gstin: '', pan: '', addressLine1: '', city: '', state: '', pincode: '',
  bankName: '', bankAccountNumber: '', bankIfsc: '', bankAccountName: '', bankBranch: '',
  notes: '',
};

export default function VendorsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editVendor, setEditVendor] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [tab, setTab] = useState('details');

  const { data, isLoading } = useQuery({
    queryKey: ['vendors', search],
    queryFn: () => vendorsApi.list({ search: search || undefined }),
  });
  const vendors = (data as any)?.data || [];

  const saveMutation = useMutation({
    mutationFn: (d: any) => editVendor ? vendorsApi.update(editVendor.id, d) : vendorsApi.create(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['vendors'] }); setShowModal(false); setEditVendor(null); setForm(defaultForm); },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => vendorsApi.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['vendors'] }); setSelected(null); },
  });

  const openEdit = (v: any) => {
    setForm({ name: v.name || '', contactPerson: v.contactPerson || '', email: v.email || '', phone: v.phone || '', whatsapp: v.whatsapp || '', gstin: v.gstin || '', pan: v.pan || '', addressLine1: v.addressLine1 || '', city: v.city || '', state: v.state || '', pincode: v.pincode || '', bankName: v.bankName || '', bankAccountNumber: v.bankAccountNumber || '', bankIfsc: v.bankIfsc || '', bankAccountName: v.bankAccountName || '', bankBranch: v.bankBranch || '', notes: v.notes || '' });
    setEditVendor(v);
    setShowModal(true);
  };

  const F = ({ label, field, placeholder = '' }: any) => (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      <input value={form[field]} onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
    </div>
  );

  return (
    <div className="flex h-full">
      <div className="flex-1 p-6 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <div><h1 className="text-2xl font-bold text-gray-900">Vendors</h1><p className="text-sm text-gray-500 mt-1">{vendors.length} vendors</p></div>
          <button onClick={() => { setEditVendor(null); setForm(defaultForm); setShowModal(true); }} className="px-4 py-2 bg-blue-900 text-white rounded-lg text-sm font-semibold hover:bg-blue-800">+ New Vendor</button>
        </div>
        <div className="mb-4">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search vendors..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        {isLoading ? <div className="text-center py-12 text-gray-500">Loading...</div> : vendors.length === 0 ? (
          <div className="text-center py-12 text-gray-500"><p className="text-4xl mb-3">🏭</p><p className="font-medium">No vendors yet</p></div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead><tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Vendor</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Contact</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">GSTIN</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">City</th>
                <th className="px-4 py-3"></th>
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                {vendors.map((v: any) => (
                  <tr key={v.id} onClick={() => setSelected(v)} className={'cursor-pointer hover:bg-gray-50 ' + (selected?.id === v.id ? 'bg-blue-50' : '')}>
                    <td className="px-4 py-3"><div className="font-medium text-sm text-gray-900">{v.name}</div>{v.contactPerson && <div className="text-xs text-gray-500">{v.contactPerson}</div>}</td>
                    <td className="px-4 py-3"><div className="text-sm text-gray-600">{v.phone}</div><div className="text-xs text-gray-400">{v.email}</div></td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-600">{v.gstin}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{v.city}</td>
                    <td className="px-4 py-3 text-right"><button onClick={(e) => { e.stopPropagation(); openEdit(v); }} className="text-xs text-blue-600 hover:text-blue-800">Edit</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <div className="w-80 bg-white border-l border-gray-200 flex flex-col overflow-hidden">
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 text-sm">Vendor Details</h3>
            <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">X</button>
          </div>
          <div className="flex border-b border-gray-200">
            {['details', 'bank'].map((t) => (
              <button key={t} onClick={() => setTab(t)} className={'flex-1 py-2 text-xs font-medium capitalize border-b-2 ' + (tab === t ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500')}>{t}</button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-3">
            {tab === 'details' ? (
              <>
                <div><p className="text-lg font-bold text-gray-900">{selected.name}</p>{selected.contactPerson && <p className="text-sm text-gray-500">{selected.contactPerson}</p>}</div>
                {selected.phone && <div className="flex justify-between text-sm"><span className="text-gray-500">Phone</span><span>{selected.phone}</span></div>}
                {selected.email && <div className="flex justify-between text-sm"><span className="text-gray-500">Email</span><span className="text-blue-600">{selected.email}</span></div>}
                {selected.whatsapp && <div className="flex justify-between text-sm"><span className="text-gray-500">WhatsApp</span><span>{selected.whatsapp}</span></div>}
                {selected.gstin && <div className="flex justify-between text-sm"><span className="text-gray-500">GSTIN</span><span className="font-mono">{selected.gstin}</span></div>}
                {selected.pan && <div className="flex justify-between text-sm"><span className="text-gray-500">PAN</span><span className="font-mono">{selected.pan}</span></div>}
                {selected.addressLine1 && <div className="text-sm"><span className="text-gray-500">Address: </span>{selected.addressLine1}, {selected.city} {selected.pincode}</div>}
                {selected.notes && <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{selected.notes}</div>}
              </>
            ) : (
              <>
                {selected.bankName && <div className="flex justify-between text-sm"><span className="text-gray-500">Bank</span><span>{selected.bankName}</span></div>}
                {selected.bankAccountName && <div className="flex justify-between text-sm"><span className="text-gray-500">Account Name</span><span>{selected.bankAccountName}</span></div>}
                {selected.bankAccountNumber && <div className="flex justify-between text-sm"><span className="text-gray-500">Account No</span><span className="font-mono">{selected.bankAccountNumber}</span></div>}
                {selected.bankIfsc && <div className="flex justify-between text-sm"><span className="text-gray-500">IFSC</span><span className="font-mono">{selected.bankIfsc}</span></div>}
                {selected.bankBranch && <div className="flex justify-between text-sm"><span className="text-gray-500">Branch</span><span>{selected.bankBranch}</span></div>}
                {!selected.bankName && <p className="text-sm text-gray-400 text-center py-4">No bank details added</p>}
              </>
            )}
          </div>
          <div className="px-5 py-3 border-t flex gap-2">
            <button onClick={() => openEdit(selected)} className="flex-1 px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50">Edit</button>
            <button onClick={() => { if (confirm('Delete vendor?')) deleteMutation.mutate(selected.id); }} className="px-3 py-2 bg-red-50 text-red-600 rounded-lg text-sm hover:bg-red-100">Delete</button>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-screen overflow-y-auto">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">{editVendor ? 'Edit Vendor' : 'New Vendor'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">X</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2"><F label="Vendor Name *" field="name" placeholder="e.g. Hikvision Distributors Pvt Ltd" /></div>
                <F label="Contact Person" field="contactPerson" placeholder="Sales Manager name" />
                <F label="Phone" field="phone" placeholder="+91 98765 43210" />
                <F label="Email" field="email" placeholder="vendor@example.com" />
                <F label="WhatsApp" field="whatsapp" placeholder="+91 98765 43210" />
                <F label="GSTIN" field="gstin" placeholder="22AAAAA0000A1Z5" />
                <F label="PAN" field="pan" placeholder="AAAAA0000A" />
                <div className="col-span-2"><F label="Address" field="addressLine1" placeholder="Street address" /></div>
                <F label="City" field="city" placeholder="Mumbai" />
                <F label="State" field="state" placeholder="Maharashtra" />
                <F label="Pincode" field="pincode" placeholder="400001" />
              </div>
              <hr />
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Bank Details</p>
              <div className="grid grid-cols-2 gap-4">
                <F label="Bank Name" field="bankName" placeholder="HDFC Bank" />
                <F label="Branch" field="bankBranch" placeholder="Andheri West" />
                <F label="Account Name" field="bankAccountName" placeholder="Company / Person name" />
                <F label="Account Number" field="bankAccountNumber" placeholder="12345678901234" />
                <F label="IFSC Code" field="bankIfsc" placeholder="HDFC0001234" />
              </div>
              <hr />
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm">Cancel</button>
              <button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending || !form.name}
                className="px-5 py-2 bg-blue-900 text-white rounded-lg text-sm font-semibold disabled:opacity-50">
                {saveMutation.isPending ? 'Saving...' : editVendor ? 'Update Vendor' : 'Create Vendor'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
