import { 
  Category, 
  Product, 
  DeliveryZone, 
  DeliverySlot, 
  Coupon, 
  Review, 
  JournalPost, 
  BatchPurityData,
  Address,
  Profile,
  InventoryBatch,
  ServiceablePincode,
  AdminUser
} from '../types';

// =========================================================================
// 1. THE 6 APPROVED DUGDHSAR PRODUCT CATEGORIES
// =========================================================================
export const INITIAL_CATEGORIES: Category[] = [
  {
    id: 'cat-milk',
    name: 'Vedic A2 Milk',
    slug: 'milk',
    hindiName: 'शुद्ध देशी गौ दुग्ध',
    description: 'Farm-fresh raw & gentle low-temp vat-pasteurized A2 milk from free-grazing indigenous Gir cows, delivered chilled in glass bottles.',
    displayOrder: 1,
    imageUrl: '/assets/aistudio/image_fe6cbcdf.png'
  },
  {
    id: 'cat-ghee',
    name: 'Vedic Bilona Ghee',
    slug: 'ghee',
    hindiName: 'पारंपरिक बिलोना घृत',
    description: 'Curd-churned golden danedar ghee simmered over slow cow-dung fire following ancient 5-stage Vedic Vidhi.',
    displayOrder: 2,
    imageUrl: '/assets/aistudio/1000095624-clean_337007be.png'
  },
  {
    id: 'cat-paneer',
    name: 'Artisanal A2 Paneer',
    slug: 'paneer',
    hindiName: 'शुद्ध मलाई पनीर',
    description: 'Soft, melt-in-mouth cottage cheese crafted at dawn from morning whole A2 Gir milk using natural lemon whey curdling.',
    displayOrder: 3,
    imageUrl: '/assets/aistudio/1000095664-clean_2425f7fb.png'
  },
  {
    id: 'cat-curd',
    name: 'Vedic Clay-Pot Curd',
    slug: 'curd',
    hindiName: 'पारंपरिक मटका दही',
    description: 'Thick, probiotic-rich curd set slowly in unglazed earthen clay pots using heirloom indigenous lactobacillus culture.',
    displayOrder: 4,
    imageUrl: '/assets/aistudio/1000095624-clean_337007be.png'
  },
  {
    id: 'cat-butter',
    name: 'Cultured A2 White Makhan',
    slug: 'butter',
    hindiName: 'ताज़ा सफेद मक्खन',
    description: 'Hand-churned unsalted white butter extracted from cultured morning malai. Unsalted, delicate, and cooling.',
    displayOrder: 5,
    imageUrl: '/assets/aistudio/1000095664-clean_2425f7fb.png'
  },
  {
    id: 'cat-khoya-mawa',
    name: 'Vedic A2 Khoya & Mawa',
    slug: 'khoya-mawa',
    hindiName: 'शुद्ध देशी गौ खोया मावा',
    description: 'Traditional slow-reduced whole A2 milk solids prepared in heavy iron kadhais without starch, palm oil, or detergents.',
    displayOrder: 6,
    imageUrl: '/assets/aistudio/1000095665-clean_9f8d49b7.png'
  }
];

// =========================================================================
// 2. PRODUCTS ACROSS THE 6 CATEGORIES
// =========================================================================
export const INITIAL_PRODUCTS: Product[] = [
  // 1. MILK
  {
    id: 'dug-whole-milk',
    name: 'DUGDHSAR Fresh A2 Desi Cow Whole Milk',
    hindiName: 'शुद्ध देशी गौ दुग्ध',
    slug: 'a2-desi-cow-whole-milk',
    categoryId: 'cat-milk',
    categorySlug: 'milk',
    badge: 'Morning Milking Best Seller',
    rating: 4.95,
    reviewsCount: 384,
    description: 'Farm-fresh unpasteurized or gently low-temp vat-pasteurized A2 milk from indigenous Gir cows. Bottled raw and pure in sterile recyclable glass bottles within 3 hours of milking.',
    heritageStory: 'Produced exclusively from free-grazing Vedic Gir cows that roam freely on lush pastures and graze on natural clover, herbs, and organic greens.',
    ingredients: ['100% Pure Indigenous Gir Cow Fresh A2 Whole Milk'],
    shelfLife: '3 Days under continuous 2°C - 4°C refrigeration',
    storageInstructions: 'Keep refrigerated between 2°C and 4°C. Boil within 24 hours of delivery.',
    allergens: ['Contains Dairy (Lactose naturally occurring, A2 Beta-Casein)'],
    purityScore: 488,
    isSubscriptionEligible: true,
    isPublished: true,
    featured: true,
    createdAt: '2026-01-15T06:00:00Z',
    images: [
      { id: 'img-wm-1', productId: 'dug-whole-milk', imageUrl: '/assets/aistudio/image_fe6cbcdf.png', altText: 'A2 Whole Milk in Glass Bottle', sortOrder: 1 },
      { id: 'img-wm-2', productId: 'dug-whole-milk', imageUrl: '/assets/aistudio/1000095624-clean_337007be.png', altText: 'Dugdhsar Gir Cow Seal', sortOrder: 2 }
    ],
    variants: [
      { id: 'wm-1l', productId: 'dug-whole-milk', sku: 'DUG-MILK-1L', sizeLabel: '1 Litre Glass Bottle', pricePaise: 17000, compareAtPricePaise: 19000, inStock: true, stockCount: 150, isSubscriptionEligible: true },
      { id: 'wm-500ml', productId: 'dug-whole-milk', sku: 'DUG-MILK-500M', sizeLabel: '500 ml Glass Bottle', pricePaise: 9500, compareAtPricePaise: 10500, inStock: true, stockCount: 90, isSubscriptionEligible: true },
      { id: 'wm-combo-2l', productId: 'dug-whole-milk', sku: 'DUG-MILK-2L-PK', sizeLabel: 'Family Pack (2 x 1L Bottles)', pricePaise: 33000, compareAtPricePaise: 38000, inStock: true, stockCount: 60, isSubscriptionEligible: true },
    ],
    nutritionalHighlights: [
      { label: 'A2 Beta-Casein', value: '100% Certified' },
      { label: 'Natural Fat', value: '4.8% Pure Cream' },
      { label: 'SNF (Solids)', value: '9.2%' },
      { label: 'Processing', value: 'Gentle Low-Temp Vat (63°C)' },
    ]
  },
  {
    id: 'dug-skimmed-milk',
    name: 'DUGDHSAR Fresh A2 Light Skimmed Milk',
    hindiName: 'देशी गौ टोंड दुग्ध',
    slug: 'a2-light-skimmed-milk',
    categoryId: 'cat-milk',
    categorySlug: 'milk',
    badge: 'Low Calorie & Heart Friendly',
    rating: 4.82,
    reviewsCount: 192,
    description: 'Light, crisp, and easily digestible A2 milk with natural fats gently separated through physical centrifugal spin without any chemical thickeners.',
    heritageStory: 'Ideal for weight management, morning tea, latte art, and individuals seeking low-fat dairy.',
    ingredients: ['Pasteurized Gir Cow Skimmed A2 Milk'],
    shelfLife: '3 Days under 2°C - 4°C refrigeration',
    storageInstructions: 'Refrigerate immediately upon delivery. Consume chilled or boiled.',
    allergens: ['Contains Dairy (A2 Milk Protein)'],
    purityScore: 492,
    isSubscriptionEligible: true,
    isPublished: true,
    featured: false,
    createdAt: '2026-01-20T06:00:00Z',
    images: [
      { id: 'img-sm-1', productId: 'dug-skimmed-milk', imageUrl: '/assets/aistudio/image_fe6cbcdf.png', altText: 'A2 Skimmed Milk', sortOrder: 1 }
    ],
    variants: [
      { id: 'sm-1l', productId: 'dug-skimmed-milk', sku: 'DUG-SKIM-1L', sizeLabel: '1 Litre Glass Bottle', pricePaise: 11000, compareAtPricePaise: 12500, inStock: true, stockCount: 85, isSubscriptionEligible: true },
      { id: 'sm-500ml', productId: 'dug-skimmed-milk', sku: 'DUG-SKIM-500M', sizeLabel: '500 ml Glass Bottle', pricePaise: 6500, compareAtPricePaise: 7500, inStock: true, stockCount: 50, isSubscriptionEligible: true },
    ],
    nutritionalHighlights: [
      { label: 'Natural Fat', value: '1.5% Low-Fat' },
      { label: 'Protein', value: '3.6g / 100ml' },
      { label: 'Calcium', value: '135mg / 100ml' },
      { label: 'Additives', value: '0.00% Zero' },
    ]
  },

  // 2. GHEE
  {
    id: 'dug-bilona-ghee',
    name: 'DUGDHSAR Vedic Traditional Bilona Cow Ghee',
    hindiName: 'वैदिक बिलोना देशी गौ घृत',
    slug: 'vedic-bilona-cow-ghee',
    categoryId: 'cat-ghee',
    categorySlug: 'ghee',
    badge: 'Curd-Churned Vedic Bilona',
    rating: 5.0,
    reviewsCount: 512,
    description: 'Handcrafted following ancient 5-stage Vedic Vidhi: whole A2 milk boiled on slow dung-cake fire, set into curd, hand-churned in wooden bilona to yield Makhan, then simmered into golden granular aromatic ghee.',
    heritageStory: 'Rich in golden beta-carotene from indigenous Gir cow grass feeding, possessing that distinctive nostalgic nutty aroma and granular danedar texture.',
    ingredients: ['100% Clarified Butterfat from Vedic Gir Cow Cultured Curd'],
    shelfLife: '12 Months at room temperature in airtight glass jar',
    storageInstructions: 'Store in a cool, dry place away from direct sunlight. Do not introduce wet spoons.',
    allergens: ['Dairy Derivative (Clarified Simmered Butterfat)'],
    purityScore: 497,
    isSubscriptionEligible: false,
    isPublished: true,
    featured: true,
    createdAt: '2026-01-10T06:00:00Z',
    images: [
      { id: 'img-bg-1', productId: 'dug-bilona-ghee', imageUrl: '/assets/aistudio/1000095624-clean_337007be.png', altText: 'Vedic Bilona Ghee Jar', sortOrder: 1 },
      { id: 'img-bg-2', productId: 'dug-bilona-ghee', imageUrl: '/assets/aistudio/1000095662-clean_7d12ecae.png', altText: 'Hand Churned Makhan Ghee', sortOrder: 2 }
    ],
    variants: [
      { id: 'bg-500ml', productId: 'dug-bilona-ghee', sku: 'DUG-GHEE-500M', sizeLabel: '500 ml Heritage Glass Jar', pricePaise: 119900, compareAtPricePaise: 135000, inStock: true, stockCount: 120, isSubscriptionEligible: false },
      { id: 'bg-1l', productId: 'dug-bilona-ghee', sku: 'DUG-GHEE-1L', sizeLabel: '1 Litre Heritage Glass Jar', pricePaise: 239800, compareAtPricePaise: 270000, inStock: true, stockCount: 80, isSubscriptionEligible: false },
      { id: 'bg-combo-2l', productId: 'dug-bilona-ghee', sku: 'DUG-GHEE-2L-PK', sizeLabel: 'Grand Pack (2 x 1L Jars)', pricePaise: 460000, compareAtPricePaise: 540000, inStock: true, stockCount: 30, isSubscriptionEligible: false },
    ],
    nutritionalHighlights: [
      { label: 'Method', value: 'Wooden Hand Bilona' },
      { label: 'Smoke Point', value: '250°C High Stability' },
      { label: 'Butyric Acid', value: 'Natural Gut Soother' },
      { label: 'Fat Quality', value: 'Unadulterated Golden Granular' },
    ]
  },

  // 3. PANEER
  {
    id: 'dug-malai-paneer',
    name: 'DUGDHSAR Fresh A2 Malai Cottage Cheese (Paneer)',
    hindiName: 'शुद्ध देशी मलाई पनीर',
    slug: 'a2-malai-cottage-cheese-paneer',
    categoryId: 'cat-paneer',
    categorySlug: 'paneer',
    badge: 'Soft & Melt-In-Mouth',
    rating: 4.92,
    reviewsCount: 278,
    description: 'Ultra-soft, velvety fresh paneer made by naturally curdling morning Gir cow milk with pure lemon extract and whey. Squeezed gently in clean muslin cloth without starch or additives.',
    heritageStory: 'Prepared in limited small batches every dawn. Absorbs curries beautifully while remaining intact and pillowy soft to bite.',
    ingredients: ['Fresh Gir Cow Whole A2 Milk', 'Natural Lemon Juice & Whey'],
    shelfLife: '4 Days under 2°C - 4°C refrigeration in brine water',
    storageInstructions: 'Immerse in clean cold water inside an airtight container in refrigerator. Change water daily.',
    allergens: ['Contains Dairy (Milk Solids)'],
    purityScore: 494,
    isSubscriptionEligible: true,
    isPublished: true,
    featured: true,
    createdAt: '2026-01-18T06:00:00Z',
    images: [
      { id: 'img-pan-1', productId: 'dug-malai-paneer', imageUrl: '/assets/aistudio/1000095664-clean_2425f7fb.png', altText: 'Fresh A2 Malai Paneer Cubes', sortOrder: 1 }
    ],
    variants: [
      { id: 'mp-250g', productId: 'dug-malai-paneer', sku: 'DUG-PAN-250G', sizeLabel: '250 grams Vacuum Pouch', pricePaise: 16000, compareAtPricePaise: 18000, inStock: true, stockCount: 110, isSubscriptionEligible: true },
      { id: 'mp-500g', productId: 'dug-malai-paneer', sku: 'DUG-PAN-500G', sizeLabel: '500 grams Vacuum Pouch', pricePaise: 31000, compareAtPricePaise: 35000, inStock: true, stockCount: 75, isSubscriptionEligible: true },
      { id: 'mp-1kg', productId: 'dug-malai-paneer', sku: 'DUG-PAN-1KG', sizeLabel: '1 Kilogram Master Block', pricePaise: 60000, compareAtPricePaise: 70000, inStock: true, stockCount: 40, isSubscriptionEligible: true },
    ],
    nutritionalHighlights: [
      { label: 'Protein Content', value: '20g / 100g' },
      { label: 'Moisture', value: 'Soft & High Retention' },
      { label: 'Starch/Detergent', value: '0.00% Zero (Completely Pure)' },
      { label: 'Texture', value: 'Creamy Velvety Crumb' },
    ]
  },

  // 4. CURD
  {
    id: 'dug-probiotic-curd',
    name: 'DUGDHSAR Clay-Pot Natural Vedic Dahi (Curd)',
    hindiName: 'पारंपरिक मटका दही',
    slug: 'clay-pot-natural-vedic-dahi-curd',
    categoryId: 'cat-curd',
    categorySlug: 'curd',
    badge: 'Traditional Clay Matka Set',
    rating: 4.94,
    reviewsCount: 310,
    description: 'Thick, luscious dahi set slowly in unglazed terracotta clay pots that naturally breathe and absorb excess whey. Cultured using heirloom indigenous starter curd rich in live lactobacillus strains.',
    heritageStory: 'Earthen pot setting imparts a gentle earthy fragrance and allows beneficial gut probiotics to flourish without refrigeration shock.',
    ingredients: ['Whole Gir Cow A2 Milk', 'Live Probiotic Heirloom Starter Culture'],
    shelfLife: '5 Days under 4°C refrigeration',
    storageInstructions: 'Refrigerate immediately. Scoop with clean dry spoon.',
    allergens: ['Contains Dairy (Fermented Milk Culture)'],
    purityScore: 496,
    isSubscriptionEligible: true,
    isPublished: true,
    featured: false,
    createdAt: '2026-01-22T06:00:00Z',
    images: [
      { id: 'img-curd-1', productId: 'dug-probiotic-curd', imageUrl: '/assets/aistudio/1000095624-clean_337007be.png', altText: 'Terracotta Pot Set A2 Curd', sortOrder: 1 }
    ],
    variants: [
      { id: 'cd-500g', productId: 'dug-probiotic-curd', sku: 'DUG-CURD-500G', sizeLabel: '500g Terracotta Clay Pot', pricePaise: 11000, compareAtPricePaise: 12500, inStock: true, stockCount: 95, isSubscriptionEligible: true },
      { id: 'cd-1kg', productId: 'dug-probiotic-curd', sku: 'DUG-CURD-1KG', sizeLabel: '1 Kilogram Master Clay Pot', pricePaise: 21000, compareAtPricePaise: 24000, inStock: true, stockCount: 60, isSubscriptionEligible: true },
    ],
    nutritionalHighlights: [
      { label: 'Live Probiotics', value: '> 10^8 CFU / gram' },
      { label: 'Acidity', value: 'Mild & Sweetly Tart' },
      { label: 'Vessel', value: 'Lead-Free Unglazed Clay' },
      { label: 'Lactose Level', value: 'Naturally Reduced by Culture' },
    ]
  },

  // 5. BUTTER
  {
    id: 'dug-white-butter',
    name: 'DUGDHSAR Vedic Cultured White Butter (Makhan)',
    hindiName: 'ताज़ा सफेद मक्खन',
    slug: 'vedic-cultured-white-butter-makhan',
    categoryId: 'cat-butter',
    categorySlug: 'butter',
    badge: 'Hand-Churned Makhan',
    rating: 4.88,
    reviewsCount: 165,
    description: 'Fresh unsalted white butter churned gently every morning from cultured A2 malai. Creamy, cooling, and packed with delicate natural pasture aroma.',
    heritageStory: 'The legendary treat celebrated in Braj literature. Perfect with piping hot stuffed parathas or sarson ka saag.',
    ingredients: ['Cultured Desi Gir Cow Milk Cream (Makhan)'],
    shelfLife: '10 Days refrigerated, 30 days frozen',
    storageInstructions: 'Keep refrigerated below 4°C in sealed butter crock.',
    allergens: ['Contains Dairy'],
    purityScore: 493,
    isSubscriptionEligible: true,
    isPublished: true,
    featured: true,
    createdAt: '2026-01-25T06:00:00Z',
    images: [
      { id: 'img-wb-1', productId: 'dug-white-butter', imageUrl: '/assets/aistudio/1000095664-clean_2425f7fb.png', altText: 'Desi Makhan White Butter', sortOrder: 1 }
    ],
    variants: [
      { id: 'wb-250g', productId: 'dug-white-butter', sku: 'DUG-MAKH-250G', sizeLabel: '250g Fresh Container', pricePaise: 22000, compareAtPricePaise: 25000, inStock: true, stockCount: 70, isSubscriptionEligible: true },
      { id: 'wb-500g', productId: 'dug-white-butter', sku: 'DUG-MAKH-500G', sizeLabel: '500g Fresh Container', pricePaise: 42000, compareAtPricePaise: 48000, inStock: true, stockCount: 45, isSubscriptionEligible: true },
    ],
    nutritionalHighlights: [
      { label: 'Salt Content', value: '0% Unsalted Pure' },
      { label: 'Natural Lecithin', value: 'High Cognitive Support' },
      { label: 'Coloring', value: 'No Artificial Yellow Dye' },
      { label: 'Churning', value: 'Wooden Hand Bilona' },
    ]
  },

  // 6. KHOYA / MAWA
  {
    id: 'dug-vedic-khoya',
    name: 'DUGDHSAR Pure Vedic A2 Danedar Khoya (Mawa)',
    hindiName: 'शुद्ध देशी गौ खोया मावा',
    slug: 'pure-vedic-a2-danedar-khoya-mawa',
    categoryId: 'cat-khoya-mawa',
    categorySlug: 'khoya-mawa',
    badge: 'Slow Iron-Kadhai Simmered',
    rating: 4.96,
    reviewsCount: 148,
    description: 'Authentic A2 Gir cow milk khoya made by continuous slow evaporation of pure whole milk in traditional thick-gauge iron cauldrons. Free from synthetic fat, starch, or bleaching agents.',
    heritageStory: 'Essential for sacred festival sweets, gujiyas, pedas, and gulab jamuns. Golden-hued, rich in dairy aroma, and naturally sweet without added sugar.',
    ingredients: ['100% Pure Gir Cow Whole A2 Milk Solids'],
    shelfLife: '7 Days refrigerated at 2°C - 4°C, 30 days frozen',
    storageInstructions: 'Keep refrigerated in airtight containers. Thaw to room temperature before kneading into sweets.',
    allergens: ['Contains Concentrated Milk Solids'],
    purityScore: 497,
    isSubscriptionEligible: false,
    isPublished: true,
    featured: true,
    createdAt: '2026-02-01T06:00:00Z',
    images: [
      { id: 'img-khoya-1', productId: 'dug-vedic-khoya', imageUrl: '/assets/aistudio/1000095665-clean_9f8d49b7.png', altText: 'Pure A2 Danedar Khoya', sortOrder: 1 }
    ],
    variants: [
      { id: 'kh-250g', productId: 'dug-vedic-khoya', sku: 'DUG-KHOY-250G', sizeLabel: '250g Vacuum Seal', pricePaise: 24000, compareAtPricePaise: 27500, inStock: true, stockCount: 55, isSubscriptionEligible: false },
      { id: 'kh-500g', productId: 'dug-vedic-khoya', sku: 'DUG-KHOY-500G', sizeLabel: '500g Vacuum Seal', pricePaise: 46000, compareAtPricePaise: 52000, inStock: true, stockCount: 40, isSubscriptionEligible: false },
      { id: 'kh-1kg', productId: 'dug-vedic-khoya', sku: 'DUG-KHOY-1KG', sizeLabel: '1 Kilogram Master Brick', pricePaise: 90000, compareAtPricePaise: 102000, inStock: true, stockCount: 25, isSubscriptionEligible: false },
    ],
    nutritionalHighlights: [
      { label: 'Starch / Urea', value: '0.00% Zero (Chemical Assay Negative)' },
      { label: 'Fat Percentage', value: '> 30% Pure Cow Fat' },
      { label: 'Color', value: 'Natural Light Cream (Unbleached)' },
      { label: 'Preparation', value: 'Slow Iron Kadhai Stirring' }
    ]
  }
];

// =========================================================================
// 3. INVENTORY BATCHES (FEFO Tracking & Expiry Governance)
// =========================================================================
export const INITIAL_BATCHES: InventoryBatch[] = [
  // A2 Whole Milk 1L Batches
  {
    id: 'batch-wm-001',
    batchNumber: 'BATCH-2026-0301-WM1',
    variantId: 'wm-1l',
    mfgDate: '2026-03-01T04:30:00Z',
    expiryDate: '2026-03-04T04:30:00Z', // Expires first -> Should be allocated first in FEFO
    initialQuantity: 80,
    onHandQuantity: 45,
    reservedQuantity: 5,
    isQuarantined: false,
    coldChainTempC: 3.1,
    status: 'active',
    createdAt: '2026-03-01T05:00:00Z',
    updatedAt: '2026-03-01T05:00:00Z'
  },
  {
    id: 'batch-wm-002',
    batchNumber: 'BATCH-2026-0302-WM1',
    variantId: 'wm-1l',
    mfgDate: '2026-03-02T04:30:00Z',
    expiryDate: '2026-03-05T04:30:00Z', // Later expiry -> FEFO secondary
    initialQuantity: 100,
    onHandQuantity: 100,
    reservedQuantity: 0,
    isQuarantined: false,
    coldChainTempC: 2.8,
    status: 'active',
    createdAt: '2026-03-02T05:00:00Z',
    updatedAt: '2026-03-02T05:00:00Z'
  },
  {
    id: 'batch-wm-quarantine',
    batchNumber: 'BATCH-2026-0301-WM-QUARANTINE',
    variantId: 'wm-1l',
    mfgDate: '2026-03-01T04:00:00Z',
    expiryDate: '2026-03-04T04:00:00Z',
    initialQuantity: 30,
    onHandQuantity: 30,
    reservedQuantity: 0,
    isQuarantined: true, // Quarantined: FEFO MUST NEVER ALLOCATE
    quarantineReason: 'Transit temperature sensor recorded 5.4°C excursion during van unloading. Held for quality re-check.',
    coldChainTempC: 5.4,
    status: 'quarantined',
    createdAt: '2026-03-01T05:00:00Z',
    updatedAt: '2026-03-01T06:30:00Z'
  },
  // Bilona Ghee 500ml Batches
  {
    id: 'batch-bg-001',
    batchNumber: 'BATCH-2026-0215-BG500',
    variantId: 'bg-500ml',
    mfgDate: '2026-02-15T10:00:00Z',
    expiryDate: '2027-02-15T10:00:00Z',
    initialQuantity: 150,
    onHandQuantity: 70,
    reservedQuantity: 2,
    isQuarantined: false,
    coldChainTempC: 22.0, // Ambient stable
    status: 'active',
    createdAt: '2026-02-15T12:00:00Z',
    updatedAt: '2026-02-15T12:00:00Z'
  },
  {
    id: 'batch-bg-002',
    batchNumber: 'BATCH-2026-0228-BG500',
    variantId: 'bg-500ml',
    mfgDate: '2026-02-28T10:00:00Z',
    expiryDate: '2027-02-28T10:00:00Z',
    initialQuantity: 60,
    onHandQuantity: 50,
    reservedQuantity: 0,
    isQuarantined: false,
    coldChainTempC: 22.0,
    status: 'active',
    createdAt: '2026-02-28T12:00:00Z',
    updatedAt: '2026-02-28T12:00:00Z'
  },
  // Malai Paneer 250g Batches
  {
    id: 'batch-pan-001',
    batchNumber: 'BATCH-2026-0301-PAN250',
    variantId: 'mp-250g',
    mfgDate: '2026-03-01T05:00:00Z',
    expiryDate: '2026-03-05T05:00:00Z',
    initialQuantity: 60,
    onHandQuantity: 50,
    reservedQuantity: 2,
    isQuarantined: false,
    coldChainTempC: 3.2,
    status: 'active',
    createdAt: '2026-03-01T06:00:00Z',
    updatedAt: '2026-03-01T06:00:00Z'
  },
  // Probiotic Curd 500g Batches
  {
    id: 'batch-curd-001',
    batchNumber: 'BATCH-2026-0301-CURD500',
    variantId: 'cd-500g',
    mfgDate: '2026-03-01T06:00:00Z',
    expiryDate: '2026-03-06T06:00:00Z',
    initialQuantity: 50,
    onHandQuantity: 45,
    reservedQuantity: 1,
    isQuarantined: false,
    coldChainTempC: 3.4,
    status: 'active',
    createdAt: '2026-03-01T07:00:00Z',
    updatedAt: '2026-03-01T07:00:00Z'
  },
  // White Butter 250g Batches
  {
    id: 'batch-wb-001',
    batchNumber: 'BATCH-2026-0301-WB250',
    variantId: 'wb-250g',
    mfgDate: '2026-03-01T06:30:00Z',
    expiryDate: '2026-03-11T06:30:00Z',
    initialQuantity: 40,
    onHandQuantity: 35,
    reservedQuantity: 0,
    isQuarantined: false,
    coldChainTempC: 2.5,
    status: 'active',
    createdAt: '2026-03-01T07:30:00Z',
    updatedAt: '2026-03-01T07:30:00Z'
  },
  // Khoya 250g Batches
  {
    id: 'batch-kh-001',
    batchNumber: 'BATCH-2026-0301-KH250',
    variantId: 'kh-250g',
    mfgDate: '2026-03-01T07:00:00Z',
    expiryDate: '2026-03-08T07:00:00Z',
    initialQuantity: 30,
    onHandQuantity: 28,
    reservedQuantity: 0,
    isQuarantined: false,
    coldChainTempC: 3.0,
    status: 'active',
    createdAt: '2026-03-01T08:00:00Z',
    updatedAt: '2026-03-01T08:00:00Z'
  }
];

// =========================================================================
// 4. DELIVERY ZONES & SERVICEABLE PINCODES (STRICT LOCAL DELIVERY ONLY)
// Fresh perishable dairy is restricted exclusively to local cold-chain zones.
// Nationwide / arbitrary non-serviceable pincodes are firmly rejected.
// =========================================================================
export const INITIAL_DELIVERY_ZONES: DeliveryZone[] = [
  { 
    id: 'dz-seoni-central', 
    zoneName: 'Seoni Town & Barghat Road Cold Hub', 
    city: 'Seoni', 
    state: 'Madhya Pradesh', 
    hubAddress: 'DUGDHSAR Dairy, 3HP5+948, Barghat Rd, Sanjay Vihar Colony, Sufi Nagar, Seoni 480661',
    minOrderPaise: 15000, 
    deliveryFeePaise: 0, 
    freeDeliveryThresholdPaise: 25000,
    isActive: true 
  },
  { 
    id: 'dz-sukla-pastures', 
    zoneName: 'Sukla Gaushala & Environs Hub', 
    city: 'Sukla', 
    state: 'Madhya Pradesh', 
    hubAddress: 'DUGDHSAR Gaushala Farm Sanctuary, WMJJ+X34, Sukla 480771',
    minOrderPaise: 15000, 
    deliveryFeePaise: 0, 
    freeDeliveryThresholdPaise: 25000,
    isActive: true 
  },
  { 
    id: 'dz-central-delhi', 
    zoneName: 'Central & Lutyens Delhi Hub', 
    city: 'New Delhi', 
    state: 'Delhi', 
    hubAddress: 'Cold Hub 1, Connaught Lane, New Delhi',
    minOrderPaise: 25000, 
    deliveryFeePaise: 5000, 
    freeDeliveryThresholdPaise: 50000,
    isActive: true 
  },
  { 
    id: 'dz-south-delhi', 
    zoneName: 'South Delhi Cold Chain Hub', 
    city: 'New Delhi', 
    state: 'Delhi', 
    hubAddress: 'Cold Hub 2, Okhla Phase 3, New Delhi',
    minOrderPaise: 25000, 
    deliveryFeePaise: 5000, 
    freeDeliveryThresholdPaise: 50000,
    isActive: true 
  },
  { 
    id: 'dz-gurugram', 
    zoneName: 'Gurugram Millennium Hub', 
    city: 'Gurugram', 
    state: 'Haryana', 
    hubAddress: 'Cold Hub 3, Sector 34, Gurugram',
    minOrderPaise: 25000, 
    deliveryFeePaise: 5000, 
    freeDeliveryThresholdPaise: 50000,
    isActive: true 
  },
  { 
    id: 'dz-noida', 
    zoneName: 'Noida Express Hub', 
    city: 'Noida', 
    state: 'Uttar Pradesh', 
    hubAddress: 'Cold Hub 4, Sector 63, Noida',
    minOrderPaise: 25000, 
    deliveryFeePaise: 5000, 
    freeDeliveryThresholdPaise: 50000,
    isActive: true 
  }
];

export const INITIAL_SERVICEABLE_PINCODES: ServiceablePincode[] = [
  // Seoni & Sukla (Madhya Pradesh) — Primary Local Direct Farm Hubs
  { pincode: '480661', zoneId: 'dz-seoni-central', localityName: 'Barghat Road / Sanjay Vihar Colony / Sufi Nagar / Seoni Town', city: 'Seoni', isColdChainActive: true, estimatedDeliveryHours: 2, isActive: true },
  { pincode: '480771', zoneId: 'dz-sukla-pastures', localityName: 'Sukla Gaushala Farm Sanctuary & Surrounding Area', city: 'Sukla', isColdChainActive: true, estimatedDeliveryHours: 1, isActive: true },

  // Central Delhi
  { pincode: '110001', zoneId: 'dz-central-delhi', localityName: 'Connaught Place / Barakhamba', city: 'New Delhi', isColdChainActive: true, estimatedDeliveryHours: 3, isActive: true },
  { pincode: '110003', zoneId: 'dz-central-delhi', localityName: 'Pandara Road / Kaka Nagar', city: 'New Delhi', isColdChainActive: true, estimatedDeliveryHours: 3, isActive: true },
  { pincode: '110011', zoneId: 'dz-central-delhi', localityName: 'Lutyens / Chanakyapuri', city: 'New Delhi', isColdChainActive: true, estimatedDeliveryHours: 3, isActive: true },
  
  // South Delhi
  { pincode: '110021', zoneId: 'dz-south-delhi', localityName: 'Anand Niketan / Shanti Niketan', city: 'New Delhi', isColdChainActive: true, estimatedDeliveryHours: 3, isActive: true },
  { pincode: '110024', zoneId: 'dz-south-delhi', localityName: 'Defence Colony / Lajpat Nagar', city: 'New Delhi', isColdChainActive: true, estimatedDeliveryHours: 3, isActive: true },
  { pincode: '110029', zoneId: 'dz-south-delhi', localityName: 'Safdarjung Enclave / Green Park', city: 'New Delhi', isColdChainActive: true, estimatedDeliveryHours: 3, isActive: true },
  { pincode: '110048', zoneId: 'dz-south-delhi', localityName: 'Greater Kailash (GK 1 & 2)', city: 'New Delhi', isColdChainActive: true, estimatedDeliveryHours: 2, isActive: true },
  { pincode: '110070', zoneId: 'dz-south-delhi', localityName: 'Vasant Kunj / Mehrauli', city: 'New Delhi', isColdChainActive: true, estimatedDeliveryHours: 3, isActive: true },

  // Gurugram
  { pincode: '122001', zoneId: 'dz-gurugram', localityName: 'Old Gurugram / Civil Lines', city: 'Gurugram', isColdChainActive: true, estimatedDeliveryHours: 3, isActive: true },
  { pincode: '122002', zoneId: 'dz-gurugram', localityName: 'DLF Phase 1-5 / Golf Course Rd', city: 'Gurugram', isColdChainActive: true, estimatedDeliveryHours: 2, isActive: true },
  { pincode: '122018', zoneId: 'dz-gurugram', localityName: 'Sohna Road / Sector 48-50', city: 'Gurugram', isColdChainActive: true, estimatedDeliveryHours: 3, isActive: true },

  // Noida
  { pincode: '201301', zoneId: 'dz-noida', localityName: 'Sector 14 / Sector 15 / Atta', city: 'Noida', isColdChainActive: true, estimatedDeliveryHours: 3, isActive: true },
  { pincode: '201304', zoneId: 'dz-noida', localityName: 'Noida Expressway / Sector 128-137', city: 'Noida', isColdChainActive: true, estimatedDeliveryHours: 4, isActive: true }
];

// =========================================================================
// 5. DELIVERY SLOTS
// =========================================================================
export const INITIAL_DELIVERY_SLOTS: DeliverySlot[] = [
  {
    id: 'slot-morning',
    slotName: 'Morning Delivery (5:00 AM - 10:00 AM)',
    startTime: '05:00 AM',
    endTime: '10:00 AM',
    cutoffTime: '09:00 PM previous night',
    maxCapacity: 350,
    currentBookings: 184,
    isActive: true
  },
  {
    id: 'slot-evening',
    slotName: 'Evening Fresh Delivery (6:00 PM - 10:00 PM)',
    startTime: '06:00 PM',
    endTime: '10:00 PM',
    cutoffTime: '04:00 PM same day',
    maxCapacity: 250,
    currentBookings: 92,
    isActive: true
  }
];

// =========================================================================
// 6. PROMOTIONAL COUPONS
// =========================================================================
export const INITIAL_COUPONS: Coupon[] = [
  {
    id: 'c-heritage60',
    code: 'HERITAGE60',
    discountType: 'percentage',
    value: 15, // 15% discount
    minOrderAmountPaise: 30000, // ₹300 minimum order
    maxDiscountPaise: 15000, // max ₹150 discount
    startsAt: '2026-01-01T00:00:00Z',
    expiresAt: '2026-12-31T23:59:59Z',
    usageLimit: 1000,
    usedCount: 142,
    isActive: true
  },
  {
    id: 'c-bilona50',
    code: 'BILONA50',
    discountType: 'fixed_amount',
    value: 5000, // ₹50 off
    minOrderAmountPaise: 50000, // ₹500 min order
    startsAt: '2026-01-01T00:00:00Z',
    expiresAt: '2026-12-31T23:59:59Z',
    usageLimit: 500,
    usedCount: 78,
    isActive: true
  }
];

// =========================================================================
// 7. VERIFIED CUSTOMER REVIEWS
// =========================================================================
export const INITIAL_REVIEWS: Review[] = [
  {
    id: 'rev-1',
    productId: 'dug-whole-milk',
    productName: 'DUGDHSAR Fresh A2 Desi Cow Whole Milk',
    userName: 'Vikramaditya S.',
    userCity: 'Golf Course Road, Gurugram',
    rating: 5,
    title: 'The genuine nostalgic taste of childhood milk',
    comment: 'Having lived abroad for 10 years, returning to regular supermarket milk was terrible for my gut. Dugdhsar A2 milk changed everything. The rich cream layer on top and naturally sweet aroma remind me of my grandmother’s haveli. 10/10.',
    verifiedPurchase: true,
    isApproved: true,
    createdAt: '2026-02-14T08:30:00Z'
  },
  {
    id: 'rev-2',
    productId: 'dug-bilona-ghee',
    productName: 'DUGDHSAR Vedic Traditional Bilona Cow Ghee',
    userName: 'Dr. Radhika Sharma',
    userCity: 'Vasant Vihar, New Delhi',
    rating: 5,
    title: 'Danedar golden texture, unmatched Ayurvedic purity',
    comment: 'As an Ayurvedic practitioner, true Bilona ghee is essential for medicinal preparations. Dugdhsar’s purity reports showing zero vegetable adulteration and high butyric acid are completely legitimate. The aroma when heated is intoxicating.',
    verifiedPurchase: true,
    isApproved: true,
    createdAt: '2026-02-18T11:20:00Z'
  },
  {
    id: 'rev-3',
    productId: 'dug-malai-paneer',
    productName: 'DUGDHSAR Fresh A2 Malai Cottage Cheese (Paneer)',
    userName: 'Ananya Mehra',
    userCity: 'Defence Colony, New Delhi',
    rating: 5,
    title: 'Cuts like soft butter, never rubbery',
    comment: 'Commercial paneer is always filled with cornstarch or hydrogenated fat. Dugdhsar’s malai paneer literally melts on the tongue. My children eat it raw with just a pinch of rock salt.',
    verifiedPurchase: true,
    isApproved: true,
    createdAt: '2026-02-21T14:45:00Z'
  }
];

// =========================================================================
// 8. JOURNAL & EDITORIAL ARTICLES
// =========================================================================
export const INITIAL_JOURNAL_POSTS: JournalPost[] = [
  {
    id: 'post-1',
    title: 'The Science of A2 Beta-Casein: Why Ancient Indian Gir Cows Are Different',
    slug: 'science-of-a2-beta-casein-gir-cows',
    excerpt: 'Explore how a singular amino acid difference at position 67 protects your digestive lining and why European A1 milk causes chronic bloating.',
    content: `For decades, modern dairy farming in India imported Western HF (Holstein Friesian) and Jersey cows to maximize raw volumetric yields. However, these cross-bred breeds carry the mutated A1 beta-casein allele, which produces the peptide BCM-7 (Beta-Casomorphin-7) during digestion.

In contrast, our indigenous Vedic Bos Indicus breeds—the Gir, Sahiwal, and Rathi—possess the natural proline amino acid at position 67 of the protein chain. This prevents the release of BCM-7, allowing complete, effortless enzymatic breakdown without inflammation or gastrointestinal distress.

At DUGDHSAR, every single cow in our herd undergoes genetic PCR testing to guarantee 100% homozygosity (A2/A2 allele). When you drink Dugdhsar milk, you are drinking dairy as nature designed it for human physiology.`,
    coverImage: '/assets/aistudio/1000095624-clean_337007be.png',
    author: 'Dr. K.V. Shastri',
    authorRole: 'Head of Veterinary Science & Vedic Husbandry',
    readTime: '6 min read',
    publishedAt: '2026-01-28T09:00:00Z',
    tags: ['A2 Science', 'Vedic Health', 'Digestion', 'Gir Cow Genetics']
  },
  {
    id: 'post-2',
    title: 'The 5-Stage Bilona Vidhi: Why True Vedic Ghee Cannot Be Mass-Produced in Factory Centrifuges',
    slug: '5-stage-bilona-vidhi-true-vedic-ghee',
    excerpt: 'Commercial "pure cow ghee" is made by skimming raw cream and boiling it directly. Here is why the ancient curd-churned Bilona method takes 30 litres of milk for 1 litre of gold.',
    content: `Almost 95% of retail commercial ghee sold in Indian supermarkets is manufactured via the "direct cream" industrial shortcut. Raw milk is fed into high-speed electric separators, cold cream is extracted, and directly boiled at high temperatures.

Vedic Bilona Ghee follows the timeless 5-stage protocol detailed in Charaka Samhita:
1. Purna Dugdha (Whole Milking): Only pure A2 morning and evening milk is pooled.
2. Mandagni Paka (Slow Boiling): The milk is boiled gently over slow neem and cow-dung embers in iron or brass cauldrons.
3. Dahi Nirmana (Curd Setting): The milk is allowed to cool to ambient temperature and set into probiotic curd using heirloom culture.
4. Manthana (Bidirectional Churning): The set curd is churned back and forth with a traditional fluted wooden bilona stick until pure white Makhan rises to the surface.
5. Ghrita Shodhana (Simmering into Ghee): The Makhan is transferred into heavy-bottomed vessels and clarified over low flame until water evaporates and the golden granular crystalline ghee settles.

It takes 28 to 32 litres of pure A2 milk to produce a single litre of DUGDHSAR Bilona Ghee. That is why it smells like sacred ambrosia.`,
    coverImage: '/assets/aistudio/1000095662-clean_7d12ecae.png',
    author: 'Pandit Rameshwar Jha',
    authorRole: 'Master Dairy Craftsman (42 Years Service)',
    readTime: '8 min read',
    publishedAt: '2026-02-05T10:30:00Z',
    tags: ['Bilona Vidhi', 'Traditional Craft', 'Ayurveda', 'Golden Ghee']
  },
  {
    id: 'post-3',
    title: 'Cold-Chain Integrity: From Milking Parlour to Your Doorstep at 3°C',
    slug: 'cold-chain-integrity-milking-to-doorstep',
    excerpt: 'The critical 3-hour journey: how rapid plate chilling and hermetically sealed refrigerated vans ensure milk delivered at dawn has zero chemical preservatives.',
    content: `Fresh milk is a living biological emulsion. The moment it leaves the cow’s udder at 37°C, ambient bacteria seek to multiply. Traditional industrial processors mask high bacterial counts by boiling milk at destructive ultra-high temperatures (UHT) that denature fragile immunoglobulins.

At DUGDHSAR, we employ the Scandinavian Low-Temperature Vat Protocol:
- Within 15 minutes of touchless milking, the milk flows through stainless steel lines into instant PHE (Plate Heat Exchangers) bringing the temperature down from 37°C to 3.5°C.
- The chilled milk is gently vat-pasteurized at 63°C for 30 minutes—retaining enzymes and natural vitamins—then immediately brought back down to 2°C.
- Our dedicated insulated glass bottling line fills, seals, and tags each bottle with an encrypted batch QR code.
- Fleet GPS-monitored refrigerated trucks maintain 2°C–4°C right up to the customer’s designated morning doorstep drop box.

No formalin, no detergent, no hydrogen peroxide, and no synthetic milk solids. Ever.`,
    coverImage: '/assets/aistudio/image_fe6cbcdf.png',
    author: 'Er. Alok Nath',
    authorRole: 'Chief of Cold-Chain Logistics',
    readTime: '5 min read',
    publishedAt: '2026-02-12T07:15:00Z',
    tags: ['Cold Chain', 'Zero Preservatives', 'Food Safety', 'Laboratory Quality']
  }
];

// =========================================================================
// 9. BATCH PURITY SENSOR REPORT
// =========================================================================
export const LATEST_BATCH_PURITY: BatchPurityData = {
  batchNumber: 'BATCH-2026-0301-GIR',
  milkingDate: 'Today, 04:30 AM',
  milkingTime: '04:30 AM - 06:15 AM',
  purityScore: 495, // 99%
  fatContent: 4.85,
  snfContent: 9.25,
  adulterationTest: '100% Negative (Pure)',
  mbrtScore: '> 5.5 Hours (Grade A+ Pristine)',
  testedBy: 'Dr. S. K. Verma, Senior Dairy Microbiologist'
};

// =========================================================================
// 10. AUTH & ADMIN USERS (Including sumitpawar65005@gmail.com)
// =========================================================================
export const DEMO_PROFILES: Profile[] = [
  {
    id: 'user-admin-sumit',
    email: 'sumitpawar65005@gmail.com',
    fullName: 'Sumit Pawar (System Administrator)',
    phone: '+91 98200 11223',
    role: 'admin',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    createdAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'user-cust-1',
    email: 'customer@dugdhsar.in',
    fullName: 'Aryaman Sen',
    phone: '+91 98101 23456',
    role: 'customer',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    createdAt: '2026-01-10T12:00:00Z'
  },
  {
    id: 'user-admin-1',
    email: 'admin@dugdhsar.in',
    fullName: 'Devavrat Singhal',
    phone: '+91 7067672604',
    role: 'admin',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    createdAt: '2026-01-01T08:00:00Z'
  }
];

export const DEMO_ADMIN_USERS: AdminUser[] = [
  {
    id: 'admin-sumit',
    email: 'sumitpawar65005@gmail.com',
    fullName: 'Sumit Pawar',
    role: 'super_admin',
    permissions: ['manage_inventory', 'manage_batches', 'manage_orders', 'manage_deliveries', 'manage_payments', 'view_reports', 'manage_admins'],
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'admin-devavrat',
    email: 'admin@dugdhsar.in',
    fullName: 'Devavrat Singhal',
    role: 'admin',
    permissions: ['manage_inventory', 'manage_batches', 'manage_orders', 'manage_deliveries', 'view_reports'],
    isActive: true,
    createdAt: '2026-01-01T08:00:00Z'
  }
];

// =========================================================================
// 11. ADDRESSES
// =========================================================================
export const DEMO_ADDRESSES: Address[] = [
  {
    id: 'addr-1',
    userId: 'user-admin-sumit',
    fullName: 'Sumit Pawar',
    phone: '+91 7067672604',
    flatNo: 'Shop 1, Ground Floor',
    apartment: 'DUGDHSAR Dairy Depo',
    street: 'Barghat Rd, Sanjay Vihar Colony, Sufi Nagar',
    landmark: '3HP5+948 Barghat Road',
    city: 'Seoni',
    state: 'Madhya Pradesh',
    pincode: '480661',
    isDefault: true,
    deliverySlot: '5:00 AM - 10:00 AM',
    instructions: 'Direct doorstep delivery at DUGDHSAR retail counter.'
  },
  {
    id: 'addr-2',
    userId: 'user-cust-1',
    fullName: 'Aryaman Sen',
    phone: '+91 7067672604',
    flatNo: 'Sanctuary Quarters',
    apartment: 'DUGDHSAR Gaushala',
    street: 'WMJJ+X34, Sukla Pastures',
    landmark: 'Sukla Gaushala',
    city: 'Sukla',
    state: 'Madhya Pradesh',
    pincode: '480771',
    isDefault: false,
    deliverySlot: '6:00 PM - 10:00 PM',
    instructions: 'Leave fresh bottle crate at gate.'
  }
];
