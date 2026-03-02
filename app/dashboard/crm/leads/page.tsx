'use client';

import { useQuery } from '@tanstack/react-query';
import { leadsApi } from '@/lib/api';
import { useState } from 'react';
import NewLeadModal from './new-lead-modal';

const STAGE_COLORS: Record<string, string> = {
  NEW: 'bg-gray-100 border-gray-300',
  CONTACTED: 'bg-blue-50 border-blue-300',
  QUALIFIED: 'bg-purple-50 border-purple-300',
  PROPOSAL: 'bg-yellow-50 border-yellow-300',
  NEGOTIATION: 'bg-orange-50 border-orange-300',
  WON: 'bg-green-50 border-green-300',
  LOST: 'bg-red-50 border-red-300',
};

const STAGE_LABELS: Record<string, string> = {
  NEW: 'New',
  CONTACTED: 'Contacted',
  QUALIFIED: 'Qualified',
  PROPOSAL: 'Proposal',
  NEGOTIATION: 'Negotiation',
  WON: 'Won',
  LOST: 'Lost',
};

function formatCurrency(value: any) {
  const num = Number(value) || 0;
  if (num >= 100000) return `₹${(num / 100000).toFixed(1)}L`;
  if (num >= 1000) return `₹${(num / 1000).toFixed(0)}K`;
  return `₹${num}`;
}

export default function LeadsPage() {
  const [showNewLead, setShowNewLead] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['leads-kanban'],
    queryFn: () => leadsApi.kanban(),
  });

  const { data: summaryData } = useQuery({
    queryKey: ['pipeline-summary'],
    queryFn: () => leadsApi.summary(),
  });

  const columns = (data as any)?.data || [];
  const summary = (summaryData as any)?.data;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Loading pipeline...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {showNewLead && <NewLeadModal onClose={() => setShowNewLead(false)} />}

      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Sales Pipeline</h1>
          {summary && (
            <p className="text-sm text-gray-500 mt-0.5">
              {summary.totalLeads} leads · Pipeline value: {formatCurrency(summary.pipelineValue)}
            </p>
          )}
        </div>
        <button
          onClick={() => setShowNewLead(true)}
          className="bg-blue-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors"
        >
          + New Lead
        </button>
      </div>

      <div className="flex-1 overflow-x-auto p-6">
        <div className="flex gap-4 h-full min-w-max">
          {columns.map((column: any) => (
            <div key={column.stage} className="w-64 flex flex-col">
              <div className={`rounded-t-lg border-t-4 p-3 bg-white border ${STAGE_COLORS[column.stage]}`}>
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-sm text-gray-800">
                    {STAGE_LABELS[column.stage]}
                  </h3>
                  <span className="bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded-full">
                    {column.total}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{formatCurrency(column.totalValue)}</p>
              </div>

              <div className="flex-1 bg-gray-50 rounded-b-lg border border-t-0 border-gray-200 p-2 space-y-2 overflow-y-auto max-h-96">
                {column.leads.length === 0 && (
                  <div className="text-center py-8 text-gray-400 text-xs">No leads</div>
                )}
                {column.leads.map((lead: any) => (
                  <div key={lead.id} className="bg-white rounded-lg border border-gray-200 p-3 hover:shadow-sm transition-shadow cursor-pointer">
                    <p className="text-sm font-medium text-gray-800 line-clamp-2">{lead.title}</p>
                    {lead.contact && (
                      <p className="text-xs text-gray-500 mt-1">
                        {lead.contact.companyName || `${lead.contact.firstName} ${lead.contact.lastName || ''}`}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs font-medium text-blue-700">
                        {formatCurrency(lead.expectedValue)}
                      </span>
                      <span className="text-xs text-gray-400">{lead.probability}%</span>
                    </div>
                    {lead.assignee && (
                      <div className="mt-2 flex items-center gap-1">
                        <div className="w-5 h-5 bg-blue-900 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">
                            {lead.assignee.fullName.charAt(0)}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">{lead.assignee.fullName}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}