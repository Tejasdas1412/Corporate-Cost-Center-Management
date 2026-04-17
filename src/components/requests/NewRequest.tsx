import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { CostCenterMaster, CostCenterRequest, RequestType } from '../../types';
import { Send, Search, Info, CheckCircle2, Globe, Boxes, Box, MapPin, Briefcase, Award, AlertTriangle, X, Upload, Download, FileSpreadsheet } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as xlsx from 'xlsx';

export default function NewRequest() {
  const { user } = useAuth();
  const [type, setType] = useState<RequestType | 'Bulk'>('Creation');
  const [masters, setMasters] = useState<CostCenterMaster[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCC, setSelectedCC] = useState<CostCenterMaster | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [bulkItems, setBulkItems] = useState<any[]>([]);
  const [showBulkReview, setShowBulkReview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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

  const filteredMasters = masters.filter(m => 
    m.CostCenterCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.CostCenterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.Department.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfirmation(true);
  };

  const confirmSubmit = async () => {
    setLoading(true);
    setShowConfirmation(false);
    
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = xlsx.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = xlsx.utils.sheet_to_json(ws);
      setBulkItems(data);
      setShowBulkReview(data.length > 0);
    };
    reader.readAsBinaryString(file);
  };

  const confirmBulkSubmit = async () => {
    setLoading(true);
    try {
      const resp = await fetch('/api/requests/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: bulkItems,
          submittedBy: user?.displayName,
          submittedByEmail: user?.email
        })
      });
      if (resp.ok) setSubmitted(true);
      setShowBulkReview(false);
    } catch (err) {
      console.error(err);
      alert('Bulk upload failed');
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
            onClick={() => { setType('Creation'); setSelectedCC(null); setSearchTerm(''); setFormData(prev => ({...prev, proposedCode: ''}))}}
            className={`flex-1 py-3 rounded-lg font-bold transition-all ${type === 'Creation' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Create New
          </button>
          <button 
            onClick={() => { setType('Amendment'); setSearchTerm(''); }}
            className={`flex-1 py-3 rounded-lg font-bold transition-all ${type === 'Amendment' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Amend Existing
          </button>
          <button 
            onClick={() => setType('Bulk')}
            className={`flex-1 py-3 rounded-lg font-bold transition-all ${type === 'Bulk' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Bulk Upload
          </button>
        </div>

        {type === 'Bulk' ? (
          <div className="flex flex-col items-center justify-center py-20 bg-blue-50/30 rounded-2xl border-2 border-dashed border-blue-200">
            <FileSpreadsheet size={64} className="text-blue-500 mb-6 opacity-40" />
            <h3 className="text-xl font-bold text-blue-900 mb-2">Mass Creation & Amendments</h3>
            <p className="text-gray-500 text-center max-w-md mb-10 px-6">
              Download our standardized Excel template, fill in your details, and upload it back to create multiple requests at once.
            </p>
            
            <div className="flex flex-wrap justify-center gap-4">
               <a 
                 href="/api/requests/template" 
                 className="flex items-center gap-2 px-6 py-3 bg-white border border-blue-200 text-blue-700 font-bold rounded-xl hover:bg-blue-50 transition-colors shadow-sm"
               >
                 <Download size={18} />
                 Download Template
               </a>
               <button 
                 onClick={() => fileInputRef.current?.click()}
                 className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20"
               >
                 <Upload size={18} />
                 Upload & Process
               </button>
               <input 
                 type="file" 
                 ref={fileInputRef} 
                 onChange={handleFileUpload} 
                 className="hidden" 
                 accept=".xlsx, .xls" 
               />
            </div>
          </div>
        ) : (
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
                
                <div className="relative">
                  <Search size={18} className="absolute left-4 top-3 text-gray-400" />
                  <input 
                    type="text"
                    placeholder="Search by Code, Name, or Department..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input pl-12 w-full bg-white transition-all focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-60 overflow-y-auto p-4 bg-gray-50 rounded-xl border border-gray-100">
                  {filteredMasters.map(cc => (
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
                  {filteredMasters.length === 0 && <p className="col-span-2 text-center text-gray-400 py-4 italic">No matching cost centers found.</p>}
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
        )}
      </div>

      <AnimatePresence>
        {showConfirmation && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="text-amber-500" size={24} />
                  <h3 className="text-xl font-bold text-gray-900">Confirm Request Changes</h3>
                </div>
                <button onClick={() => setShowConfirmation(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>

              <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Identification</p>
                    <div>
                      <label className="text-xs text-gray-500 font-bold uppercase mb-1 block">Cost Center Name</label>
                      <p className="font-bold text-gray-900">{formData.proposedName}</p>
                      <p className="font-mono text-xs text-blue-600 mt-1">{formData.proposedCode}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 font-bold uppercase mb-1 block">Request Type</label>
                      <span className={`badge ${type === 'Creation' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}`}>
                        {type}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ownership</p>
                    <div>
                      <label className="text-xs text-gray-500 font-bold uppercase mb-1 block">Department</label>
                      <p className="font-bold text-gray-900">{formData.proposedDept}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 font-bold uppercase mb-1 block">Business Manager / PMO</label>
                      <p className="font-bold text-gray-900">{formData.proposedManager}</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 space-y-4">
                   <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Technical Metadata</p>
                   <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-gray-500 block">Domain:</span>
                        <span className="font-bold text-blue-900">{formData.domain}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block">Location:</span>
                        <span className="font-bold text-blue-900">{formData.location}</span>
                      </div>
                   </div>
                </div>

                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Justification</p>
                  <p className="text-sm text-gray-700 italic bg-gray-50 p-4 rounded-xl border border-gray-100 leading-relaxed">
                    "{formData.justification}"
                  </p>
                </div>

                <div className="flex items-start gap-4 p-4 bg-amber-50 rounded-xl border border-amber-100">
                  <div className="mt-1 flex-shrink-0">
                    <AlertTriangle className="text-amber-500" size={18} />
                  </div>
                  <p className="text-xs text-amber-800 leading-relaxed font-medium">
                    Please ensure all details are accurate. Once submitted, this request will be sent to the ISPL PM team for processing in the official master record.
                  </p>
                </div>
              </div>

              <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                <button onClick={() => setShowConfirmation(false)} className="btn-secondary px-8">Back to Edit</button>
                <button 
                  onClick={confirmSubmit}
                  className="btn-primary px-10 shadow-lg shadow-blue-500/20"
                >
                  <Send size={18} />
                  Finalize & Submit
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showBulkReview && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full flex flex-col h-[80vh]"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Bulk Upload Review ({bulkItems.length} items)</h3>
                  <p className="text-xs text-gray-500">Please review the data extracted from your file before processing.</p>
                </div>
                <button onClick={() => setShowBulkReview(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-auto p-0">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4">Type</th>
                      <th className="px-6 py-4">Source ID</th>
                      <th className="px-6 py-4">Proposed Name</th>
                      <th className="px-6 py-4">Department</th>
                      <th className="px-6 py-4">Paradigm</th>
                      <th className="px-6 py-4">Location</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {bulkItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <span className={`badge ${item.RequestType === 'Creation' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}`}>
                            {item.RequestType}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-blue-600">{item.ExistingCostCenterCode || '-'}</td>
                        <td className="px-6 py-4 font-bold text-xs">{item.ProposedCostCenterName}</td>
                        <td className="px-6 py-4 text-xs font-medium">{item.DepartmentProposed}</td>
                        <td className="px-6 py-4 text-xs">{item.ParadigmCodeProposed}</td>
                        <td className="px-6 py-4 text-xs">{item.LocationProposed}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                <button onClick={() => setShowBulkReview(false)} className="btn-secondary px-8">Cancel</button>
                <button 
                  disabled={loading}
                  onClick={confirmBulkSubmit}
                  className="btn-primary px-10 shadow-lg shadow-blue-500/20"
                >
                   {loading ? (
                     <>
                       <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                       Processing...
                     </>
                   ) : (
                     <>
                       <Send size={18} />
                       Finalize & Process All
                     </>
                   )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
