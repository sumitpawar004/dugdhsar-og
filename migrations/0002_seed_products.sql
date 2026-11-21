INSERT OR IGNORE INTO products (
  id, slug, name, hindi_name, category, description, heritage_story, badge,
  image_url, shelf_life, purity_score, is_subscription_eligible, is_active, display_order
) VALUES
  (
    'dug-whole-milk',
    'a2-desi-cow-whole-milk',
    'DUGDHSAR Fresh A2 Desi Cow Whole Milk',
    'शुद्ध देशी गौ दुग्ध',
    'milk',
    'Farm-fresh raw & gentle low-temp vat-pasteurized A2 milk from indigenous Gir cows. Bottled pure in sterile recyclable glass bottles within 3 hours of milking.',
    'Produced exclusively from free-grazing Vedic Gir cows roaming organic pastures in Seoni district.',
    'Morning Milking Best Seller',
    '/assets/aistudio/image_fe6cbcdf.png',
    '3 Days under continuous 2°C - 4°C refrigeration',
    488, 1, 1, 1
  ),
  (
    'dug-skimmed-milk',
    'a2-light-skimmed-milk',
    'DUGDHSAR Fresh A2 Light Skimmed Milk',
    'देशी गौ टोंड दुग्ध',
    'milk',
    'Light, crisp, and easily digestible A2 milk with natural fats gently separated through physical centrifugal spin without any chemical thickeners.',
    'Ideal for weight management, morning tea, and individuals seeking low-fat A2 dairy.',
    'Low Calorie & Heart Friendly',
    '/assets/aistudio/image_fe6cbcdf.png',
    '3 Days under 2°C - 4°C refrigeration',
    492, 1, 1, 2
  ),
  (
    'dug-buffalo-milk',
    'pure-desi-buffalo-milk',
    'DUGDHSAR Pure Desi Murrah Buffalo Whole Milk',
    'शुद्ध देशी मुर्राह भैंस का ताज़ा दूध',
    'milk',
    'Farm-fresh unadulterated pure Murrah buffalo whole milk delivered in sterilized glass bottles. Naturally thick with rich clotted malai and high calcium.',
    'Sourced from free-ranging indigenous Murrah buffaloes raised with green fodder and ethical care in Seoni.',
    'Rich & Creamy 7.5% Fat',
    '/assets/aistudio/image_fe6cbcdf.png',
    '3 Days under continuous 2°C - 4°C refrigeration',
    494, 1, 1, 3
  ),
  (
    'dug-bilona-ghee',
    'vedic-bilona-cow-ghee',
    'DUGDHSAR Vedic Traditional Bilona Cow Ghee',
    'वैदिक बिलोना देशी गौ घृत',
    'ghee',
    'Handcrafted following ancient 5-stage Vedic Vidhi: whole A2 milk boiled on slow fire, set into curd, hand-churned in wooden bilona to yield Makhan, then simmered into golden danedar ghee.',
    'Rich in golden beta-carotene from indigenous Gir cow grass feeding, with authentic nutty aroma and granular texture.',
    'Curd-Churned Vedic Bilona',
    '/assets/aistudio/1000095624-clean_337007be.png',
    '12 Months at room temperature in airtight glass jar',
    497, 0, 1, 4
  ),
  (
    'dug-malai-paneer',
    'a2-malai-cottage-cheese-paneer',
    'DUGDHSAR Fresh A2 Malai Cottage Cheese (Paneer)',
    'शुद्ध देशी मलाई पनीर',
    'paneer',
    'Ultra-soft, velvety fresh paneer made by naturally curdling morning Gir cow milk with pure lemon extract and whey. Squeezed gently in clean muslin cloth without starch or additives.',
    'Prepared in limited small batches every dawn so every cube stays pillowy soft.',
    'Soft & Melt-In-Mouth',
    '/assets/aistudio/1000095664-clean_2425f7fb.png',
    '4 Days under 2°C - 4°C refrigeration in brine water',
    494, 1, 1, 5
  ),
  (
    'dug-probiotic-curd',
    'clay-pot-natural-vedic-dahi-curd',
    'DUGDHSAR Clay-Pot Natural Vedic Dahi (Curd)',
    'पारंपरिक मटका दही',
    'curd',
    'Thick, luscious dahi set slowly in unglazed terracotta clay pots that naturally breathe and absorb excess whey. Cultured using heirloom indigenous starter curd rich in live probiotics.',
    'Earthen pot setting imparts a gentle earthy fragrance and naturally sweet thickness.',
    'Traditional Clay Matka Set',
    '/assets/aistudio/1000095624-clean_337007be.png',
    '5 Days under 4°C refrigeration',
    496, 1, 1, 6
  ),
  (
    'dug-white-butter',
    'vedic-cultured-white-butter-makhan',
    'DUGDHSAR Vedic Cultured White Butter (Makhan)',
    'ताज़ा सफेद मक्खन',
    'butter',
    'Fresh unsalted white butter churned gently every morning from cultured A2 malai. Creamy, cooling, and packed with delicate natural pasture aroma.',
    'Traditional hand-churned unsalted white makhan with zero artificial yellow dyes.',
    'Hand-Churned Makhan',
    '/assets/aistudio/1000095664-clean_2425f7fb.png',
    '10 Days refrigerated, 30 days frozen',
    493, 1, 1, 7
  ),
  (
    'dug-vedic-khoya',
    'pure-vedic-a2-danedar-khoya-mawa',
    'DUGDHSAR Pure Vedic A2 Danedar Khoya (Mawa)',
    'शुद्ध देशी गौ खोया मावा',
    'khoya-mawa',
    'Authentic A2 Gir cow milk khoya made by continuous slow evaporation of pure whole milk in heavy iron kadhais. Free from synthetic fat, starch, or bleaching agents.',
    'Essential for sacred festival sweets, gujiyas, pedas, and gulab jamuns.',
    'Slow Iron-Kadhai Simmered',
    '/assets/aistudio/1000095665-clean_9f8d49b7.png',
    '7 Days refrigerated at 2°C - 4°C, 30 days frozen',
    497, 0, 1, 8
  );

INSERT OR IGNORE INTO product_variants (
  id, product_id, sku, size_label, unit_ml_or_g, price_paise, compare_at_price_paise,
  stock_qty, is_subscription_eligible, is_active
) VALUES
  ('wm-1l', 'dug-whole-milk', 'DUG-MILK-1L', '1 Litre Glass Bottle', 1000, 17000, 19000, 150, 1, 1),
  ('wm-500ml', 'dug-whole-milk', 'DUG-MILK-500M', '500 ml Glass Bottle', 500, 9500, 10500, 90, 1, 1),
  ('wm-combo-2l', 'dug-whole-milk', 'DUG-MILK-2L-PK', 'Family Pack (2 x 1L Bottles)', 2000, 33000, 38000, 60, 1, 1),
  ('sm-1l', 'dug-skimmed-milk', 'DUG-SKIM-1L', '1 Litre Glass Bottle', 1000, 11000, 12500, 85, 1, 1),
  ('sm-500ml', 'dug-skimmed-milk', 'DUG-SKIM-500M', '500 ml Glass Bottle', 500, 6500, 7500, 50, 1, 1),
  ('bm-1l', 'dug-buffalo-milk', 'DUG-BUF-1L', '1 Litre Glass Bottle', 1000, 19000, 21000, 120, 1, 1),
  ('bm-500ml', 'dug-buffalo-milk', 'DUG-BUF-500M', '500 ml Glass Bottle', 500, 10500, 11500, 70, 1, 1),
  ('bm-combo-2l', 'dug-buffalo-milk', 'DUG-BUF-2L-PK', 'Family Pack (2 x 1L Bottles)', 2000, 37000, 42000, 45, 1, 1),
  ('bg-500ml', 'dug-bilona-ghee', 'DUG-GHEE-500M', '500 ml Heritage Glass Jar', 500, 119900, 135000, 120, 0, 1),
  ('bg-1l', 'dug-bilona-ghee', 'DUG-GHEE-1L', '1 Litre Heritage Glass Jar', 1000, 239800, 270000, 80, 0, 1),
  ('bg-combo-2l', 'dug-bilona-ghee', 'DUG-GHEE-2L-PK', 'Grand Pack (2 x 1L Jars)', 2000, 460000, 540000, 30, 0, 1),
  ('mp-250g', 'dug-malai-paneer', 'DUG-PAN-250G', '250 grams Vacuum Pouch', 250, 16000, 18000, 110, 1, 1),
  ('mp-500g', 'dug-malai-paneer', 'DUG-PAN-500G', '500 grams Vacuum Pouch', 500, 31000, 35000, 75, 1, 1),
  ('mp-1kg', 'dug-malai-paneer', 'DUG-PAN-1KG', '1 Kilogram Master Block', 1000, 60000, 70000, 40, 1, 1),
  ('cd-500g', 'dug-probiotic-curd', 'DUG-CURD-500G', '500g Terracotta Clay Pot', 500, 11000, 12500, 95, 1, 1),
  ('cd-1kg', 'dug-probiotic-curd', 'DUG-CURD-1KG', '1 Kilogram Master Clay Pot', 1000, 21000, 24000, 60, 1, 1),
  ('wb-250g', 'dug-white-butter', 'DUG-MAKH-250G', '250g Fresh Container', 250, 22000, 25000, 70, 1, 1),
  ('wb-500g', 'dug-white-butter', 'DUG-MAKH-500G', '500g Fresh Container', 500, 42000, 48000, 45, 1, 1),
  ('kh-250g', 'dug-vedic-khoya', 'DUG-KHOY-250G', '250g Vacuum Seal', 250, 24000, 27500, 55, 0, 1),
  ('kh-500g', 'dug-vedic-khoya', 'DUG-KHOY-500G', '500g Vacuum Seal', 500, 46000, 52000, 40, 0, 1),
  ('kh-1kg', 'dug-vedic-khoya', 'DUG-KHOY-1KG', '1 Kilogram Master Brick', 1000, 90000, 102000, 25, 0, 1);

INSERT OR IGNORE INTO plans (
  id, code, name, product_id, variant_id, milk_type, frequency, price_paise, billing_cycle, is_active
) VALUES
  ('plan-cow-daily-1l', 'COW_DAILY_1L', 'Gir Cow A2 Milk — Daily 1L (Monthly Prepaid)', 'dug-whole-milk', 'wm-1l', 'cow', 'daily', 17000, 'prepaid_monthly', 1),
  ('plan-cow-daily-500ml', 'COW_DAILY_500ML', 'Gir Cow A2 Milk — Daily 500ml (Monthly Prepaid)', 'dug-whole-milk', 'wm-500ml', 'cow', 'daily', 9500, 'prepaid_monthly', 1),
  ('plan-cow-alt-1l', 'COW_ALT_1L', 'Gir Cow A2 Milk — Alternate Days 1L (Monthly Prepaid)', 'dug-whole-milk', 'wm-1l', 'cow', 'alternate_days', 17000, 'prepaid_monthly', 1),
  ('plan-cow-weekly-1l', 'COW_WEEKLY_1L', 'Gir Cow A2 Milk — Daily 1L (Weekly Prepaid)', 'dug-whole-milk', 'wm-1l', 'cow', 'daily', 17000, 'prepaid_weekly', 1),
  ('plan-buf-daily-1l', 'BUF_DAILY_1L', 'Murrah Buffalo Milk — Daily 1L (Monthly Prepaid)', 'dug-buffalo-milk', 'bm-1l', 'buffalo', 'daily', 19000, 'prepaid_monthly', 1),
  ('plan-buf-daily-500ml', 'BUF_DAILY_500ML', 'Murrah Buffalo Milk — Daily 500ml (Monthly Prepaid)', 'dug-buffalo-milk', 'bm-500ml', 'buffalo', 'daily', 10500, 'prepaid_monthly', 1),
  ('plan-buf-alt-1l', 'BUF_ALT_1L', 'Murrah Buffalo Milk — Alternate Days 1L (Monthly Prepaid)', 'dug-buffalo-milk', 'bm-1l', 'buffalo', 'alternate_days', 19000, 'prepaid_monthly', 1),
  ('plan-skim-daily-1l', 'SKIM_DAILY_1L', 'A2 Light Skimmed Milk — Daily 1L (Monthly Prepaid)', 'dug-skimmed-milk', 'sm-1l', 'skimmed', 'daily', 11000, 'prepaid_monthly', 1);

INSERT OR IGNORE INTO site_settings (key, value_json) VALUES
  (
    'delivery_zones',
    '[{"id":"dz-seoni-central","zoneName":"Seoni Town & Barghat Road Cold Hub","city":"Seoni","state":"Madhya Pradesh","pincodes":["480661"],"minOrderPaise":15000,"deliveryFeePaise":0,"freeDeliveryThresholdPaise":25000,"isActive":true},{"id":"dz-sukla-pastures","zoneName":"Sukla Gaushala & Environs Hub","city":"Sukla","state":"Madhya Pradesh","pincodes":["480771"],"minOrderPaise":15000,"deliveryFeePaise":0,"freeDeliveryThresholdPaise":25000,"isActive":true}]'
  ),
  (
    'delivery_slots',
    '[{"id":"morning","slotName":"Morning Delivery (5:00 AM - 10:00 AM)","cutoffIst":"21:00","isActive":true},{"id":"evening","slotName":"Evening Fresh Delivery (6:00 PM - 10:00 PM)","cutoffIst":"16:00","isActive":true}]'
  ),
  (
    'store_banner',
    '{"enabled":true,"text":"Pure Vedic A2 Gir Cow & Murrah Buffalo Dairy — Twice Daily Cold-Chain Delivery in Seoni, MP"}'
  );
