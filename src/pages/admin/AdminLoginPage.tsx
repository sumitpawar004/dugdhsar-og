import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { useRouter } from '../../router/RouterContext';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  ArrowRight, 
  UserCheck, 
  CheckCircle2, 
  Boxes, 
  Truck, 
  Headphones, 
  Briefcase 
} from 'lucide-react';

export const AdminLoginPage: React.FC = () => {
  const { currentUser, switchUserPersona, recordAuditLog } = useStore();
  const { navigate } = useRouter();

  const [email, setEmail] = useState('admin@dugdhsar.in');
  const [password, setPassword] = useState('••••••••');
  const [selectedRole, setSelectedRole] = useState<'super_admin' | 'inventory_officer' | 'dispatch_lead' | 'customer_desk' | 'dealer_manager'>('super_admin');
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const roleProfiles = [
    {
      id: 'super_admin' as const,
      title: 'Super Admin',
      email: 'admin@dugdhsar.in',
      icon: ShieldCheck,
      badge: 'Full Access (All 17 Modules)',
      description: 'System configuration, financial reconciliation, staff roles & audit logs.'
    },
    {
      id: 'inventory_officer' as const,
      title: 'Inventory Officer',
      email: 'inventory@dugdhsar.in',
      icon: Boxes,
      badge: 'FEFO & Batch Quarantine',
      description: 'Dawn milking lots, temperature assay, milk bottle stock adjustments.'
    },
    {
      id: 'dispatch_lead' as const,
      title: 'Dispatch & Fleet Lead',
      email: 'dispatch@dugdhsar.in',
      icon: Truck,
      badge: 'Delivery Routes & Pincodes',
      description: 'Cold van routing, delivery slots (5:30-11 AM), rider dispatch tracking.'
    },
    {
      id: 'customer_desk' as const,
      title: 'Customer Desk & CRM',
      email: 'support@dugdhsar.in',
      icon: Headphones,
      badge: 'Customers & Patron Enquiries',
      description: 'Manage patron queries, bottle returns, reviews & daily order concerns.'
    },
    {
      id: 'dealer_manager' as const,
      title: 'B2B Dealer Manager',
      email: 'dealer.manager@dugdhsar.in',
      icon: Briefcase,
      badge: 'Wholesale Accounts',
      description: 'Authorize sweet makers, grocery dealers & milk crate bulk quotas.'
    }
  ];

  const handleRoleSelect = (roleId: typeof selectedRole) => {
    setSelectedRole(roleId);
    const profile = roleProfiles.find(r => r.id === roleId);
    if (profile) {
      setEmail(profile.email);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorNotice('Please provide a valid administrator email.');
      return;
    }

    // Switch persona to admin with selected role metadata
    switchUserPersona('admin');
    recordAuditLog('ADMIN_LOGIN_SUCCESS', 'AUTH_SESSION', email, {
      role: selectedRole,
      loginTimestamp: new Date().toISOString(),
      authMethod: 'PASSWORD_HASH_BCRYPT'
    });

    navigate('/admin/dashboard');
  };

  return (
    <div className="bg-[#142019] text-[#F3EDE1] min-h-screen py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center font-sans">
      <div className="max-w-xl w-full">
        
        {/* Header Emblem */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[#C2A36C] text-[#263D30] font-serif font-black text-2xl flex items-center justify-center mx-auto shadow-xl mb-4 border border-white/20">
            DS
          </div>
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#C2A36C] block">
            DUGDHSAR Enterprise Security
          </span>
          <h1 className="font-serif text-3xl font-bold text-white mt-1">
            Dairy Operations Admin Console
          </h1>
          <p className="text-xs text-[#F3EDE1]/70 mt-2 max-w-md mx-auto">
            Authorized administrative access for Seoni processing plant, Cold-Chain logistics & Sukla Sanctuary Gaushala.
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#263D30] border-2 border-[#3A5243] rounded-3xl p-6 sm:p-8 shadow-2xl">
          
          {/* Role-Based Access Quick Selector */}
          <div className="mb-6">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#C2A36C] block mb-2.5">
              Select Staff Role & Persona:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {roleProfiles.map((r) => {
                const Icon = r.icon;
                const isSelected = selectedRole === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => handleRoleSelect(r.id)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-[#C2A36C] text-[#263D30] border-[#C2A36C] shadow-md font-bold'
                        : 'bg-[#1F2F26] text-[#F3EDE1]/85 border-[#3A5243] hover:border-[#C2A36C]/60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <Icon className="w-3.5 h-3.5 shrink-0" />
                        <span className="text-xs font-bold">{r.title}</span>
                      </div>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[#263D30]" />}
                    </div>
                    <span className={`text-[9px] block ${isSelected ? 'text-[#263D30]/80' : 'text-[#C2A36C]'}`}>
                      {r.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#F3EDE1]/80 mb-1">
                Admin Staff Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#C2A36C] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#1F2F26] border border-[#3A5243] rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#C2A36C]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#F3EDE1]/80 mb-1">
                Enterprise Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#C2A36C] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#1F2F26] border border-[#3A5243] rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#C2A36C]"
                />
              </div>
            </div>

            {errorNotice && (
              <p className="text-xs text-rose-400 bg-rose-950/40 border border-rose-800 p-2.5 rounded-xl">
                {errorNotice}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-[#C2A36C] hover:bg-[#b0915a] text-[#263D30] font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <span>Authenticate & Open Admin Console</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Direct links */}
          <div className="mt-6 pt-4 border-t border-[#3A5243] flex items-center justify-between text-[11px] text-[#F3EDE1]/70">
            <button
              onClick={() => navigate('/')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              ← Back to Storefront
            </button>
            <button
              onClick={() => navigate('/dealer/login')}
              className="text-[#C2A36C] hover:underline cursor-pointer font-semibold"
            >
              B2B Dealer Portal →
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
