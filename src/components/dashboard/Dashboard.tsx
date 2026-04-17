import React, { useEffect, useState } from 'react';
import { CostCenterRequest } from '../../types';
import { 
  BarChart, 
  Clock, 
  CheckCircle2, 
  Send, 
  PlusCircle, 
  Edit3,
  Calendar
} from 'lucide-react';
import { motion } from 'motion/react';

export default function Dashboard() {
  const [requests, setRequests] = useState<CostCenterRequest[]>([]);

  useEffect(() => {
    fetch('/api/requests')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setRequests(data);
        } else {
          console.error('Expected array for requests, got:', data);
          setRequests([]);
        }
      })
      .catch(err => {
        console.error('Fetch error:', err);
        setRequests([]);
      });
  }, []);

  const safeRequests = Array.isArray(requests) ? requests : [];

  const stats = [
    { label: 'Total Requests', value: safeRequests.length, icon: BarChart, color: 'brand-primary' },
    { label: 'Pending Dispatch', value: safeRequests.filter(r => r.Status === 'Submitted' || r.Status === 'Pending Monthly Dispatch').length, icon: Clock, color: 'brand-primary' },
    { label: 'Sent to ISPL PM', value: safeRequests.filter(r => r.Status === 'Sent to ISPL PM' || r.Status === 'In Progress by ISPL PM').length, icon: Send, color: 'brand-primary' },
    { label: 'Completed', value: safeRequests.filter(r => r.Status === 'Completed' || r.Status === 'Notification Sent').length, icon: CheckCircle2, color: 'brand-primary' },
  ];

  const typeStats = [
    { label: 'Creation Requests', value: safeRequests.filter(r => r.RequestType === 'Creation').length, icon: PlusCircle },
    { label: 'Amendment Requests', value: safeRequests.filter(r => r.RequestType === 'Amendment').length, icon: Edit3 },
  ];

  const getDaysUntilNinth = () => {
    const today = new Date();
    // Use mid-day to avoid TZ issues with ceil
    const target = new Date(today.getFullYear(), today.getMonth() + 1, 9, 12, 0, 0);
    const diff = target.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const daysLeft = getDaysUntilNinth();

  return (
    <div className="space-y-6">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            key={stat.label} 
            className="bg-brand-surface p-4 border border-brand-border rounded-[4px]"
          >
            <div className="flex flex-col">
              <p className="text-[24px] font-bold text-brand-primary">{stat.value.toString().padStart(2, '0')}</p>
              <p className="text-[12px] font-bold text-brand-text-subtle uppercase tracking-wider">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Breakdown */}
        <div className="lg:col-span-1 space-y-6">
           <div className="card">
              <h3 className="text-[13px] font-bold uppercase tracking-wider text-brand-text-subtle mb-4">Request Breakdown</h3>
              <div className="space-y-3">
                {typeStats.map(type => (
                  <div key={type.label} className="flex items-center justify-between p-3 bg-[#FAFBFC] rounded-[3px] border border-brand-border">
                    <div className="flex items-center gap-3">
                      <type.icon className="text-brand-text-subtle" size={16} />
                      <span className="font-semibold text-[13px]">{type.label}</span>
                    </div>
                    <span className="text-[18px] font-bold text-brand-primary">{type.value}</span>
                  </div>
                ))}
              </div>
           </div>

           <div className="bg-[#FFF7E6] border border-[#FFAB00] p-4 rounded-[4px] flex items-center gap-4">
              <div className="text-xl">⚠️</div>
              <div className="flex-1">
                 <p className="text-[#825C00] font-bold text-[13px]">Upcoming Dispatch:</p>
                 <p className="text-[#825C00] text-[12px]">Monthly batch sync is scheduled for the 9th of next month (In {daysLeft} days).</p>
              </div>
           </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2">
           <div className="card !p-0 overflow-hidden">
              <div className="px-5 py-4 border-b border-brand-border bg-[#FAFBFC]">
                <h3 className="text-[14px] font-bold text-[#091E42]">Recent Activity</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-[#FAFBFC] border-b border-brand-border text-brand-text-subtle text-[11px] font-bold uppercase tracking-wider">
                      <th className="px-5 py-3">ID</th>
                      <th className="px-5 py-3">Type</th>
                      <th className="px-5 py-3">Name</th>
                      <th className="px-5 py-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border">
                    {safeRequests.slice(0, 5).map((req) => (
                      <tr key={req.id} className="hover:bg-[#F4F5F7] transition-all">
                        <td className="px-5 py-4 text-[12px] font-bold text-brand-primary uppercase tracking-tighter">{req.RequestID}</td>
                        <td className="px-5 py-4">
                          <span className={`text-[11px] font-bold uppercase ${req.RequestType === 'Creation' ? 'text-green-600' : 'text-brand-primary'}`}>
                            {req.RequestType}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-[13px] font-bold text-[#091E42] truncate max-w-[200px]">{req.ProposedCostCenterName || 'TBD'}</p>
                        </td>
                        <td className="px-5 py-4 text-right">
                           <span className={`status-pill ${
                             req.Status === 'Completed' ? 'status-completed' : 
                             req.Status === 'Sent to ISPL PM' ? 'status-sent' :
                             'status-submitted'
                           }`}>
                             {req.Status}
                           </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
