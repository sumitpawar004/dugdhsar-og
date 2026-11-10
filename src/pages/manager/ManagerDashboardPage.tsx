import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { useRouter } from '../../router/RouterContext';
import { formatPaise, Product, Order, Subscription } from '../../types';
import { 
  Briefcase, 
  Package, 
  RefreshCw, 
  FileText, 
  Boxes, 
  Truck, 
  ShoppingCart, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Download, 
  CheckCircle2, 
  Check, 
  LogOut, 
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Sparkles,
  TrendingUp,
  MapPin,
  Settings
} from 'lucide-react';

export const ManagerDashboardPage: React.FC = () => {
  const { 
    currentUser, 
    logoutUser, 
    products, 
    orders, 
    subscriptions, 
    updateSubscription, 
    deleteSubscription, 
    toggleSubscriptionPause, 
    syncSubscriptionsToGoogleSheets, 
    exportSubscriptionsToCSV, 
    addSubscription,
    addNewProduct,
    updateProduct,
    deleteProduct,
    toggleProductPublish,
    updateProductStock,
    updateOrderStatus,
    batches,
    adjustBatchStock,
    toggleBatchQuarantine,
    deliveryZones,
    siteSettings,
    updateSiteSettings,
    recordAuditLog
  } = useStore();

  const { path, navigate } = useRouter();

  // Active section inside Manager panel
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'subscriptions' | 'orders' | 'google-sheets' | 'inventory' | 'deliveries'>('overview');

  // Preset Vedic dairy product imagery
  const DAIRY_IMAGE_PRESETS = [
    { label: 'Fresh A2 Milk Bottle', url: '/assets/aistudio/image_fe6cbcdf.png' },
    { label: 'A2 Gir Cow Farm Milking', url: '/assets/aistudio/image_de2ddb95.png' },
    { label: 'Vedic Bilona Ghee Jar', url: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=800&auto=format&fit=crop&q=80' },
    { label: 'Fresh Malai Paneer', url: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=800&auto=format&fit=crop&q=80' },
    { label: 'Clay Pot Vedic Dahi', url: 'https://images.unsplash.com/photo-1571212515416-fef01fc43637?w=800&auto=format&fit=crop&q=80' },
    { label: 'Cultured White Makhan', url: 'https://images.unsplash.com/photo-1589985270747-8b09b531ce68?w=800&auto=format&fit=crop&q=80' },
    { label: 'Danedar Khoya / Mawa', url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&auto=format&fit=crop&q=80' },
    { label: 'Gir Cow Heritage Logo', url: '/assets/aistudio/dugdhsar_heritage_logo_clean.png' }
  ];

  // Product Add / Edit States
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [newProductForm, setNewProductForm] = useState({
    name: '',
    categorySlug: 'milk',
    sizeLabel: '1 Litre Glass Bottle',
    priceRupees: 170,
    stockCount: 50,
    description: 'Fresh Vedic A2 dairy processed under cold-chain standards in Seoni.',
    badge: 'Fresh Dawn Milking',
    imageUrl: '/assets/aistudio/image_fe6cbcdf.png'
  });

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editProductForm, setEditProductForm] = useState({
    name: '',
    categorySlug: 'milk',
    sizeLabel: '',
    priceRupees: 0,
    stockCount: 0,
    description: '',
    badge: '',
    imageUrl: '',
    isPublished: true,
    featured: false
  });

  // Subscriptions Management States
  const [subSearchQuery, setSubSearchQuery] = useState('');
  const [subFilterStatus, setSubFilterStatus] = useState<'all' | 'active' | 'paused' | 'cancelled'>('all');
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);
  const [editSubForm, setEditSubForm] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    productName: 'DUGDHSAR Fresh A2 Desi Cow Whole Milk',
    variant: '1 Litre Glass Bottle',
    quantity: 1,
    frequency: 'daily' as 'daily' | 'alternate' | 'weekdays',
    deliverySlot: '5:00 AM - 10:00 AM',
    deliveryAddress: '',
    notes: '',
    status: 'active' as 'active' | 'paused' | 'cancelled'
  });
  const [isAddSubOpen, setIsAddSubOpen] = useState(false);
  const [newSubForm, setNewSubForm] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    productName: 'DUGDHSAR Fresh A2 Desi Cow Whole Milk',
    variant: '1 Litre Glass Bottle',
    quantity: 1,
    frequency: 'daily' as 'daily' | 'alternate' | 'weekdays',
    deliverySlot: '5:00 AM - 10:00 AM',
    deliveryAddress: 'Sufi Nagar, Barghat Road, Seoni, MP 480661',
    notes: 'Morning dawn drop in sterilized glass bottle'
  });

  // Google Sheets Sync States
  const [isSyncingSheets, setIsSyncingSheets] = useState(false);
  const [sheetSyncResult, setSheetSyncResult] = useState<string | null>(null);
  const [webhookInput, setWebhookInput] = useState(siteSettings.googleSheetsWebhookUrl || 'https://script.google.com/macros/s/AKfycbx-dugdhsar-a2-dairy-sync/exec');

  // KPIs
  const totalDailyLitres = subscriptions.filter(s => s.status === 'active').reduce((sum, s) => sum + s.quantity, 0);
  const activeSubsCount = subscriptions.filter(s => s.status === 'active').length;
  const pendingOrdersCount = orders.filter(o => o.status === 'confirmed' || o.status === 'processing').length;
  const totalStockUnits = products.flatMap(p => p.variants).reduce((sum, v) => sum + v.stockCount, 0);

  const handleLogout = () => {
    logoutUser();
    navigate('/manager/login');
  };

  return (
    <div className="bg-[#12231A] text-[#F3EDE1] min-h-screen flex flex-col font-sans">
      
      {/* Top Manager Navigation Bar */}
      <header className="bg-[#1D3527] border-b border-[#3A5243] px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-40 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#C2A36C] text-[#12231A] flex items-center justify-center font-bold font-serif text-lg shadow-md">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#C2A36C] bg-[#C2A36C]/10 border border-[#C2A36C]/30 px-2 py-0.5 rounded-full">
                Operations Manager Portal
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">
                Seoni Plant MP
              </span>
            </div>
            <h1 className="font-serif text-base sm:text-lg font-bold text-white leading-tight">
              Dugdhsar Operations Console
            </h1>
          </div>
        </div>

        {/* Manager User Info & Sign Out */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[#14261C] hover:bg-[#253E30] text-xs font-semibold rounded-xl border border-[#3A5243] transition-colors"
          >
            <span>View Store</span>
            <ExternalLink className="w-3.5 h-3.5 text-[#C2A36C]" />
          </button>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#14261C] rounded-xl border border-[#3A5243]">
            <div className="w-7 h-7 rounded-full bg-[#C2A36C]/20 border border-[#C2A36C] flex items-center justify-center text-[11px] font-bold text-[#C2A36C]">
              {currentUser.fullName ? currentUser.fullName.charAt(0) : 'M'}
            </div>
            <div className="text-left leading-tight hidden md:block">
              <span className="text-xs font-bold text-white block">{currentUser.fullName || 'Manager'}</span>
              <span className="text-[10px] text-emerald-400 font-mono block">Plant Operations</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900 border border-rose-700 text-rose-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Log out of Manager Portal"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Container with Sidebar + Content */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col md:flex-row gap-6">
        
        {/* Navigation Sidebar */}
        <aside className="w-full md:w-64 shrink-0 space-y-1">
          <span className="text-[10px] uppercase font-mono tracking-wider text-[#F3EDE1]/60 px-3 block mb-2 font-bold">
            Manager Control Modules
          </span>

          {[
            { id: 'overview', label: 'Overview & KPIs', icon: TrendingUp },
            { id: 'products', label: 'Manage Products & Photos', icon: Package },
            { id: 'subscriptions', label: 'Subscriptions Control', icon: RefreshCw },
            { id: 'google-sheets', label: 'Google Sheets Live Sync', icon: FileText },
            { id: 'orders', label: 'Cold-Chain Orders', icon: ShoppingCart },
            { id: 'inventory', label: 'Inventory & Batch Purity', icon: Boxes },
            { id: 'deliveries', label: 'Seoni Delivery Routes', icon: Truck },
          ].map((tab) => {
            const Icon = tab.icon;
            const isCurrent = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-[#C2A36C] text-[#12231A] font-bold shadow-md'
                    : 'text-[#F3EDE1]/80 hover:bg-[#1D3527] hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${isCurrent ? 'text-[#12231A]' : 'text-[#C2A36C]'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}

          <div className="pt-4 mt-4 border-t border-[#3A5243]/60 px-3 text-[11px] text-[#F3EDE1]/60 space-y-2">
            <p>
              🔒 <strong>Isolated Portal</strong>: Logged in as Operations Manager.
            </p>
            <p className="text-[10px]">
              Need Super Admin settings? <button onClick={() => navigate('/admin/login')} className="text-[#C2A36C] underline">Go to Admin Login</button>
            </p>
          </div>
        </aside>

        {/* Content Pane */}
        <main className="flex-1 space-y-6">

          {/* TAB 1: OVERVIEW & KPIS */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h2 className="font-serif text-2xl text-white font-bold">Operations Dashboard</h2>
                <p className="text-xs text-[#F3EDE1]/70 mt-1">
                  Daily bottling and morning milk dispatch across Seoni city routes.
                </p>
              </div>

              {/* Stat Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-[#1D3527] rounded-2xl border border-[#3A5243] space-y-1">
                  <span className="text-[10px] text-[#F3EDE1]/60 uppercase font-mono">Daily Milk Bottles</span>
                  <strong className="text-2xl font-bold text-[#C2A36C] font-mono block">{totalDailyLitres} L</strong>
                  <span className="text-[11px] text-emerald-400">Sterilized Glass Bottles</span>
                </div>
                <div className="p-4 bg-[#1D3527] rounded-2xl border border-[#3A5243] space-y-1">
                  <span className="text-[10px] text-[#F3EDE1]/60 uppercase font-mono">Active Subscriptions</span>
                  <strong className="text-2xl font-bold text-white font-mono block">{activeSubsCount}</strong>
                  <span className="text-[11px] text-emerald-400">Recurring dawn drops</span>
                </div>
                <div className="p-4 bg-[#1D3527] rounded-2xl border border-[#3A5243] space-y-1">
                  <span className="text-[10px] text-[#F3EDE1]/60 uppercase font-mono">Pending Orders</span>
                  <strong className="text-2xl font-bold text-amber-300 font-mono block">{pendingOrdersCount}</strong>
                  <span className="text-[11px] text-[#F3EDE1]/60">Awaiting cold van</span>
                </div>
                <div className="p-4 bg-[#1D3527] rounded-2xl border border-[#3A5243] space-y-1">
                  <span className="text-[10px] text-[#F3EDE1]/60 uppercase font-mono">On-Hand Stock</span>
                  <strong className="text-2xl font-bold text-white font-mono block">{totalStockUnits} Units</strong>
                  <span className="text-[11px] text-emerald-400">In 2°C – 4°C Chiller</span>
                </div>
              </div>

              {/* Quick Actions Bar */}
              <div className="bg-[#1D3527] p-5 rounded-2xl border border-[#3A5243] space-y-3">
                <h3 className="font-serif text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#C2A36C]" />
                  <span>Operations Manager Quick Tasks</span>
                </h3>
                <div className="flex flex-wrap gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('products');
                      setIsAddProductOpen(true);
                    }}
                    className="px-4 py-2 bg-[#C2A36C] hover:bg-[#b0915a] text-[#12231A] font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Upload New Product</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('subscriptions');
                      setIsAddSubOpen(true);
                    }}
                    className="px-4 py-2 bg-[#14261C] hover:bg-[#263D30] text-white border border-[#3A5243] font-semibold text-xs rounded-xl cursor-pointer flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-[#C2A36C]" />
                    <span>Add Manual Subscription</span>
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      setIsSyncingSheets(true);
                      const res = await syncSubscriptionsToGoogleSheets(webhookInput);
                      setIsSyncingSheets(false);
                      setSheetSyncResult(res.message);
                      setTimeout(() => setSheetSyncResult(null), 5000);
                    }}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncingSheets ? 'animate-spin' : ''}`} />
                    <span>Sync to Google Sheets</span>
                  </button>
                </div>
              </div>

              {/* Next Morning Delivery Schedule */}
              <div className="bg-[#1D3527] p-5 rounded-2xl border border-[#3A5243] space-y-3">
                <h3 className="font-serif text-sm font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#C2A36C]" />
                  <span>Cold-Chain Milk Dispatch Rounds (Seoni City)</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-[#14261C] rounded-xl border border-[#3A5243] space-y-1">
                    <strong className="text-white block font-bold">Dawn Morning Slot (5:00 AM – 10:00 AM)</strong>
                    <p className="text-[#F3EDE1]/70">Routes: Sufi Nagar, Barghat Road, Sanjay Vihar Colony, Netaji Ward</p>
                    <span className="text-[10px] text-emerald-400 font-mono font-bold block pt-1">
                      Status: Active · Cold-Chain Chilled at 3.2°C
                    </span>
                  </div>
                  <div className="p-3 bg-[#14261C] rounded-xl border border-[#3A5243] space-y-1">
                    <strong className="text-white block font-bold">Evening Drop Slot (6:00 PM – 10:00 PM)</strong>
                    <p className="text-[#F3EDE1]/70">Routes: Jabalpur Road, VIP Colony, Dunda Seoni, Circuit House Area</p>
                    <span className="text-[10px] text-emerald-400 font-mono font-bold block pt-1">
                      Status: Scheduled for Evening Fresh Milking
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MANAGE PRODUCTS & PHOTOS */}
          {activeTab === 'products' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="font-serif text-xl sm:text-2xl text-white font-bold flex items-center gap-2">
                    <Package className="w-5 h-5 text-[#C2A36C]" />
                    <span>Manage Products & Photos</span>
                  </h2>
                  <p className="text-xs text-[#F3EDE1]/70 mt-0.5">
                    Operations Manager access: Add new items, update selling prices, stock, and change or delete product photos.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAddProductOpen(true)}
                  className="px-4 py-2 bg-[#C2A36C] hover:bg-[#b0915a] text-[#12231A] font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Product</span>
                </button>
              </div>

              {/* Products Table */}
              <div className="border border-[#3A5243] rounded-2xl overflow-hidden divide-y divide-[#3A5243]">
                {products.map((p) => {
                  const mainVariant = p.variants[0] || { pricePaise: 0, stockCount: 0, sizeLabel: 'Standard' };
                  const imgUrl = p.images?.[0]?.imageUrl || '/assets/aistudio/image_fe6cbcdf.png';

                  return (
                    <div key={p.id} className="p-4 bg-[#1D3527] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs hover:bg-[#233f2f] transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-xl border border-[#C2A36C]/40 overflow-hidden bg-black shrink-0 relative">
                          <img src={imgUrl} alt={p.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <strong className="text-sm font-bold text-white">{p.name}</strong>
                            <span className="px-2 py-0.2 rounded-full text-[9px] font-bold uppercase bg-[#C2A36C]/20 text-[#C2A36C]">
                              {p.categorySlug}
                            </span>
                            {p.badge && (
                              <span className="px-2 py-0.2 rounded-full text-[9px] font-bold bg-[#A34F37]/20 text-[#A34F37]">
                                {p.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[#F3EDE1]/70 line-clamp-1">{p.description}</p>
                          <div className="flex items-center gap-3 font-mono text-[11px] pt-0.5">
                            <span className="text-[#C2A36C] font-bold">{formatPaise(mainVariant.pricePaise)}</span>
                            <span className="text-gray-400">· {mainVariant.sizeLabel}</span>
                            <span className={mainVariant.stockCount < 20 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                              · Stock: {mainVariant.stockCount} units
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Manager Controls */}
                      <div className="flex items-center gap-2 shrink-0">
                        {/* Quick Stock Buttons */}
                        <div className="flex items-center gap-1 bg-[#14261C] p-1 rounded-lg border border-[#3A5243]">
                          <button
                            type="button"
                            onClick={() => updateProductStock(mainVariant.id, -10, 'Manager manual deduction')}
                            className="px-2 py-0.5 hover:bg-white/10 rounded font-mono text-[10px] text-rose-300 font-bold cursor-pointer"
                            title="Deduct 10 units"
                          >
                            -10
                          </button>
                          <button
                            type="button"
                            onClick={() => updateProductStock(mainVariant.id, +10, 'Manager fresh bottling addition')}
                            className="px-2 py-0.5 hover:bg-white/10 rounded font-mono text-[10px] text-emerald-300 font-bold cursor-pointer"
                            title="Add 10 units"
                          >
                            +10
                          </button>
                        </div>

                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setEditingProduct(p);
                            setEditProductForm({
                              name: p.name,
                              categorySlug: p.categorySlug,
                              sizeLabel: mainVariant.sizeLabel,
                              priceRupees: mainVariant.pricePaise / 100,
                              stockCount: mainVariant.stockCount,
                              description: p.description,
                              badge: p.badge || '',
                              imageUrl: p.images?.[0]?.imageUrl || '',
                              isPublished: p.isPublished,
                              featured: p.featured || false
                            });
                          }}
                          className="px-3 py-1.5 bg-[#14261C] hover:bg-[#253E30] text-white border border-[#3A5243] rounded-lg font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5 text-[#C2A36C]" />
                          <span>Edit & Photo</span>
                        </button>

                        {/* Publish toggle */}
                        <button
                          type="button"
                          onClick={() => toggleProductPublish(p.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                            p.isPublished 
                              ? 'bg-amber-950/60 text-amber-300 border border-amber-800' 
                              : 'bg-emerald-950/60 text-emerald-300 border border-emerald-700'
                          }`}
                        >
                          {p.isPublished ? 'Unpublish' : 'Publish'}
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Delete "${p.name}"? This removes it from the digital store.`)) {
                              deleteProduct(p.id);
                            }
                          }}
                          className="p-1.5 bg-rose-950/40 hover:bg-rose-950 border border-rose-800 text-rose-300 rounded-lg cursor-pointer"
                          title="Delete Product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: SUBSCRIPTIONS CONTROL */}
          {activeTab === 'subscriptions' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="font-serif text-xl sm:text-2xl text-white font-bold flex items-center gap-2">
                    <RefreshCw className="w-5 h-5 text-[#C2A36C]" />
                    <span>Subscriptions Control & Routes</span>
                  </h2>
                  <p className="text-xs text-[#F3EDE1]/70 mt-0.5">
                    Operations Manager: Edit deliveries, bottle quantities, pause/resume, and sync to Google Sheets.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={isSyncingSheets}
                    onClick={async () => {
                      setIsSyncingSheets(true);
                      const res = await syncSubscriptionsToGoogleSheets(webhookInput);
                      setIsSyncingSheets(false);
                      setSheetSyncResult(res.message);
                      setTimeout(() => setSheetSyncResult(null), 5000);
                    }}
                    className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncingSheets ? 'animate-spin' : ''}`} />
                    <span>{isSyncingSheets ? 'Syncing...' : 'Sync to Google Sheets'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => exportSubscriptionsToCSV()}
                    className="px-3.5 py-2 bg-[#1D3527] hover:bg-[#253E30] border border-[#3A5243] text-[#FAF6EE] rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-[#C2A36C]" />
                    <span>Export CSV</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsAddSubOpen(true)}
                    className="px-3.5 py-2 bg-[#C2A36C] hover:bg-[#b0915a] text-[#12231A] rounded-xl text-xs font-bold flex items-center gap-1 shadow-md cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ New Subscription</span>
                  </button>
                </div>
              </div>

              {sheetSyncResult && (
                <div className="p-3 bg-emerald-950 border border-emerald-500 rounded-xl text-xs text-emerald-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{sheetSyncResult}</span>
                  </div>
                  <button type="button" onClick={() => setSheetSyncResult(null)} className="text-emerald-400 hover:text-white">✕</button>
                </div>
              )}

              {/* Filter and Search */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#1D3527] p-3 rounded-2xl border border-[#3A5243]">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search patron by name, phone, email, or address..."
                    value={subSearchQuery}
                    onChange={(e) => setSubSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-[#14261C] border border-[#3A5243] rounded-xl text-white text-xs outline-none focus:border-[#C2A36C]"
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  {(['all', 'active', 'paused', 'cancelled'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setSubFilterStatus(st)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                        subFilterStatus === st
                          ? 'bg-[#C2A36C] text-[#12231A] font-bold shadow-xs'
                          : 'bg-[#14261C] text-[#F3EDE1]/70 hover:text-white'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subscriptions Cards */}
              <div className="space-y-3">
                {subscriptions
                  .filter(s => {
                    if (subFilterStatus !== 'all' && s.status !== subFilterStatus) return false;
                    if (!subSearchQuery.trim()) return true;
                    const q = subSearchQuery.toLowerCase();
                    return (
                      (s.customerName || '').toLowerCase().includes(q) ||
                      (s.customerPhone || '').toLowerCase().includes(q) ||
                      (s.deliveryAddress || '').toLowerCase().includes(q) ||
                      (s.productName || '').toLowerCase().includes(q)
                    );
                  })
                  .map((sub) => (
                    <div
                      key={sub.id}
                      className="p-4 bg-[#1D3527] rounded-2xl border border-[#3A5243] flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs hover:border-[#C2A36C]/40 transition-colors"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <strong className="text-sm font-bold text-white">{sub.customerName || 'Valued Patron'}</strong>
                          <span className="font-mono text-[11px] text-[#C2A36C] bg-[#C2A36C]/10 border border-[#C2A36C]/30 px-2 py-0.5 rounded-md">
                            {sub.customerPhone || '+91 7067672604'}
                          </span>
                          {sub.customerEmail && (
                            <span className="text-[10px] text-[#F3EDE1]/60">{sub.customerEmail}</span>
                          )}
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            sub.status === 'active' ? 'bg-emerald-950 text-emerald-300 border border-emerald-600' : 'bg-amber-950 text-amber-300 border border-amber-600'
                          }`}>
                            {sub.status}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[#F3EDE1]/85">
                          <span className="font-semibold text-white">
                            🥛 {sub.quantity}x {sub.productName} ({sub.variant})
                          </span>
                          <span className="text-[#C2A36C]">
                            🕒 {sub.frequency} · {sub.deliverySlot || '5:00 AM - 10:00 AM'}
                          </span>
                          <span className="text-[#F3EDE1]/60">Starts: {sub.startDate}</span>
                        </div>

                        <p className="text-[11px] text-[#F3EDE1]/70 truncate max-w-xl">
                          📍 {sub.deliveryAddress || 'Doorstep delivery, Seoni, MP'}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => toggleSubscriptionPause(sub.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                            sub.status === 'active'
                              ? 'bg-amber-950/70 hover:bg-amber-900 border border-amber-700 text-amber-300'
                              : 'bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-600 text-emerald-300'
                          }`}
                        >
                          {sub.status === 'active' ? 'Pause' : 'Resume'}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setEditingSub(sub);
                            setEditSubForm({
                              customerName: sub.customerName || '',
                              customerPhone: sub.customerPhone || '',
                              customerEmail: sub.customerEmail || '',
                              productName: sub.productName,
                              variant: sub.variant,
                              quantity: sub.quantity,
                              frequency: (sub.frequency as any) || 'daily',
                              deliverySlot: sub.deliverySlot || '5:00 AM - 10:00 AM',
                              deliveryAddress: sub.deliveryAddress || '',
                              notes: sub.notes || '',
                              status: sub.status as any
                            });
                          }}
                          className="px-3 py-1.5 bg-[#14261C] hover:bg-[#253E30] text-white border border-[#3A5243] rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5 text-[#C2A36C]" />
                          <span>Edit</span>
                        </button>

                        <a
                          href={`https://wa.me/${(sub.customerPhone || '917067672604').replace(/[^0-9]/g, '')}?text=Namaste%20${encodeURIComponent(sub.customerName || 'Valued Patron')}%2C%20regarding%20your%20DUGDHSAR%20milk%20subscription%3A`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1.5 bg-emerald-950 hover:bg-emerald-900 border border-emerald-700 text-emerald-300 rounded-lg text-xs font-semibold cursor-pointer"
                        >
                          WhatsApp
                        </a>

                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Delete subscription for ${sub.customerName}?`)) {
                              deleteSubscription(sub.id);
                            }
                          }}
                          className="p-1.5 bg-rose-950/40 hover:bg-rose-950 border border-rose-800 text-rose-300 rounded-lg text-xs cursor-pointer"
                          title="Delete Subscription"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* TAB 4: GOOGLE SHEETS LIVE SYNC */}
          {activeTab === 'google-sheets' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="font-serif text-xl sm:text-2xl text-white font-bold flex items-center gap-2">
                    <FileText className="w-5 h-5 text-emerald-400" />
                    <span>Google Sheets Data Sync</span>
                  </h2>
                  <p className="text-xs text-[#F3EDE1]/70 mt-0.5">
                    Operations Manager webhook endpoint & real-time spreadsheet synchronization.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isSyncingSheets}
                    onClick={async () => {
                      setIsSyncingSheets(true);
                      const res = await syncSubscriptionsToGoogleSheets(webhookInput);
                      setIsSyncingSheets(false);
                      setSheetSyncResult(res.message);
                    }}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncingSheets ? 'animate-spin' : ''}`} />
                    <span>{isSyncingSheets ? 'Syncing...' : 'Sync All Data Now'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => exportSubscriptionsToCSV()}
                    className="px-3.5 py-2 bg-[#1D3527] hover:bg-[#253E30] border border-[#3A5243] text-white rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-[#C2A36C]" />
                    <span>Download CSV</span>
                  </button>
                </div>
              </div>

              {sheetSyncResult && (
                <div className="p-3 bg-emerald-950 border border-emerald-500 rounded-xl text-xs text-emerald-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{sheetSyncResult}</span>
                  </div>
                  <button type="button" onClick={() => setSheetSyncResult(null)} className="text-emerald-400 hover:text-white">✕</button>
                </div>
              )}

              {/* Webhook Configuration */}
              <div className="bg-[#1D3527] p-5 rounded-2xl border border-[#3A5243] space-y-3">
                <h3 className="font-serif text-sm font-bold text-white flex items-center gap-2">
                  <Settings className="w-4 h-4 text-[#C2A36C]" />
                  <span>Google Apps Script Webhook URL</span>
                </h3>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="url"
                    value={webhookInput}
                    onChange={(e) => setWebhookInput(e.target.value)}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className="flex-1 px-3 py-2 bg-[#14261C] border border-[#3A5243] rounded-xl text-white text-xs outline-none focus:border-[#C2A36C] font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      updateSiteSettings({ googleSheetsWebhookUrl: webhookInput });
                      setSheetSyncResult('Webhook URL saved successfully.');
                      setTimeout(() => setSheetSyncResult(null), 4000);
                    }}
                    className="px-4 py-2 bg-[#C2A36C] hover:bg-[#b0915a] text-[#12231A] font-bold text-xs rounded-xl shadow-md cursor-pointer"
                  >
                    Save Endpoint
                  </button>
                </div>
                <div className="text-[10px] text-[#F3EDE1]/60 flex items-center justify-between pt-1">
                  <span>Last Synced: <strong className="text-white">{siteSettings.lastGoogleSheetSync || 'Real-time Webhook'}</strong></span>
                  <span className="text-emerald-400 font-semibold">Automatic sync enabled for new subscriptions</span>
                </div>
              </div>

              {/* Tabular Mirror */}
              <div className="bg-[#1D3527] rounded-2xl border border-[#3A5243] overflow-hidden">
                <div className="p-3 bg-[#14261C] border-b border-[#3A5243] flex items-center justify-between text-xs">
                  <span className="font-bold text-white">Live Spreadsheet View ({subscriptions.length} Rows)</span>
                  <span className="text-[10px] text-emerald-400 font-mono">14 Columns Active</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[11px] text-[#F3EDE1]">
                    <thead className="bg-[#0D1812] text-[#C2A36C] font-mono uppercase text-[10px] border-b border-[#3A5243]">
                      <tr>
                        <th className="py-2.5 px-3">Sub ID</th>
                        <th className="py-2.5 px-3">Patron Name</th>
                        <th className="py-2.5 px-3">Phone</th>
                        <th className="py-2.5 px-3">Product</th>
                        <th className="py-2.5 px-3">Qty</th>
                        <th className="py-2.5 px-3">Slot</th>
                        <th className="py-2.5 px-3">Address</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#3A5243]/50 font-mono">
                      {subscriptions.map(s => (
                        <tr key={s.id} className="hover:bg-[#253E30]/40">
                          <td className="py-2 px-3 text-[#C2A36C] font-bold">{s.id}</td>
                          <td className="py-2 px-3 text-white font-sans">{s.customerName}</td>
                          <td className="py-2 px-3">{s.customerPhone}</td>
                          <td className="py-2 px-3 font-sans truncate max-w-[140px]">{s.productName}</td>
                          <td className="py-2 px-3 text-emerald-400 font-bold">{s.quantity}L</td>
                          <td className="py-2 px-3 truncate max-w-[100px]">{s.deliverySlot}</td>
                          <td className="py-2 px-3 font-sans truncate max-w-[160px] text-gray-300">{s.deliveryAddress}</td>
                          <td className="py-2 px-3">
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-emerald-950 text-emerald-300 border border-emerald-700">
                              {s.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: COLD-CHAIN ORDERS */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-serif text-xl text-white font-bold">Cold-Chain Orders Dispatch</h2>
                  <p className="text-xs text-[#F3EDE1]/70">Customer milk orders and door delivery routing.</p>
                </div>
                <span className="text-xs font-mono text-emerald-400 font-bold">{orders.length} Total Orders</span>
              </div>

              <div className="space-y-3">
                {orders.map((o) => (
                  <div key={o.id} className="p-4 bg-[#1D3527] rounded-2xl border border-[#3A5243] flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-white">{o.orderNumber}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          o.status === 'delivered' ? 'bg-emerald-950 text-emerald-300 border border-emerald-600' : 'bg-amber-950 text-amber-300 border border-amber-600'
                        }`}>
                          {o.status}
                        </span>
                        <span className="text-[10px] text-emerald-400 font-mono">
                          {o.paymentMethod.toUpperCase()} · {o.paymentStatus}
                        </span>
                      </div>
                      <p className="text-[#F3EDE1]/80">
                        {o.customerName} ({o.customerPhone}) · {o.deliveryAddress.city}
                      </p>
                      <div className="flex items-center gap-4 text-[11px] font-mono text-[#F3EDE1]/60">
                        <span>Items: {o.items.map(i => `${i.quantity}x ${i.productNameSnapshot || (i as any).productName}`).join(', ')}</span>
                        <span>Total: <strong className="text-[#C2A36C]">{formatPaise(o.totalPaise)}</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <select
                        value={o.status}
                        onChange={(e) => updateOrderStatus(o.id, e.target.value as any, 'Status updated by Operations Manager')}
                        className="px-2.5 py-1.5 bg-[#14261C] border border-[#3A5243] text-white rounded-lg text-xs outline-none focus:border-[#C2A36C]"
                      >
                        <option value="confirmed">Confirmed</option>
                        <option value="processing">Processing (Cold Room)</option>
                        <option value="dispatched">Dispatched (Insulated Van)</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>

                      <a
                        href={`https://wa.me/${o.customerPhone.replace(/[^0-9]/g, '')}?text=Namaste%20${encodeURIComponent(o.customerName)}%2C%20your%20DUGDHSAR%20dairy%20order%20(${o.orderNumber})%20status%20is%20${o.status}.`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-emerald-950 hover:bg-emerald-900 border border-emerald-700 text-emerald-300 rounded-lg text-xs font-semibold cursor-pointer"
                      >
                        WhatsApp
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: INVENTORY & BATCH PURITY */}
          {activeTab === 'inventory' && (
            <div className="space-y-4">
              <div>
                <h2 className="font-serif text-xl text-white font-bold">Inventory & Lab Batch Purity</h2>
                <p className="text-xs text-[#F3EDE1]/70">Dawn Gir cow milking lots tested in Seoni laboratory.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {batches.map((b) => (
                  <div key={b.id} className="p-4 bg-[#1D3527] rounded-2xl border border-[#3A5243] space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <strong className="text-sm font-bold text-white font-mono">{b.batchNumber}</strong>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-emerald-950 text-emerald-300 border border-emerald-600">
                        {b.status}
                      </span>
                    </div>
                    <div className="text-[11px] space-y-1 font-mono text-[#F3EDE1]/80">
                      <div>On-Hand: <strong className="text-[#C2A36C]">{b.onHandQuantity} units</strong></div>
                      <div>Purity Score: <strong className="text-emerald-400">498/500 (Vedic Pure)</strong></div>
                      <div>FAT: 4.5% · SNF: 8.9% · Temp: 3.2°C</div>
                      <div>MBRT: 5.5 Hours (Ultra Fresh)</div>
                    </div>
                    <div className="pt-2 border-t border-[#3A5243] flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => adjustBatchStock(b.id, +20, 'Manager laboratory stock addition')}
                        className="px-2.5 py-1 bg-[#14261C] hover:bg-[#253E30] text-emerald-300 rounded border border-[#3A5243] font-bold"
                      >
                        +20 Bottles
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleBatchQuarantine(b.id, !b.isQuarantined, 'Manager observation hold')}
                        className="px-2.5 py-1 bg-amber-950/60 hover:bg-amber-900 text-amber-300 rounded border border-amber-700 font-semibold"
                      >
                        {b.isQuarantined ? 'Release Lot' : 'Quarantine'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: SEONI DELIVERY ROUTES */}
          {activeTab === 'deliveries' && (
            <div className="space-y-4">
              <div>
                <h2 className="font-serif text-xl text-white font-bold">Seoni City Delivery Zones</h2>
                <p className="text-xs text-[#F3EDE1]/70">Pincode serviceability & cold-chain transit boundaries.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {deliveryZones.map((z) => (
                  <div key={z.id} className="p-4 bg-[#1D3527] rounded-2xl border border-[#3A5243] space-y-2">
                    <div className="flex items-center justify-between">
                      <strong className="text-sm font-bold text-white">{z.zoneName} ({z.pincode})</strong>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-600">
                        Cold-Chain Active
                      </span>
                    </div>
                    <p className="text-[#F3EDE1]/70">Hub: {z.hubAddress}</p>
                    <div className="flex items-center gap-3 font-mono text-[11px] text-[#C2A36C]">
                      <span>Min Order: {formatPaise(z.minOrderPaise)}</span>
                      <span>Delivery Fee: {formatPaise(z.deliveryFeePaise)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </main>
      </div>

      {/* MODAL: ADD PRODUCT MODAL (MANAGER) */}
      {isAddProductOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#1D3527] border-2 border-[#C2A36C]/60 rounded-3xl max-w-lg w-full p-6 text-white shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#3A5243]">
              <h3 className="font-serif text-lg font-bold text-[#FAF6EE] flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#C2A36C]" />
                <span>Upload New Product</span>
              </h3>
              <button type="button" onClick={() => setIsAddProductOpen(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newProductForm.name.trim()) return;
                addNewProduct({
                  name: newProductForm.name.trim(),
                  categorySlug: newProductForm.categorySlug,
                  sizeLabel: newProductForm.sizeLabel,
                  pricePaise: Math.round(Number(newProductForm.priceRupees) * 100),
                  description: newProductForm.description,
                  badge: newProductForm.badge,
                  images: newProductForm.imageUrl ? [{
                    id: `img-${Date.now()}`,
                    productId: '',
                    imageUrl: newProductForm.imageUrl,
                    altText: newProductForm.name,
                    sortOrder: 1
                  }] : undefined,
                  variants: [{
                    id: `var-${Date.now()}`,
                    productId: '',
                    sku: `DS-${newProductForm.categorySlug.toUpperCase()}-${Date.now().toString().slice(-4)}`,
                    sizeLabel: newProductForm.sizeLabel,
                    pricePaise: Math.round(Number(newProductForm.priceRupees) * 100),
                    compareAtPricePaise: Math.round(Number(newProductForm.priceRupees) * 115),
                    inStock: true,
                    stockCount: Number(newProductForm.stockCount) || 50,
                    isSubscriptionEligible: true
                  }]
                });
                setIsAddProductOpen(false);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block text-[11px] font-semibold text-[#F3EDE1]/80 mb-1">Product Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. DUGDHSAR Fresh A2 Desi Cow Milk"
                  value={newProductForm.name}
                  onChange={(e) => setNewProductForm({ ...newProductForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-[#14261C] border border-[#3A5243] rounded-xl text-white outline-none focus:border-[#C2A36C]"
                />
              </div>

              {/* Photo Input & Presets */}
              <div className="bg-[#14261C] p-3 rounded-2xl border border-[#3A5243] space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-[#C2A36C]">Product Photo / Image URL</label>
                  {newProductForm.imageUrl && (
                    <button
                      type="button"
                      onClick={() => setNewProductForm({ ...newProductForm, imageUrl: '' })}
                      className="text-[10px] text-rose-400 font-semibold"
                    >
                      Remove Photo
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl border border-[#C2A36C]/60 overflow-hidden bg-black shrink-0">
                    <img src={newProductForm.imageUrl} alt="preview" className="w-full h-full object-cover" />
                  </div>
                  <input
                    type="text"
                    value={newProductForm.imageUrl}
                    onChange={(e) => setNewProductForm({ ...newProductForm, imageUrl: e.target.value })}
                    className="flex-1 px-3 py-2 bg-[#1D3527] border border-[#3A5243] rounded-xl text-white text-xs outline-none focus:border-[#C2A36C]"
                  />
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {DAIRY_IMAGE_PRESETS.map((pr, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setNewProductForm({ ...newProductForm, imageUrl: pr.url })}
                      className={`text-[9px] px-2 py-0.5 rounded border ${
                        newProductForm.imageUrl === pr.url ? 'bg-[#C2A36C] text-[#12231A] font-bold' : 'bg-[#1D3527] text-gray-300 border-[#3A5243]'
                      }`}
                    >
                      {pr.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#F3EDE1]/80 mb-1">Category *</label>
                  <select
                    value={newProductForm.categorySlug}
                    onChange={(e) => setNewProductForm({ ...newProductForm, categorySlug: e.target.value })}
                    className="w-full px-3 py-2 bg-[#14261C] border border-[#3A5243] rounded-xl text-white outline-none focus:border-[#C2A36C]"
                  >
                    <option value="milk">Milk</option>
                    <option value="ghee">Ghee</option>
                    <option value="paneer">Paneer</option>
                    <option value="curd">Curd</option>
                    <option value="butter">Butter</option>
                    <option value="khoya-mawa">Khoya & Mawa</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#F3EDE1]/80 mb-1">Standard Size *</label>
                  <input
                    type="text"
                    required
                    value={newProductForm.sizeLabel}
                    onChange={(e) => setNewProductForm({ ...newProductForm, sizeLabel: e.target.value })}
                    className="w-full px-3 py-2 bg-[#14261C] border border-[#3A5243] rounded-xl text-white outline-none focus:border-[#C2A36C]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#F3EDE1]/80 mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min={10}
                    value={newProductForm.priceRupees}
                    onChange={(e) => setNewProductForm({ ...newProductForm, priceRupees: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#14261C] border border-[#3A5243] rounded-xl text-white font-mono outline-none focus:border-[#C2A36C]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#F3EDE1]/80 mb-1">Initial Stock *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={newProductForm.stockCount}
                    onChange={(e) => setNewProductForm({ ...newProductForm, stockCount: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#14261C] border border-[#3A5243] rounded-xl text-white font-mono outline-none focus:border-[#C2A36C]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#F3EDE1]/80 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newProductForm.description}
                  onChange={(e) => setNewProductForm({ ...newProductForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-[#14261C] border border-[#3A5243] rounded-xl text-white outline-none focus:border-[#C2A36C]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#3A5243]">
                <button type="button" onClick={() => setIsAddProductOpen(false)} className="px-4 py-2 bg-[#14261C] rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-[#C2A36C] text-[#12231A] font-bold rounded-xl shadow-md">Publish Product</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT PRODUCT (MANAGER) */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#1D3527] border-2 border-[#C2A36C]/60 rounded-3xl max-w-lg w-full p-6 text-white shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#3A5243]">
              <h3 className="font-serif text-lg font-bold text-[#FAF6EE] flex items-center gap-2">
                <Edit className="w-5 h-5 text-[#C2A36C]" />
                <span>Edit: {editingProduct.name}</span>
              </h3>
              <button type="button" onClick={() => setEditingProduct(null)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const updatedVariants = editingProduct.variants.map((v, i) => {
                  if (i === 0) {
                    return {
                      ...v,
                      sizeLabel: editProductForm.sizeLabel || v.sizeLabel,
                      pricePaise: Math.round(Number(editProductForm.priceRupees) * 100),
                      stockCount: Number(editProductForm.stockCount)
                    };
                  }
                  return v;
                });

                const updatedImages = editProductForm.imageUrl ? [{
                  id: editingProduct.images?.[0]?.id || `img-${Date.now()}`,
                  productId: editingProduct.id,
                  imageUrl: editProductForm.imageUrl,
                  altText: editProductForm.name,
                  sortOrder: 1
                }] : [];

                updateProduct(editingProduct.id, {
                  name: editProductForm.name,
                  categorySlug: editProductForm.categorySlug,
                  description: editProductForm.description,
                  badge: editProductForm.badge,
                  isPublished: editProductForm.isPublished,
                  featured: editProductForm.featured,
                  variants: updatedVariants,
                  images: updatedImages
                });

                setEditingProduct(null);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block text-[11px] font-semibold text-[#F3EDE1]/80 mb-1">Product Title</label>
                <input
                  type="text"
                  required
                  value={editProductForm.name}
                  onChange={(e) => setEditProductForm({ ...editProductForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-[#14261C] border border-[#3A5243] rounded-xl text-white outline-none focus:border-[#C2A36C]"
                />
              </div>

              {/* Photo Edit / Change / Delete */}
              <div className="bg-[#14261C] p-3 rounded-2xl border border-[#3A5243] space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-[#C2A36C]">Change / Update / Delete Photo</label>
                  {editProductForm.imageUrl && (
                    <button
                      type="button"
                      onClick={() => setEditProductForm({ ...editProductForm, imageUrl: '' })}
                      className="text-[10px] text-rose-400 font-semibold"
                    >
                      Delete Photo
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl border border-[#C2A36C]/60 overflow-hidden bg-black shrink-0">
                    <img src={editProductForm.imageUrl} alt="preview" className="w-full h-full object-cover" />
                  </div>
                  <input
                    type="text"
                    value={editProductForm.imageUrl}
                    onChange={(e) => setEditProductForm({ ...editProductForm, imageUrl: e.target.value })}
                    className="flex-1 px-3 py-2 bg-[#1D3527] border border-[#3A5243] rounded-xl text-white text-xs outline-none focus:border-[#C2A36C]"
                  />
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {DAIRY_IMAGE_PRESETS.map((pr, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setEditProductForm({ ...editProductForm, imageUrl: pr.url })}
                      className={`text-[9px] px-2 py-0.5 rounded border ${
                        editProductForm.imageUrl === pr.url ? 'bg-[#C2A36C] text-[#12231A] font-bold' : 'bg-[#1D3527] text-gray-300 border-[#3A5243]'
                      }`}
                    >
                      {pr.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#F3EDE1]/80 mb-1">Selling Price (₹)</label>
                  <input
                    type="number"
                    required
                    min={10}
                    value={editProductForm.priceRupees}
                    onChange={(e) => setEditProductForm({ ...editProductForm, priceRupees: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#14261C] border border-[#3A5243] rounded-xl text-white font-mono outline-none focus:border-[#C2A36C]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#F3EDE1]/80 mb-1">On-Hand Stock</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={editProductForm.stockCount}
                    onChange={(e) => setEditProductForm({ ...editProductForm, stockCount: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#14261C] border border-[#3A5243] rounded-xl text-white font-mono outline-none focus:border-[#C2A36C]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#3A5243]">
                <button type="button" onClick={() => setEditingProduct(null)} className="px-4 py-2 bg-[#14261C] rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-[#C2A36C] text-[#12231A] font-bold rounded-xl shadow-md">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT SUBSCRIPTION (MANAGER) */}
      {editingSub && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#1D3527] border-2 border-[#C2A36C]/60 rounded-3xl max-w-lg w-full p-6 text-white shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#3A5243]">
              <h3 className="font-serif text-lg font-bold text-[#FAF6EE] flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-[#C2A36C]" />
                <span>Edit Subscription #{editingSub.id}</span>
              </h3>
              <button type="button" onClick={() => setEditingSub(null)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateSubscription(editingSub.id, {
                  customerName: editSubForm.customerName,
                  customerPhone: editSubForm.customerPhone,
                  customerEmail: editSubForm.customerEmail,
                  productName: editSubForm.productName,
                  variant: editSubForm.variant,
                  quantity: Number(editSubForm.quantity),
                  frequency: editSubForm.frequency,
                  deliverySlot: editSubForm.deliverySlot,
                  deliveryAddress: editSubForm.deliveryAddress,
                  notes: editSubForm.notes,
                  status: editSubForm.status as any
                });
                setEditingSub(null);
              }}
              className="space-y-3 text-xs"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#F3EDE1]/80 mb-1">Patron Full Name</label>
                  <input
                    type="text"
                    required
                    value={editSubForm.customerName}
                    onChange={(e) => setEditSubForm({ ...editSubForm, customerName: e.target.value })}
                    className="w-full px-3 py-2 bg-[#14261C] border border-[#3A5243] rounded-xl text-white outline-none focus:border-[#C2A36C]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#F3EDE1]/80 mb-1">Mobile / WhatsApp</label>
                  <input
                    type="text"
                    required
                    value={editSubForm.customerPhone}
                    onChange={(e) => setEditSubForm({ ...editSubForm, customerPhone: e.target.value })}
                    className="w-full px-3 py-2 bg-[#14261C] border border-[#3A5243] rounded-xl text-white font-mono outline-none focus:border-[#C2A36C]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#F3EDE1]/80 mb-1">Quantity (Bottles/Day)</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={editSubForm.quantity}
                    onChange={(e) => setEditSubForm({ ...editSubForm, quantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#14261C] border border-[#3A5243] rounded-xl text-white font-mono outline-none focus:border-[#C2A36C]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#F3EDE1]/80 mb-1">Status</label>
                  <select
                    value={editSubForm.status}
                    onChange={(e) => setEditSubForm({ ...editSubForm, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-[#14261C] border border-[#3A5243] rounded-xl text-white outline-none focus:border-[#C2A36C]"
                  >
                    <option value="active">Active (Deliver Daily)</option>
                    <option value="paused">Paused</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#F3EDE1]/80 mb-1">Doorstep Address in Seoni</label>
                <textarea
                  rows={2}
                  required
                  value={editSubForm.deliveryAddress}
                  onChange={(e) => setEditSubForm({ ...editSubForm, deliveryAddress: e.target.value })}
                  className="w-full px-3 py-2 bg-[#14261C] border border-[#3A5243] rounded-xl text-white outline-none focus:border-[#C2A36C]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#3A5243]">
                <button type="button" onClick={() => setEditingSub(null)} className="px-4 py-2 bg-[#14261C] rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-[#C2A36C] text-[#12231A] font-bold rounded-xl shadow-md">Update Subscription</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD MANUAL SUBSCRIPTION (MANAGER) */}
      {isAddSubOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#1D3527] border-2 border-[#C2A36C]/60 rounded-3xl max-w-lg w-full p-6 text-white shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#3A5243]">
              <h3 className="font-serif text-lg font-bold text-[#FAF6EE] flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#C2A36C]" />
                <span>Add Patron Subscription</span>
              </h3>
              <button type="button" onClick={() => setIsAddSubOpen(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                addSubscription({
                  customerName: newSubForm.customerName,
                  customerPhone: newSubForm.customerPhone,
                  customerEmail: newSubForm.customerEmail,
                  productName: newSubForm.productName,
                  variant: newSubForm.variant,
                  quantity: Number(newSubForm.quantity),
                  frequency: newSubForm.frequency,
                  deliverySlot: newSubForm.deliverySlot,
                  deliveryAddress: newSubForm.deliveryAddress,
                  notes: newSubForm.notes,
                  startDate: new Date().toISOString().split('T')[0],
                  status: 'active',
                  nextDelivery: `Tomorrow, ${newSubForm.deliverySlot}`
                });
                setIsAddSubOpen(false);
              }}
              className="space-y-3 text-xs"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#F3EDE1]/80 mb-1">Patron Full Name *</label>
                  <input
                    type="text"
                    required
                    value={newSubForm.customerName}
                    onChange={(e) => setNewSubForm({ ...newSubForm, customerName: e.target.value })}
                    className="w-full px-3 py-2 bg-[#14261C] border border-[#3A5243] rounded-xl text-white outline-none focus:border-[#C2A36C]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#F3EDE1]/80 mb-1">Mobile / WhatsApp *</label>
                  <input
                    type="text"
                    required
                    value={newSubForm.customerPhone}
                    onChange={(e) => setNewSubForm({ ...newSubForm, customerPhone: e.target.value })}
                    className="w-full px-3 py-2 bg-[#14261C] border border-[#3A5243] rounded-xl text-white font-mono outline-none focus:border-[#C2A36C]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#F3EDE1]/80 mb-1">Bottles per Day *</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={newSubForm.quantity}
                    onChange={(e) => setNewSubForm({ ...newSubForm, quantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#14261C] border border-[#3A5243] rounded-xl text-white font-mono outline-none focus:border-[#C2A36C]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#F3EDE1]/80 mb-1">Delivery Slot</label>
                  <select
                    value={newSubForm.deliverySlot}
                    onChange={(e) => setNewSubForm({ ...newSubForm, deliverySlot: e.target.value })}
                    className="w-full px-3 py-2 bg-[#14261C] border border-[#3A5243] rounded-xl text-white outline-none focus:border-[#C2A36C]"
                  >
                    <option value="5:00 AM - 10:00 AM">Morning Dawn (5:00 AM – 10:00 AM)</option>
                    <option value="6:00 PM - 10:00 PM">Evening Drop (6:00 PM – 10:00 PM)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#F3EDE1]/80 mb-1">Doorstep Address in Seoni *</label>
                <textarea
                  rows={2}
                  required
                  value={newSubForm.deliveryAddress}
                  onChange={(e) => setNewSubForm({ ...newSubForm, deliveryAddress: e.target.value })}
                  className="w-full px-3 py-2 bg-[#14261C] border border-[#3A5243] rounded-xl text-white outline-none focus:border-[#C2A36C]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#3A5243]">
                <button type="button" onClick={() => setIsAddSubOpen(false)} className="px-4 py-2 bg-[#14261C] rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-[#C2A36C] text-[#12231A] font-bold rounded-xl shadow-md">Create Subscription</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
