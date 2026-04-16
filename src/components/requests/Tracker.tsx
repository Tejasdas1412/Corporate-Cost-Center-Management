import React, { useState, useEffect } from 'react';
import { CostCenterRequest } from '../../types';
import { Search, Filter, ArrowRight, Clock, CheckCircle2, AlertCircle, Send } from 'lucide-react';

export default function Tracker() {
  const [requests, setRequests] = useState<CostCenterRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  useEffect(() => {
    fetch('/api/requests')
      .then(res => res.json())
      .then(data => setRequests(data))
      .catch(console.error);
  }, []);

  const filtered = requests.filter(r => {
    const matchesSearch = 
      r.RequestID.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.ProposedCostCenterCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.ProposedCostCenterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.SubmittedByEmail.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'All' || r.Status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Completed': return 'status-completed';
      case 'Submitted': return 'status-submitted';
      case 'Sent to ISPL PM': return 'status-sent';
      case 'In Progress by ISPL PM': return 'status-sent';
      default: return 'status-pending';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search size={16} className="absolute left-3 top-2.5 text-brand-text-subtle" />
          <input 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search ID, Name..." 
            className="input pl-10 h-10" 
          />
        </div>
        <div className="flex gap-2 items-center w-full md:w-auto overflow-x-auto">
          {['All', 'Submitted', 'Sent to ISPL PM', 'Completed'].map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-4 py-1.5 rounded-[3px] text-[13px] font-bold transition-all border whitespace-nowrap
                ${filterStatus === s ? 'bg-brand-primary text-white border-brand-primary' : 'bg-white text-brand-text border-brand-border hover:bg-[#EBECF0]'}
              `}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="card !p-0 overflow-hidden">
        <div className="header-row px-5 py-4 border-b border-brand-border bg-[#FAFBFC]">
           <div className="font-bold text-[13px] text-[#091E42]">All Line Items</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#FAFBFC] border-b border-brand-border text-brand-text-subtle text-[11px] font-bold uppercase tracking-wider">
                <th className="px-5 py-3">ID</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Cost Center Details</th>
                <th className="px-5 py-3">Requester</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Last Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {filtered.map(req => (
                <tr key={req.id} className="hover:bg-[#F4F5F7] transition-colors">
                  <td className="px-5 py-4">
                    <span className="text-[12px] font-bold text-brand-primary">{req.RequestID}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-[12px] font-bold uppercase ${req.RequestType === 'Creation' ? 'text-green-600' : 'text-brand-primary'}`}>
                      {req.RequestType}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                     <div className="flex flex-col">
                        <span className="font-bold text-[13px] text-[#091E42]">{req.ProposedCostCenterName || 'TBD'}</span>
                        <span className="text-[11px] text-brand-text-subtle">{req.ProposedCostCenterCode}</span>
                     </div>
                  </td>
                  <td className="px-5 py-4 text-brand-text text-[13px]">
                    {req.SubmittedBy}
                  </td>
                  <td className="px-5 py-4">
                     <span className={`status-pill ${getStatusStyle(req.Status)}`}>
                        {req.Status}
                     </span>
                  </td>
                  <td className="px-5 py-4 text-right text-[12px] text-brand-text-subtle">
                     {new Date(req.SubmittedDate).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
