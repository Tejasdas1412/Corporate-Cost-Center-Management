import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { CostCenterRequest, MonthlyBatchLog } from '../../types';
import { Mail, Download, History, Send, ClipboardList, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

export default function MonthlyDispatch() {
  const { user } = useAuth();
  const [pending, setPending] = useState<CostCenterRequest[]>([]);
  const [history, setHistory] = useState<MonthlyBatchLog[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    try {
      const respReq = await fetch('/api/requests');
      const dataReq = await respReq.json();
      setPending(dataReq.filter((r: any) => r.Status === 'Submitted' || r.Status === 'Pending Monthly Dispatch'));

      const respBatches = await fetch('/api/batches');
      const dataBatches = await respBatches.json();
      setHistory(dataBatches);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDispatch = async () => {
    if (pending.length === 0) return;
    setLoading(true);

    try {
      // 1. Call Backend to Collate & Send
      const response = await fetch('/api/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sentBy: user?.displayName,
          sentByEmail: user?.email
        })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      alert("Batch dispatched successfully! The items have been grouped and are now available for manual extraction in the History section below.");
      fetchData();
    } catch (error) {
      console.error(error);
      alert("Dispatch failed. Please check the system logs.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = (batchId: string) => {
    window.location.href = `/api/batches/${batchId}/download`;
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pending Batch */}
        <div className="space-y-6">
           <div className="card h-full flex flex-col">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-xl font-bold flex items-center gap-2">
                    <ClipboardList className="text-blue-500" />
                    New Batch Creation
                 </h3>
                 <span className="badge bg-blue-100 text-blue-700">{pending.length} Requests</span>
              </div>

              <div className="flex-1 overflow-y-auto max-h-[400px] mb-6 border border-gray-100 rounded-xl bg-gray-50/50">
                 {pending.map(req => (
                   <div key={req.id} className="p-4 border-b border-gray-100 flex justify-between items-center">
                      <div>
                        <p className="font-bold text-sm">{req.ProposedCostCenterName}</p>
                        <p className="text-[10px] text-gray-500 font-mono italic">{req.ProposedCostCenterCode}</p>
                      </div>
                      <span className={`badge ${req.RequestType === 'Creation' ? 'bg-green-100' : 'bg-purple-100'}`}>
                         {req.RequestType}
                      </span>
                   </div>
                 ))}
                 {pending.length === 0 && (
                   <div className="p-12 text-center text-gray-400 italic">No pending requests for this month.</div>
                 )}
              </div>

              <div className="space-y-4">
                 <div className="p-4 bg-blue-50 text-blue-800 rounded-xl border border-blue-100 text-xs leading-relaxed">
                    <strong>Business Logic:</strong> Clicking dispatch will collate the items above into an Excel file, mark them as 'Sent to ISPL PM', and trigger an email dispatch.
                 </div>
                 <button 
                   onClick={handleDispatch}
                   disabled={loading || pending.length === 0}
                   className="w-full btn-primary py-4 text-lg shadow-xl shadow-blue-500/20 disabled:bg-gray-400"
                 >
                    {loading ? 'Processing Dispatch...' : 'Dispatch Batch to ISPL'}
                    <Send size={20} />
                 </button>
              </div>
           </div>
        </div>

        {/* History */}
        <div className="space-y-6">
           <div className="card h-full">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                 <History className="text-gray-400" />
                 Dispatch History
              </h3>
              
              <div className="space-y-4">
                 {history.map(batch => (
                   <div key={batch.id} className="group p-4 bg-white border border-gray-200 rounded-xl hover:border-blue-300 transition-all">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-bold text-gray-900">{batch.BatchMonth}</p>
                          <p className="text-[10px] text-gray-400">{new Date(batch.BatchDate).toLocaleString()}</p>
                        </div>
                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded italic">
                          {batch.TotalRequestsSent} rows
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                         <div className="flex items-center gap-2 text-[10px] text-gray-400">
                           <Mail size={12} />
                           <span>Sent to ISPL Team</span>
                         </div>
                         <button 
                           onClick={() => handleDownloadReport(batch.BatchID)}
                           className="flex items-center gap-1 text-[10px] font-bold text-blue-500 hover:text-blue-700 transition-colors uppercase tracking-widest"
                         >
                           <Download size={14} />
                           Report
                         </button>
                      </div>
                   </div>
                 ))}
                 {history.length === 0 && <p className="text-center text-gray-400 italic py-8">No previous batches.</p>}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
