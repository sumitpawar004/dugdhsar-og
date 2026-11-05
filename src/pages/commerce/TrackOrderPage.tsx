import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { useRouter } from '../../router/RouterContext';
import { formatPaise } from '../../types';
import { 
  Truck, 
  Thermometer, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  ShieldCheck, 
  PhoneCall, 
  Search 
} from 'lucide-react';

export const TrackOrderPage: React.FC = () => {
  const { orders } = useStore();
  const { navigate } = useRouter();

  const [searchOrderNumber, setSearchOrderNumber] = useState(orders[0]?.orderNumber || 'DS-8941');
  const activeOrder = orders.find(o => o.orderNumber === searchOrderNumber || o.id === searchOrderNumber) || orders[0];

  const milestones = [
    { title: 'Touchless Milking & Quality Seal', time: '04:30 AM', desc: 'Milked from Vedic Gir cows, verified at 492 purity score and bottled fresh.', done: true },
    { title: 'Vat Pasteurization & Glass Bottling', time: '05:00 AM', desc: 'Rapidly chilled to 3.5°C and bottled in sterile recyclable glass jars.', done: true },
    { title: 'Refrigerated Cold-Chain Van Dispatch', time: '05:35 AM', desc: 'Loaded into insulated GPS cooler container DS-VAN-08.', done: true },
    { title: 'Arrival at Customer Doorstep', time: '06:45 AM', desc: 'Placed in insulated doorstep bag with empty bottle collection.', done: activeOrder?.status === 'delivered' }
  ];

  return (
    <div className="bg-[#F8F4EC] text-[#302C26] min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <div className="text-center max-w-xl mx-auto mb-10">
          <p className="text-xs uppercase tracking-[0.25em] text-[#A34F37] font-semibold mb-2">
            Real-Time Logistics Telemetry
          </p>
          <h1 className="text-3xl sm:text-4xl font-serif text-[#263D30] font-normal mb-3">
            Track Cold-Chain Fleet Delivery
          </h1>
          <p className="text-xs text-[#302C26]/75">
            Monitor internal bottle temperature, refrigerated van GPS position, and morning delivery window.
          </p>
        </div>

        {/* Search bar */}
        <div className="bg-[#FAF6EE] p-4 rounded-2xl border border-[#D8C9AD] mb-8 flex gap-3 shadow-xs">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#302C26]/50" />
            <input
              type="text"
              value={searchOrderNumber}
              onChange={(e) => setSearchOrderNumber(e.target.value)}
              placeholder="Enter Order Number (e.g. DS-8941)"
              className="w-full pl-9 pr-3 py-2 text-xs border border-[#D8C9AD] rounded-xl font-mono text-[#263D30] uppercase bg-[#F8F4EC]"
            />
          </div>
          <button
            onClick={() => {}}
            className="bg-[#263D30] text-[#FAF6EE] px-5 py-2 text-xs font-semibold rounded-xl hover:bg-[#1A2B22]"
          >
            Locate
          </button>
        </div>

        {activeOrder ? (
          <div className="space-y-6">
            
            {/* Live Telemetry Sensor Card */}
            <div className="bg-[#263D30] text-[#FAF6EE] p-6 sm:p-8 rounded-3xl shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#3A5243]">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-[#C2A36C] font-semibold block mb-1">
                    Order Status: <strong className="text-white uppercase">{activeOrder.status}</strong>
                  </span>
                  <h2 className="text-2xl font-serif text-[#FAF6EE]">
                    Order {activeOrder.orderNumber}
                  </h2>
                </div>

                <div className="flex items-center gap-4 bg-[#1F2F26] px-4 py-2.5 rounded-2xl border border-[#3A5243]">
                  <Thermometer className="w-6 h-6 text-[#C2A36C] animate-pulse" />
                  <div>
                    <span className="text-[10px] text-[#FAF6EE]/70 block">Internal Bottle Sensor</span>
                    <span className="text-sm font-mono font-bold text-white">3.2°C (Pristine Cold)</span>
                  </div>
                </div>
              </div>

              {/* Fleet & Driver details */}
              <div className="pt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-[#FAF6EE]/85">
                <div>
                  <span className="text-[#C2A36C] block text-[11px] font-semibold">Delivery Partner</span>
                  <span className="font-semibold text-white">Rameshwar Singh</span>
                  <p className="text-[11px] text-[#FAF6EE]/60">Refrigerated Van #DS-04</p>
                </div>
                <div>
                  <span className="text-[#C2A36C] block text-[11px] font-semibold">Delivery Window</span>
                  <span className="font-semibold text-white">{activeOrder.deliverySlot}</span>
                  <p className="text-[11px] text-[#FAF6EE]/60">{activeOrder.estimatedDelivery}</p>
                </div>
                <div>
                  <span className="text-[#C2A36C] block text-[11px] font-semibold">Assigned Pincode</span>
                  <span className="font-mono font-semibold text-white">{activeOrder.deliveryPincode}</span>
                  <p className="text-[11px] text-[#FAF6EE]/60">{activeOrder.deliveryAddress.city}</p>
                </div>
              </div>
            </div>

            {/* Timeline Milestones */}
            <div className="bg-[#FAF6EE] p-6 sm:p-8 rounded-3xl border border-[#D8C9AD] shadow-xs">
              <h3 className="font-serif text-xl text-[#263D30] font-semibold mb-6">
                Cold-Chain Milestone Audit
              </h3>

              <div className="space-y-6 relative before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#D8C9AD]">
                {milestones.map((m, idx) => (
                  <div key={idx} className="relative flex items-start gap-4 pl-8">
                    <div className={`absolute left-0 top-0.5 w-7 h-7 rounded-full border-2 flex items-center justify-center ${
                      m.done 
                        ? 'border-[#263D30] bg-[#263D30] text-[#FAF6EE]' 
                        : 'border-[#D8C9AD] bg-[#FAF6EE] text-slate-300'
                    }`}>
                      <CheckCircle2 className="w-4 h-4" />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-semibold text-[#263D30]">{m.title}</span>
                        <span className="text-[11px] font-mono text-[#A34F37] font-semibold">{m.time}</span>
                      </div>
                      <p className="text-xs text-[#302C26]/75 leading-relaxed">
                        {m.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Driver Assistance */}
            <div className="p-4 bg-[#FAF6EE] rounded-2xl border border-[#D8C9AD] flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-[#263D30] block">Need assistance with morning delivery?</span>
                <span className="text-[#302C26]/70 text-[11px]">Direct priority line to our dawn dispatch supervisor.</span>
              </div>
              <a
                href="tel:7067672604"
                className="bg-[#A34F37] text-[#FAF6EE] px-4 py-2 rounded-lg font-semibold hover:bg-[#8e422c] transition-colors flex items-center gap-1.5"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Call Dispatch (+91 7067672604)</span>
              </a>
            </div>
          </div>
        ) : (
          <div className="py-16 text-center text-xs text-[#302C26]/70">
            Order not found. Please verify the order number.
          </div>
        )}
      </div>
    </div>
  );
};
