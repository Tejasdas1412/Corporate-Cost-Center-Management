import React, { useState, useEffect } from 'react';
import { CostCenterRequest, CostCenterMaster } from '../../types';
import { Save, CheckCircle2, User, Building2, MessageSquare, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../context/AuthContext';

export default function ISPLWorkbench() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<CostCenterRequest[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [updateData, setUpdateData] = useState<Partial<CostCenterRequest>>({});
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    try {
      const resp = await fetch('/api/requests');
      const data = await resp.json();
      setRequests(data.filter((r: any) => r.Status === 'Sent to ISPL PM' || r.Status === 'In Progress by ISPL PM'));
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const startEdit = (req: CostCenterRequest) => {
    setEditingId(req.id!);
    setUpdateData({
      ProposedCostCenterCode: req.ProposedCostCenterCode,
      ProposedCostCenterName: req.ProposedCostCenterName,
      DepartmentFinal: req.DepartmentProposed,
      TeamFinal: req.TeamProposed,
      BusinessManagerFinal: req.BusinessManagerProposed,
      PMOFinal: req.PMOProposed,
      HODFinal: req.HODProposed,
      DomainFinal: req.DomainProposed,
      ClusterFinal: req.ClusterProposed,
      Cluster1Final: req.Cluster1Proposed,
      Cluster2Final: req.Cluster2Proposed,
      ParadigmCodeFinal: req.ParadigmCodeProposed,
      ParadigmCodeDescriptionFinal: req.ParadigmCodeDescriptionProposed,
      LocationFinal: req.LocationProposed,
      ExCoFinal: req.ExCoProposed,
      ISPLPMRemarks: ''
    });
  };

  const handleComplete = async (req: CostCenterRequest) => {
    setLoading(true);
    try {
      // 1. Update Request
      const finalPayload = {
        ...updateData,
        Status: 'Completed' as const,
        CompletionDate: new Date().toISOString(),
        UpdatedDate: new Date().toISOString(),
        NotificationSent: 1,
        NotificationSentDate: new Date().toISOString()
      };
      
      await fetch(`/api/requests/${req.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalPayload)
      });

      // 2. Update Cost Center Master
      const masterPayload: Partial<CostCenterMaster> = {
        CostCenterCode: updateData.ProposedCostCenterCode!,
        CostCenterName: updateData.ProposedCostCenterName!,
        Department: updateData.DepartmentFinal!,
        Team: updateData.TeamFinal!,
        BusinessManager: updateData.BusinessManagerFinal!,
        PMO: updateData.PMOFinal!,
        HOD: updateData.HODFinal!,
        Domain: updateData.DomainFinal!,
        Cluster: updateData.ClusterFinal!,
        Cluster1: updateData.Cluster1Final!,
        Cluster2: updateData.Cluster2Final!,
        ParadigmCode: updateData.ParadigmCodeFinal!,
        ParadigmCodeDescription: updateData.ParadigmCodeDescriptionFinal!,
        Location: updateData.LocationFinal!,
        ExCo: updateData.ExCoFinal!,
        Status: 'Active',
        EffectiveDate: new Date().toISOString(),
        LastUpdatedDate: new Date().toISOString()
      };

      await fetch('/api/master', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-email': user?.email || 'Anonymous'
        },
        body: JSON.stringify(masterPayload)
      });

      // 3. Trigger Email via Backend
      await fetch('/api/notify-completion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestData: { ...req, ...finalPayload } })
      });

      setEditingId(null);
      fetchData();
      alert("Line item completed and master updated!");
    } catch (error) {
      console.error(error);
      alert("Error completing request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Process ISPL Actions</h2>
        <span className="badge bg-indigo-100 text-indigo-700">{requests.length} Pending Actions</span>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {requests.map(req => (
          <div key={req.id} className="card relative overflow-hidden group">
            {req.RequestType === 'Creation' && (
              <div className="absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 bg-green-500/10 rounded-full group-hover:bg-green-500/20 transition-colors" />
            )}
            
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Request Info */}
              <div className="lg:w-1/3 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-blue-600">{req.RequestID}</span>
                  <span className={`badge ${req.RequestType === 'Creation' ? 'bg-green-50 text-green-700' : 'bg-purple-50 text-purple-700'}`}>
                    {req.RequestType}
                  </span>
                </div>
                
                <div>
                   <h3 className="text-lg font-bold">{req.ProposedCostCenterName}</h3>
                   <p className="text-sm font-mono text-gray-500">{req.ProposedCostCenterCode}</p>
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 p-2 rounded">
                  <User size={12} />
                  <span>Requester: {req.SubmittedBy}</span>
                </div>

                <div className="p-3 bg-amber-50 rounded-lg border border-amber-100 italic text-[11px] text-amber-800">
                  " {req.Justification} "
                </div>
              </div>

              {/* Action Area */}
              <div className="flex-1 lg:border-l lg:pl-8 space-y-6">
                 {editingId === req.id ? (
                   <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div>
                           <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Final CC Code</label>
                           <input 
                             value={updateData.ProposedCostCenterCode}
                             onChange={e => setUpdateData({...updateData, ProposedCostCenterCode: e.target.value})}
                             className="input py-1.5 text-sm" 
                           />
                         </div>
                         <div>
                           <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Final CC Name</label>
                           <input 
                             value={updateData.ProposedCostCenterName}
                             onChange={e => setUpdateData({...updateData, ProposedCostCenterName: e.target.value})}
                             className="input py-1.5 text-sm" 
                           />
                         </div>
                         <div>
                           <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Department</label>
                           <input 
                             value={updateData.DepartmentFinal}
                             onChange={e => setUpdateData({...updateData, DepartmentFinal: e.target.value})}
                             className="input py-1.5 text-sm" 
                           />
                         </div>
                         <div>
                           <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Business Manager / PMO</label>
                           <input 
                             value={updateData.BusinessManagerFinal}
                             onChange={e => setUpdateData({
                               ...updateData, 
                               BusinessManagerFinal: e.target.value,
                               PMOFinal: e.target.value
                             })}
                             className="input py-1.5 text-sm" 
                           />
                         </div>
                         <div>
                           <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Head of Department (HOD)</label>
                           <input 
                             value={updateData.HODFinal}
                             onChange={e => setUpdateData({...updateData, HODFinal: e.target.value})}
                             className="input py-1.5 text-sm" 
                           />
                         </div>
                      </div>

                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <div className="col-span-full mb-2 border-b border-gray-200 pb-2">
                          <span className="text-[10px] font-black uppercase text-blue-600 tracking-widest">Metadata Configuration</span>
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-gray-400 uppercase">Domain</label>
                          <input value={updateData.DomainFinal} onChange={e => setUpdateData({...updateData, DomainFinal: e.target.value})} className="input py-1 text-xs" />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-gray-400 uppercase">Cluster</label>
                          <input value={updateData.ClusterFinal} onChange={e => setUpdateData({...updateData, ClusterFinal: e.target.value})} className="input py-1 text-xs" />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-gray-400 uppercase">Cluster 1</label>
                          <input value={updateData.Cluster1Final} onChange={e => setUpdateData({...updateData, Cluster1Final: e.target.value})} className="input py-1 text-xs" />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-gray-400 uppercase">Cluster 2</label>
                          <input value={updateData.Cluster2Final} onChange={e => setUpdateData({...updateData, Cluster2Final: e.target.value})} className="input py-1 text-xs" />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-gray-400 uppercase">Paradigm Code</label>
                          <input value={updateData.ParadigmCodeFinal} onChange={e => setUpdateData({...updateData, ParadigmCodeFinal: e.target.value})} className="input py-1 text-xs" />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-gray-400 uppercase">Paradigm DESC</label>
                          <input value={updateData.ParadigmCodeDescriptionFinal} onChange={e => setUpdateData({...updateData, ParadigmCodeDescriptionFinal: e.target.value})} className="input py-1 text-xs" />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-gray-400 uppercase">Location</label>
                          <input value={updateData.LocationFinal} onChange={e => setUpdateData({...updateData, LocationFinal: e.target.value})} className="input py-1 text-xs" />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-gray-400 uppercase">ExCo</label>
                          <input value={updateData.ExCoFinal} onChange={e => setUpdateData({...updateData, ExCoFinal: e.target.value})} className="input py-1 text-xs" />
                        </div>
                      </div>

                      <div>
                         <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">ISPL REMARKS</label>
                         <textarea 
                           value={updateData.ISPLPMRemarks}
                           onChange={e => setUpdateData({...updateData, ISPLPMRemarks: e.target.value})}
                           className="input py-2 text-sm resize-none" 
                           rows={2}
                           placeholder="Enter action remarks..."
                         />
                      </div>

                      <div className="flex gap-2 justify-end">
                         <button onClick={() => setEditingId(null)} className="btn-secondary px-6">Cancel</button>
                         <button 
                           onClick={() => handleComplete(req)} 
                           disabled={loading}
                           className="btn-primary px-8"
                         >
                           <CheckCircle2 size={18} />
                           {loading ? 'Processing...' : 'Complete Line Item'}
                         </button>
                      </div>
                   </motion.div>
                 ) : (
                   <div className="flex flex-col h-full justify-center items-center text-center p-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                      <Building2 className="text-gray-300 mb-2" size={32} />
                      <p className="text-sm font-medium text-gray-500 mb-4">Awaiting manual processing in ISPL systems</p>
                      <button 
                        onClick={() => startEdit(req)}
                        className="btn-secondary !border-blue-200 text-blue-600 hover:bg-blue-50"
                      >
                         Open Workbench
                         <ArrowRight size={16} />
                      </button>
                   </div>
                 )}
              </div>
            </div>
          </div>
        ))}

        {requests.length === 0 && (
          <div className="flex flex-col items-center justify-center p-20 text-gray-400">
            <CheckCircle2 size={48} className="text-gray-200 mb-4" />
            <p className="italic font-medium">Clear workbench! No pending ISPL actions.</p>
          </div>
        )}
      </div>
    </div>
  );
}
