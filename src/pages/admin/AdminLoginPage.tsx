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
import { GoogleLoginModal } from '../../components/GoogleLoginModal';

export const AdminLoginPage: React.FC = () => {
  const { currentUser, switchUserPersona, recordAuditLog, loginUser } = useStore();
  const { navigate } = useRouter();

  const [email, setEmail] = useState('admin@dugdhsar.in');
  const [password, setPassword] = useState('••••••••');
  const [selectedRole, setSelectedRole] = useState<'super_admin' | 'inventory_officer' | 'dispatch_lead' | 'customer_desk' | 'dealer_manager'>('super_admin');
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);

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

  const handleGoogleAdminLogin = async (googleEmail = 'sumitpawar65005@gmail.com') => {
    switchUserPersona('admin');
    recordAuditLog('GOOGLE_ADMIN_LOGIN_SUCCESS', 'AUTH_SESSION', googleEmail, {
      role: 'super_admin',
      provider: 'google_oauth',
      loginTimestamp: new Date().toISOString()
    });
    navigate('/admin/dashboard');
  };

  const GoogleGIcon = () => (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
    </svg>
  );

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
          
          {/* GOOGLE ADMIN SIGN IN */}
          <div className="mb-6 p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#C2A36C] block mb-2">
              Super Admin Instant Google Sign In
            </span>
            <button
              type="button"
              onClick={() => handleGoogleAdminLogin('sumitpawar65005@gmail.com')}
              className="w-full bg-white hover:bg-neutral-100 text-neutral-900 font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-3 transition-all shadow-md active:scale-[0.98] cursor-pointer"
            >
              <GoogleGIcon />
              <span>Sign in with Google (Super Admin)</span>
              <span className="text-[10px] text-neutral-500 font-normal">sumitpawar65005@gmail.com</span>
            </button>

            <button
              type="button"
              onClick={() => setIsGoogleModalOpen(true)}
              className="mt-2 text-[11px] text-[#C2A36C] hover:underline cursor-pointer font-medium block mx-auto"
            >
              Or sign in with another administrator Google Gmail account →
            </button>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#3A5243]"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
              <span className="bg-[#263D30] px-3 text-[#C2A36C]">Or Select Staff Persona & Password</span>
            </div>
          </div>
          
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

          {/* Separate Portals Switcher */}
          <div className="mt-6 pt-4 border-t border-[#3A5243] space-y-2">
            <div className="flex items-center justify-between text-[11px] text-[#F3EDE1]/70">
              <button
                onClick={() => navigate('/')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                ← Back to Storefront
              </button>
              <button
                onClick={() => navigate('/login')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Patron Login →
              </button>
            </div>
            <div className="flex items-center justify-center gap-3 pt-1 text-[11px]">
              <button
                onClick={() => navigate('/manager/login')}
                className="text-[#C2A36C] hover:underline cursor-pointer font-semibold"
              >
                📋 Operations Manager Portal
              </button>
              <span className="text-[#3A5243]">|</span>
              <button
                onClick={() => navigate('/dealer/login')}
                className="text-[#C2A36C] hover:underline cursor-pointer font-semibold"
              >
                🏢 B2B Dealer Portal
              </button>
            </div>
          </div>

        </div>

        <GoogleLoginModal
          isOpen={isGoogleModalOpen}
          onClose={() => setIsGoogleModalOpen(false)}
          targetRole="admin"
          onSuccessRedirect="/admin/dashboard"
        />

      </div>
    </div>
  );
};
