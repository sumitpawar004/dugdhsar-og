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
