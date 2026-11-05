import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { useRouter } from '../../router/RouterContext';
import { formatPaise, Order, Product } from '../../types';
import { 
  BarChart3, 
  Package, 
  Layers, 
  Boxes, 
  ShoppingCart, 
  Users, 
  CreditCard, 
  Tag, 
  Truck, 
  FileText, 
  BookOpen, 
  HelpCircle, 
  Star, 
  PieChart, 
  Settings, 
  UserCheck, 
  ShieldAlert, 
  Plus, 
  Check, 
  Search,
  ArrowRight,
  TrendingUp,
  RotateCcw,
  AlertTriangle,
  Download,
  Building2,
  Handshake,
  Percent,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Eye,
  Sliders,
  DollarSign
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const { 
    currentUser, 
    switchUserPersona,
    products, 
    orders, 
    enquiries, 
    reviews, 
    auditLogs, 
    deliveryZones,
    categories,
    batches,
    adjustBatchStock,
    toggleBatchQuarantine,
    runAutomatedTestSuite,
    updateProductStock, 
    updateOrderStatus, 
    toggleProductPublish,
    recordAuditLog
  } = useStore();

  const { path, navigate } = useRouter();

  // Active admin staff role for RBAC enforcement
  const [activeStaffRole, setActiveStaffRole] = useState<'super_admin' | 'operations_manager' | 'inventory_officer' | 'dispatch_lead' | 'customer_desk'>('super_admin');

  // RBAC Permission Mapping
  const rolePermissions: Record<string, string[]> = {
    super_admin: [
      'dashboard', 'overview', 'products', 'categories', 'orders', 'customers', 
      'dealers', 'partners', 'inventory', 'deliveries', 'delivery', 'payments', 
      'offers', 'discounts', 'analytics', 'reports', 'reviews', 'content', 
      'staff', 'users', 'settings', 'audit-logs', 'qa-tests', 'enquiries'
    ],
    operations_manager: [
      'dashboard', 'overview', 'products', 'categories', 'orders', 'customers', 
      'dealers', 'partners', 'inventory', 'deliveries', 'delivery', 'analytics', 
      'reports', 'enquiries', 'qa-tests'
    ],
    inventory_officer: [
      'inventory', 'products', 'categories', 'qa-tests'
    ],
    dispatch_lead: [
      'deliveries', 'delivery', 'orders', 'inventory'
    ],
    customer_desk: [
      'customers', 'reviews', 'enquiries', 'orders'
    ]
  };

  // Derive active admin section from URL path (e.g. /admin/inventory => 'inventory')
  const pathSegments = path.split('/').filter(Boolean);
  const rawSubSection = pathSegments[1] || 'dashboard';

  // Normalize aliases (e.g., overview -> dashboard, delivery -> deliveries, discounts -> offers, reports -> analytics, users -> staff)
  const normalizeSection = (sec: string) => {
    if (sec === 'overview') return 'dashboard';
    if (sec === 'delivery') return 'deliveries';
    if (sec === 'discounts') return 'offers';
    if (sec === 'reports') return 'analytics';
    if (sec === 'users') return 'staff';
    return sec;
  };

  const [activeSection, setActiveSection] = useState<string>(normalizeSection(rawSubSection));

  useEffect(() => {
    if (pathSegments[0] === 'admin') {
      const sec = normalizeSection(pathSegments[1] || 'dashboard');
      setActiveSection(sec);
    }
  }, [path]);

  const handleSelectSection = (sec: string) => {
    const normalized = normalizeSection(sec);
    setActiveSection(normalized);
    const targetPath = normalized === 'dashboard' ? '/admin/dashboard' : `/admin/${normalized}`;
    navigate(targetPath);
  };

  // KPIs
  const totalRevenuePaise = orders.reduce((acc, o) => acc + (o.paymentStatus === 'captured' ? o.totalPaise : 0), 0);
  const totalItemsSold = orders.reduce((acc, o) => acc + o.items.reduce((sum, i) => sum + i.quantity, 0), 0);
  const pendingOrders = orders.filter(o => o.status === 'confirmed' || o.status === 'processing').length;
  const lowStockVariants = products.flatMap(p => p.variants).filter(v => v.stockCount < 50);

  // Batch specific adjustment state
  const [selectedBatchId, setSelectedBatchId] = useState(batches[0]?.id || '');
  const [batchDelta, setBatchDelta] = useState(10);
  const [batchReason, setBatchReason] = useState('Morning bottling lot arrival');
  const [batchNotice, setBatchNotice] = useState<string | null>(null);

  // Automated 15-suite QA runner state
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [testResults, setTestResults] = useState<any[] | null>(null);
  const [testSummary, setTestSummary] = useState<any | null>(null);

  // Local state for Offers / Coupons
  const [coupons, setCoupons] = useState([
    { code: 'VEDIC10', type: 'percentage', discount: 10, minOrderPaise: 49900, active: true, usageCount: 412 },
    { code: 'PUREGIR15', type: 'percentage', discount: 15, minOrderPaise: 99900, active: true, usageCount: 238 },
    { code: 'FRESHDAWN', type: 'flat', discountPaise: 10000, minOrderPaise: 50000, active: true, usageCount: 890 },
    { code: 'SEONI20', type: 'percentage', discount: 20, minOrderPaise: 149900, active: false, usageCount: 150 }
  ]);
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponDiscount, setNewCouponDiscount] = useState(10);

  // Local state for Dealers
  const [dealersList, setDealersList] = useState([
    { id: 'DLR-01', name: 'Shree Kanha Sweets & Dairy', contact: 'Rameshwar Sahu (+91 98261 44021)', city: 'Seoni, Barghat Rd', tier: 'Gold', creditLimitPaise: 50000000, outstandingPaise: 11550000, status: 'Approved' },
    { id: 'DLR-02', name: 'Seoni Organic Depot & Store', contact: 'Sunil Agrawal (+91 94251 88301)', city: 'Seoni, Nehru Ward', tier: 'Platinum', creditLimitPaise: 100000000, outstandingPaise: 42000000, status: 'Approved' },
    { id: 'DLR-03', name: 'Ganga Mithai Bhandar', contact: 'Vijay Rathore (+91 78981 12345)', city: 'Barapatthar, Seoni', tier: 'Silver', creditLimitPaise: 25000000, outstandingPaise: 8000000, status: 'Approved' },
    { id: 'DLR-04', name: 'Mahakaushal Dairy Mart', contact: 'Dinesh Yadav (+91 91112 55432)', city: 'Lakhnadon / Seoni', tier: 'Silver', creditLimitPaise: 20000000, outstandingPaise: 0, status: 'Pending Review' }
  ]);

  // Local state for Partners
  const [partnersList] = useState([
    { id: 'PRT-01', category: 'Cold-Chain Fleet', name: 'Mahakaushal Cold Logistics (Fleet MP-28-D)', coverage: 'Daily Seoni & Rural Corridors', contact: '+91 7067672604', status: 'Active (3.2°C Insulated)' },
    { id: 'PRT-02', category: 'Certified Testing Lab', name: 'NABL Accredited Dairy Assay Laboratory', coverage: '18-Point Daily Purity & Adulteration Testing', contact: 'lab@dugdhsar.in', status: 'Accredited (ISO/IEC 17025)' },
    { id: 'PRT-03', category: 'Sanctuary Gaushala', name: 'Sukla Vedic Gir Sanctuary Hub', coverage: 'Sukla Pastures (480771)', contact: 'farm@dugdhsar.in', status: 'Active Ahimsa Stewardship' },
    { id: 'PRT-04', category: 'Payment Gateway', name: 'Razorpay Enterprise Integration', coverage: 'UPI AutoPay, Netbanking, Cards & Escrow', contact: 'api@razorpay.com', status: 'Live & Operational' }
  ]);

  // Local state for Customers
  const [customersList] = useState([
    { id: 'CUST-01', name: 'Sunita Sharma', phone: '+91 94251 22890', locality: 'Barghat Road, Sanjay Vihar', subActive: true, milkQty: '2L Daily', totalSpentPaise: 4890000, vip: true },
    { id: 'CUST-02', name: 'Dr. Anand Verma', phone: '+91 98261 77412', locality: 'Sufi Nagar, Seoni', subActive: true, milkQty: '1L Daily', totalSpentPaise: 2450000, vip: true },
    { id: 'CUST-03', name: 'Pooja Agrawal', phone: '+91 91112 88901', locality: 'Tagore Ward, Seoni', subActive: false, milkQty: 'On-demand Ghee', totalSpentPaise: 1438800, vip: false },
    { id: 'CUST-04', name: 'Yashodhara Roy', phone: '+91 98765 43210', locality: 'Civil Lines, Seoni', subActive: true, milkQty: '3L Daily', totalSpentPaise: 7350000, vip: true }
  ]);

  // Local state for Staff & Roles
  const [staffList, setStaffList] = useState([
    { id: 'STF-01', name: 'Sumit Pawar', email: 'admin@dugdhsar.in', role: 'Super Admin', status: 'Active', lastActive: 'Just now' },
    { id: 'STF-02', name: 'Ramesh Patel', email: 'dispatch@dugdhsar.in', role: 'Dispatch & Fleet Lead', status: 'Active', lastActive: '10 mins ago' },
    { id: 'STF-03', name: 'Dr. Rajesh Deshmukh', email: 'inventory@dugdhsar.in', role: 'Inventory Officer', status: 'Active', lastActive: '1 hour ago' },
    { id: 'STF-04', name: 'Priya Tiwari', email: 'support@dugdhsar.in', role: 'Customer Desk', status: 'Active', lastActive: '5 mins ago' },
    { id: 'STF-05', name: 'Manoj Verma', email: 'dealer.manager@dugdhsar.in', role: 'B2B Dealer Manager', status: 'Active', lastActive: 'Yesterday' }
  ]);

  // Content Announcement State
  const [bannerNotice, setBannerNotice] = useState('Dawn dispatch completed punctually. Bottles delivered across Seoni before 11:00 AM.');
  const [isSavingContent, setIsSavingContent] = useState(false);

  // Settings State
  const [dairySettings, setDairySettings] = useState({
    fssaiLicense: '10020000000000',
    gstin: '23AAAAA0000A1Z5',
    morningCutoff: '08:00 PM (Previous Night)',
    tempMinC: 2.0,
    tempMaxC: 4.0,
    shopAddress: '3HP5+948, Barghat Rd, Sanjay Vihar Colony, Sufi Nagar, Seoni, Madhya Pradesh 480661',
    whatsappSupport: '+91 7067672604',
    supportEmail: 'support@dugdhsar.in'
  });

  // Audit Logs Filter
  const [auditSearch, setAuditSearch] = useState('');

  // 17 Modules in Exact Order of Requested URL Table
  const navModules = [
    { id: 'dashboard', path: '/admin/dashboard', label: 'Overview Dashboard', icon: BarChart3 },
    { id: 'products', path: '/admin/products', label: 'Manage Products', icon: Package },
    { id: 'categories', path: '/admin/categories', label: 'Categories', icon: Layers },
    { id: 'orders', path: '/admin/orders', label: 'Orders Management', icon: ShoppingCart },
    { id: 'customers', path: '/admin/customers', label: 'Customer Management', icon: Users },
    { id: 'dealers', path: '/admin/dealers', label: 'Dealer Management', icon: Building2 },
    { id: 'partners', path: '/admin/partners', label: 'Partner Management', icon: Handshake },
    { id: 'inventory', path: '/admin/inventory', label: 'Inventory Management', icon: Boxes },
    { id: 'deliveries', path: '/admin/deliveries', label: 'Delivery Management', icon: Truck },
    { id: 'payments', path: '/admin/payments', label: 'Payments', icon: CreditCard },
    { id: 'offers', path: '/admin/offers', label: 'Offers & Coupons', icon: Tag },
    { id: 'analytics', path: '/admin/analytics', label: 'Sales Analytics', icon: PieChart },
    { id: 'reviews', path: '/admin/reviews', label: 'Reviews & Feedback', icon: Star },
    { id: 'content', path: '/admin/content', label: 'Website Content', icon: FileText },
    { id: 'staff', path: '/admin/staff', label: 'Staff & Roles', icon: UserCheck },
    { id: 'settings', path: '/admin/settings', label: 'Settings', icon: Settings },
    { id: 'audit-logs', path: '/admin/audit-logs', label: 'Audit Logs', icon: ShieldAlert },
    { id: 'qa-tests', path: '/admin/qa-tests', label: 'QA 15-Suite Engine', icon: ShieldCheck }
  ];

  const handleRunQASuite = async () => {
    setIsRunningTests(true);
    const data = await runAutomatedTestSuite();
    setTestResults(data.results);
    setTestSummary(data);
    setIsRunningTests(false);
  };

  const handleBatchAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatchId) return;
    const res = await adjustBatchStock(selectedBatchId, batchDelta, batchReason);
    setBatchNotice(res.message);
    setTimeout(() => setBatchNotice(null), 4000);
  };

  const handleToggleQuarantine = async (batchId: string, currentQuarantined: boolean) => {
    const reason = !currentQuarantined 
      ? prompt('Enter mandatory QA Quarantine Reason:', 'Temperature excursion sensor alert (5.1°C)') || 'QA evaluation hold'
      : undefined;
    const res = await toggleBatchQuarantine(batchId, !currentQuarantined, reason);
    setBatchNotice(res.message);
    setTimeout(() => setBatchNotice(null), 4000);
  };

  const handleToggleCoupon = (code: string) => {
    setCoupons(prev => prev.map(c => {
      if (c.code === code) {
        const updated = !c.active;
        recordAuditLog('COUPON_TOGGLE_ACTIVE', 'COUPONS', code, {
          active: updated,
          adminRole: activeStaffRole
        });
        return { ...c, active: updated };
      }
      return c;
    }));
  };

  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouponCode) return;
    const upper = newCouponCode.trim().toUpperCase();
    const newC = {
      code: upper,
      type: 'percentage' as const,
      discount: newCouponDiscount,
      minOrderPaise: 49900,
      active: true,
      usageCount: 0
    };
    setCoupons([newC, ...coupons]);
    recordAuditLog('COUPON_CREATED', 'COUPONS', upper, {
      discount: newCouponDiscount,
      adminRole: activeStaffRole
    });
    setNewCouponCode('');
  };

  const handleApproveDealer = (dealerId: string, dealerName: string) => {
    setDealersList(prev => prev.map(d => {
      if (d.id === dealerId) {
        recordAuditLog('DEALER_APPROVED', 'DEALERS', dealerId, {
          dealerName,
          adminRole: activeStaffRole
        });
        return { ...d, status: 'Approved' };
      }
      return d;
    }));
  };

  const handleExportAuditLogs = () => {
    const jsonStr = JSON.stringify(auditLogs, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dugdhsar-audit-logs-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    recordAuditLog('AUDIT_LOGS_EXPORTED', 'SECURITY_SYSTEM', 'JSON_EXPORT', { count: auditLogs.length });
  };

  const isModulePermitted = rolePermissions[activeStaffRole]?.includes(activeSection);

  return (
    <div className="bg-[#142019] text-[#F3EDE1] min-h-screen py-6 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* Top Operational Header with Active Role Selector */}
        <div className="bg-[#263D30] border-2 border-[#3A5243] p-5 sm:p-6 rounded-3xl mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#C2A36C] text-[#263D30] font-serif font-black text-xl flex items-center justify-center shadow-md">
              DS
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-serif text-xl sm:text-2xl font-bold text-white">
                  DUGDHSAR Operations & Governance Console
                </h1>
                <span className="bg-[#C2A36C]/25 border border-[#C2A36C]/50 text-[#C2A36C] text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full">
                  Role: {activeStaffRole.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-[#F3EDE1]/70 mt-0.5">
                Physical Shop: 3HP5+948, Barghat Rd, Seoni · Gaushala Hub: Sukla (MP 480771) · Audit Log Stream Active
              </p>
            </div>
          </div>

          {/* Role Switcher & Action Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Live Role Switcher */}
            <div className="flex items-center gap-1.5 bg-[#1F2F26] p-1 rounded-xl border border-[#3A5243]">
              <span className="text-[10px] uppercase font-bold text-[#C2A36C] px-2 hidden sm:inline">
                Role:
              </span>
              <select
                value={activeStaffRole}
                onChange={(e) => {
                  const newRole = e.target.value as any;
                  setActiveStaffRole(newRole);
                  recordAuditLog('ADMIN_ROLE_SWITCHED', 'STAFF_RBAC', newRole, {
                    previousRole: activeStaffRole,
                    actor: currentUser.email
                  });
                }}
                className="bg-[#263D30] text-xs font-bold text-white px-2.5 py-1.5 rounded-lg border border-[#3A5243] outline-none cursor-pointer"
              >
                <option value="super_admin">👑 Super Admin</option>
                <option value="operations_manager">📊 Operations Manager</option>
                <option value="inventory_officer">📦 Inventory Officer</option>
                <option value="dispatch_lead">🚚 Dispatch Lead</option>
                <option value="customer_desk">🎧 Customer Desk</option>
              </select>
            </div>

            <button
              onClick={() => navigate('/dealer/dashboard')}
              className="bg-[#1F2F26] hover:bg-[#2A4033] text-white border border-[#3A5243] px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Building2 className="w-3.5 h-3.5 text-[#C2A36C]" />
              <span className="hidden sm:inline">Dealer Portal</span>
            </button>

            <button
              onClick={() => navigate('/shop')}
              className="bg-[#1F2F26] hover:bg-[#2A4033] text-white border border-[#3A5243] px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Storefront
            </button>

            <button
              onClick={() => { switchUserPersona('customer'); navigate('/account'); }}
              className="bg-[#C2A36C] hover:bg-[#b0915a] text-[#263D30] font-bold px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer"
            >
              Customer Mode
            </button>
          </div>
        </div>

        {/* Main 17-Module Workspace Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Navigation Sidebar (Exact 17 URLs requested) */}
          <div className="lg:col-span-3 bg-[#263D30] p-3.5 rounded-3xl border border-[#3A5243] space-y-1 shadow-lg">
            <div className="flex items-center justify-between px-3 py-2 border-b border-[#3A5243] mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#C2A36C]">
                17 Admin Modules
              </span>
              <span className="text-[9px] font-mono text-[#F3EDE1]/60">RBAC Active</span>
            </div>

            <div className="space-y-0.5 max-h-[72vh] overflow-y-auto pr-1 scrollbar-thin">
              {navModules.map((m) => {
                const Icon = m.icon;
                const isCurrent = activeSection === m.id;
                const isAllowed = rolePermissions[activeStaffRole]?.includes(m.id);

                return (
                  <button
                    key={m.id}
                    onClick={() => handleSelectSection(m.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                      isCurrent
                        ? 'bg-[#C2A36C] text-[#263D30] font-bold shadow-sm'
                        : isAllowed
                        ? 'text-[#F3EDE1]/85 hover:bg-[#1F2F26] hover:text-white'
                        : 'text-[#F3EDE1]/40 hover:bg-[#1F2F26]/50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{m.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {m.id === 'orders' && pendingOrders > 0 && (
                        <span className="bg-[#A34F37] text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                          {pendingOrders}
                        </span>
                      )}
                      {!isAllowed && (
                        <span className="text-[8px] bg-red-950/60 border border-red-800 text-red-300 px-1 rounded uppercase">
                          Restricted
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Module Content Pane (9 cols) */}
          <div className="lg:col-span-9 bg-[#263D30] p-6 sm:p-8 rounded-3xl border border-[#3A5243] shadow-lg min-h-[600px]">
            
            {/* RBAC Access Denied Banner if restricted for selected role */}
            {!isModulePermitted && (
              <div className="p-6 bg-red-950/40 border-2 border-red-700/60 rounded-2xl text-center space-y-3 mb-6">
                <AlertTriangle className="w-8 h-8 text-red-400 mx-auto" />
                <h3 className="font-serif text-lg font-bold text-white">
                  Permission Required: {activeSection.toUpperCase()}
                </h3>
                <p className="text-xs text-[#F3EDE1]/75 max-w-md mx-auto">
                  Your active role (<strong>{activeStaffRole.replace('_', ' ').toUpperCase()}</strong>) does not have write access to this module. Switch your role above to <strong>Super Admin</strong> or <strong>Operations Manager</strong> to view or modify this resource.
                </p>
                <button
                  onClick={() => setActiveStaffRole('super_admin')}
                  className="px-4 py-2 bg-[#C2A36C] text-[#263D30] font-bold text-xs rounded-xl hover:bg-[#b0915a] transition-all cursor-pointer"
                >
                  Elevate to Super Admin Role
                </button>
              </div>
            )}

            {/* 1. OVERVIEW DASHBOARD (/admin/dashboard & /admin) */}
            {activeSection === 'dashboard' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-[#3A5243]">
                  <div>
                    <h2 className="font-serif text-2xl text-white font-semibold">Executive Dairy Overview</h2>
                    <p className="text-xs text-[#F3EDE1]/70">Real-time cold-chain logistics, subscription retention & revenue metrics</p>
                  </div>
                  <button
                    onClick={() => navigate('/admin/orders')}
                    className="px-3.5 py-1.5 bg-[#C2A36C] hover:bg-[#b0915a] text-[#263D30] rounded-xl text-xs font-bold transition-all"
                  >
                    Manage Orders ({orders.length})
                  </button>
                </div>
                
                {/* 4 Primary KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="bg-[#1F2F26] p-4.5 rounded-2xl border border-[#3A5243]">
                    <span className="text-[10px] uppercase font-bold text-[#C2A36C] block mb-1">Gross Revenue</span>
                    <span className="text-xl font-bold font-mono text-white tabular-nums">{formatPaise(totalRevenuePaise)}</span>
                    <p className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1 font-semibold">
                      <TrendingUp className="w-3 h-3" />
                      <span>+18.4% this month</span>
                    </p>
                  </div>

                  <div className="bg-[#1F2F26] p-4.5 rounded-2xl border border-[#3A5243]">
                    <span className="text-[10px] uppercase font-bold text-[#C2A36C] block mb-1">Total Orders</span>
                    <span className="text-xl font-bold font-mono text-white tabular-nums">{orders.length}</span>
                    <p className="text-[10px] text-[#F3EDE1]/60 mt-1">{pendingOrders} awaiting dawn dispatch</p>
                  </div>

                  <div className="bg-[#1F2F26] p-4.5 rounded-2xl border border-[#3A5243]">
                    <span className="text-[10px] uppercase font-bold text-[#C2A36C] block mb-1">Bottles Distributed</span>
                    <span className="text-xl font-bold font-mono text-white tabular-nums">{totalItemsSold}</span>
                    <p className="text-[10px] text-emerald-400 mt-1">100% Glass Sanitized</p>
                  </div>

                  <div className="bg-[#1F2F26] p-4.5 rounded-2xl border border-[#3A5243]">
                    <span className="text-[10px] uppercase font-bold text-[#C2A36C] block mb-1">Active Cold Vans</span>
                    <span className="text-xl font-bold font-mono text-white tabular-nums">12 Active</span>
                    <p className="text-[10px] text-[#F3EDE1]/60 mt-1">Avg temperature 3.2°C</p>
                  </div>
                </div>

                {/* Dawn Dispatch Cutoff & Purity Notice */}
                <div className="p-4 bg-[#1F2F26] rounded-2xl border border-[#3A5243] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <div>
                      <strong className="text-white block">Morning Dispatch Slot: 05:30 AM – 11:00 AM Active</strong>
                      <span className="text-[#F3EDE1]/70">Strict adherence to national dairy sanitation standards. Batch-tested for zero synthetic contaminants.</span>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/admin/deliveries')}
                    className="px-3 py-1.5 bg-[#263D30] hover:bg-[#3A5243] text-white border border-[#3A5243] rounded-lg text-[11px] font-semibold shrink-0 cursor-pointer"
                  >
                    View Routes →
                  </button>
                </div>
              </div>
            )}

            {/* 2. MANAGE PRODUCTS (/admin/products) */}
            {activeSection === 'products' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-serif text-xl text-white font-semibold">Dairy Provisions Catalog ({products.length})</h2>
                  <span className="text-xs text-[#C2A36C] font-mono">Strict Integer Paise Architecture</span>
                </div>

                <div className="border border-[#3A5243] rounded-2xl overflow-hidden divide-y divide-[#3A5243]">
                  {products.map(p => {
                    const v = p.variants[0];
                    return (
                      <div key={p.id} className="p-4 bg-[#1F2F26] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm">{p.name}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              p.isPublished ? 'bg-emerald-950 border border-emerald-600 text-emerald-300' : 'bg-rose-950 border border-rose-800 text-rose-300'
                            }`}>
                              {p.isPublished ? 'Active' : 'Unpublished'}
                            </span>
                          </div>
                          <p className="text-[#F3EDE1]/60 text-[11px]">{p.categorySlug.toUpperCase()} · Standard Size: {v.sizeLabel}</p>
                          <div className="flex items-center gap-3 font-mono">
                            <span className="text-[#C2A36C] font-bold">MRP: {formatPaise(v.pricePaise)}</span>
                            <span className="text-[#F3EDE1]/75">Stock: <strong>{v.stockCount}</strong></span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              toggleProductPublish(p.id);
                              recordAuditLog('PRODUCT_PUBLISH_TOGGLED', 'PRODUCTS', p.id, {
                                previousState: p.isPublished,
                                adminRole: activeStaffRole
                              });
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                              p.isPublished 
                                ? 'bg-rose-950/60 text-rose-300 border border-rose-800 hover:bg-rose-900/60'
                                : 'bg-emerald-950/60 text-emerald-300 border border-emerald-700 hover:bg-emerald-900/60'
                            }`}
                          >
                            {p.isPublished ? 'Unpublish' : 'Publish'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3. CATEGORIES (/admin/categories) */}
            {activeSection === 'categories' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-serif text-xl text-white font-semibold">Dairy Categories Management</h2>
                    <p className="text-xs text-[#F3EDE1]/70">Connected categories matching brand architecture</p>
                  </div>
                  <button
                    onClick={() => {
                      const catName = prompt('Enter New Category Name:', 'Cultured Butter (White Makhan)');
                      if (catName) {
                        recordAuditLog('CATEGORY_CREATED', 'CATEGORIES', catName, { adminRole: activeStaffRole });
                        alert(`Category "${catName}" registered into system.`);
                      }
                    }}
                    className="px-3.5 py-2 bg-[#C2A36C] text-[#263D30] font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Category</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { slug: 'milk', name: 'Fresh A2 Cow Milk', count: 3, icon: '🥛', desc: 'Raw & Pasteurized Glass Bottles' },
                    { slug: 'ghee', name: 'Vedic Bilona Ghee', count: 2, icon: '🏺', desc: 'Hand-Churned Golden Danedar' },
                    { slug: 'paneer', name: 'Fresh Malai Paneer', count: 2, icon: '🧀', desc: 'High Bio-Protein Vacuum Block' },
                    { slug: 'curd', name: 'Clay-Pot Dahi (Curd)', count: 2, icon: '🏺', desc: 'Live Culture Terracotta Set' },
                    { slug: 'butter', name: 'White Makhan (Butter)', count: 1, icon: '🧈', desc: 'Ahimsa Cultured Unsalted' },
                    { slug: 'khoya-mawa', name: 'Pure Vedic Khoya', count: 1, icon: '🍯', desc: 'Danedar Mithai Base' }
                  ].map((cat) => (
                    <div key={cat.slug} className="p-4 bg-[#1F2F26] rounded-2xl border border-[#3A5243] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl">{cat.icon}</span>
                        <span className="text-[10px] bg-[#C2A36C]/20 border border-[#C2A36C]/40 text-[#C2A36C] font-bold px-2 py-0.5 rounded-full font-mono">
                          {cat.count} SKUs
                        </span>
                      </div>
                      <h3 className="font-serif text-base font-bold text-white">{cat.name}</h3>
                      <p className="text-[11px] text-[#F3EDE1]/70">{cat.desc}</p>
                      <span className="text-[10px] font-mono text-emerald-400 block pt-1">URL: /products/{cat.slug}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. ORDERS MANAGEMENT (/admin/orders) */}
            {activeSection === 'orders' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-serif text-xl text-white font-semibold">Active Orders & Dawn Dispatch ({orders.length})</h2>
                  <span className="text-xs text-[#C2A36C]">Morning Slot: 05:30 AM – 11:00 AM</span>
                </div>

                <div className="space-y-3">
                  {orders.map(o => (
                    <div key={o.id} className="p-4 bg-[#1F2F26] rounded-2xl border border-[#3A5243] space-y-3 text-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#3A5243]">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white text-sm">{o.orderNumber}</span>
                          <span className="text-[#F3EDE1]/70">· {o.customerName} ({o.customerPhone})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[#C2A36C] text-sm">{formatPaise(o.totalPaise)}</span>
                          <select
                            value={o.status}
                            onChange={(e) => {
                              const newStatus = e.target.value as any;
                              updateOrderStatus(o.id, newStatus);
                              recordAuditLog('ORDER_STATUS_UPDATED', 'ORDERS', o.id, {
                                previousStatus: o.status,
                                newStatus,
                                adminRole: activeStaffRole
                              });
                            }}
                            className="bg-[#263D30] border border-[#3A5243] text-white px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer"
                          >
                            <option value="confirmed">Confirmed</option>
                            <option value="processing">Processing</option>
                            <option value="out_for_delivery">Out for Delivery</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </div>
                      </div>

                      <div className="text-[11px] text-[#F3EDE1]/85">
                        Items: {o.items.map(i => `${i.productNameSnapshot} (${i.sizeSnapshot}) × ${i.quantity}`).join(', ')}
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#C2A36C] pt-1">
                        <span>Slot: {o.deliverySlot} · Destination: {o.deliveryPincode}</span>
                        <span className="font-mono text-white">Tracking: {o.trackingNumber || 'Pending'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5. CUSTOMER MANAGEMENT (/admin/customers) */}
            {activeSection === 'customers' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-serif text-xl text-white font-semibold">Registered Dairy Patrons ({customersList.length})</h2>
                  <span className="text-xs text-emerald-400 font-semibold">100% Verified Phone/WhatsApp</span>
                </div>

                <div className="border border-[#3A5243] rounded-2xl overflow-hidden divide-y divide-[#3A5243]">
                  {customersList.map((c) => (
                    <div key={c.id} className="p-4 bg-[#1F2F26] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <strong className="text-sm font-bold text-white">{c.name}</strong>
                          {c.vip && (
                            <span className="px-2 py-0.2 rounded-full bg-[#C2A36C]/20 border border-[#C2A36C]/50 text-[#C2A36C] text-[9px] font-bold uppercase">
                              VIP Patron
                            </span>
                          )}
                          <span className={`px-2 py-0.2 rounded-full text-[9px] font-bold ${
                            c.subActive ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' : 'bg-gray-800 text-gray-300'
                          }`}>
                            {c.subActive ? `Active Sub: ${c.milkQty}` : 'Ad-hoc Orders'}
                          </span>
                        </div>
                        <p className="text-[#F3EDE1]/70">{c.phone} · {c.locality}, Seoni MP</p>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="text-[10px] text-[#F3EDE1]/60 block">Lifetime Spend</span>
                          <span className="font-mono font-bold text-emerald-400 text-sm">{formatPaise(c.totalSpentPaise)}</span>
                        </div>
                        <a
                          href={`https://wa.me/${c.phone.replace(/[^0-9]/g, '')}?text=Namaste%20${encodeURIComponent(c.name)}%2C%20greetings%20from%20DUGDHSAR%20Dairy.`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-emerald-950 hover:bg-emerald-900 border border-emerald-600 text-emerald-300 rounded-lg text-xs font-semibold"
                        >
                          WhatsApp Patron
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 6. DEALER MANAGEMENT (/admin/dealers) */}
            {activeSection === 'dealers' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-serif text-xl text-white font-semibold">B2B Dealer & Sweet Shop Accounts</h2>
                    <p className="text-xs text-[#F3EDE1]/70">Wholesale pricing tiers, monthly crate allocations & credit limits</p>
                  </div>
                  <button
                    onClick={() => navigate('/dealer/dashboard')}
                    className="px-3.5 py-1.5 bg-[#C2A36C] text-[#263D30] font-bold text-xs rounded-xl flex items-center gap-1.5"
                  >
                    <span>Open Dealer Portal View</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-3">
                  {dealersList.map((d) => (
                    <div key={d.id} className="p-4 bg-[#1F2F26] rounded-2xl border border-[#3A5243] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{d.name}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#C2A36C]/20 border border-[#C2A36C]/40 text-[#C2A36C]">
                            {d.tier} Tier
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            d.status === 'Approved' ? 'bg-emerald-950 text-emerald-300 border border-emerald-600' : 'bg-amber-950 text-amber-300 border border-amber-600'
                          }`}>
                            {d.status}
                          </span>
                        </div>
                        <p className="text-[#F3EDE1]/70">{d.contact} · {d.city}</p>
                        <div className="flex items-center gap-4 text-[11px] font-mono pt-1">
                          <span>Credit Limit: <strong className="text-white">{formatPaise(d.creditLimitPaise)}</strong></span>
                          <span>Outstanding: <strong className="text-amber-400">{formatPaise(d.outstandingPaise)}</strong></span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {d.status !== 'Approved' && (
                          <button
                            onClick={() => handleApproveDealer(d.id, d.name)}
                            className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-lg text-xs"
                          >
                            Approve Dealership
                          </button>
                        )}
                        <button
                          onClick={() => {
                            const newLimit = prompt(`Enter new Credit Limit in ₹ for ${d.name}:`, '500000');
                            if (newLimit) {
                              recordAuditLog('DEALER_CREDIT_UPDATED', 'DEALERS', d.id, {
                                newLimitRupees: newLimit,
                                adminRole: activeStaffRole
                              });
                              alert(`Credit limit for ${d.name} updated to ₹${newLimit}`);
                            }
                          }}
                          className="px-3 py-1.5 bg-[#263D30] hover:bg-[#3A5243] text-[#F3EDE1] border border-[#3A5243] rounded-lg text-xs"
                        >
                          Adjust Credit
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 7. PARTNER MANAGEMENT (/admin/partners) */}
            {activeSection === 'partners' && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-serif text-xl text-white font-semibold">Institutional Partners & Fleet</h2>
                  <p className="text-xs text-[#F3EDE1]/70">Testing laboratories, Gaushala sanctuaries, and cold logistics fleet</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {partnersList.map((prt) => (
                    <div key={prt.id} className="p-4.5 bg-[#1F2F26] rounded-2xl border border-[#3A5243] space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase text-[#C2A36C] tracking-wider">
                          {prt.category}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-400 font-mono">
                          {prt.status}
                        </span>
                      </div>
                      <h3 className="font-serif text-base font-bold text-white">{prt.name}</h3>
                      <p className="text-[#F3EDE1]/70 text-[11px]">{prt.coverage}</p>
                      <div className="pt-2 border-t border-[#3A5243]/60 flex items-center justify-between text-[11px]">
                        <span>Contact: <strong className="text-white">{prt.contact}</strong></span>
                        <span className="text-[#C2A36C] font-semibold">Verified Partner ✓</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 8. INVENTORY MANAGEMENT (/admin/inventory) */}
            {activeSection === 'inventory' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-serif text-xl text-white font-semibold">FEFO Batch Lot Inventory & Temperature Assay</h2>
                    <p className="text-xs text-[#F3EDE1]/70">First-Expiry First-Out tracking strictly mapped to 2°C–4°C threshold</p>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-300 font-mono border border-emerald-600 font-bold">
                    {batches.length} Active Lots
                  </span>
                </div>

                {batchNotice && (
                  <div className="p-3 bg-emerald-950 border border-emerald-600 rounded-xl text-xs text-emerald-300 font-mono">
                    {batchNotice}
                  </div>
                )}

                {/* Batch List */}
                <div className="space-y-3">
                  {batches.map(b => (
                    <div key={b.id} className="p-4 bg-[#1F2F26] rounded-2xl border border-[#3A5243] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white text-sm">{b.batchNumber}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            b.isQuarantined ? 'bg-rose-950 border border-rose-800 text-rose-300' : 'bg-emerald-950 border border-emerald-700 text-emerald-300'
                          }`}>
                            {b.isQuarantined ? 'Quarantined (QA Hold)' : 'Pass (In Cold Vault)'}
                          </span>
                        </div>
                        <p className="text-[#F3EDE1]/70">Variant: {b.variantId} · Cold Vault Temp: {b.coldChainTempC || 3.2}°C</p>
                        <div className="flex items-center gap-4 text-[11px] font-mono text-[#C2A36C]">
                          <span>On-Hand: <strong>{b.onHandQuantity}</strong> units</span>
                          <span>Exp: {new Date(b.expiryDate).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleQuarantine(b.id, b.isQuarantined)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                            b.isQuarantined 
                              ? 'bg-emerald-900 text-emerald-200 border border-emerald-600' 
                              : 'bg-rose-950 text-rose-300 border border-rose-800'
                          }`}
                        >
                          {b.isQuarantined ? 'Release Hold' : 'QA Quarantine'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Manual Adjustment */}
                <form onSubmit={handleBatchAdjust} className="bg-[#1F2F26] p-5 rounded-2xl border border-[#3A5243] space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#C2A36C]">
                    Manual Batch Stock Adjustment & Security Log
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] text-[#F3EDE1]/70 mb-1">Target Lot</label>
                      <select
                        value={selectedBatchId}
                        onChange={(e) => setSelectedBatchId(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-[#263D30] border border-[#3A5243] rounded-lg text-white font-mono"
                      >
                        {batches.map(b => (
                          <option key={b.id} value={b.id}>{b.batchNumber} ({b.onHandQuantity} on-hand)</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] text-[#F3EDE1]/70 mb-1">Delta (+ / - units)</label>
                      <input
                        type="number"
                        value={batchDelta}
                        onChange={(e) => setBatchDelta(parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 text-xs bg-[#263D30] border border-[#3A5243] rounded-lg text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-[#F3EDE1]/70 mb-1">Mandatory Reason</label>
                      <input
                        type="text"
                        required
                        value={batchReason}
                        onChange={(e) => setBatchReason(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-[#263D30] border border-[#3A5243] rounded-lg text-white"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#C2A36C] hover:bg-[#b0915a] text-[#263D30] font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Commit Batch Stock Adjustment
                  </button>
                </form>
              </div>
            )}

            {/* 9. DELIVERY MANAGEMENT (/admin/deliveries) */}
            {activeSection === 'deliveries' && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-serif text-xl text-white font-semibold">Active Cold-Chain Delivery Pincodes & Vans</h2>
                  <p className="text-xs text-[#F3EDE1]/70">Seoni city morning (05:30 AM – 11:00 AM) and evening routes</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  {deliveryZones.map(zone => (
                    <div key={zone.id} className="p-4.5 bg-[#1F2F26] rounded-2xl border border-[#3A5243] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-sm">{zone.zoneName}</span>
                        <span className="font-mono text-[#C2A36C] font-bold text-xs bg-[#263D30] px-2 py-0.5 rounded">
                          {zone.pincode}
                        </span>
                      </div>
                      <p className="text-[#F3EDE1]/70">{zone.city}, {zone.state}</p>
                      <div className="pt-2 border-t border-[#3A5243]/60 flex items-center justify-between text-[11px]">
                        <span className="text-emerald-400 font-semibold">Free Delivery Above {formatPaise(zone.minOrderPaise)}</span>
                        <span className="text-[#C2A36C]">Insulated Route ✓</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 10. PAYMENTS (/admin/payments) */}
            {activeSection === 'payments' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-serif text-xl text-white font-semibold">Payments Reconciliation & Gateway Ledger</h2>
                    <p className="text-xs text-[#F3EDE1]/70">Strict Integer Paise Accounting · Razorpay & Cash on Delivery</p>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-400 bg-[#1F2F26] px-3 py-1 rounded-xl border border-[#3A5243]">
                    Total Captured: {formatPaise(totalRevenuePaise)}
                  </span>
                </div>

                <div className="border border-[#3A5243] rounded-2xl overflow-hidden divide-y divide-[#3A5243] text-xs">
                  {orders.map(o => (
                    <div key={o.id} className="p-4 bg-[#1F2F26] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white text-sm">{o.orderNumber}</span>
                          <span className="uppercase text-[9px] font-bold px-2 py-0.5 rounded bg-[#263D30] text-[#C2A36C] border border-[#3A5243]">
                            {o.paymentMethod.toUpperCase()}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                            o.paymentStatus === 'captured' ? 'bg-emerald-950 text-emerald-300' : 'bg-amber-950 text-amber-300'
                          }`}>
                            {o.paymentStatus}
                          </span>
                        </div>
                        <span className="text-[#F3EDE1]/60 text-[11px]">Payer: {o.customerName} · Ref: pay_rzp_{o.id.substring(0, 8)}</span>
                      </div>

                      <div className="text-right">
                        <span className="font-mono font-bold text-emerald-400 text-sm block">{formatPaise(o.totalPaise)}</span>
                        <span className="text-[10px] text-[#F3EDE1]/50">{new Date(o.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 11. OFFERS & COUPONS (/admin/offers) */}
            {activeSection === 'offers' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-serif text-xl text-white font-semibold">Promotional Offers & Voucher Engine</h2>
                    <p className="text-xs text-[#F3EDE1]/70">Manage discounts with integer paise validation</p>
                  </div>
                </div>

                {/* Create Coupon Form */}
                <form onSubmit={handleCreateCoupon} className="p-4.5 bg-[#1F2F26] rounded-2xl border border-[#3A5243] flex flex-wrap items-center gap-3">
                  <input
                    type="text"
                    required
                    placeholder="Coupon Code (e.g. MORNING20)"
                    value={newCouponCode}
                    onChange={(e) => setNewCouponCode(e.target.value)}
                    className="px-3.5 py-2 text-xs bg-[#263D30] border border-[#3A5243] rounded-xl text-white uppercase font-mono"
                  />
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-[#F3EDE1]/70">Discount:</span>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={newCouponDiscount}
                      onChange={(e) => setNewCouponDiscount(parseInt(e.target.value) || 10)}
                      className="w-16 px-2.5 py-2 text-xs bg-[#263D30] border border-[#3A5243] rounded-xl text-white font-mono"
                    />
                    <span className="text-xs text-white">%</span>
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#C2A36C] hover:bg-[#b0915a] text-[#263D30] font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Create Coupon & Log Audit
                  </button>
                </form>

                {/* Coupons List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {coupons.map((c) => (
                    <div key={c.code} className="p-4 bg-[#1F2F26] rounded-2xl border border-[#3A5243] flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="font-mono text-sm text-[#C2A36C]">{c.code}</strong>
                          <span className={`text-[9px] px-2 py-0.2 rounded font-bold uppercase ${
                            c.active ? 'bg-emerald-950 text-emerald-300' : 'bg-gray-800 text-gray-400'
                          }`}>
                            {c.active ? 'Active' : 'Disabled'}
                          </span>
                        </div>
                        <span className="text-[11px] text-[#F3EDE1]/70 block mt-0.5">
                          {c.discount}% discount · Min order {formatPaise(c.minOrderPaise)}
                        </span>
                        <span className="text-[10px] text-white/50 block font-mono">Redeemed: {c.usageCount} times</span>
                      </div>

                      <button
                        onClick={() => handleToggleCoupon(c.code)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                          c.active ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                        }`}
                      >
                        {c.active ? 'Disable' : 'Enable'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 12. SALES ANALYTICS (/admin/analytics) */}
            {activeSection === 'analytics' && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-serif text-xl text-white font-semibold">Executive Sales Analytics & Cold-Chain Throughput</h2>
                  <p className="text-xs text-[#F3EDE1]/70">Monthly trends, daily litres dispatched & repeat customer loyalty</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4.5 bg-[#1F2F26] rounded-2xl border border-[#3A5243]">
                    <span className="text-[10px] uppercase font-bold text-[#C2A36C] block mb-1">Daily Dawn Milk Volume</span>
                    <span className="text-2xl font-bold font-mono text-white">1,250 Litres / day</span>
                    <p className="text-[10px] text-emerald-400 mt-1 font-semibold">98.4% On-time delivery rate</p>
                  </div>

                  <div className="p-4.5 bg-[#1F2F26] rounded-2xl border border-[#3A5243]">
                    <span className="text-[10px] uppercase font-bold text-[#C2A36C] block mb-1">Average Order Value (AOV)</span>
                    <span className="text-2xl font-bold font-mono text-white">₹742.00</span>
                    <p className="text-[10px] text-emerald-400 mt-1">+8.1% vs last quarter</p>
                  </div>

                  <div className="p-4.5 bg-[#1F2F26] rounded-2xl border border-[#3A5243]">
                    <span className="text-[10px] uppercase font-bold text-[#C2A36C] block mb-1">Subscription Retention</span>
                    <span className="text-2xl font-bold font-mono text-white">94.2%</span>
                    <p className="text-[10px] text-[#F3EDE1]/60 mt-1">Average tenure 8.6 months</p>
                  </div>
                </div>

                <div className="p-5 bg-[#1F2F26] rounded-2xl border border-[#3A5243] space-y-3">
                  <h3 className="font-serif text-base font-bold text-white">Category Sales Volume Distribution</h3>
                  <div className="space-y-2 text-xs">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span>A2 Desi Cow Whole Milk (Fresh Glass Bottles)</span>
                        <span className="font-mono font-bold text-emerald-400">58%</span>
                      </div>
                      <div className="w-full bg-[#263D30] h-2 rounded-full overflow-hidden">
                        <div className="bg-[#C2A36C] h-full rounded-full" style={{ width: '58%' }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span>Vedic Bilona Cow Ghee (Danedar Wooden Churned)</span>
                        <span className="font-mono font-bold text-emerald-400">24%</span>
                      </div>
                      <div className="w-full bg-[#263D30] h-2 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: '24%' }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span>Fresh A2 Malai Paneer & Curd</span>
                        <span className="font-mono font-bold text-emerald-400">18%</span>
                      </div>
                      <div className="w-full bg-[#263D30] h-2 rounded-full overflow-hidden">
                        <div className="bg-amber-400 h-full rounded-full" style={{ width: '18%' }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 13. REVIEWS & FEEDBACK (/admin/reviews) */}
            {activeSection === 'reviews' && (
              <div className="space-y-4">
                <h2 className="font-serif text-xl text-white font-semibold">Patron Ratings & Testimonial Moderation ({reviews.length})</h2>
                <div className="space-y-3">
                  {reviews.map(rev => (
                    <div key={rev.id} className="p-4 bg-[#1F2F26] rounded-2xl border border-[#3A5243] text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">{rev.userName} ({rev.userCity})</span>
                        <div className="flex text-amber-400">
                          {Array.from({ length: rev.rating }).map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                          ))}
                        </div>
                      </div>
                      <span className="font-semibold text-[#C2A36C] block">{rev.title}</span>
                      <p className="text-[#F3EDE1]/80">{rev.comment}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 14. WEBSITE CONTENT (/admin/content) */}
            {activeSection === 'content' && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-serif text-xl text-white font-semibold">Website Notice & Editorial Content</h2>
                  <p className="text-xs text-[#F3EDE1]/70">Live banner text, Gaushala bulletins & morning dispatch announcements</p>
                </div>

                <div className="p-5 bg-[#1F2F26] rounded-2xl border border-[#3A5243] space-y-4 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-[#C2A36C] mb-1.5">
                      Top Announcement Banner (Broadcast across Header)
                    </label>
                    <textarea
                      rows={3}
                      value={bannerNotice}
                      onChange={(e) => setBannerNotice(e.target.value)}
                      className="w-full p-3 bg-[#263D30] border border-[#3A5243] rounded-xl text-white outline-none"
                    />
                  </div>

                  <button
                    onClick={() => {
                      setIsSavingContent(true);
                      recordAuditLog('WEBSITE_CONTENT_UPDATED', 'ANNOUNCEMENT_BANNER', 'TOP_BANNER', {
                        text: bannerNotice,
                        adminRole: activeStaffRole
                      });
                      setTimeout(() => {
                        setIsSavingContent(false);
                        alert('Banner broadcast content updated & logged in security audit.');
                      }, 500);
                    }}
                    className="px-5 py-2.5 bg-[#C2A36C] hover:bg-[#b0915a] text-[#263D30] font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    {isSavingContent ? 'Saving...' : 'Publish Content Update & Log Audit'}
                  </button>
                </div>
              </div>
            )}

            {/* 15. STAFF & ROLES (/admin/staff) */}
            {activeSection === 'staff' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-serif text-xl text-white font-semibold">Staff & Role-Based Access Control (RBAC)</h2>
                    <p className="text-xs text-[#F3EDE1]/70">Admin role permissions & security enforcement</p>
                  </div>
                  <button
                    onClick={() => {
                      const name = prompt('Enter staff member name:', 'Vikram Rathore');
                      const email = prompt('Enter staff email:', 'vikram@dugdhsar.in');
                      if (name && email) {
                        const newStf = { id: `STF-0${staffList.length + 1}`, name, email, role: 'Operations Manager', status: 'Active', lastActive: 'Never' };
                        setStaffList([...staffList, newStf]);
                        recordAuditLog('STAFF_MEMBER_CREATED', 'STAFF_RBAC', email, { role: 'Operations Manager', adminRole: activeStaffRole });
                      }
                    }}
                    className="px-3.5 py-2 bg-[#C2A36C] text-[#263D30] font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Staff Member</span>
                  </button>
                </div>

                {/* Role Matrix */}
                <div className="border border-[#3A5243] rounded-2xl overflow-hidden divide-y divide-[#3A5243] text-xs">
                  {staffList.map((stf) => (
                    <div key={stf.id} className="p-4 bg-[#1F2F26] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-white text-sm">{stf.name}</strong>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#C2A36C]/20 text-[#C2A36C] border border-[#C2A36C]/40">
                            {stf.role}
                          </span>
                        </div>
                        <span className="text-[#F3EDE1]/60 text-[11px]">{stf.email} · Last active: {stf.lastActive}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950 px-2 py-0.5 rounded border border-emerald-700">
                          {stf.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 16. SETTINGS (/admin/settings) */}
            {activeSection === 'settings' && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-serif text-xl text-white font-semibold">Dairy Operations Settings</h2>
                  <p className="text-xs text-[#F3EDE1]/70">FSSAI food license, GSTIN, cold-chain parameters & dispatch cutoffs</p>
                </div>

                <div className="p-6 bg-[#1F2F26] rounded-2xl border border-[#3A5243] space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-medium text-[#F3EDE1]/70 mb-1">FSSAI Central Dairy License</label>
                      <input
                        type="text"
                        value={dairySettings.fssaiLicense}
                        onChange={(e) => setDairySettings({ ...dairySettings, fssaiLicense: e.target.value })}
                        className="w-full p-2.5 bg-[#263D30] border border-[#3A5243] rounded-xl text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-[#F3EDE1]/70 mb-1">State GSTIN</label>
                      <input
                        type="text"
                        value={dairySettings.gstin}
                        onChange={(e) => setDairySettings({ ...dairySettings, gstin: e.target.value })}
                        className="w-full p-2.5 bg-[#263D30] border border-[#3A5243] rounded-xl text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-[#F3EDE1]/70 mb-1">Dawn Milk Delivery Slot</label>
                      <input
                        type="text"
                        defaultValue="05:30 AM – 11:00 AM (Morning)"
                        className="w-full p-2.5 bg-[#263D30] border border-[#3A5243] rounded-xl text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-[#F3EDE1]/70 mb-1">Official WhatsApp Concierge</label>
                      <input
                        type="text"
                        value={dairySettings.whatsappSupport}
                        onChange={(e) => setDairySettings({ ...dairySettings, whatsappSupport: e.target.value })}
                        className="w-full p-2.5 bg-[#263D30] border border-[#3A5243] rounded-xl text-white font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-[#F3EDE1]/70 mb-1">Physical Retail Shop Address (Seoni)</label>
                    <input
                      type="text"
                      value={dairySettings.shopAddress}
                      onChange={(e) => setDairySettings({ ...dairySettings, shopAddress: e.target.value })}
                      className="w-full p-2.5 bg-[#263D30] border border-[#3A5243] rounded-xl text-white"
                    />
                  </div>

                  <button
                    onClick={() => {
                      recordAuditLog('SETTINGS_UPDATED', 'SYSTEM_CONFIG', 'DAIRY_PARAMETERS', {
                        dairySettings,
                        adminRole: activeStaffRole
                      });
                      alert('Dairy operations settings saved & logged.');
                    }}
                    className="px-5 py-2.5 bg-[#C2A36C] hover:bg-[#b0915a] text-[#263D30] font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Save Operational Settings & Log Audit
                  </button>
                </div>
              </div>
            )}

            {/* 17. AUDIT LOGS (/admin/audit-logs) */}
            {activeSection === 'audit-logs' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="font-serif text-xl text-white font-semibold">
                      Immutable Security & Operations Audit Logs ({auditLogs.length})
                    </h2>
                    <p className="text-xs text-[#F3EDE1]/70">Admin को हर important activity का record (Every state mutation recorded)</p>
                  </div>

                  <button
                    onClick={handleExportAuditLogs}
                    className="px-4 py-2 bg-[#C2A36C] hover:bg-[#b0915a] text-[#263D30] font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export Audit Trail (JSON)</span>
                  </button>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-4 h-4 text-[#C2A36C] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={auditSearch}
                    onChange={(e) => setAuditSearch(e.target.value)}
                    placeholder="Search logs by action, resource type, ID or admin email..."
                    className="w-full pl-10 pr-4 py-2 text-xs bg-[#1F2F26] border border-[#3A5243] rounded-xl text-white outline-none"
                  />
                </div>

                <div className="border border-[#3A5243] rounded-2xl overflow-hidden divide-y divide-[#3A5243] text-xs font-mono max-h-[580px] overflow-y-auto">
                  {auditLogs
                    .filter(l => 
                      !auditSearch || 
                      l.action.toLowerCase().includes(auditSearch.toLowerCase()) ||
                      l.resourceType.toLowerCase().includes(auditSearch.toLowerCase()) ||
                      l.adminEmail.toLowerCase().includes(auditSearch.toLowerCase())
                    )
                    .map(log => (
                      <div key={log.id} className="p-3.5 bg-[#1F2F26] flex items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[#C2A36C] font-bold text-xs">{log.action}</span>
                            <span className="text-[10px] bg-[#263D30] text-[#F3EDE1]/70 px-1.5 py-0.5 rounded border border-[#3A5243]">
                              {log.resourceType} : {log.resourceId}
                            </span>
                          </div>
                          <span className="text-[11px] text-[#F3EDE1]/60 block mt-0.5">
                            Admin: <strong>{log.adminEmail}</strong> · IP: {log.ipAddress}
                          </span>
                          {log.metadata && (
                            <span className="text-[10px] text-emerald-400 block mt-1">
                              {JSON.stringify(log.metadata)}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-[#F3EDE1]/50 shrink-0 font-sans">
                          {new Date(log.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* 18. QA 15-SUITE ENGINE (/admin/qa-tests) */}
            {activeSection === 'qa-tests' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="font-serif text-xl text-white font-semibold">Automated 15-Suite Architectural Testing Engine</h2>
                  <button
                    onClick={handleRunQASuite}
                    disabled={isRunningTests}
                    className="bg-[#C2A36C] hover:bg-[#b0915a] text-[#263D30] font-black px-4 py-2 rounded-xl text-xs transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>{isRunningTests ? 'Running Diagnostic...' : 'Execute All 15 Test Suites'}</span>
                  </button>
                </div>

                {testSummary && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                    <div className="p-3 bg-[#1F2F26] rounded-xl border border-emerald-500/30">
                      <span className="text-[#F3EDE1]/60 block text-[10px]">TOTAL SUITES</span>
                      <span className="text-xl font-bold text-white">{testSummary.totalSuites}</span>
                    </div>
                    <div className="p-3 bg-[#1F2F26] rounded-xl border border-emerald-500/30">
                      <span className="text-emerald-400 block text-[10px]">PASSED</span>
                      <span className="text-xl font-bold text-emerald-400">{testSummary.passedSuites}</span>
                    </div>
                    <div className="p-3 bg-[#1F2F26] rounded-xl border border-emerald-500/30">
                      <span className="text-[#C2A36C] block text-[10px]">EXECUTION TIME</span>
                      <span className="text-xl font-bold text-[#C2A36C]">{testSummary.executionTimeMs} ms</span>
                    </div>
                    <div className="p-3 bg-[#1F2F26] rounded-xl border border-emerald-500/30">
                      <span className="text-emerald-400 block text-[10px]">SCHEMA COMPLIANCE</span>
                      <span className="text-xl font-bold text-white">100%</span>
                    </div>
                  </div>
                )}

                {testResults && (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {testResults.map((t) => (
                      <div key={t.suiteNumber} className="p-3 bg-[#1F2F26] rounded-xl border border-[#3A5243] flex items-center justify-between text-xs font-mono">
                        <div>
                          <span className="font-bold text-white block">Suite {t.suiteNumber}: {t.name}</span>
                          <span className="text-[11px] text-[#F3EDE1]/70">{t.details}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700">
                          {t.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
};
