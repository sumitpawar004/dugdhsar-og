import React, { useState } from 'react';
import { AccountLayout } from './AccountLayout';
import { useStore } from '../../context/StoreContext';
import { Plus, Trash2, CheckCircle2, MapPin } from 'lucide-react';

export const AddressesPage: React.FC = () => {
  const { userAddresses: addresses, addAddress, deleteAddress, setDefaultAddress, currentUser } = useStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    fullName: currentUser.fullName || '',
    phone: currentUser.phone || '',
    flatNo: '',
    apartment: '',
    street: 'Barghat Rd, Sufi Nagar',
    landmark: 'Near Sanjay Vihar Colony',
    city: 'Seoni',
    state: 'Madhya Pradesh',
    pincode: '480661',
    isDefault: true,
    deliverySlot: '5:00 AM - 10:00 AM',
    instructions: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.phone || !formData.flatNo || !formData.pincode) return;

    addAddress(formData);
    setShowAddModal(false);
    setFormData({
      fullName: currentUser.fullName || '',
      phone: currentUser.phone || '',
      flatNo: '',
      apartment: '',
      street: 'Barghat Rd, Sufi Nagar',
      landmark: '',
      city: 'Seoni',
      state: 'Madhya Pradesh',
      pincode: '480661',
      isDefault: false,
      deliverySlot: '5:00 AM - 10:00 AM',
      instructions: ''
    });
  };

  return (
    <AccountLayout>
      <div className="bg-[#FAF6EE] p-6 sm:p-8 rounded-3xl border border-[#D8C9AD] shadow-xs">
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#D8C9AD]">
          <div>
            <h2 className="font-serif text-2xl text-[#263D30] font-semibold">
              Delivery Address Book ({addresses.length})
            </h2>
            <p className="text-xs text-[#302C26]/70">
              Manage dawn doorstep delivery locations and entry gate instructions.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="bg-[#263D30] text-[#FAF6EE] px-4 py-2 rounded-xl text-xs font-semibold hover:bg-[#1A2B22] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add New Address</span>
          </button>
        </div>

        {addresses.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#302C26]/70">
            <MapPin className="w-10 h-10 text-[#C2A36C] mx-auto mb-3" />
            <p className="font-semibold text-sm text-[#263D30] mb-1">No saved address found.</p>
            <p className="text-xs text-[#302C26]/60 mb-4">Add your home or office address in Seoni for morning doorstep drops.</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-5 py-2.5 bg-[#263D30] text-[#FAF6EE] rounded-xl text-xs font-semibold hover:bg-[#1A2B22] cursor-pointer inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Delivery Address</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                addr.isDefault 
                  ? 'border-2 border-[#263D30] bg-[#FAF6EE]' 
                  : 'border-[#D8C9AD] bg-[#F8F4EC]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[#263D30]">{addr.fullName}</span>
                    {addr.isDefault && (
                      <span className="text-[10px] bg-[#263D30] text-[#FAF6EE] font-semibold px-2 py-0.5 rounded">
                        Default
                      </span>
                    )}
                  </div>
                  {addresses.length > 1 && (
                    <button
                      onClick={() => deleteAddress(addr.id)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                      title="Delete address"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <p className="text-xs text-[#302C26]/80 leading-relaxed mb-2">
                  {addr.flatNo}, {addr.apartment}<br />
                  {addr.street}, {addr.landmark && `${addr.landmark}, `}{addr.city} — {addr.pincode}
                </p>

                <p className="text-[11px] text-[#302C26]/70">
                  Phone: <strong>{addr.phone}</strong> · Slot: <strong>{addr.deliverySlot}</strong>
                </p>

                {addr.instructions && (
                  <p className="text-[11px] text-[#A34F37] mt-2 italic">
                    Note: {addr.instructions}
                  </p>
                )}
              </div>

              {!addr.isDefault && (
                <div className="mt-4 pt-3 border-t border-[#D8C9AD]/40">
                  <button
                    onClick={() => setDefaultAddress(addr.id)}
                    className="text-xs text-[#263D30] font-semibold hover:underline"
                  >
                    Set as Default Morning Address
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

        {/* Modal: Add Address */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[#FAF6EE] max-w-lg w-full p-8 rounded-3xl border border-[#D8C9AD] shadow-2xl">
              <h3 className="font-serif text-2xl text-[#263D30] font-semibold mb-4">
                Add New Delivery Location
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="e.g. Aryaman Sen"
                      className="w-full px-3 py-2 text-xs border border-[#D8C9AD] rounded-lg bg-[#F8F4EC] text-[#302C26]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Phone *</label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+91 98101 23456"
                      className="w-full px-3 py-2 text-xs border border-[#D8C9AD] rounded-lg bg-[#F8F4EC] text-[#302C26]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1">Flat / House No *</label>
                    <input
                      type="text"
                      required
                      value={formData.flatNo}
                      onChange={(e) => setFormData({ ...formData, flatNo: e.target.value })}
                      placeholder="Flat 402"
                      className="w-full px-3 py-2 text-xs border border-[#D8C9AD] rounded-lg bg-[#F8F4EC] text-[#302C26]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Apartment / Society *</label>
                    <input
                      type="text"
                      required
                      value={formData.apartment}
                      onChange={(e) => setFormData({ ...formData, apartment: e.target.value })}
                      placeholder="The Magnolias"
                      className="w-full px-3 py-2 text-xs border border-[#D8C9AD] rounded-lg bg-[#F8F4EC] text-[#302C26]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1">City *</label>
                    <input
                      type="text"
                      required
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-[#D8C9AD] rounded-lg bg-[#F8F4EC] text-[#302C26]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">State *</label>
                    <input
                      type="text"
                      required
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-[#D8C9AD] rounded-lg bg-[#F8F4EC] text-[#302C26]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Pincode *</label>
                    <input
                      type="text"
                      required
                      value={formData.pincode}
                      onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-[#D8C9AD] rounded-lg font-mono bg-[#F8F4EC] text-[#302C26]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">Gate / Entry Instructions</label>
                  <input
                    type="text"
                    value={formData.instructions}
                    onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                    placeholder="e.g. Leave in cold delivery bag on door handle"
                    className="w-full px-3 py-2 text-xs border border-[#D8C9AD] rounded-lg bg-[#F8F4EC] text-[#302C26]"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-[#D8C9AD]">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-xs font-medium text-[#302C26]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-[#263D30] text-[#FAF6EE] px-5 py-2 text-xs font-semibold rounded-lg hover:bg-[#1A2B22]"
                  >
                    Save Address
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AccountLayout>
  );
};
