import React, { useState, useEffect } from 'react';
import { CostCenterMaster } from '../../types';
import { Search, Database, Trash2, ShieldCheck, Tag, Map as MapIcon, Globe, MapPin, Briefcase, Award } from 'lucide-react';
import MapContainer from '../MapContainer';

export default function MasterData() {
  const [masters, setMasters] = useState<CostCenterMaster[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchMasters = async () => {
    try {
      const resp = await fetch('/api/master');
      const data = await resp.json();
      setMasters(data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchMasters();
  }, []);

  const filtered = masters.filter(m => 
    m.CostCenterCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.CostCenterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.Department.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.Domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.Location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: number) => {
    if (!confirm("Remove this cost center from official master record?")) return;
    try {
      await fetch(`/api/master/${id}`, { method: 'DELETE' });
      fetchMasters();
    } catch (err) { console.error(err); }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
              <input 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search Code, Name, Domain, Location..." 
                className="input pl-10" 
              />
            </div>
            <div className="flex items-center gap-4 text-xs font-bold text-green-600 bg-green-50 px-4 py-2 rounded-full border border-green-100 uppercase tracking-widest">
               <ShieldCheck size={16} />
               Official Master Record
            </div>
          </div>

          <div className="card !p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[1200px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 text-[10px] font-black uppercase tracking-widest">
                    <th className="px-6 py-4">Code / Name</th>
                    <th className="px-6 py-4">Structure (Domain/Cluster)</th>
                    <th className="px-6 py-4">Paradigm</th>
                    <th className="px-6 py-4">Org details</th>
                    <th className="px-6 py-4">Location & ExCo</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map(item => (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                            <Tag size={20} />
                          </div>
                          <div>
                            <p className="font-mono text-xs font-bold text-blue-600">{item.CostCenterCode}</p>
                            <p className="font-bold text-gray-900 line-clamp-1">{item.CostCenterName}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                         <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-700">
                               <Globe size={12} className="text-blue-500" />
                               {item.Domain}
                            </div>
                            <div className="text-[10px] text-gray-500">
                               {item.Cluster} / {item.Cluster1} / {item.Cluster2}
                            </div>
                         </div>
                      </td>
                      <td className="px-6 py-4">
                         <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-700">
                               <Briefcase size={12} className="text-orange-500" />
                               {item.ParadigmCode}
                            </div>
                            <div className="text-[10px] text-gray-500 line-clamp-1">
                               {item.ParadigmCodeDescription}
                            </div>
                         </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{item.Department} / {item.Team}</p>
                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">BM/PMO: {item.BusinessManager}</p>
                          <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">HOD: {item.HOD}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                         <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-700">
                               <MapPin size={12} className="text-red-500" />
                               {item.Location}
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                               <Award size={12} className="text-purple-500" />
                               ExCo: {item.ExCo}
                            </div>
                         </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`badge ${item.Status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {item.Status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => handleDelete(Number(item.id))}
                          className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {masters.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-20 text-center text-gray-400 italic">
                        <div className="flex flex-col items-center">
                          <Database size={40} className="text-gray-100 mb-4" />
                          <p>Cost Center Master is empty. Complete a Request to populate data.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="card h-full">
            <h3 className="text-[14px] font-bold text-[#091E42] mb-4 flex items-center gap-2">
              <MapIcon size={16} className="text-blue-500" />
              Geography Overview
            </h3>
            <div className="rounded-lg overflow-hidden border border-brand-border h-[500px]">
              <MapContainer />
            </div>
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100 italic text-[12px] text-blue-800">
              Map shows location of active cost centers across regional offices.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
