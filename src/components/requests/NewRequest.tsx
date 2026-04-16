import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { CostCenterMaster, CostCenterRequest, RequestType } from '../../types';
import { Send, Search, Info, CheckCircle2, Globe, Boxes, Box, MapPin, Briefcase, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function NewRequest() {
  const { user } = useAuth();
  const [type, setType] = useState<RequestType>('Creation');
  const [masters, setMasters] = useState<CostCenterMaster[]>([]);
  const [selectedCC, setSelectedCC] = useState<CostCenterMaster | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  // Form fields
  const [formData, setFormData] = useState({
    proposedCode: '',
    proposedName: '',
    proposedDept: '',
    proposedTeam: '',
    proposedManager: '',
    proposedPMO: '',
    proposedHOD: '',
    domain: '',
    cluster: '',
    cluster1: '',
    cluster2: '',
    paradigmCode: '',
    paradigmCodeDescription: '',
    location: '',
    exCo: '',
    justification: ''
  });

  useEffect(() => {
    fetch('/api/master')
      .then(res => res.json())
      .then(data => setMasters(data.filter((cc: any) => cc.Status === 'Active')))
      .catch(console.error);
  }, []);

  // Auto-generate code for New Creation
  useEffect(() => {
    if (type === 'Creation' && !formData.proposedCode) {
      const yearMonth = new Date().toISOString().slice(2, 7).replace('-', '');
      const random = Math.floor(1000 + Math.random() * 9000);
      setFormData(prev => ({ ...prev, proposedCode: `CC-${yearMonth}-${random}` }));
    }
  }, [type, formData.proposedCode]);

  const handleCCSelect = (cc: CostCenterMaster) => {
    setSelectedCC(cc);
    setFormData({
      ...formData,
      proposedCode: cc.CostCenterCode,
      proposedName: cc.CostCenterName,
      proposedDept: cc.Department,
      proposedTeam: cc.Team,
      proposedManager: cc.BusinessManager,
      proposedPMO: cc.PMO,
      proposedHOD: cc.HOD,
      domain: cc.Domain,
      cluster: cc.Cluster,
      cluster1: cc.Cluster1,
      cluster2: cc.Cluster2,
      paradigmCode: cc.ParadigmCode,
      paradigmCodeDescription: cc.ParadigmCodeDescription,
      location: cc.Location,
      exCo: cc.ExCo,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const requestID = `REQ-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
      const payload = {
        RequestID: requestID,
        RequestType: type,
        ExistingCostCenterCode: selectedCC?.CostCenterCode || '',
        ExistingCostCenterName: selectedCC?.CostCenterName || '',
        ProposedCostCenterCode: formData.proposedCode,
        ProposedCostCenterName: formData.proposedName,
        
        DepartmentOld: selectedCC?.Department || '',
        DepartmentProposed: formData.proposedDept,
        
        TeamOld: selectedCC?.Team || '',
        TeamProposed: formData.proposedTeam,
        
        BusinessManagerOld: selectedCC?.BusinessManager || '',
        BusinessManagerProposed: formData.proposedManager,
        
        PMOOld: selectedCC?.PMO || '',
        PMOProposed: formData.proposedPMO,

        HODOld: selectedCC?.HOD || '',
        HODProposed: formData.proposedHOD,

        DomainOld: selectedCC?.Domain || '',
        DomainProposed: formData.domain,

        ClusterOld: selectedCC?.Cluster || '',
        ClusterProposed: formData.cluster,

        Cluster1Old: selectedCC?.Cluster1 || '',
        Cluster1Proposed: formData.cluster1,

        Cluster2Old: selectedCC?.Cluster2 || '',
        Cluster2Proposed: formData.cluster2,

        ParadigmCodeOld: selectedCC?.ParadigmCode || '',
        ParadigmCodeProposed: formData.paradigmCode,

        ParadigmCodeDescriptionOld: selectedCC?.ParadigmCodeDescription || '',
        ParadigmCodeDescriptionProposed: formData.paradigmCodeDescription,

        LocationOld: selectedCC?.Location || '',
        LocationProposed: formData.location,

        ExCoOld: selectedCC?.ExCo || '',
        ExCoProposed: formData.exCo,

        Justification: formData.justification,
        SubmittedBy: user?.displayName || 'User',
        SubmittedByEmail: user?.email || '',
        SubmittedDate: new Date().toISOString(),
        Status: 'Submitted',
        NotificationSent: 0
      };

      await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      setSubmitted(true);
    } catch (error) {
      console.error("Submission Error:", error);
      alert("Failed to submit request.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
        <CheckCircle2 size={80} className="text-green-500 mb-6" />
        <h2 className="text-3xl font-bold mb-2">Request Submitted!</h2>
        <p className="text-gray-500 mb-8">Your request has been added to the tracker for the next dispatch cycle.</p>
        <button onClick={() => { setSubmitted(false); setType('Creation'); setSelectedCC(null); setFormData({ proposedCode: '', proposedName: '', proposedDept: '', proposedTeam: '', proposedManager: '', proposedPMO: '', proposedHOD: '', domain: '', cluster: '', cluster1: '', cluster2: '', paradigmCode: '', paradigmCodeDescription: '', location: '', exCo: '', justification: '' }); }} className="btn-primary px-8">Raise Another Request</button>
      </motion.div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="card mb-8">
        <div className="flex gap-4 p-1 bg-gray-100 rounded-xl mb-8">
          <button 
            onClick={() => { setType('Creation'); setSelectedCC(null); setFormData(prev => ({...prev, proposedCode: ''}))}}
            className={`flex-1 py-3 rounded-lg font-bold transition-all ${type === 'Creation' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Create New
          </button>
          <button 
            onClick={() => setType('Amendment')}
            className={`flex-1 py-3 rounded-lg font-bold transition-all ${type === 'Amendment' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Amend Existing
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10">
          <AnimatePresence mode="wait">
            {type === 'Amendment' && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: 'auto' }} 
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4"
              >
                <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                  <Search size={16} className="text-blue-500" />
                  Select Cost Center to Amend
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-60 overflow-y-auto p-4 bg-gray-50 rounded-xl border border-gray-100">
                  {masters.map(cc => (
                    <button
                      key={cc.id}
                      type="button"
                      onClick={() => handleCCSelect(cc)}
                      className={`text-left p-4 rounded-xl border transition-all ${selectedCC?.id === cc.id ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm'}`}
                    >
                      <p className="text-xs font-mono font-bold opacity-60">{cc.CostCenterCode}</p>
                      <p className="font-bold truncate">{cc.CostCenterName}</p>
                      <p className="text-[10px] uppercase tracking-widest mt-1 opacity-70">{cc.Department}</p>
                    </button>
                  ))}
                  {masters.length === 0 && <p className="col-span-2 text-center text-gray-400 py-4 italic">No active cost centers found in master data.</p>}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-6 col-span-full">
               <h3 className="text-xs font-bold uppercase tracking-widest text-blue-600 flex items-center gap-2">
                 <Info size={14} />
                 Identification & Naming
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Proposed CC Code (Auto-generated)</label>
                    <input 
                      disabled
                      value={formData.proposedCode}
                      className="input mt-1 bg-gray-50 cursor-not-allowed font-mono text-blue-700" 
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Proposed CC Name</label>
                    <input 
                      required
                      value={formData.proposedName}
                      onChange={e => setFormData({...formData, proposedName: e.target.value})}
                      placeholder="e.g. Asia Digital Marketing" 
                      className="input mt-1" 
                    />
                  </div>
               </div>
            </div>

            <div className="space-y-6">
               <h3 className="text-xs font-bold uppercase tracking-widest text-blue-600 flex items-center gap-2">
                 <Globe size={14} />
                 Domain & Cluster
               </h3>
               <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Domain</label>
                    <input required value={formData.domain} onChange={e => setFormData({...formData, domain: e.target.value})} className="input mt-1" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Cluster</label>
                    <input required value={formData.cluster} onChange={e => setFormData({...formData, cluster: e.target.value})} className="input mt-1" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Cluster-1</label>
                    <input required value={formData.cluster1} onChange={e => setFormData({...formData, cluster1: e.target.value})} className="input mt-1" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Cluster-2</label>
                    <input required value={formData.cluster2} onChange={e => setFormData({...formData, cluster2: e.target.value})} className="input mt-1" />
                  </div>
               </div>
            </div>

            <div className="space-y-6">
               <h3 className="text-xs font-bold uppercase tracking-widest text-blue-600 flex items-center gap-2">
                 <Briefcase size={14} />
                 Paradigm Details
               </h3>
               <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Paradigm Code</label>
                    <input required value={formData.paradigmCode} onChange={e => setFormData({...formData, paradigmCode: e.target.value})} className="input mt-1" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Paradigm Description</label>
                    <input required value={formData.paradigmCodeDescription} onChange={e => setFormData({...formData, paradigmCodeDescription: e.target.value})} className="input mt-1" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Department</label>
                    <input required value={formData.proposedDept} onChange={e => setFormData({...formData, proposedDept: e.target.value})} className="input mt-1" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Team</label>
                    <input required value={formData.proposedTeam} onChange={e => setFormData({...formData, proposedTeam: e.target.value})} className="input mt-1" />
                  </div>
               </div>
            </div>

            <div className="space-y-6">
               <h3 className="text-xs font-bold uppercase tracking-widest text-blue-600 flex items-center gap-2">
                 <MapPin size={14} />
                 Location & Governance
               </h3>
               <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Location</label>
                    <input required value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="input mt-1" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Business Manager / PMO</label>
                    <input 
                      required 
                      value={formData.proposedManager} 
                      onChange={e => setFormData({
                        ...formData, 
                        proposedManager: e.target.value,
                        proposedPMO: e.target.value // Keeping them in sync as requested
                      })} 
                      className="input mt-1" 
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Head of Department (HOD)</label>
                    <input required value={formData.proposedHOD} onChange={e => setFormData({...formData, proposedHOD: e.target.value})} className="input mt-1" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">ExCo</label>
                    <input required value={formData.exCo} onChange={e => setFormData({...formData, exCo: e.target.value})} className="input mt-1" />
                  </div>
               </div>
            </div>

            <div className="col-span-full pt-6 border-t border-gray-100">
               <label className="text-sm font-bold text-[#091E42] mb-2 block">Justification / Remarks</label>
               <textarea 
                 required
                 value={formData.justification}
                 onChange={e => setFormData({...formData, justification: e.target.value})}
                 rows={3}
                 className="input resize-none"
                 placeholder="Business reason for this request..."
               />
            </div>
          </div>

          <div className="pt-6 flex justify-end">
             <button 
               disabled={loading}
               type="submit" 
               className="btn-primary px-12 py-4 text-lg shadow-xl shadow-blue-500/20 disabled:bg-gray-400"
             >
               {loading ? 'Submitting...' : 'Submit Request'}
               <Send size={20} />
             </button>
          </div>
        </form>
      </div>
    </div>
  );
}
