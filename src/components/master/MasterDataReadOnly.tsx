import React, { useState, useEffect } from 'react';
import { CostCenterMaster } from '../../types';
import { Search, Database, Tag, ShieldCheck, Download, Filter } from 'lucide-react';

export default function MasterDataReadOnly() {
  const [masters, setMasters] = useState<CostCenterMaster[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchMasters = async () => {
    try {
      const resp = await fetch('/api/master');
      const data = await resp.json();
      setMasters(data.filter((m: any) => m.Status === 'Active'));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchMasters();
  }, []);

  const handleExport = () => {
    window.location.href = '/api/master/export';
  };

  const filtered = masters.filter(m => 
    m.CostCenterCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.CostCenterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.Department.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.BusinessManager.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.PMO.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-96">
            <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
            <input 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search Code, Name, Dept, Manager..." 
              className="input pl-10" 
            />
          </div>
          <button className="btn-secondary flex items-center gap-2">
            <Filter size={16} />
            Filters
          </button>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200">
             <ShieldCheck size={14} className="text-green-600" />
             Read-Only View
          </div>
          <button 
            onClick={handleExport}
            className="btn-primary flex items-center gap-2 px-6"
          >
            <Download size={18} />
            Export Master Data
          </button>
        </div>
      </div>

      <div className="card !p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[1000px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 text-[10px] font-black uppercase tracking-widest">
                <th className="px-6 py-4">Cost Center Code</th>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Department / Team</th>
                <th className="px-6 py-4">Business Manager</th>
                <th className="px-6 py-4">PMO</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Effective Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center">
                    <div className="flex justify-center items-center gap-3 text-gray-400">
                      <div className="w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      Loading master records...
                    </div>
                  </td>
                </tr>
              ) : filtered.map(item => (
                <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4 font-mono text-sm font-bold text-blue-600">
                    {item.CostCenterCode}
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-gray-900">{item.CostCenterName}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">{item.Department}</p>
                      <p className="text-[10px] text-gray-500 uppercase font-bold">{item.Team}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm">{item.BusinessManager}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm">{item.PMO}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="badge bg-green-100 text-green-700">
                      {item.Status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-500 font-medium">
                    {item.EffectiveDate ? new Date(item.EffectiveDate).toLocaleDateString() : 'N/A'}
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-20 text-center text-gray-400 italic">
                    <div className="flex flex-col items-center">
                      <Database size={40} className="text-gray-100 mb-4" />
                      <p>No active cost centers found matching your search.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-4 bg-brand-bg rounded-xl border border-brand-border flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
            <Database size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Active CCs</p>
            <p className="text-xl font-black text-[#091E42]">{masters.length}</p>
          </div>
        </div>
        <div className="p-4 bg-brand-bg rounded-xl border border-brand-border flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
            <ShieldCheck size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Data Integrity</p>
            <p className="text-xl font-black text-[#091E42]">100% Verified</p>
          </div>
        </div>
        <div className="p-4 bg-brand-bg rounded-xl border border-brand-border flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
            <Tag size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Last Synced</p>
            <p className="text-xl font-black text-[#091E42]">Just now</p>
          </div>
        </div>
      </div>
    </div>
  );
}
