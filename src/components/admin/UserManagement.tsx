import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../../context/AuthContext';
import { User as UserIcon, ShieldAlert, Trash2, UserPlus, Save, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DBUser {
  id: number;
  email: string;
  displayName: string;
  roles: string; // From DB as comma-separated
}

const ALL_ROLES: { value: UserRole; label: string }[] = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'BUSINESS_MANAGER', label: 'Business Manager' },
  { value: 'PMO', label: 'PMO' },
  { value: 'HOD', label: 'HOD' },
  { value: 'EXCO', label: 'ExCo' },
  { value: 'ISPL_PM', label: 'ISPL PM' },
];

export default function UserManagement() {
  const [users, setUsers] = useState<DBUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    displayName: '',
    roles: [] as UserRole[]
  });

  const fetchUsers = async () => {
    try {
      const resp = await fetch('/api/users');
      const data = await resp.json();
      setUsers(data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newUser.roles.length === 0) {
        alert("Select at least one role.");
        return;
    }
    setLoading(true);
    try {
      await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            ...newUser,
            roles: newUser.roles.join(',')
        })
      });
      setShowAddForm(false);
      setNewUser({ email: '', displayName: '', roles: [] });
      fetchUsers();
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Permanently revoke access for this user?')) return;
    try {
      await fetch(`/api/users/${id}`, { method: 'DELETE' });
      fetchUsers();
    } catch (err) { console.error(err); }
  };

  const toggleRole = (userId: number, currentRoles: string, roleToToggle: UserRole) => {
    let rolesArr = currentRoles ? currentRoles.split(',').filter(Boolean) as UserRole[] : [];
    if (rolesArr.includes(roleToToggle)) {
        rolesArr = rolesArr.filter(r => r !== roleToToggle);
    } else {
        rolesArr.push(roleToToggle);
    }
    
    updateUserRoles(userId, rolesArr.join(','));
  };

  const updateUserRoles = async (id: number, rolesString: string) => {
    try {
      await fetch(`/api/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roles: rolesString })
      });
      fetchUsers();
    } catch (err) { console.error(err); }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center text-gray-800">
        <div>
           <h2 className="text-[20px] font-bold text-[#091E42]">Access Management</h2>
           <p className="text-brand-text-subtle text-sm">Designate system authorities and departmental roles.</p>
        </div>
        <button 
          onClick={() => setShowAddForm(true)}
          className="btn-primary"
        >
          <UserPlus size={18} />
          Provision New User
        </button>
      </div>

      <AnimatePresence>
        {showAddForm && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="card bg-blue-50 border-blue-200"
          >
            <form onSubmit={handleAddUser} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-blue-600 uppercase mb-1 block">Display Name</label>
                  <input 
                    required
                    value={newUser.displayName}
                    onChange={e => setNewUser({...newUser, displayName: e.target.value})}
                    placeholder="e.g. Jane Doe"
                    className="input py-2"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-blue-600 uppercase mb-1 block">Email Address</label>
                  <input 
                    required
                    type="email"
                    value={newUser.email}
                    onChange={e => setNewUser({...newUser, email: e.target.value})}
                    placeholder="name@company.com"
                    className="input py-2"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-[10px] font-bold text-blue-600 uppercase mb-2 block">Assigned Roles</label>
                <div className="flex flex-wrap gap-3 p-4 bg-white rounded-lg border border-blue-100">
                    {ALL_ROLES.map(r => (
                        <label key={r.value} className="flex items-center gap-2 cursor-pointer group">
                            <input 
                                type="checkbox"
                                checked={newUser.roles.includes(r.value)}
                                onChange={e => {
                                    if (e.target.checked) {
                                        setNewUser({...newUser, roles: [...newUser.roles, r.value]});
                                    } else {
                                        setNewUser({...newUser, roles: newUser.roles.filter(x => x !== r.value)});
                                    }
                                }}
                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-xs font-bold text-gray-700 group-hover:text-blue-600 transition-colors">{r.label}</span>
                        </label>
                    ))}
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowAddForm(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={loading} className="btn-primary min-w-[120px]">
                  <Save size={16} />
                  {loading ? 'Saving...' : 'Save User'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="card !p-0 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 uppercase text-[10px] font-black text-gray-400">
              <th className="px-6 py-4">Employee Identity</th>
              <th className="px-6 py-4">Granted Permissions</th>
              <th className="px-6 py-4">Security Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
                      <UserIcon size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-[#091E42]">{u.displayName}</p>
                      <p className="text-xs text-gray-500 font-mono italic">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1.5 max-w-xs">
                    {ALL_ROLES.map(role => {
                        const hasRole = u.roles?.split(',').includes(role.value);
                        return (
                            <button
                                key={role.value}
                                onClick={() => toggleRole(u.id, u.roles, role.value)}
                                className={`px-2 py-0.5 rounded text-[9px] font-black uppercase transition-all ${
                                    hasRole 
                                    ? 'bg-blue-600 text-white shadow-sm' 
                                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                }`}
                            >
                                {role.label}
                            </button>
                        );
                    })}
                  </div>
                </td>
                <td className="px-6 py-4">
                   <div className="flex items-center gap-1.5 text-[10px] font-black text-green-600 uppercase">
                      <ShieldCheck size={14} className="text-green-500" />
                      Live Session
                   </div>
                </td>
                <td className="px-6 py-4 text-right">
                   <button 
                    onClick={() => handleDelete(u.id)}
                    className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                   >
                     <Trash2 size={18} />
                   </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-lg border border-amber-100 text-amber-800">
        <ShieldAlert size={20} />
        <p className="text-[12px] font-medium italic">
          Roles define functional authority. Administrators can allocate multiple duties to a single user profile.
        </p>
      </div>
    </div>
  );
}
