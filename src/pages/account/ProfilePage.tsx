import React, { useState } from 'react';
import { AccountLayout } from './AccountLayout';
import { useStore } from '../../context/StoreContext';
import { ShieldCheck, User, CheckCircle2 } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { currentUser, updateProfile } = useStore();
  const [fullName, setFullName] = useState(currentUser.fullName);
  const [phone, setPhone] = useState(currentUser.phone);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({ fullName, phone });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <AccountLayout>
      <div className="bg-[#FAF6EE] p-6 sm:p-8 rounded-3xl border border-[#D8C9AD] shadow-xs max-w-2xl">
        <h2 className="font-serif text-2xl text-[#263D30] font-semibold mb-1">
          Profile & Security Settings
        </h2>
        <p className="text-xs text-[#302C26]/70 mb-6">
          Update your contact phone for dawn delivery WhatsApp dispatch alerts.
        </p>

        {savedSuccess && (
          <div className="mb-6 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Profile credentials updated successfully.</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1 text-[#302C26]">Full Name</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-[#D8C9AD] rounded-xl bg-[#F8F4EC] text-[#302C26]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1 text-[#302C26]">Primary Email Address</label>
            <input
              type="email"
              disabled
              value={currentUser.email}
              className="w-full px-3 py-2 text-xs border border-[#D8C9AD] rounded-xl bg-[#D8C9AD]/20 text-[#302C26]/60 cursor-not-allowed"
            />
            <span className="text-[10px] text-[#302C26]/50 mt-1 block">Email address cannot be modified once verified.</span>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1 text-[#302C26]">WhatsApp / Phone Number</label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-[#D8C9AD] rounded-xl bg-[#F8F4EC] text-[#302C26]"
            />
          </div>

          <div className="pt-4 border-t border-[#D8C9AD]/40 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[11px] text-[#A34F37]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Two-Factor Authentication Active</span>
            </div>

            <button
              type="submit"
              className="bg-[#263D30] text-[#FAF6EE] px-6 py-2.5 rounded-xl text-xs font-semibold hover:bg-[#1A2B22] transition-colors"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </AccountLayout>
  );
};
