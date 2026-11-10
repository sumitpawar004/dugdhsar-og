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
    subscriptions,
    updateSubscription,
    deleteSubscription,
    toggleSubscriptionPause,
    cancelSubscription,
    syncSubscriptionsToGoogleSheets,
    exportSubscriptionsToCSV,
    addSubscription,
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
    recordAuditLog,
    addNewProduct,
    updateProduct,
    deleteProduct,
    updateOrder,
    addNewDeliveryZone,
    updateDeliveryZone,
    deleteDeliveryZone,
    websiteAnnouncement,
    updateWebsiteAnnouncement,
    siteSettings,
    updateSiteSettings
  } = useStore();

  const { path, navigate } = useRouter();

  // Active admin staff role for RBAC enforcement
  const [activeStaffRole, setActiveStaffRole] = useState<'super_admin' | 'operations_manager' | 'inventory_officer' | 'dispatch_lead' | 'customer_desk'>('super_admin');

  // RBAC Permission Mapping - Admin & Manager have full control over Products, Photos, Subscriptions, and Google Sheets Sync
  const rolePermissions: Record<string, string[]> = {
    super_admin: [
      'dashboard', 'overview', 'products', 'categories', 'orders', 'subscriptions', 'google-sheets', 'customers', 
      'dealers', 'partners', 'inventory', 'deliveries', 'delivery', 'payments', 
      'offers', 'discounts', 'analytics', 'reports', 'reviews', 'content', 
      'staff', 'users', 'settings', 'audit-logs', 'qa-tests', 'enquiries'
    ],
    operations_manager: [
      'dashboard', 'overview', 'products', 'categories', 'orders', 'subscriptions', 'google-sheets', 'customers', 
      'dealers', 'partners', 'inventory', 'deliveries', 'delivery', 'analytics', 
      'reports', 'enquiries', 'qa-tests'
    ],
    inventory_officer: [
      'inventory', 'products', 'categories', 'qa-tests'
    ],
    dispatch_lead: [
      'deliveries', 'delivery', 'orders', 'subscriptions', 'inventory'
    ],
    customer_desk: [
      'customers', 'subscriptions', 'reviews', 'enquiries', 'orders'
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

  // Content Announcement State (Live sync with website top announcement)
  const [bannerNotice, setBannerNotice] = useState(websiteAnnouncement || 'Dawn dispatch completed punctually. Bottles delivered across Seoni before 11:00 AM.');
  const [isSavingContent, setIsSavingContent] = useState(false);

  // Settings State (Live sync with Store Context settings)
  const [dairySettings, setDairySettings] = useState({
    fssaiLicense: siteSettings.fssaiNumber || '10020000000000',
    gstin: siteSettings.gstin || '23AAAAA0000A1Z5',
    morningCutoff: siteSettings.morningHours || '5:00 AM – 10:00 AM',
    tempMinC: 2.0,
    tempMaxC: 4.0,
    shopAddress: siteSettings.address || '3HP5+948, Barghat Rd, Sanjay Vihar Colony, Sufi Nagar, Seoni, Madhya Pradesh 480661',
    whatsappSupport: siteSettings.whatsapp || '+91 7067672604',
    supportEmail: siteSettings.email || 'support@dugdhsar.in'
  });

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

  // Product Add & Edit Modals State
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [newProductForm, setNewProductForm] = useState({
    name: '',
    categorySlug: 'milk',
    sizeLabel: '1 Litre Glass Bottle',
    priceRupees: 170,
    stockCount: 50,
    description: 'Pure certified A2 Gir cow dairy delivered fresh under cold-chain standards in Seoni.',
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

  // Subscriptions & Google Sheets Management State
  const [subSearchQuery, setSubSearchQuery] = useState('');
  const [subFilterStatus, setSubFilterStatus] = useState<'all' | 'active' | 'paused' | 'cancelled'>('all');
  const [editingSub, setEditingSub] = useState<any | null>(null);
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
  const [newSubAdminForm, setNewSubAdminForm] = useState({
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
  const [isSyncingSheets, setIsSyncingSheets] = useState(false);
  const [sheetSyncResult, setSheetSyncResult] = useState<string | null>(null);
  const [webhookInput, setWebhookInput] = useState(siteSettings.googleSheetsWebhookUrl || 'https://script.google.com/macros/s/AKfycbx-dugdhsar-a2-dairy-sync/exec');

  // Order Inspector & Manage Modal State
  const [inspectingOrder, setInspectingOrder] = useState<Order | null>(null);
  const [orderTrackingNum, setOrderTrackingNum] = useState('');
  const [orderDeliverySlot, setOrderDeliverySlot] = useState('');
  const [orderVehicleVan, setOrderVehicleVan] = useState('Cold Van MP-28-D-1964');

  // Delivery Zone Add Modal State
  const [isAddZoneOpen, setIsAddZoneOpen] = useState(false);
  const [newZoneForm, setNewZoneForm] = useState({
    zoneName: '',
    city: 'Seoni',
    pincode: '',
    minOrderRupees: 200,
    deliveryFeeRupees: 40,
    estimatedHours: 2
  });

  // Audit Logs Filter
  const [auditSearch, setAuditSearch] = useState('');

  // 19 Complete Modules with Subscriptions and Google Sheets Sync
  const navModules = [
    { id: 'dashboard', path: '/admin/dashboard', label: 'Overview Dashboard', icon: BarChart3 },
    { id: 'products', path: '/admin/products', label: 'Manage Products', icon: Package },
    { id: 'categories', path: '/admin/categories', label: 'Categories', icon: Layers },
    { id: 'orders', path: '/admin/orders', label: 'Orders Management', icon: ShoppingCart },
    { id: 'subscriptions', path: '/admin/subscriptions', label: 'Subscriptions Control', icon: RefreshCw },
    { id: 'google-sheets', path: '/admin/google-sheets', label: 'Google Sheets Sync', icon: FileText },
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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#3A5243]">
                  <div>
                    <h2 className="font-serif text-xl text-white font-semibold">Dairy Provisions Catalog ({products.length})</h2>
                    <p className="text-xs text-[#F3EDE1]/70">Total control: add products, adjust live prices, stock levels & status</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddProductOpen(true)}
                      className="px-4 py-2 bg-[#C2A36C] hover:bg-[#b0915a] text-[#263D30] font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ Add New Product</span>
                    </button>
                  </div>
                </div>

                <div className="border border-[#3A5243] rounded-2xl overflow-hidden divide-y divide-[#3A5243]">
                  {products.map(p => {
                    const v = p.variants[0] || { sizeLabel: '1 Litre', pricePaise: 17000, stockCount: 50, id: 'v-1' };
                    return (
                      <div key={p.id} className="p-4 bg-[#1F2F26] flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-white text-sm">{p.name}</span>
                            <span className="text-[11px] text-[#C2A36C] font-serif">({p.hindiName})</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              p.isPublished ? 'bg-emerald-950 border border-emerald-600 text-emerald-300' : 'bg-rose-950 border border-rose-800 text-rose-300'
                            }`}>
                              {p.isPublished ? 'Live on Store' : 'Unpublished'}
                            </span>
                            {p.featured && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-950 border border-amber-600 text-amber-300">
                                Featured
                              </span>
                            )}
                          </div>
                          
                          <p className="text-[#F3EDE1]/70 text-[11px]">
                            Category: <strong className="text-white uppercase">{p.categorySlug}</strong> · Standard Size: <strong className="text-white">{v.sizeLabel}</strong>
                          </p>

                          <div className="flex items-center gap-4 font-mono">
                            <span className="text-[#C2A36C] font-bold text-sm">Selling Price: {formatPaise(v.pricePaise)}</span>
                            <span className="text-[#F3EDE1]/85">On-Hand Stock: <strong className={v.stockCount < 15 ? 'text-amber-400' : 'text-emerald-400'}>{v.stockCount} units</strong></span>
                          </div>
                        </div>

                        {/* Control Actions */}
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Quick Stock Controls */}
                          <div className="flex items-center bg-[#263D30] border border-[#3A5243] rounded-xl px-1.5 py-1">
                            <span className="text-[10px] text-[#F3EDE1]/60 px-1 font-semibold">Stock:</span>
                            <button
                              type="button"
                              onClick={() => updateProductStock(v.id, -10, 'Admin manual stock deduct')}
                              className="px-1.5 py-0.5 hover:bg-[#3A5243] rounded text-rose-300 font-bold font-mono text-[11px] cursor-pointer"
                              title="Deduct 10 units"
                            >
                              -10
                            </button>
                            <button
                              type="button"
                              onClick={() => updateProductStock(v.id, +10, 'Admin manual stock add')}
                              className="px-1.5 py-0.5 hover:bg-[#3A5243] rounded text-emerald-300 font-bold font-mono text-[11px] cursor-pointer"
                              title="Add 10 units"
                            >
                              +10
                            </button>
                            <button
                              type="button"
                              onClick={() => updateProductStock(v.id, +50, 'Admin batch addition')}
                              className="px-1.5 py-0.5 hover:bg-[#3A5243] rounded text-emerald-300 font-bold font-mono text-[11px] cursor-pointer"
                              title="Add 50 units"
                            >
                              +50
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
                                sizeLabel: v.sizeLabel,
                                priceRupees: v.pricePaise / 100,
                                stockCount: v.stockCount,
                                description: p.description,
                                badge: p.badge || '',
                                imageUrl: p.images?.[0]?.imageUrl || '',
                                isPublished: p.isPublished,
                                featured: p.featured || false
                              });
                            }}
                            className="px-3 py-1.5 bg-[#263D30] hover:bg-[#3A5243] border border-[#3A5243] text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5 text-[#C2A36C]" />
                            <span>Edit</span>
                          </button>

                          {/* Publish/Unpublish */}
                          <button
                            type="button"
                            onClick={() => toggleProductPublish(p.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                              p.isPublished 
                                ? 'bg-amber-950/60 text-amber-300 border border-amber-800 hover:bg-amber-900/60'
                                : 'bg-emerald-950/60 text-emerald-300 border border-emerald-700 hover:bg-emerald-900/60'
                            }`}
                          >
                            {p.isPublished ? 'Unpublish' : 'Publish'}
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete "${p.name}"? This cannot be undone.`)) {
                                deleteProduct(p.id);
                              }
                            }}
                            className="px-2.5 py-1.5 bg-rose-950/40 hover:bg-rose-950 border border-rose-800 text-rose-300 rounded-lg text-xs font-semibold cursor-pointer"
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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#3A5243]">
                  <div>
                    <h2 className="font-serif text-xl text-white font-semibold">Active Orders & Cold-Chain Dispatch ({orders.length})</h2>
                    <p className="text-xs text-[#F3EDE1]/70">Full dispatch control: driver assignment, live status updates & WhatsApp routing</p>
                  </div>
                  <span className="text-xs text-[#C2A36C] font-semibold bg-[#263D30] px-3 py-1 rounded-lg border border-[#3A5243]">
                    Morning Slot: 05:30 AM – 11:00 AM
                  </span>
                </div>

                <div className="space-y-3">
                  {orders.map(o => (
                    <div key={o.id} className="p-4 bg-[#1F2F26] rounded-2xl border border-[#3A5243] space-y-3 text-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#3A5243]">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-white text-sm">{o.orderNumber}</span>
                          <span className="text-[#F3EDE1]/80 font-semibold">· {o.customerName}</span>
                          <span className="text-[11px] text-[#C2A36C]">({o.customerPhone})</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            o.status === 'delivered' ? 'bg-emerald-950 text-emerald-300 border border-emerald-600' :
                            o.status === 'dispatched' ? 'bg-amber-950 text-amber-300 border border-amber-600' :
                            o.status === 'cancelled' ? 'bg-rose-950 text-rose-300 border border-rose-600' :
                            'bg-blue-950 text-blue-300 border border-blue-600'
                          }`}>
                            {o.status === 'dispatched' ? 'Out for Delivery' : o.status.replace(/_/g, ' ')}
                          </span>
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
                            className="bg-[#263D30] border border-[#3A5243] text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
                          >
                            <option value="confirmed">Confirmed</option>
                            <option value="processing">Processing (Milking & Bottling)</option>
                            <option value="dispatched">Out for Delivery (Cold Van)</option>
                            <option value="delivered">Delivered to Doorstep</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </div>
                      </div>

                      <div className="text-[11px] text-[#F3EDE1]/85">
                        <strong className="text-white">Provisions: </strong>
                        {o.items.map(i => `${i.productNameSnapshot} (${i.sizeSnapshot}) × ${i.quantity}`).join(', ')}
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#C2A36C] pt-1">
                        <span>Slot: <strong className="text-white">{o.deliverySlot}</strong> · Pincode: <strong className="text-white">{o.deliveryPincode}</strong></span>
                        <span className="font-mono text-white">Tracking: <strong>{o.trackingNumber || 'DS-COLD-SEONI-101'}</strong></span>
                      </div>

                      {/* Super Admin Quick Actions */}
                      <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-[#3A5243]/60">
                        <button
                          type="button"
                          onClick={() => {
                            setInspectingOrder(o);
                            setOrderTrackingNum(o.trackingNumber || `DS-COLD-SEONI-${Math.floor(100 + Math.random() * 900)}`);
                            setOrderDeliverySlot(o.deliverySlot || '05:30 AM - 11:00 AM');
                          }}
                          className="px-3 py-1.5 bg-[#263D30] hover:bg-[#3A5243] text-[#FAF6EE] rounded-lg text-xs font-semibold flex items-center gap-1 border border-[#3A5243] cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5 text-[#C2A36C]" />
                          <span>Inspect & Manage</span>
                        </button>

                        <a
                          href={`https://wa.me/${o.customerPhone.replace(/[^0-9]/g, '')}?text=Namaste%20${encodeURIComponent(o.customerName)}%2C%20your%20DUGDHSAR%20dairy%20order%20(${o.orderNumber})%20is%20${o.status === 'dispatched' ? 'out%20for%20cold-chain%20delivery%20in%20insulated%20van' : 'confirmed%20for%20morning%20dawn%20delivery'}.%20Tracking%3A%20${encodeURIComponent(o.trackingNumber || 'DS-COLD-SEONI-101')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-emerald-950 hover:bg-emerald-900 border border-emerald-600 text-emerald-300 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <span>WhatsApp Customer</span>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SUBSCRIPTIONS MANAGEMENT (/admin/subscriptions) */}
            {activeSection === 'subscriptions' && (
              <div className="space-y-5">
                {/* Header & KPI Summary */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="font-serif text-xl sm:text-2xl text-white font-bold flex items-center gap-2">
                      <RefreshCw className="w-5 h-5 text-[#C2A36C]" />
                      <span>Subscriptions Control / दैनिक दूध सब्सक्रिप्शन</span>
                    </h2>
                    <p className="text-xs text-[#F3EDE1]/70 mt-0.5">
                      Full control for Admin & Operations Manager: daily deliveries, pause/resume, edits & instant Google Sheets sync.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={isSyncingSheets}
                      onClick={async () => {
                        setIsSyncingSheets(true);
                        setSheetSyncResult(null);
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
                      className="px-3.5 py-2 bg-[#1F2F26] hover:bg-[#3A5243] border border-[#3A5243] text-[#FAF6EE] rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-[#C2A36C]" />
                      <span>Export CSV</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsAddSubOpen(true)}
                      className="px-3.5 py-2 bg-[#C2A36C] hover:bg-[#b0915a] text-[#263D30] rounded-xl text-xs font-bold flex items-center gap-1 shadow-md cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ New Subscription</span>
                    </button>
                  </div>
                </div>

                {/* Feedback Notification */}
                {sheetSyncResult && (
                  <div className="p-3 bg-emerald-950/80 border border-emerald-500 rounded-xl text-xs text-emerald-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{sheetSyncResult}</span>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setSheetSyncResult(null)}
                      className="text-emerald-400 hover:text-white"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* Subscription Stat Pills */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-[#1F2F26] rounded-xl border border-[#3A5243]">
                    <span className="text-[10px] text-[#F3EDE1]/60 block uppercase font-mono">Total Patrons</span>
                    <strong className="text-xl font-bold text-white font-mono mt-0.5 block">{subscriptions.length}</strong>
                    <span className="text-[10px] text-emerald-400 font-medium">All Seoni zones</span>
                  </div>
                  <div className="p-3 bg-[#1F2F26] rounded-xl border border-[#3A5243]">
                    <span className="text-[10px] text-[#F3EDE1]/60 block uppercase font-mono">Active Bottles / Day</span>
                    <strong className="text-xl font-bold text-[#C2A36C] font-mono mt-0.5 block">
                      {subscriptions.filter(s => s.status === 'active').reduce((acc, s) => acc + s.quantity, 0)} Litres
                    </strong>
                    <span className="text-[10px] text-[#F3EDE1]/60 font-medium">Sterile glass bottles</span>
                  </div>
                  <div className="p-3 bg-[#1F2F26] rounded-xl border border-[#3A5243]">
                    <span className="text-[10px] text-[#F3EDE1]/60 block uppercase font-mono">Active Subscriptions</span>
                    <strong className="text-xl font-bold text-emerald-400 font-mono mt-0.5 block">
                      {subscriptions.filter(s => s.status === 'active').length}
                    </strong>
                    <span className="text-[10px] text-[#F3EDE1]/60">Morning & Evening drop</span>
                  </div>
                  <div className="p-3 bg-[#1F2F26] rounded-xl border border-[#3A5243]">
                    <span className="text-[10px] text-[#F3EDE1]/60 block uppercase font-mono">Google Sheet Sync</span>
                    <strong className="text-xs font-bold text-white font-mono mt-1.5 block truncate">
                      {siteSettings.lastGoogleSheetSync || 'Real-time Webhook'}
                    </strong>
                    <span className="text-[10px] text-emerald-400">Live automatic backup</span>
                  </div>
                </div>

                {/* Filters & Search */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#1F2F26] p-3 rounded-2xl border border-[#3A5243]">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search patron by name, phone, email, or colony..."
                      value={subSearchQuery}
                      onChange={(e) => setSubSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 bg-[#17241C] border border-[#3A5243] rounded-xl text-white text-xs outline-none focus:border-[#C2A36C]"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                    {(['all', 'active', 'paused', 'cancelled'] as const).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setSubFilterStatus(st)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                          subFilterStatus === st
                            ? 'bg-[#C2A36C] text-[#263D30] font-bold shadow-xs'
                            : 'bg-[#17241C] text-[#F3EDE1]/70 hover:text-white'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Subscriptions List */}
                <div className="space-y-3">
                  {subscriptions
                    .filter(s => {
                      if (subFilterStatus !== 'all' && s.status !== subFilterStatus) return false;
                      if (!subSearchQuery.trim()) return true;
                      const q = subSearchQuery.toLowerCase();
                      const name = (s.customerName || '').toLowerCase();
                      const phone = (s.customerPhone || '').toLowerCase();
                      const email = (s.customerEmail || '').toLowerCase();
                      const address = (s.deliveryAddress || '').toLowerCase();
                      const prod = (s.productName || '').toLowerCase();
                      return (
                        name.includes(q) ||
                        phone.includes(q) ||
                        email.includes(q) ||
                        address.includes(q) ||
                        prod.includes(q)
                      );
                    })
                    .map((sub) => (
                      <div
                        key={sub.id}
                        className="p-4 bg-[#1F2F26] rounded-2xl border border-[#3A5243] flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs hover:border-[#C2A36C]/40 transition-colors"
                      >
                        <div className="space-y-1.5 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <strong className="text-sm font-bold text-white">{sub.customerName || 'Valued Patron'}</strong>
                            <span className="font-mono text-[11px] text-[#C2A36C] bg-[#C2A36C]/10 border border-[#C2A36C]/30 px-2 py-0.5 rounded-md">
                              {sub.customerPhone || '+91 7067672604'}
                            </span>
                            {sub.customerEmail && (
                              <span className="text-[10px] text-[#F3EDE1]/60">
                                {sub.customerEmail}
                              </span>
                            )}
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                sub.status === 'active'
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-600'
                                  : sub.status === 'paused'
                                  ? 'bg-amber-950 text-amber-300 border border-amber-600'
                                  : 'bg-rose-950 text-rose-300 border border-rose-800'
                              }`}
                            >
                              {sub.status}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[#F3EDE1]/85">
                            <span className="font-semibold text-white">
                              📦 {sub.quantity}x {sub.productName} ({sub.variant})
                            </span>
                            <span className="text-[#C2A36C]">
                              🕒 {sub.frequency} · {sub.deliverySlot || '5:00 AM - 10:00 AM'}
                            </span>
                            <span className="text-[#F3EDE1]/60">
                              Starts: {sub.startDate}
                            </span>
                          </div>

                          <p className="text-[11px] text-[#F3EDE1]/70 truncate max-w-xl">
                            📍 {sub.deliveryAddress || 'Doorstep delivery, Seoni, MP'}
                          </p>

                          {sub.notes && (
                            <p className="text-[10px] text-[#C2A36C]/90 italic">
                              Drop Notes: {sub.notes}
                            </p>
                          )}
                        </div>

                        {/* Admin Action Buttons */}
                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          {/* 1-Tap Pause / Resume */}
                          <button
                            type="button"
                            onClick={() => toggleSubscriptionPause(sub.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                              sub.status === 'active'
                                ? 'bg-amber-950/70 hover:bg-amber-900 border border-amber-700 text-amber-300'
                                : 'bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-600 text-emerald-300'
                            }`}
                          >
                            <span>{sub.status === 'active' ? 'Pause' : 'Resume'}</span>
                          </button>

                          {/* Edit Subscription */}
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
                                status: sub.status
                              });
                            }}
                            className="px-3 py-1.5 bg-[#263D30] hover:bg-[#3A5243] text-white border border-[#3A5243] rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5 text-[#C2A36C]" />
                            <span>Edit</span>
                          </button>

                          {/* Direct WhatsApp link */}
                          <a
                            href={`https://wa.me/${(sub.customerPhone || '917067672604').replace(/[^0-9]/g, '')}?text=Namaste%20${encodeURIComponent(sub.customerName || 'Valued Patron')}%2C%20regarding%20your%20DUGDHSAR%20daily%20A2%20milk%20subscription%20(${encodeURIComponent(sub.variant)}%20x%20${sub.quantity})%3A`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1.5 bg-emerald-950 hover:bg-emerald-900 border border-emerald-700 text-emerald-300 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                            title="Direct WhatsApp"
                          >
                            <span>WhatsApp</span>
                          </a>

                          {/* Delete Subscription */}
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

                  {subscriptions.length === 0 && (
                    <div className="p-8 text-center bg-[#1F2F26] rounded-2xl border border-[#3A5243] text-[#F3EDE1]/60">
                      No customer subscriptions yet. Click "+ New Subscription" above to create one.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* GOOGLE SHEETS DATA SYNC MODULE (/admin/google-sheets) */}
            {activeSection === 'google-sheets' && (
              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="font-serif text-xl sm:text-2xl text-white font-bold flex items-center gap-2">
                      <FileText className="w-5 h-5 text-emerald-400" />
                      <span>Google Sheets Data Sync / गूगल डेटा शीट सिंक</span>
                    </h2>
                    <p className="text-xs text-[#F3EDE1]/70 mt-0.5">
                      Automatically synchronizes all user morning bottle subscriptions and orders to your external Google Spreadsheet.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isSyncingSheets}
                      onClick={async () => {
                        setIsSyncingSheets(true);
                        setSheetSyncResult(null);
                        const res = await syncSubscriptionsToGoogleSheets(webhookInput);
                        setIsSyncingSheets(false);
                        setSheetSyncResult(res.message);
                      }}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncingSheets ? 'animate-spin' : ''}`} />
                      <span>{isSyncingSheets ? 'Synchronizing...' : 'Sync All Records Now'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => exportSubscriptionsToCSV()}
                      className="px-3.5 py-2 bg-[#1F2F26] hover:bg-[#3A5243] border border-[#3A5243] text-white rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-[#C2A36C]" />
                      <span>Download Sheet CSV</span>
                    </button>
                  </div>
                </div>

                {/* Status Notice */}
                {sheetSyncResult && (
                  <div className="p-3 bg-emerald-950 border border-emerald-500 rounded-xl text-xs text-emerald-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{sheetSyncResult}</span>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setSheetSyncResult(null)}
                      className="text-emerald-400 hover:text-white"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* Configuration Card */}
                <div className="bg-[#1F2F26] p-5 rounded-2xl border border-[#3A5243] space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-serif text-sm font-bold text-white flex items-center gap-2">
                      <Settings className="w-4 h-4 text-[#C2A36C]" />
                      <span>Google Apps Script / Webhook Endpoint Configuration</span>
                    </h3>
                    <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded-full">
                      Auto-Sync Active on Every New Subscription
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#F3EDE1]/80 mb-1.5">
                      Google Sheets Webhook URL (Google Apps Script Web App Endpoint)
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="url"
                        value={webhookInput}
                        onChange={(e) => setWebhookInput(e.target.value)}
                        placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                        className="flex-1 px-3 py-2 bg-[#17241C] border border-[#3A5243] rounded-xl text-white text-xs outline-none focus:border-[#C2A36C] font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          updateSiteSettings({ googleSheetsWebhookUrl: webhookInput });
                          setSheetSyncResult('Google Sheets Webhook URL saved successfully.');
                          setTimeout(() => setSheetSyncResult(null), 4000);
                        }}
                        className="px-4 py-2 bg-[#C2A36C] hover:bg-[#b0915a] text-[#263D30] font-bold text-xs rounded-xl shadow-md cursor-pointer shrink-0"
                      >
                        Save Webhook
                      </button>
                    </div>
                    <p className="text-[10px] text-[#F3EDE1]/60 mt-1.5 leading-relaxed">
                      Whenever a customer subscribes from the website or calendar, the complete customer details (Name, Phone, Email, Address, Milk Type, Bottle Qty, Delivery Slot) are immediately sent to this sheet.
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[#3A5243]/60 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="text-[#F3EDE1]/70">
                      Last Synchronized: <strong className="text-white">{siteSettings.lastGoogleSheetSync || 'Just now'}</strong>
                    </span>
                    <span className="text-emerald-400 font-medium">
                      ✓ Data format: 14 Columns compliant with Google Sheets & Microsoft Excel
                    </span>
                  </div>
                </div>

                {/* Google Sheet Live Tabular Preview */}
                <div className="bg-[#1F2F26] rounded-2xl border border-[#3A5243] overflow-hidden">
                  <div className="p-4 bg-[#17241C] border-b border-[#3A5243] flex items-center justify-between">
                    <div>
                      <h4 className="font-serif text-sm font-bold text-white flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Live Google Sheet Data Preview ({subscriptions.length} Subscriptions)</span>
                      </h4>
                      <p className="text-[10px] text-[#F3EDE1]/60">Real-time mirror of spreadsheet columns & rows</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => exportSubscriptionsToCSV()}
                      className="px-2.5 py-1 bg-[#263D30] hover:bg-[#3A5243] text-white border border-[#3A5243] rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      Export CSV
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[11px] text-[#F3EDE1]">
                      <thead className="bg-[#0F1813] text-[#C2A36C] font-mono uppercase text-[10px] tracking-wider border-b border-[#3A5243]">
                        <tr>
                          <th className="py-2.5 px-3">Sub ID</th>
                          <th className="py-2.5 px-3">Patron Name</th>
                          <th className="py-2.5 px-3">Mobile</th>
                          <th className="py-2.5 px-3">Email</th>
                          <th className="py-2.5 px-3">Product</th>
                          <th className="py-2.5 px-3">Qty</th>
                          <th className="py-2.5 px-3">Slot</th>
                          <th className="py-2.5 px-3">Delivery Address</th>
                          <th className="py-2.5 px-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#3A5243]/60 font-mono">
                        {subscriptions.map((s) => (
                          <tr key={s.id} className="hover:bg-[#263D30]/40 transition-colors">
                            <td className="py-2.5 px-3 text-[#C2A36C] font-bold">{s.id}</td>
                            <td className="py-2.5 px-3 text-white font-sans font-semibold">{s.customerName}</td>
                            <td className="py-2.5 px-3">{s.customerPhone}</td>
                            <td className="py-2.5 px-3 text-gray-400">{s.customerEmail || '—'}</td>
                            <td className="py-2.5 px-3 font-sans truncate max-w-[140px]">{s.productName}</td>
                            <td className="py-2.5 px-3 text-emerald-400 font-bold">{s.quantity}L</td>
                            <td className="py-2.5 px-3 truncate max-w-[110px]">{s.deliverySlot}</td>
                            <td className="py-2.5 px-3 font-sans truncate max-w-[160px] text-gray-300">{s.deliveryAddress}</td>
                            <td className="py-2.5 px-3">
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                                s.status === 'active' ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' : 'bg-amber-950 text-amber-300 border border-amber-700'
                              }`}>
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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#3A5243]">
                  <div>
                    <h2 className="font-serif text-xl text-white font-semibold">Active Cold-Chain Delivery Pincodes & Zones ({deliveryZones.length})</h2>
                    <p className="text-xs text-[#F3EDE1]/70">Add and manage serviceable pincodes, minimum order thresholds & cold van corridors</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAddZoneOpen(true)}
                    className="px-4 py-2 bg-[#C2A36C] hover:bg-[#b0915a] text-[#263D30] font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md cursor-pointer shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Add Delivery Pincode / Zone</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  {deliveryZones.map(zone => (
                    <div key={zone.id} className="p-4.5 bg-[#1F2F26] rounded-2xl border border-[#3A5243] space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{zone.zoneName}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            zone.isActive !== false ? 'bg-emerald-950 text-emerald-300 border border-emerald-600' : 'bg-rose-950 text-rose-300 border border-rose-800'
                          }`}>
                            {zone.isActive !== false ? 'Active' : 'Disabled'}
                          </span>
                        </div>
                        <span className="font-mono text-[#C2A36C] font-bold text-xs bg-[#263D30] px-2 py-0.5 rounded border border-[#3A5243]">
                          PIN: {zone.pincode}
                        </span>
                      </div>
                      
                      <p className="text-[#F3EDE1]/70">{zone.city}, {zone.state} · Hub: {zone.hubAddress || 'Seoni Hub'}</p>
                      
                      <div className="pt-2 border-t border-[#3A5243]/60 flex flex-wrap items-center justify-between text-[11px] gap-2">
                        <span className="text-emerald-400 font-semibold">Free Delivery Above {formatPaise(zone.minOrderPaise)}</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              updateDeliveryZone(zone.id, { isActive: zone.isActive === false ? true : false });
                            }}
                            className="px-2.5 py-1 bg-[#263D30] hover:bg-[#3A5243] border border-[#3A5243] text-white rounded text-[10px] font-semibold cursor-pointer"
                          >
                            {zone.isActive === false ? 'Enable' : 'Disable'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Remove delivery zone ${zone.zoneName} (${zone.pincode})?`)) {
                                deleteDeliveryZone(zone.id);
                              }
                            }}
                            className="p-1 text-rose-400 hover:text-rose-200 cursor-pointer"
                            title="Delete Zone"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
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
                      updateWebsiteAnnouncement(bannerNotice);
                      recordAuditLog('WEBSITE_CONTENT_UPDATED', 'ANNOUNCEMENT_BANNER', 'TOP_BANNER', {
                        text: bannerNotice,
                        adminRole: activeStaffRole
                      });
                      setTimeout(() => {
                        setIsSavingContent(false);
                        alert('Banner broadcast content updated live across entire website and saved!');
                      }, 400);
                    }}
                    className="px-5 py-2.5 bg-[#C2A36C] hover:bg-[#b0915a] text-[#263D30] font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    {isSavingContent ? 'Publishing Live...' : 'Publish Content Live & Update Header'}
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
                      updateSiteSettings({
                        fssaiNumber: dairySettings.fssaiLicense,
                        gstin: dairySettings.gstin,
                        morningHours: dairySettings.morningCutoff,
                        address: dairySettings.shopAddress,
                        whatsapp: dairySettings.whatsappSupport,
                        email: dairySettings.supportEmail
                      });
                      recordAuditLog('SETTINGS_UPDATED', 'SYSTEM_CONFIG', 'DAIRY_PARAMETERS', {
                        dairySettings,
                        adminRole: activeStaffRole
                      });
                      alert('Dairy operations settings saved live & synchronized with website footer, navbar and receipts!');
                    }}
                    className="px-5 py-2.5 bg-[#C2A36C] hover:bg-[#b0915a] text-[#263D30] font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Save Operational Settings Live
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

        {/* MODAL 1: ADD NEW PRODUCT MODAL */}
        {isAddProductOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[#263D30] border-2 border-[#C2A36C]/60 rounded-3xl max-w-lg w-full p-6 sm:p-8 text-white shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-[#3A5243]">
                <div>
                  <h3 className="font-serif text-lg font-bold text-[#FAF6EE] flex items-center gap-2">
                    <Plus className="w-5 h-5 text-[#C2A36C]" />
                    <span>Add New Dairy Provision</span>
                  </h3>
                  <p className="text-[11px] text-[#F3EDE1]/70">Publish new SKU to Dugdhsar digital storefront</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddProductOpen(false)}
                  className="p-1 text-[#F3EDE1]/60 hover:text-white cursor-pointer"
                >
                  ✕
                </button>
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
                  setNewProductForm({
                    name: '',
                    categorySlug: 'milk',
                    sizeLabel: '1 Litre Glass Bottle',
                    priceRupees: 170,
                    stockCount: 50,
                    description: 'Pure certified A2 Gir cow dairy delivered fresh under cold-chain standards in Seoni.',
                    badge: 'Fresh Dawn Milking',
                    imageUrl: '/assets/aistudio/image_fe6cbcdf.png'
                  });
                }}
                className="space-y-3.5 text-xs"
              >
                <div>
                  <label className="block text-[11px] font-semibold text-[#F3EDE1]/80 mb-1">Product Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DUGDHSAR Fresh A2 Desi Cow Milk"
                    value={newProductForm.name}
                    onChange={(e) => setNewProductForm({ ...newProductForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-[#1F2F26] border border-[#3A5243] rounded-xl text-white outline-none focus:border-[#C2A36C]"
                  />
                </div>

                {/* Photo Upload & Select */}
                <div className="bg-[#1A2820] p-3 rounded-2xl border border-[#3A5243] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-semibold text-[#C2A36C]">Product Photo / Image URL</label>
                    {newProductForm.imageUrl && (
                      <button
                        type="button"
                        onClick={() => setNewProductForm({ ...newProductForm, imageUrl: '' })}
                        className="text-[10px] text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
                      >
                        Remove Photo
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    {newProductForm.imageUrl ? (
                      <div className="w-14 h-14 rounded-xl border border-[#C2A36C]/60 overflow-hidden bg-black shrink-0 relative">
                        <img 
                          src={newProductForm.imageUrl} 
                          alt="Product preview" 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                    ) : (
                      <div className="w-14 h-14 rounded-xl border border-dashed border-[#3A5243] flex items-center justify-center text-[10px] text-gray-400 shrink-0">
                        No Image
                      </div>
                    )}
                    <input
                      type="text"
                      placeholder="Enter image URL or select from presets below"
                      value={newProductForm.imageUrl}
                      onChange={(e) => setNewProductForm({ ...newProductForm, imageUrl: e.target.value })}
                      className="flex-1 px-3 py-2 bg-[#1F2F26] border border-[#3A5243] rounded-xl text-white text-xs outline-none focus:border-[#C2A36C]"
                    />
                  </div>

                  {/* Preset Photo Chips */}
                  <div>
                    <span className="text-[10px] text-[#F3EDE1]/60 block mb-1">Quick Vedic Image Presets:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {DAIRY_IMAGE_PRESETS.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setNewProductForm({ ...newProductForm, imageUrl: preset.url })}
                          className={`text-[10px] px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                            newProductForm.imageUrl === preset.url
                              ? 'bg-[#C2A36C] text-[#263D30] font-bold border-[#C2A36C]'
                              : 'bg-[#1F2F26] text-[#F3EDE1]/80 border-[#3A5243] hover:border-[#C2A36C]'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#F3EDE1]/80 mb-1">Category *</label>
                    <select
                      value={newProductForm.categorySlug}
                      onChange={(e) => setNewProductForm({ ...newProductForm, categorySlug: e.target.value })}
                      className="w-full px-3 py-2 bg-[#1F2F26] border border-[#3A5243] rounded-xl text-white outline-none focus:border-[#C2A36C] capitalize"
                    >
                      <option value="milk">Milk (Fresh A2 Desi Cow)</option>
                      <option value="ghee">Ghee (Vedic Bilona)</option>
                      <option value="paneer">Paneer (Fresh Malai)</option>
                      <option value="curd">Curd (Clay-Pot Dahi)</option>
                      <option value="butter">Butter (White Makhan)</option>
                      <option value="khoya-mawa">Khoya & Mawa</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#F3EDE1]/80 mb-1">Standard Size / Unit *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 1 Litre Glass Bottle or 500 GM"
                      value={newProductForm.sizeLabel}
                      onChange={(e) => setNewProductForm({ ...newProductForm, sizeLabel: e.target.value })}
                      className="w-full px-3 py-2 bg-[#1F2F26] border border-[#3A5243] rounded-xl text-white outline-none focus:border-[#C2A36C]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#F3EDE1]/80 mb-1">Selling Price (₹) *</label>
                    <input
                      type="number"
                      required
                      min={10}
                      value={newProductForm.priceRupees}
                      onChange={(e) => setNewProductForm({ ...newProductForm, priceRupees: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-[#1F2F26] border border-[#3A5243] rounded-xl text-white font-mono outline-none focus:border-[#C2A36C]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#F3EDE1]/80 mb-1">Initial Stock (Units) *</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={newProductForm.stockCount}
                      onChange={(e) => setNewProductForm({ ...newProductForm, stockCount: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-[#1F2F26] border border-[#3A5243] rounded-xl text-white font-mono outline-none focus:border-[#C2A36C]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#F3EDE1]/80 mb-1">Badge / Tagline</label>
                  <input
                    type="text"
                    placeholder="e.g. Fresh Dawn Milking or Vedic Bilona"
                    value={newProductForm.badge}
                    onChange={(e) => setNewProductForm({ ...newProductForm, badge: e.target.value })}
                    className="w-full px-3 py-2 bg-[#1F2F26] border border-[#3A5243] rounded-xl text-white outline-none focus:border-[#C2A36C]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#F3EDE1]/80 mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={newProductForm.description}
                    onChange={(e) => setNewProductForm({ ...newProductForm, description: e.target.value })}
                    className="w-full px-3 py-2 bg-[#1F2F26] border border-[#3A5243] rounded-xl text-white outline-none focus:border-[#C2A36C]"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#3A5243]">
                  <button
                    type="button"
                    onClick={() => setIsAddProductOpen(false)}
                    className="px-4 py-2 bg-[#1F2F26] hover:bg-[#3A5243] text-[#F3EDE1]/75 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#C2A36C] hover:bg-[#b0915a] text-[#263D30] font-bold rounded-xl shadow-md cursor-pointer"
                  >
                    Publish Product Live
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 2: EDIT PRODUCT MODAL (WITH FULL PHOTO MANAGEMENT) */}
        {editingProduct && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[#263D30] border-2 border-[#C2A36C]/60 rounded-3xl max-w-lg w-full p-6 sm:p-8 text-white shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-[#3A5243]">
                <div>
                  <h3 className="font-serif text-lg font-bold text-[#FAF6EE] flex items-center gap-2">
                    <Edit className="w-5 h-5 text-[#C2A36C]" />
                    <span>Edit Provision: {editingProduct.name}</span>
                  </h3>
                  <p className="text-[11px] text-[#F3EDE1]/70">Modify product details, photo, selling price, or inventory count</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="p-1 text-[#F3EDE1]/60 hover:text-white cursor-pointer"
                >
                  ✕
                </button>
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
                className="space-y-3.5 text-xs"
              >
                <div>
                  <label className="block text-[11px] font-semibold text-[#F3EDE1]/80 mb-1">Product Title</label>
                  <input
                    type="text"
                    required
                    value={editProductForm.name}
                    onChange={(e) => setEditProductForm({ ...editProductForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-[#1F2F26] border border-[#3A5243] rounded-xl text-white outline-none focus:border-[#C2A36C]"
                  />
                </div>

                {/* Photo Management for Admin & Manager */}
                <div className="bg-[#1A2820] p-3 rounded-2xl border border-[#3A5243] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-semibold text-[#C2A36C]">
                      Product Photo (Edit, Replace or Delete)
                    </label>
                    {editProductForm.imageUrl && (
                      <button
                        type="button"
                        onClick={() => setEditProductForm({ ...editProductForm, imageUrl: '' })}
                        className="text-[10px] text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
                      >
                        Delete Photo
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    {editProductForm.imageUrl ? (
                      <div className="w-14 h-14 rounded-xl border border-[#C2A36C]/60 overflow-hidden bg-black shrink-0 relative">
                        <img 
                          src={editProductForm.imageUrl} 
                          alt="Product preview" 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                    ) : (
                      <div className="w-14 h-14 rounded-xl border border-dashed border-[#3A5243] flex items-center justify-center text-[10px] text-gray-400 shrink-0">
                        No Image
                      </div>
                    )}
                    <input
                      type="text"
                      placeholder="Paste image URL (https://... or /assets/...)"
                      value={editProductForm.imageUrl}
                      onChange={(e) => setEditProductForm({ ...editProductForm, imageUrl: e.target.value })}
                      className="flex-1 px-3 py-2 bg-[#1F2F26] border border-[#3A5243] rounded-xl text-white text-xs outline-none focus:border-[#C2A36C]"
                    />
                  </div>

                  {/* Preset Photo Chips */}
                  <div>
                    <span className="text-[10px] text-[#F3EDE1]/60 block mb-1">Select from Vedic Dairy Presets:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {DAIRY_IMAGE_PRESETS.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setEditProductForm({ ...editProductForm, imageUrl: preset.url })}
                          className={`text-[10px] px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                            editProductForm.imageUrl === preset.url
                              ? 'bg-[#C2A36C] text-[#263D30] font-bold border-[#C2A36C]'
                              : 'bg-[#1F2F26] text-[#F3EDE1]/80 border-[#3A5243] hover:border-[#C2A36C]'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#F3EDE1]/80 mb-1">Category</label>
                    <select
                      value={editProductForm.categorySlug}
                      onChange={(e) => setEditProductForm({ ...editProductForm, categorySlug: e.target.value })}
                      className="w-full px-3 py-2 bg-[#1F2F26] border border-[#3A5243] rounded-xl text-white outline-none focus:border-[#C2A36C] capitalize"
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
                    <label className="block text-[11px] font-semibold text-[#F3EDE1]/80 mb-1">Size / Volume Label</label>
                    <input
                      type="text"
                      required
                      value={editProductForm.sizeLabel}
                      onChange={(e) => setEditProductForm({ ...editProductForm, sizeLabel: e.target.value })}
                      className="w-full px-3 py-2 bg-[#1F2F26] border border-[#3A5243] rounded-xl text-white outline-none focus:border-[#C2A36C]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#F3EDE1]/80 mb-1">Selling Price (₹)</label>
                    <input
                      type="number"
                      required
                      min={10}
                      value={editProductForm.priceRupees}
                      onChange={(e) => setEditProductForm({ ...editProductForm, priceRupees: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-[#1F2F26] border border-[#3A5243] rounded-xl text-white font-mono outline-none focus:border-[#C2A36C]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#F3EDE1]/80 mb-1">On-Hand Stock (Units)</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={editProductForm.stockCount}
                      onChange={(e) => setEditProductForm({ ...editProductForm, stockCount: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-[#1F2F26] border border-[#3A5243] rounded-xl text-white font-mono outline-none focus:border-[#C2A36C]"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4 py-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editProductForm.isPublished}
                      onChange={(e) => setEditProductForm({ ...editProductForm, isPublished: e.target.checked })}
                      className="w-4 h-4 accent-[#C2A36C] rounded"
                    />
                    <span className="text-[11px] font-semibold">Live & Active on Store</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editProductForm.featured}
                      onChange={(e) => setEditProductForm({ ...editProductForm, featured: e.target.checked })}
                      className="w-4 h-4 accent-[#C2A36C] rounded"
                    />
                    <span className="text-[11px] font-semibold">Featured on Homepage</span>
                  </label>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#F3EDE1]/80 mb-1">Badge / Tagline</label>
                  <input
                    type="text"
                    value={editProductForm.badge}
                    onChange={(e) => setEditProductForm({ ...editProductForm, badge: e.target.value })}
                    className="w-full px-3 py-2 bg-[#1F2F26] border border-[#3A5243] rounded-xl text-white outline-none focus:border-[#C2A36C]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#F3EDE1]/80 mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={editProductForm.description}
                    onChange={(e) => setEditProductForm({ ...editProductForm, description: e.target.value })}
                    className="w-full px-3 py-2 bg-[#1F2F26] border border-[#3A5243] rounded-xl text-white outline-none focus:border-[#C2A36C]"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#3A5243]">
                  <button
                    type="button"
                    onClick={() => setEditingProduct(null)}
                    className="px-4 py-2 bg-[#1F2F26] hover:bg-[#3A5243] text-[#F3EDE1]/75 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#C2A36C] hover:bg-[#b0915a] text-[#263D30] font-bold rounded-xl shadow-md cursor-pointer"
                  >
                    Save Changes Live
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 3: INSPECT & MANAGE ORDER MODAL */}
        {inspectingOrder && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[#263D30] border-2 border-[#C2A36C]/60 rounded-3xl max-w-lg w-full p-6 sm:p-8 text-white shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-[#3A5243]">
                <div>
                  <h3 className="font-serif text-lg font-bold text-[#FAF6EE] flex items-center gap-2">
                    <Truck className="w-5 h-5 text-[#C2A36C]" />
                    <span>Manage Dispatch: {inspectingOrder.orderNumber}</span>
                  </h3>
                  <p className="text-[11px] text-[#F3EDE1]/70">{inspectingOrder.customerName} · {inspectingOrder.customerPhone}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setInspectingOrder(null)}
                  className="p-1 text-[#F3EDE1]/60 hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Order Items Preview */}
              <div className="p-3 bg-[#1F2F26] rounded-xl border border-[#3A5243] text-xs space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-[#C2A36C] block">Provisions Snapshot:</span>
                {inspectingOrder.items.map(i => (
                  <div key={i.id} className="flex justify-between text-[#F3EDE1]/85">
                    <span>{i.productNameSnapshot} ({i.sizeSnapshot}) × {i.quantity}</span>
                    <span className="font-mono font-bold text-white">{formatPaise(i.totalPaise)}</span>
                  </div>
                ))}
                <div className="pt-2 border-t border-[#3A5243] flex justify-between font-bold text-sm">
                  <span>Total Due:</span>
                  <span className="text-[#C2A36C] font-mono">{formatPaise(inspectingOrder.totalPaise)}</span>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-[#F3EDE1]/80 mb-1">Cold-Chain Status</label>
                  <select
                    value={inspectingOrder.status}
                    onChange={(e) => {
                      const newStatus = e.target.value as any;
                      updateOrderStatus(inspectingOrder.id, newStatus);
                      setInspectingOrder({ ...inspectingOrder, status: newStatus });
                    }}
                    className="w-full px-3 py-2 bg-[#1F2F26] border border-[#3A5243] rounded-xl text-white font-semibold outline-none focus:border-[#C2A36C]"
                  >
                    <option value="confirmed">Confirmed</option>
                    <option value="processing">Processing (Milking & Bottling)</option>
                    <option value="dispatched">Out for Delivery (Cold Van)</option>
                    <option value="delivered">Delivered to Doorstep</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#F3EDE1]/80 mb-1">Cold Tracking ID</label>
                    <input
                      type="text"
                      value={orderTrackingNum}
                      onChange={(e) => setOrderTrackingNum(e.target.value)}
                      placeholder="e.g. DS-COLD-SEONI-101"
                      className="w-full px-3 py-2 bg-[#1F2F26] border border-[#3A5243] rounded-xl text-white font-mono outline-none focus:border-[#C2A36C]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#F3EDE1]/80 mb-1">Assigned Vehicle / Van</label>
                    <input
                      type="text"
                      value={orderVehicleVan}
                      onChange={(e) => setOrderVehicleVan(e.target.value)}
                      className="w-full px-3 py-2 bg-[#1F2F26] border border-[#3A5243] rounded-xl text-white outline-none focus:border-[#C2A36C]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#F3EDE1]/80 mb-1">Delivery Slot</label>
                  <input
                    type="text"
                    value={orderDeliverySlot}
                    onChange={(e) => setOrderDeliverySlot(e.target.value)}
                    className="w-full px-3 py-2 bg-[#1F2F26] border border-[#3A5243] rounded-xl text-white outline-none focus:border-[#C2A36C]"
                  />
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-[#3A5243]">
                  <a
                    href={`https://wa.me/${inspectingOrder.customerPhone.replace(/[^0-9]/g, '')}?text=Namaste%20${encodeURIComponent(inspectingOrder.customerName)}%2C%20your%20DUGDHSAR%20dairy%20order%20(${inspectingOrder.orderNumber})%20is%20${inspectingOrder.status === 'dispatched' ? 'out%20for%20cold-chain%20delivery%20in%20insulated%20van' : 'confirmed%20for%20morning%20dawn%20delivery'}.%20Tracking%3A%20${encodeURIComponent(orderTrackingNum)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto px-4 py-2 bg-emerald-950 hover:bg-emerald-900 border border-emerald-600 text-emerald-300 font-bold rounded-xl text-center"
                  >
                    Open WhatsApp Chat
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      updateOrder(inspectingOrder.id, {
                        trackingNumber: orderTrackingNum,
                        deliverySlot: orderDeliverySlot,
                        notes: `Assigned to ${orderVehicleVan}`
                      });
                      setInspectingOrder(null);
                    }}
                    className="w-full sm:w-auto px-5 py-2 bg-[#C2A36C] hover:bg-[#b0915a] text-[#263D30] font-bold rounded-xl shadow-md cursor-pointer"
                  >
                    Save Dispatch Record
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 4: ADD DELIVERY ZONE MODAL */}
        {isAddZoneOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[#263D30] border-2 border-[#C2A36C]/60 rounded-3xl max-w-md w-full p-6 sm:p-8 text-white shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#3A5243]">
                <div>
                  <h3 className="font-serif text-lg font-bold text-[#FAF6EE] flex items-center gap-2">
                    <Truck className="w-5 h-5 text-[#C2A36C]" />
                    <span>Add Serviceable Pincode</span>
                  </h3>
                  <p className="text-[11px] text-[#F3EDE1]/70">Expand cold-chain corridor in Seoni</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddZoneOpen(false)}
                  className="p-1 text-[#F3EDE1]/60 hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newZoneForm.pincode.trim() || !newZoneForm.zoneName.trim()) return;
                  addNewDeliveryZone({
                    zoneName: newZoneForm.zoneName.trim(),
                    city: newZoneForm.city.trim(),
                    pincode: newZoneForm.pincode.trim(),
                    minOrderPaise: Math.round(Number(newZoneForm.minOrderRupees) * 100),
                    deliveryFeePaise: Math.round(Number(newZoneForm.deliveryFeeRupees) * 100),
                    estimatedHours: Number(newZoneForm.estimatedHours) || 2,
                    isActive: true
                  });
                  setIsAddZoneOpen(false);
                  setNewZoneForm({
                    zoneName: '',
                    city: 'Seoni',
                    pincode: '',
                    minOrderRupees: 200,
                    deliveryFeeRupees: 40,
                    estimatedHours: 2
                  });
                }}
                className="space-y-3 text-xs"
              >
                <div>
                  <label className="block text-[11px] font-semibold text-[#F3EDE1]/80 mb-1">Zone / Locality Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Barghat Road & Sanjay Vihar"
                    value={newZoneForm.zoneName}
                    onChange={(e) => setNewZoneForm({ ...newZoneForm, zoneName: e.target.value })}
                    className="w-full px-3 py-2 bg-[#1F2F26] border border-[#3A5243] rounded-xl text-white outline-none focus:border-[#C2A36C]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#F3EDE1]/80 mb-1">City</label>
                    <input
                      type="text"
                      required
                      value={newZoneForm.city}
                      onChange={(e) => setNewZoneForm({ ...newZoneForm, city: e.target.value })}
                      className="w-full px-3 py-2 bg-[#1F2F26] border border-[#3A5243] rounded-xl text-white outline-none focus:border-[#C2A36C]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#F3EDE1]/80 mb-1">6-Digit Pincode *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 480661"
                      value={newZoneForm.pincode}
                      onChange={(e) => setNewZoneForm({ ...newZoneForm, pincode: e.target.value })}
                      className="w-full px-3 py-2 bg-[#1F2F26] border border-[#3A5243] rounded-xl text-white font-mono outline-none focus:border-[#C2A36C]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#F3EDE1]/80 mb-1">Min Order for Free (₹)</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={newZoneForm.minOrderRupees}
                      onChange={(e) => setNewZoneForm({ ...newZoneForm, minOrderRupees: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-[#1F2F26] border border-[#3A5243] rounded-xl text-white font-mono outline-none focus:border-[#C2A36C]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#F3EDE1]/80 mb-1">Standard Delivery Fee (₹)</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={newZoneForm.deliveryFeeRupees}
                      onChange={(e) => setNewZoneForm({ ...newZoneForm, deliveryFeeRupees: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-[#1F2F26] border border-[#3A5243] rounded-xl text-white font-mono outline-none focus:border-[#C2A36C]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#3A5243]">
                  <button
                    type="button"
                    onClick={() => setIsAddZoneOpen(false)}
                    className="px-4 py-2 bg-[#1F2F26] hover:bg-[#3A5243] text-[#F3EDE1]/75 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#C2A36C] hover:bg-[#b0915a] text-[#263D30] font-bold rounded-xl shadow-md cursor-pointer"
                  >
                    Add Delivery Zone
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: EDIT SUBSCRIPTION MODAL (ADMIN & MANAGER) */}
        {editingSub && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[#263D30] border-2 border-[#C2A36C]/60 rounded-3xl max-w-lg w-full p-6 sm:p-8 text-white shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-[#3A5243]">
                <div>
                  <h3 className="font-serif text-lg font-bold text-[#FAF6EE] flex items-center gap-2">
                    <RefreshCw className="w-5 h-5 text-[#C2A36C]" />
                    <span>Edit Subscription #{editingSub.id}</span>
                  </h3>
                  <p className="text-[11px] text-[#F3EDE1]/70">Admin & Manager Control: Update patron bottles, schedule, or route address</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingSub(null)}
                  className="p-1 text-[#F3EDE1]/60 hover:text-white cursor-pointer"
                >
                  ✕
                </button>
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
                    status: editSubForm.status as 'active' | 'paused' | 'cancelled'
                  });
                  setEditingSub(null);
                }}
                className="space-y-3.5 text-xs"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#F3EDE1]/80 mb-1">Patron Full Name *</label>
                    <input
                      type="text"
                      required
                      value={editSubForm.customerName}
                      onChange={(e) => setEditSubForm({ ...editSubForm, customerName: e.target.value })}
                      className="w-full px-3 py-2 bg-[#1F2F26] border border-[#3A5243] rounded-xl text-white outline-none focus:border-[#C2A36C]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#F3EDE1]/80 mb-1">Mobile / WhatsApp *</label>
                    <input
                      type="text"
                      required
                      value={editSubForm.customerPhone}
                      onChange={(e) => setEditSubForm({ ...editSubForm, customerPhone: e.target.value })}
                      className="w-full px-3 py-2 bg-[#1F2F26] border border-[#3A5243] rounded-xl text-white font-mono outline-none focus:border-[#C2A36C]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#F3EDE1]/80 mb-1">Customer Email</label>
                  <input
                    type="email"
                    value={editSubForm.customerEmail}
                    onChange={(e) => setEditSubForm({ ...editSubForm, customerEmail: e.target.value })}
                    className="w-full px-3 py-2 bg-[#1F2F26] border border-[#3A5243] rounded-xl text-white outline-none focus:border-[#C2A36C]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#F3EDE1]/80 mb-1">Dairy Product *</label>
                    <select
                      value={editSubForm.productName}
                      onChange={(e) => setEditSubForm({ ...editSubForm, productName: e.target.value })}
                      className="w-full px-3 py-2 bg-[#1F2F26] border border-[#3A5243] rounded-xl text-white outline-none focus:border-[#C2A36C]"
                    >
                      <option value="DUGDHSAR Fresh A2 Desi Cow Whole Milk">Fresh A2 Whole Milk</option>
                      <option value="DUGDHSAR Fresh A2 Light Skimmed Milk">Fresh A2 Light Milk</option>
                      <option value="DUGDHSAR Vedic Traditional Bilona Cow Ghee">Vedic Bilona Ghee</option>
                      <option value="DUGDHSAR Fresh A2 Malai Cottage Cheese (Paneer)">Fresh Malai Paneer</option>
                      <option value="DUGDHSAR Clay-Pot Natural Vedic Dahi (Curd)">Clay-Pot Vedic Dahi</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#F3EDE1]/80 mb-1">Daily Bottle Quantity *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={20}
                      value={editSubForm.quantity}
                      onChange={(e) => setEditSubForm({ ...editSubForm, quantity: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-[#1F2F26] border border-[#3A5243] rounded-xl text-white font-mono outline-none focus:border-[#C2A36C]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#F3EDE1]/80 mb-1">Schedule Frequency</label>
                    <select
                      value={editSubForm.frequency}
                      onChange={(e) => setEditSubForm({ ...editSubForm, frequency: e.target.value as any })}
                      className="w-full px-3 py-2 bg-[#1F2F26] border border-[#3A5243] rounded-xl text-white outline-none focus:border-[#C2A36C]"
                    >
                      <option value="daily">Daily Morning Drop</option>
                      <option value="alternate">Alternate Days</option>
                      <option value="weekdays">Weekdays (Mon – Fri)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#F3EDE1]/80 mb-1">Delivery Slot</label>
                    <select
                      value={editSubForm.deliverySlot}
                      onChange={(e) => setEditSubForm({ ...editSubForm, deliverySlot: e.target.value })}
                      className="w-full px-3 py-2 bg-[#1F2F26] border border-[#3A5243] rounded-xl text-white outline-none focus:border-[#C2A36C]"
                    >
                      <option value="5:00 AM - 10:00 AM">Morning Dawn (5:00 AM – 10:00 AM)</option>
                      <option value="6:00 PM - 10:00 PM">Evening Drop (6:00 PM – 10:00 PM)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#F3EDE1]/80 mb-1">Subscription Status *</label>
                  <select
                    value={editSubForm.status}
                    onChange={(e) => setEditSubForm({ ...editSubForm, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-[#1F2F26] border border-[#3A5243] rounded-xl text-white outline-none focus:border-[#C2A36C]"
                  >
                    <option value="active">Active (Deliver Daily)</option>
                    <option value="paused">Paused (Temporarily On Hold)</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#F3EDE1]/80 mb-1">Complete Doorstep Address in Seoni *</label>
                  <textarea
                    rows={2}
                    required
                    value={editSubForm.deliveryAddress}
                    onChange={(e) => setEditSubForm({ ...editSubForm, deliveryAddress: e.target.value })}
                    className="w-full px-3 py-2 bg-[#1F2F26] border border-[#3A5243] rounded-xl text-white outline-none focus:border-[#C2A36C]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#F3EDE1]/80 mb-1">Drop Notes / Delivery Remarks</label>
                  <input
                    type="text"
                    value={editSubForm.notes}
                    onChange={(e) => setEditSubForm({ ...editSubForm, notes: e.target.value })}
                    placeholder="e.g. Leave in insulated door bag / ring bell"
                    className="w-full px-3 py-2 bg-[#1F2F26] border border-[#3A5243] rounded-xl text-white outline-none focus:border-[#C2A36C]"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#3A5243]">
                  <button
                    type="button"
                    onClick={() => setEditingSub(null)}
                    className="px-4 py-2 bg-[#1F2F26] hover:bg-[#3A5243] text-[#F3EDE1]/75 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#C2A36C] hover:bg-[#b0915a] text-[#263D30] font-bold rounded-xl shadow-md cursor-pointer"
                  >
                    Save Subscription & Sync
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: ADD MANUAL SUBSCRIPTION (ADMIN & MANAGER) */}
        {isAddSubOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[#263D30] border-2 border-[#C2A36C]/60 rounded-3xl max-w-lg w-full p-6 sm:p-8 text-white shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-[#3A5243]">
                <div>
                  <h3 className="font-serif text-lg font-bold text-[#FAF6EE] flex items-center gap-2">
                    <Plus className="w-5 h-5 text-[#C2A36C]" />
                    <span>Create Manual Subscription</span>
                  </h3>
                  <p className="text-[11px] text-[#F3EDE1]/70">Add a patron directly to cold-chain delivery routes & sync to Google Sheets</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddSubOpen(false)}
                  className="p-1 text-[#F3EDE1]/60 hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  addSubscription({
                    customerName: newSubAdminForm.customerName,
                    customerPhone: newSubAdminForm.customerPhone,
                    customerEmail: newSubAdminForm.customerEmail,
                    productName: newSubAdminForm.productName,
                    variant: newSubAdminForm.variant,
                    quantity: Number(newSubAdminForm.quantity),
                    frequency: newSubAdminForm.frequency,
                    deliverySlot: newSubAdminForm.deliverySlot,
                    deliveryAddress: newSubAdminForm.deliveryAddress,
                    notes: newSubAdminForm.notes,
                    startDate: new Date().toISOString().split('T')[0],
                    status: 'active',
                    nextDelivery: `Tomorrow, ${newSubAdminForm.deliverySlot}`
                  });
                  setIsAddSubOpen(false);
                  setNewSubAdminForm({
                    customerName: '',
                    customerPhone: '',
                    customerEmail: '',
                    productName: 'DUGDHSAR Fresh A2 Desi Cow Whole Milk',
                    variant: '1 Litre Glass Bottle',
                    quantity: 1,
                    frequency: 'daily',
                    deliverySlot: '5:00 AM - 10:00 AM',
                    deliveryAddress: 'Sufi Nagar, Barghat Road, Seoni, MP 480661',
                    notes: 'Morning dawn drop in sterilized glass bottle'
                  });
                }}
                className="space-y-3.5 text-xs"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#F3EDE1]/80 mb-1">Patron Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Chandra Verma"
                      value={newSubAdminForm.customerName}
                      onChange={(e) => setNewSubAdminForm({ ...newSubAdminForm, customerName: e.target.value })}
                      className="w-full px-3 py-2 bg-[#1F2F26] border border-[#3A5243] rounded-xl text-white outline-none focus:border-[#C2A36C]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#F3EDE1]/80 mb-1">Mobile / WhatsApp *</label>
                    <input
                      type="text"
                      required
                      placeholder="+91 98765 43210"
                      value={newSubAdminForm.customerPhone}
                      onChange={(e) => setNewSubAdminForm({ ...newSubAdminForm, customerPhone: e.target.value })}
                      className="w-full px-3 py-2 bg-[#1F2F26] border border-[#3A5243] rounded-xl text-white font-mono outline-none focus:border-[#C2A36C]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#F3EDE1]/80 mb-1">Customer Email (Optional)</label>
                  <input
                    type="email"
                    placeholder="patron@gmail.com"
                    value={newSubAdminForm.customerEmail}
                    onChange={(e) => setNewSubAdminForm({ ...newSubAdminForm, customerEmail: e.target.value })}
                    className="w-full px-3 py-2 bg-[#1F2F26] border border-[#3A5243] rounded-xl text-white outline-none focus:border-[#C2A36C]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#F3EDE1]/80 mb-1">Dairy Product *</label>
                    <select
                      value={newSubAdminForm.productName}
                      onChange={(e) => setNewSubAdminForm({ ...newSubAdminForm, productName: e.target.value })}
                      className="w-full px-3 py-2 bg-[#1F2F26] border border-[#3A5243] rounded-xl text-white outline-none focus:border-[#C2A36C]"
                    >
                      <option value="DUGDHSAR Fresh A2 Desi Cow Whole Milk">Fresh A2 Whole Milk</option>
                      <option value="DUGDHSAR Fresh A2 Light Skimmed Milk">Fresh A2 Light Milk</option>
                      <option value="DUGDHSAR Vedic Traditional Bilona Cow Ghee">Vedic Bilona Ghee</option>
                      <option value="DUGDHSAR Fresh A2 Malai Cottage Cheese (Paneer)">Fresh Malai Paneer</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#F3EDE1]/80 mb-1">Daily Bottle Quantity *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={20}
                      value={newSubAdminForm.quantity}
                      onChange={(e) => setNewSubAdminForm({ ...newSubAdminForm, quantity: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-[#1F2F26] border border-[#3A5243] rounded-xl text-white font-mono outline-none focus:border-[#C2A36C]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#F3EDE1]/80 mb-1">Schedule Frequency</label>
                    <select
                      value={newSubAdminForm.frequency}
                      onChange={(e) => setNewSubAdminForm({ ...newSubAdminForm, frequency: e.target.value as any })}
                      className="w-full px-3 py-2 bg-[#1F2F26] border border-[#3A5243] rounded-xl text-white outline-none focus:border-[#C2A36C]"
                    >
                      <option value="daily">Daily Morning Drop</option>
                      <option value="alternate">Alternate Days</option>
                      <option value="weekdays">Weekdays (Mon – Fri)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#F3EDE1]/80 mb-1">Delivery Slot</label>
                    <select
                      value={newSubAdminForm.deliverySlot}
                      onChange={(e) => setNewSubAdminForm({ ...newSubAdminForm, deliverySlot: e.target.value })}
                      className="w-full px-3 py-2 bg-[#1F2F26] border border-[#3A5243] rounded-xl text-white outline-none focus:border-[#C2A36C]"
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
                    value={newSubAdminForm.deliveryAddress}
                    onChange={(e) => setNewSubAdminForm({ ...newSubAdminForm, deliveryAddress: e.target.value })}
                    className="w-full px-3 py-2 bg-[#1F2F26] border border-[#3A5243] rounded-xl text-white outline-none focus:border-[#C2A36C]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#F3EDE1]/80 mb-1">Drop Notes</label>
                  <input
                    type="text"
                    value={newSubAdminForm.notes}
                    onChange={(e) => setNewSubAdminForm({ ...newSubAdminForm, notes: e.target.value })}
                    className="w-full px-3 py-2 bg-[#1F2F26] border border-[#3A5243] rounded-xl text-white outline-none focus:border-[#C2A36C]"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#3A5243]">
                  <button
                    type="button"
                    onClick={() => setIsAddSubOpen(false)}
                    className="px-4 py-2 bg-[#1F2F26] hover:bg-[#3A5243] text-[#F3EDE1]/75 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#C2A36C] hover:bg-[#b0915a] text-[#263D30] font-bold rounded-xl shadow-md cursor-pointer"
                  >
                    Create & Sync to Sheet
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
