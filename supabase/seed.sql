-- MadeHere demo seed — FICTIONAL DATA ONLY.
-- Every company, product, and claim below is invented. Rows are flagged
-- is_demo = true and removed by scripts/db/remove-demo-data.sql
-- (npm run db:seed:remove). Demo records must never be published as factual
-- content about real companies.

begin;

-- ---------------------------------------------------------------------------
-- Categories (8)
-- ---------------------------------------------------------------------------
insert into public.categories (name, slug, description, display_order, is_demo) values
  ('Cookware', 'cookware', 'Skillets, pots, and bakeware.', 1, true),
  ('Kitchen Tools', 'kitchen-tools', 'Knives, boards, and utensils.', 2, true),
  ('Furniture', 'furniture', 'Tables, seating, and storage.', 3, true),
  ('Bedding', 'bedding', 'Sheets, blankets, and pillows.', 4, true),
  ('Home Décor', 'home-decor', 'Lighting, textiles, and accents.', 5, true),
  ('Tools', 'tools', 'Hand tools and workshop gear.', 6, true),
  ('Lawn & Garden', 'lawn-garden', 'Outdoor and garden equipment.', 7, true),
  ('Cleaning Products', 'cleaning', 'Household cleaning and care.', 8, true)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- Brands (12) — mix of classifications, tiers, and states
-- ---------------------------------------------------------------------------
insert into public.brands
  (name, slug, summary, headquarters_city, headquarters_state, price_level,
   status, subscription_tier, is_featured, is_sponsored, founded_year, is_demo,
   published_at)
values
  ('Hearthstead Cookware (Demo)', 'hearthstead-cookware',
   'Fictional cast-iron maker demonstrating a verified brand profile.',
   'Columbus', 'Ohio', 2, 'published', 'verified', true, false, 1998, true, now()),
  ('Bluegrain Woodworks (Demo)', 'bluegrain-woodworks',
   'Fictional furniture workshop demonstrating a brand-reported claim.',
   'Asheville', 'North Carolina', 3, 'published', 'featured', true, false, 2011, true, now()),
  ('Northloom Textiles (Demo)', 'northloom-textiles',
   'Fictional bedding mill demonstrating imported-components disclosure.',
   'Portland', 'Maine', 2, 'published', 'basic', false, false, 1987, true, now()),
  ('Copperfield Tool Co. (Demo)', 'copperfield-tool',
   'Fictional hand-tool maker demonstrating an assembled-in-USA status.',
   'Erie', 'Pennsylvania', 1, 'published', 'basic', false, false, 1952, true, now()),
  ('Prairie & Hearth Home (Demo)', 'prairie-hearth-home',
   'Fictional décor brand demonstrating a mixed-sourcing catalog.',
   'Minneapolis', 'Minnesota', 2, 'published', 'verified', false, true, 2015, true, now()),
  ('Clearwater Supply (Demo)', 'clearwater-supply',
   'Fictional cleaning-products brand demonstrating an awaiting-review status.',
   'Eugene', 'Oregon', 1, 'published', 'basic', false, false, 2019, true, now()),
  ('Stonebridge Cutlery (Demo)', 'stonebridge-cutlery',
   'Fictional knife maker demonstrating a verified kitchen-tools profile.',
   'New Britain', 'Connecticut', 3, 'published', 'verified', true, false, 1979, true, now()),
  ('Willow Bend Gardens (Demo)', 'willow-bend-gardens',
   'Fictional garden-equipment brand demonstrating a brand-reported claim.',
   'Boise', 'Idaho', 2, 'published', 'basic', false, false, 2008, true, now()),
  ('Lakeshore Lighting (Demo)', 'lakeshore-lighting',
   'Fictional lighting brand demonstrating designed-in-USA disclosure.',
   'Grand Rapids', 'Michigan', 2, 'published', 'basic', false, false, 2013, true, now()),
  ('Amberline Bedding (Demo)', 'amberline-bedding',
   'Fictional bedding brand demonstrating a featured subscription tier.',
   'Greenville', 'South Carolina', 2, 'published', 'featured', true, true, 2005, true, now()),
  ('Foundry & Field (Demo)', 'foundry-field',
   'Fictional lawn-tool maker demonstrating imported-components disclosure.',
   'Des Moines', 'Iowa', 2, 'published', 'basic', false, false, 1994, true, now()),
  ('Draft Harbor Goods (Demo)', 'draft-harbor-goods',
   'Fictional unpublished brand demonstrating that drafts stay private.',
   'Burlington', 'Vermont', 1, 'draft', 'basic', false, false, 2021, true, null)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- Brand ↔ category links
-- ---------------------------------------------------------------------------
insert into public.brand_categories (brand_id, category_id)
select b.id, c.id
from (values
  ('hearthstead-cookware', 'cookware'),
  ('bluegrain-woodworks', 'furniture'),
  ('northloom-textiles', 'bedding'),
  ('northloom-textiles', 'home-decor'),
  ('copperfield-tool', 'tools'),
  ('prairie-hearth-home', 'home-decor'),
  ('clearwater-supply', 'cleaning'),
  ('stonebridge-cutlery', 'kitchen-tools'),
  ('willow-bend-gardens', 'lawn-garden'),
  ('lakeshore-lighting', 'home-decor'),
  ('amberline-bedding', 'bedding'),
  ('foundry-field', 'lawn-garden'),
  ('foundry-field', 'tools'),
  ('draft-harbor-goods', 'home-decor')
) as l(brand_slug, category_slug)
join public.brands b on b.slug = l.brand_slug
join public.categories c on c.slug = l.category_slug
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Products (30) across brands, classifications, and price points
-- ---------------------------------------------------------------------------
insert into public.products
  (brand_id, category_id, name, slug, summary, price_amount,
   manufacturing_classification, manufacturing_state, status, is_featured,
   is_sponsored, is_demo, published_at)
select
  b.id, c.id, p.name, p.slug, p.summary, p.price,
  p.classification::public.manufacturing_classification, p.state,
  p.status::public.content_status, p.featured, p.sponsored, true,
  case when p.status = 'published' then now() end
from (values
  ('hearthstead-cookware','cookware','10″ Cast-Iron Skillet (Demo)','hearthstead-10in-skillet','Fictional skillet demonstrating a verified product page.',120,'verified_made_in_usa','Ohio','published',true,false),
  ('hearthstead-cookware','cookware','12″ Cast-Iron Skillet (Demo)','hearthstead-12in-skillet','Fictional larger skillet.',150,'verified_made_in_usa','Ohio','published',false,false),
  ('hearthstead-cookware','cookware','Dutch Oven, 6 qt (Demo)','hearthstead-dutch-oven','Fictional enameled dutch oven with imported enamel.',240,'made_in_usa_imported_components','Ohio','published',false,false),
  ('hearthstead-cookware','cookware','Griddle Pan (Demo)','hearthstead-griddle','Fictional reversible griddle.',95,'verified_made_in_usa','Ohio','published',false,false),
  ('bluegrain-woodworks','furniture','Shaker Dining Table (Demo)','bluegrain-shaker-table','Fictional table demonstrating a brand-reported classification.',1450,'brand_reported_made_in_usa','North Carolina','published',true,false),
  ('bluegrain-woodworks','furniture','Windsor Chair (Demo)','bluegrain-windsor-chair','Fictional hand-finished chair.',420,'brand_reported_made_in_usa','North Carolina','published',false,false),
  ('bluegrain-woodworks','furniture','Walnut Bookshelf (Demo)','bluegrain-bookshelf','Fictional five-shelf bookcase.',890,'brand_reported_made_in_usa','North Carolina','published',false,false),
  ('northloom-textiles','bedding','Flannel Sheet Set (Demo)','northloom-flannel-sheets','Fictional sheets demonstrating imported-components disclosure.',180,'made_in_usa_imported_components','Maine','published',false,false),
  ('northloom-textiles','bedding','Wool Blanket (Demo)','northloom-wool-blanket','Fictional queen wool blanket.',260,'made_in_usa_imported_components','Maine','published',false,false),
  ('northloom-textiles','home-decor','Linen Curtains (Demo)','northloom-linen-curtains','Fictional curtains with imported linen.',140,'made_in_usa_imported_components','Maine','published',false,false),
  ('copperfield-tool','tools','16 oz Claw Hammer (Demo)','copperfield-claw-hammer','Fictional hammer demonstrating an assembled-in-USA status.',42,'assembled_in_usa','Pennsylvania','published',false,false),
  ('copperfield-tool','tools','Adjustable Wrench Set (Demo)','copperfield-wrench-set','Fictional three-piece wrench set.',68,'assembled_in_usa','Pennsylvania','published',false,false),
  ('copperfield-tool','tools','Screwdriver Set (Demo)','copperfield-screwdrivers','Fictional 12-piece screwdriver set.',54,'assembled_in_usa','Pennsylvania','published',false,false),
  ('copperfield-tool','tools','Pry Bar (Demo)','copperfield-pry-bar','Fictional forged pry bar.',28,'verified_made_in_usa','Pennsylvania','published',false,false),
  ('prairie-hearth-home','home-decor','Wool Throw Blanket (Demo)','prairie-wool-throw','Fictional throw demonstrating a sponsored product card.',95,'certain_products_made_in_usa','Minnesota','published',false,true),
  ('prairie-hearth-home','home-decor','Ceramic Table Lamp (Demo)','prairie-ceramic-lamp','Fictional lamp from the imported line — honestly labeled.',120,'designed_in_usa_manufactured_elsewhere',null,'published',false,false),
  ('prairie-hearth-home','home-decor','Oak Picture Frames (Demo)','prairie-oak-frames','Fictional frame set from the domestic line.',60,'certain_products_made_in_usa','Minnesota','published',false,false),
  ('clearwater-supply','cleaning','All-Purpose Cleaner (Demo)','clearwater-all-purpose','Fictional cleaner demonstrating an awaiting-review status.',12,'awaiting_review','Oregon','published',false,false),
  ('clearwater-supply','cleaning','Dish Soap Concentrate (Demo)','clearwater-dish-soap','Fictional concentrate awaiting review.',9,'awaiting_review','Oregon','published',false,false),
  ('clearwater-supply','cleaning','Glass Cleaner (Demo)','clearwater-glass-cleaner','Fictional glass cleaner with unclear sourcing.',8,'unclear',null,'published',false,false),
  ('stonebridge-cutlery','kitchen-tools','8″ Chef Knife (Demo)','stonebridge-chef-knife','Fictional forged chef knife with verified evidence.',185,'verified_made_in_usa','Connecticut','published',true,false),
  ('stonebridge-cutlery','kitchen-tools','Paring Knife (Demo)','stonebridge-paring-knife','Fictional paring knife.',75,'verified_made_in_usa','Connecticut','published',false,false),
  ('stonebridge-cutlery','kitchen-tools','Maple Cutting Board (Demo)','stonebridge-cutting-board','Fictional end-grain board.',110,'verified_made_in_usa','Connecticut','published',false,false),
  ('willow-bend-gardens','lawn-garden','Garden Spade (Demo)','willow-bend-spade','Fictional spade with a brand-reported claim.',58,'brand_reported_made_in_usa','Idaho','published',false,false),
  ('willow-bend-gardens','lawn-garden','Pruning Shears (Demo)','willow-bend-shears','Fictional bypass pruners.',36,'brand_reported_made_in_usa','Idaho','published',false,false),
  ('lakeshore-lighting','home-decor','Brass Floor Lamp (Demo)','lakeshore-floor-lamp','Fictional lamp designed domestically, made abroad — labeled honestly.',210,'designed_in_usa_manufactured_elsewhere',null,'published',false,false),
  ('lakeshore-lighting','home-decor','Pendant Light (Demo)','lakeshore-pendant','Fictional pendant, US-owned brand, unconfirmed manufacturing.',160,'us_owned_unconfirmed_manufacturing',null,'published',false,false),
  ('amberline-bedding','bedding','Percale Sheet Set (Demo)','amberline-percale-sheets','Fictional sheets demonstrating a featured, sponsored listing.',150,'verified_made_in_usa','South Carolina','published',true,true),
  ('foundry-field','lawn-garden','Steel Garden Rake (Demo)','foundry-field-rake','Fictional rake with imported handle hardware.',44,'made_in_usa_imported_components','Iowa','published',false,false),
  ('foundry-field','tools','Hand Trowel (Demo)','foundry-field-trowel','Fictional forged trowel — unpublished draft for testing.',24,'awaiting_review','Iowa','draft',false,false)
) as p(brand_slug, category_slug, name, slug, summary, price, classification, state, status, featured, sponsored)
join public.brands b on b.slug = p.brand_slug
join public.categories c on c.slug = p.category_slug
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- Evidence rows (pending review — approval requires a real admin reviewer)
-- ---------------------------------------------------------------------------
insert into public.manufacturing_evidence
  (brand_id, product_id, classification, source_url, source_title,
   evidence_note, evidence_type, accessed_at, confidence_score, review_status)
select
  b.id,
  (select id from public.products where slug = e.product_slug),
  e.classification::public.manufacturing_classification,
  e.source_url, e.source_title, e.note,
  e.etype::public.evidence_type, now(), e.confidence, 'pending'
from (values
  ('hearthstead-cookware','hearthstead-10in-skillet','verified_made_in_usa',
   'https://example.invalid/demo-foundry-tour','Demo: foundry tour writeup',
   'Fictional demo evidence — placeholder for a real sourced record.','factory_documentation',80),
  ('bluegrain-woodworks','bluegrain-shaker-table','brand_reported_made_in_usa',
   'https://example.invalid/demo-brand-faq','Demo: brand FAQ',
   'Fictional demo evidence — brand-reported only.','brand_statement',50),
  ('stonebridge-cutlery','stonebridge-chef-knife','verified_made_in_usa',
   'https://example.invalid/demo-press-visit','Demo: press factory visit',
   'Fictional demo evidence — placeholder for a real sourced record.','press_coverage',75)
) as e(brand_slug, product_slug, classification, source_url, source_title, note, etype, confidence)
join public.brands b on b.slug = e.brand_slug;

-- ---------------------------------------------------------------------------
-- Manufacturing locations
-- ---------------------------------------------------------------------------
insert into public.manufacturing_locations
  (brand_id, facility_name, city, state, location_type, verification_status)
select b.id, l.facility, l.city, l.state, l.ltype::public.location_type, 'pending'
from (values
  ('hearthstead-cookware','Demo Foundry No. 2','Columbus','Ohio','factory'),
  ('bluegrain-woodworks','Demo Workshop','Asheville','North Carolina','workshop'),
  ('stonebridge-cutlery','Demo Forge','New Britain','Connecticut','factory'),
  ('amberline-bedding','Demo Mill','Greenville','South Carolina','factory')
) as l(brand_slug, facility, city, state, ltype)
join public.brands b on b.slug = l.brand_slug;

-- ---------------------------------------------------------------------------
-- Articles: 4 shopping guides + 3 founder/factory stories
-- ---------------------------------------------------------------------------
insert into public.articles
  (title, slug, excerpt, body, article_type, status, is_sponsored,
   sponsor_brand_id, is_demo, published_at)
values
  ('Choosing American-Made Cast Iron (Demo Guide)', 'cast-iron-buying-guide',
   'A fictional shopping guide demonstrating the editorial layout.',
   'Fictional demo body copy.', 'shopping_guide', 'published', false, null, true, now()),
  ('American-Made Bedding, Explained (Demo Guide)', 'bedding-guide',
   'A fictional guide demonstrating evidence presentation.',
   'Fictional demo body copy.', 'shopping_guide', 'published', false, null, true, now()),
  ('Outfitting a Workshop with U.S.-Made Tools (Demo Guide)', 'workshop-tools-guide',
   'A fictional sponsored guide demonstrating disclosure placement.',
   'Fictional demo body copy.', 'shopping_guide', 'published', true,
   (select id from public.brands where slug = 'copperfield-tool'), true, now()),
  ('Kitchen Knives Worth Keeping (Demo Guide)', 'kitchen-knives-guide',
   'A fictional comparison guide.',
   'Fictional demo body copy.', 'shopping_guide', 'published', false, null, true, now()),
  ('Inside the Demo Foundry (Demo Story)', 'inside-demo-foundry',
   'A fictional factory story.',
   'Fictional demo body copy.', 'factory_story', 'published', false, null, true, now()),
  ('The Two Sisters Behind Bluegrain (Demo Story)', 'bluegrain-founders',
   'A fictional founder story.',
   'Fictional demo body copy.', 'founder_story', 'published', false, null, true, now()),
  ('How Stonebridge Forges a Knife (Demo Story)', 'stonebridge-forging',
   'A fictional factory story.',
   'Fictional demo body copy.', 'factory_story', 'published', false, null, true, now())
on conflict (slug) do nothing;

-- Link articles to brands/products
insert into public.article_brands (article_id, brand_id)
select a.id, b.id
from (values
  ('cast-iron-buying-guide','hearthstead-cookware'),
  ('bedding-guide','northloom-textiles'),
  ('bedding-guide','amberline-bedding'),
  ('workshop-tools-guide','copperfield-tool'),
  ('kitchen-knives-guide','stonebridge-cutlery'),
  ('inside-demo-foundry','hearthstead-cookware'),
  ('bluegrain-founders','bluegrain-woodworks'),
  ('stonebridge-forging','stonebridge-cutlery')
) as l(article_slug, brand_slug)
join public.articles a on a.slug = l.article_slug
join public.brands b on b.slug = l.brand_slug
on conflict do nothing;

insert into public.article_products (article_id, product_id, display_order, editorial_label)
select a.id, p.id, l.ord, l.label
from (values
  ('cast-iron-buying-guide','hearthstead-10in-skillet',1,'Best overall (demo)'),
  ('cast-iron-buying-guide','hearthstead-dutch-oven',2,'Best for braising (demo)'),
  ('bedding-guide','northloom-flannel-sheets',1,'Best flannel (demo)'),
  ('bedding-guide','amberline-percale-sheets',2,'Best percale (demo)'),
  ('workshop-tools-guide','copperfield-claw-hammer',1,'Workhorse pick (demo)'),
  ('kitchen-knives-guide','stonebridge-chef-knife',1,'Best chef knife (demo)')
) as l(article_slug, product_slug, ord, label)
join public.articles a on a.slug = l.article_slug
join public.products p on p.slug = l.product_slug
on conflict do nothing;

commit;
