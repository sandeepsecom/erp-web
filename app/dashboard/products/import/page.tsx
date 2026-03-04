// @ts-nocheck
'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { productsApi } from '@/lib/api';

const TEMPLATE_HEADERS = ['name', 'sku', 'description', 'category', 'uom', 'costPrice', 'salePrice', 'inputTaxRate', 'outputTaxRate', 'hsnCode', 'sacCode', 'isService', 'trackSerial', 'currentStock'];

const SAMPLE_ROWS = [
  ['Hikvision 4MP Dome Camera', 'HIK-4MP-DOME', '4MP IR Fixed Dome Network Camera', 'CCTV', 'NOS', '4500', '7500', '18', '18', '85258090', '', 'false', 'true', '0'],
  ['Annual Maintenance Service', 'AMC-BASIC', 'Basic AMC for CCTV systems', 'AMC', 'NOS', '0', '12000', '18', '18', '', '998712', 'true', 'false', '0'],
  ['CAT6 Cable', 'CAT6-305M', '305 meter CAT6 UTP Cable Box', 'Networking', 'BOX', '1800', '3200', '18', '18', '85444290', '', 'false', 'false', '10'],
];

function parseCSV(text: string) {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
    const obj: any = {};
    headers.forEach((h, i) => { obj[h] = values[i] || ''; });
    return obj;
  }).filter(row => row.name);
}

export default function ImportProductsPage() {
  const router = useRouter();
  const fileRef = useRef(null);
  const [preview, setPreview] = useState([]);
  const [fileName, setFileName] = useState('');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const downloadTemplate = () => {
    const csv = [TEMPLATE_HEADERS.join(','), ...SAMPLE_ROWS.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'products_import_template.csv';
    a.click();
  };

  const handleFile = (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    setResult(null);
    setError('');
    const reader = new FileReader();
    reader.onload = (ev: any) => {
      const text = ev.target.result;
      const rows = parseCSV(text);
      setPreview(rows);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (preview.length === 0) return;
    setImporting(true);
    setError('');
    try {
      const res = await productsApi.import(preview);
      setResult((res as any).data);
      setPreview([]);
      setFileName('');
    } catch (e: any) {
      setError(e.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.push('/dashboard/products')} className="text-gray-400 hover:text-gray-600 text-sm">← Back</button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Import Products</h1>
          <p className="text-sm text-gray-500">Upload a CSV file to bulk import products</p>
        </div>
      </div>

      {/* Step 1 - Download Template */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900 text-sm">Step 1 — Download Template</h2>
            <p className="text-xs text-gray-500 mt-1">Download the CSV template with sample data to understand the format</p>
          </div>
          <button onClick={downloadTemplate} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 flex items-center gap-2">
            ⬇ Download Template
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {TEMPLATE_HEADERS.map(h => (
            <span key={h} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded font-mono">{h}</span>
          ))}
        </div>
      </div>

      {/* Step 2 - Upload */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
        <h2 className="font-semibold text-gray-900 text-sm mb-3">Step 2 — Upload Your CSV</h2>
        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
        >
          <p className="text-3xl mb-2">📂</p>
          <p className="text-sm font-medium text-gray-700">{fileName || 'Click to upload CSV file'}</p>
          <p className="text-xs text-gray-400 mt-1">Only .csv files supported</p>
          <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} className="hidden" />
        </div>
      </div>

      {/* Step 3 - Preview */}
      {preview.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-semibold text-gray-900 text-sm">Step 3 — Preview & Import</h2>
              <p className="text-xs text-gray-500 mt-0.5">{preview.length} products ready to import</p>
            </div>
            <button onClick={handleImport} disabled={importing}
              className="px-5 py-2 bg-blue-900 text-white rounded-lg text-sm font-semibold hover:bg-blue-800 disabled:opacity-50">
              {importing ? 'Importing...' : `Import ${preview.length} Products`}
            </button>
          </div>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm mb-3">{error}</div>}
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-3 py-2 font-semibold text-gray-500">#</th>
                  <th className="text-left px-3 py-2 font-semibold text-gray-500">Name</th>
                  <th className="text-left px-3 py-2 font-semibold text-gray-500">SKU</th>
                  <th className="text-left px-3 py-2 font-semibold text-gray-500">Category</th>
                  <th className="text-left px-3 py-2 font-semibold text-gray-500">Type</th>
                  <th className="text-right px-3 py-2 font-semibold text-gray-500">Cost</th>
                  <th className="text-right px-3 py-2 font-semibold text-gray-500">Price</th>
                  <th className="text-right px-3 py-2 font-semibold text-gray-500">GST%</th>
                  <th className="text-left px-3 py-2 font-semibold text-gray-500">HSN/SAC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {preview.slice(0, 50).map((row: any, i: number) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                    <td className="px-3 py-2 font-medium text-gray-900">{row.name}</td>
                    <td className="px-3 py-2 text-gray-500 font-mono">{row.sku}</td>
                    <td className="px-3 py-2">{row.category && <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">{row.category}</span>}</td>
                    <td className="px-3 py-2">
                      <span className={'px-2 py-0.5 rounded-full ' + (row.isService === 'true' ? 'bg-purple-50 text-purple-700' : 'bg-green-50 text-green-700')}>
                        {row.isService === 'true' ? 'Service' : 'Product'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right text-gray-600">₹{Number(row.costPrice || 0).toLocaleString('en-IN')}</td>
                    <td className="px-3 py-2 text-right font-medium text-gray-900">₹{Number(row.salePrice || 0).toLocaleString('en-IN')}</td>
                    <td className="px-3 py-2 text-right text-gray-600">{row.outputTaxRate || 18}%</td>
                    <td className="px-3 py-2 font-mono text-gray-500">{row.hsnCode || row.sacCode}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {preview.length > 50 && <p className="text-xs text-gray-400 p-3 text-center">Showing first 50 of {preview.length} rows</p>}
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-5">
          <h2 className="font-semibold text-green-800 mb-2">Import Complete!</h2>
          <div className="flex gap-6">
            <div><p className="text-2xl font-bold text-green-700">{result.created}</p><p className="text-xs text-green-600">Products Created</p></div>
            <div><p className="text-2xl font-bold text-orange-600">{result.skipped}</p><p className="text-xs text-orange-500">Skipped (duplicates)</p></div>
          </div>
          <button onClick={() => router.push('/dashboard/products')} className="mt-4 px-4 py-2 bg-green-700 text-white rounded-lg text-sm font-medium hover:bg-green-800">
            View Products →
          </button>
        </div>
      )}
    </div>
  );
}
