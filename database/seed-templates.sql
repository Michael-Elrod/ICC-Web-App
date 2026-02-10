-- seed-templates.sql

INSERT INTO `job_template` (`template_name`, `created_by`) VALUES ('Crawl Space', 1);
SET @crawl_id = LAST_INSERT_ID();

-- Phase 1: Pre-Planning (order 0)
INSERT INTO `template_phase` (`template_id`, `phase_title`, `phase_description`, `phase_order`)
VALUES (@crawl_id, 'Pre-Planning', 'Initial planning and preparation phase', 0);
SET @phase_id = LAST_INSERT_ID();

INSERT INTO `template_task` (`template_phase_id`, `task_title`, `task_duration`, `task_offset`, `task_description`, `task_order`) VALUES
(@phase_id, 'Architect Plans Printed', 1, 0, 'Get architectural plans printed', 0),
(@phase_id, 'Survey', 1, 0, 'Complete property survey', 1),
(@phase_id, 'Contact electric company for layout/access', 1, 0, 'Coordinate with electric company', 2),
(@phase_id, 'Contact water/sewer company for layout/access', 1, 0, 'Coordinate with water/sewer company', 3),
(@phase_id, 'Contact cable company for layout/access', 1, 0, 'Coordinate with cable company', 4),
(@phase_id, 'Contact gas company for layout/access', 1, 0, 'Coordinate with gas company', 5),
(@phase_id, 'Contact backhoe operator', 1, 0, 'Schedule backhoe operator', 6),
(@phase_id, 'Contact truss company (if needed)', 1, 0, 'Coordinate with truss company', 7),
(@phase_id, 'Portable Toilet', 1, 0, 'Arrange portable toilet delivery', 8),
(@phase_id, 'Temporary Water (meter paid for)', 1, 0, 'Pay for water meter', 9),
(@phase_id, 'Sewer (paid for)', 1, 0, 'Pay for sewer connection', 10),
(@phase_id, 'Temporary Power', 1, 0, 'Set up temporary power', 11),
(@phase_id, 'Temporary Water installed', 1, 0, 'Install temporary water', 12),
(@phase_id, 'Dirt Work/tree removal to prep lot', 1, 0, 'Prepare lot', 13),
(@phase_id, 'One Call Lot', 1, -10, 'Schedule One Call for lot inspection', 14);

INSERT INTO `template_material` (`template_phase_id`, `material_title`, `material_offset`, `material_description`, `material_order`) VALUES
(@phase_id, 'Windows', 0, 'Order and arrange delivery of windows', 0),
(@phase_id, 'Siding', 0, 'Order and arrange delivery of siding materials', 1),
(@phase_id, 'Posts', 0, 'Order and arrange delivery of posts', 2),
(@phase_id, 'Exterior Doors', 0, 'Order and arrange delivery of exterior doors', 3),
(@phase_id, 'Shingles/Metal', 0, 'Order and arrange delivery of roofing materials', 4),
(@phase_id, 'Tub/Showers', 0, 'Order and arrange delivery of tub/shower units', 5),
(@phase_id, 'HVAC Equipment', 0, 'Order and arrange delivery of HVAC equipment', 6),
(@phase_id, 'Flooring', 0, 'Order and arrange delivery of flooring materials', 7),
(@phase_id, 'Materials ordered for block work', -5, 'Order blocks, vents, and anchors', 8);

-- Phase 2: Construction Start (order 1)
INSERT INTO `template_phase` (`template_id`, `phase_title`, `phase_description`, `phase_order`)
VALUES (@crawl_id, 'Construction Start', 'Initial construction phase including foundation work', 1);
SET @phase_id = LAST_INSERT_ID();

INSERT INTO `template_task` (`template_phase_id`, `task_title`, `task_duration`, `task_offset`, `task_description`, `task_order`) VALUES
(@phase_id, 'Dig Footers & Pour Concrete', 2, 1, 'Excavate footers and pour concrete foundation', 0),
(@phase_id, 'Termite company contacted', 1, 4, 'Contact termite company to spray lot', 1),
(@phase_id, 'Blocks layed', 3, 4, 'Lay concrete blocks for foundation', 2);

INSERT INTO `template_material` (`template_phase_id`, `material_title`, `material_offset`, `material_description`, `material_order`) VALUES
(@phase_id, 'Foundation material (Rebar)', 0, 'Delivery of rebar and foundation materials', 0),
(@phase_id, 'Block work material', 3, 'Delivery of blocks and related materials', 1);

-- Phase 3: Foundation (order 2)
INSERT INTO `template_phase` (`template_id`, `phase_title`, `phase_description`, `phase_order`)
VALUES (@crawl_id, 'Foundation', 'Main foundation work and utilities', 2);
SET @phase_id = LAST_INSERT_ID();

INSERT INTO `template_task` (`template_phase_id`, `task_title`, `task_duration`, `task_offset`, `task_description`, `task_order`) VALUES
(@phase_id, 'Rough plumbing installed', 2, 12, 'Install rough plumbing', 0),
(@phase_id, 'Lay Plastic', 1, 7, 'Install plastic barrier', 1),
(@phase_id, 'Garages poured (if needed)', 1, 7, 'Pour garage slabs', 2);

INSERT INTO `template_material` (`template_phase_id`, `material_title`, `material_offset`, `material_description`, `material_order`) VALUES
(@phase_id, 'Deliver Tubs', 5, 'Delivery of bathtubs and shower units', 0),
(@phase_id, 'Deliver framing package', 7, 'Delivery of framing materials', 1),
(@phase_id, 'Trusses delivered (if needed)', 6, 'Delivery of roof trusses', 2);

-- Phase 4: Framing (order 3)
INSERT INTO `template_phase` (`template_id`, `phase_title`, `phase_description`, `phase_order`)
VALUES (@crawl_id, 'Framing', 'Framing construction and material ordering', 3);
SET @phase_id = LAST_INSERT_ID();

INSERT INTO `template_task` (`template_phase_id`, `task_title`, `task_duration`, `task_offset`, `task_description`, `task_order`) VALUES
(@phase_id, 'Frame house', 4, 8, 'Complete house framing', 0),
(@phase_id, 'Blocks painted (if needed)', 1, 12, 'Paint foundation blocks', 1);

INSERT INTO `template_material` (`template_phase_id`, `material_title`, `material_offset`, `material_description`, `material_order`) VALUES
(@phase_id, 'Deliver windows/exterior doors', 11, 'Delivery of windows and exterior doors', 0),
(@phase_id, 'Deliver shingles', 11, 'Delivery of roofing shingles', 1),
(@phase_id, 'Doors', 10, 'Order interior doors', 2),
(@phase_id, 'Door Knobs', 10, 'Order door hardware', 3),
(@phase_id, 'Cabinets/vanities', 15, 'Order cabinet and vanity units', 4),
(@phase_id, 'Cabinet pulls', 15, 'Order cabinet hardware', 5),
(@phase_id, 'Kitchen sink', 10, 'Order kitchen sink', 6),
(@phase_id, 'Hand rail (if needed)', 10, 'Order handrails', 7),
(@phase_id, 'Specialty items', 10, 'Order specialty items', 8),
(@phase_id, 'Vanity Faucet', 10, 'Order vanity faucets', 9),
(@phase_id, 'Kitchen Faucet', 10, 'Order kitchen faucet', 10),
(@phase_id, 'Tub/shower faucet', 10, 'Order tub and shower faucets', 11),
(@phase_id, 'Tile (if needed)', 10, 'Order tile materials', 12);

-- Phase 5: Rough in to Sheetrock (order 4)
INSERT INTO `template_phase` (`template_id`, `phase_title`, `phase_description`, `phase_order`)
VALUES (@crawl_id, 'Rough in to Sheetrock', 'Rough-in work and major installations', 4);
SET @phase_id = LAST_INSERT_ID();

INSERT INTO `template_task` (`template_phase_id`, `task_title`, `task_duration`, `task_offset`, `task_description`, `task_order`) VALUES
(@phase_id, 'Install Roof', 3, 12, 'Install roofing materials', 0),
(@phase_id, 'Install Siding', 3, 16, 'Install siding materials', 1),
(@phase_id, 'Install Brick (if needed)', 4, 16, 'Install brick facade', 2),
(@phase_id, 'Electric Rough-in', 4, 13, 'Complete electrical rough-in', 3),
(@phase_id, 'HVAC Rough-in (including bath vents)', 4, 13, 'Complete HVAC system rough-in', 4),
(@phase_id, 'Plumbing Rough-in', 2, 12, 'Complete plumbing rough-in', 5),
(@phase_id, 'Insulate exterior walls', 3, 17, 'Install exterior wall insulation', 6),
(@phase_id, 'Install sheetrock', 6, 22, 'Install sheetrock throughout', 7),
(@phase_id, 'Insulate Attic', 2, 29, 'Install attic insulation', 8),
(@phase_id, 'Inspection day', 1, 20, 'Complete inspection', 9);

INSERT INTO `template_material` (`template_phase_id`, `material_title`, `material_offset`, `material_description`, `material_order`) VALUES
(@phase_id, 'Deliver Siding', 15, 'Delivery of siding materials', 0),
(@phase_id, 'Garage Door (if needed)', 20, 'Order garage door', 1),
(@phase_id, 'Trim Material', 20, 'Order trim materials', 2),
(@phase_id, 'Counter tops', 20, 'Order counter tops', 3),
(@phase_id, 'Sheetrock', 20, 'Order sheetrock materials', 4),
(@phase_id, 'Water heater', 20, 'Order water heater', 5),
(@phase_id, 'Toilets', 20, 'Order toilets', 6),
(@phase_id, 'Light fixtures', 20, 'Order light fixtures', 7),
(@phase_id, 'Bathroom Kits', 20, 'Order bathroom accessory kits', 8),
(@phase_id, 'Deliver sheetrock', 21, 'Delivery of sheetrock materials', 9);

-- Phase 6: Trim Out & Exterior Finish (order 5)
INSERT INTO `template_phase` (`template_id`, `phase_title`, `phase_description`, `phase_order`)
VALUES (@crawl_id, 'Trim Out & Exterior Finish', 'Interior finishing and exterior completion', 5);
SET @phase_id = LAST_INSERT_ID();

INSERT INTO `template_task` (`template_phase_id`, `task_title`, `task_duration`, `task_offset`, `task_description`, `task_order`) VALUES
(@phase_id, 'Tile installed (if needed)', 1, 32, 'Install tile flooring', 0),
(@phase_id, 'Trim out', 3, 29, 'Install trim throughout', 1),
(@phase_id, 'Termite spray', 1, 31, 'Apply termite treatment', 2),
(@phase_id, 'Paint Interior', 5, 32, 'Paint interior surfaces', 3),
(@phase_id, 'Paint/Stain Exterior (if needed)', 5, 32, 'Paint or stain exterior surfaces', 4),
(@phase_id, 'Underground Utilities ran (if needed)', 1, 33, 'Run underground utilities', 5),
(@phase_id, 'Install Exterior Electric/Meter', 3, 33, 'Install exterior electrical and meter', 6),
(@phase_id, 'Call Entergy for Permanent Power', 3, 40, 'Arrange permanent power connection', 7),
(@phase_id, 'Install Flooring', 4, 41, 'Install flooring materials', 8),
(@phase_id, 'Install Cabinets', 2, 38, 'Install cabinet units', 9),
(@phase_id, 'Electric Top Out', 3, 38, 'Complete electrical finishing', 10),
(@phase_id, 'HVAC Top Out', 3, 38, 'Complete HVAC finishing', 11),
(@phase_id, 'Install appliances', 2, 46, 'Install all appliances', 12),
(@phase_id, 'Install Garage Door (if needed)', 2, 41, 'Install garage door', 13),
(@phase_id, 'Main water line/sewer connection', 2, 46, 'Connect main utilities', 14),
(@phase_id, 'Concrete driveway/sidewalks installed', 2, 49, 'Install concrete surfaces', 15),
(@phase_id, 'Install steps', 2, 41, 'Install house steps', 16),
(@phase_id, 'Deck/patio installation', 2, 41, 'Install deck and patio', 17);

INSERT INTO `template_material` (`template_phase_id`, `material_title`, `material_offset`, `material_description`, `material_order`) VALUES
(@phase_id, 'Ceiling Fans', 25, 'Order ceiling fans', 0),
(@phase_id, 'Vanity Lights', 30, 'Order vanity lights', 1),
(@phase_id, 'Porch Light Front', 35, 'Order front porch light', 2),
(@phase_id, 'Porch Light Motion', 40, 'Order motion sensor porch light', 3),
(@phase_id, 'Vanity Mirrors', 25, 'Order vanity mirrors', 4),
(@phase_id, 'Mirrors', 30, 'Order additional mirrors', 5),
(@phase_id, 'Deliver trim package/doors', 28, 'Delivery of trim and doors', 6),
(@phase_id, 'Deliver flooring', 40, 'Delivery of flooring materials', 7),
(@phase_id, 'Deliver cabinets', 37, 'Delivery of cabinet units', 8),
(@phase_id, 'Deliver electric fixtures', 37, 'Delivery of electrical fixtures', 9),
(@phase_id, 'Deliver Appliances', 45, 'Delivery of all appliances', 10),
(@phase_id, 'Deliver plumbing items', 45, 'Delivery of sink, water heater, disposal, fixtures', 11),
(@phase_id, 'Mail box', 30, 'Order mailbox', 12),
(@phase_id, 'Address numbers/letters', 30, 'Order address numbers and letters', 13),
(@phase_id, 'Sod (if needed)', 40, 'Order sod materials', 14),
(@phase_id, 'Privacy fence materials (if needed)', 40, 'Order privacy fence materials', 15);

-- Phase 7: Interior Finish (order 6)
INSERT INTO `template_phase` (`template_id`, `phase_title`, `phase_description`, `phase_order`)
VALUES (@crawl_id, 'Interior Finish', 'Final interior finishing and inspections', 6);
SET @phase_id = LAST_INSERT_ID();

INSERT INTO `template_task` (`template_phase_id`, `task_title`, `task_duration`, `task_offset`, `task_description`, `task_order`) VALUES
(@phase_id, 'Pre punch out list', 2, 46, 'Complete pre-punch out inspection', 0),
(@phase_id, 'Plumbing Final', 3, 46, 'Final plumbing inspection', 1),
(@phase_id, 'Electric Final', 2, 49, 'Final electrical inspection', 2),
(@phase_id, 'Install mail box/address numbers', 1, 49, 'Install mailbox and address numbers', 3),
(@phase_id, 'Touch up paint/1/4 round', 1, 48, 'Complete paint touch ups and quarter round installation', 4);

-- Phase 8: Final (order 7)
INSERT INTO `template_phase` (`template_id`, `phase_title`, `phase_description`, `phase_order`)
VALUES (@crawl_id, 'Final', 'Final completion tasks', 7);
SET @phase_id = LAST_INSERT_ID();

INSERT INTO `template_task` (`template_phase_id`, `task_title`, `task_duration`, `task_offset`, `task_description`, `task_order`) VALUES
(@phase_id, 'Final punch out', 2, 51, 'Complete final punch out inspection', 0),
(@phase_id, 'Final dirtwork', 2, 50, 'Complete final landscaping and dirt work', 1),
(@phase_id, 'Install privacy fence (if needed)', 2, 51, 'Install privacy fencing', 2),
(@phase_id, 'Clean house', 1, 53, 'Final house cleaning', 3);


-- =============================================
-- SLAB TEMPLATE
-- =============================================
INSERT INTO `job_template` (`template_name`, `created_by`) VALUES ('Slab', 1);
SET @slab_id = LAST_INSERT_ID();

-- Phase 1: Pre-Planning (order 0)
INSERT INTO `template_phase` (`template_id`, `phase_title`, `phase_description`, `phase_order`)
VALUES (@slab_id, 'Pre-Planning', 'Initial planning and preparation phase', 0);
SET @phase_id = LAST_INSERT_ID();

INSERT INTO `template_task` (`template_phase_id`, `task_title`, `task_duration`, `task_offset`, `task_description`, `task_order`) VALUES
(@phase_id, 'Architect Plans Printed', 1, 0, 'Get architectural plans printed', 0),
(@phase_id, 'Survey', 1, 0, 'Complete property survey', 1),
(@phase_id, 'Contact electric company for layout/access', 1, 0, 'Coordinate with electric company', 2),
(@phase_id, 'Contact water/sewer company for layout/access', 1, 0, 'Coordinate with water/sewer company', 3),
(@phase_id, 'Contact cable company for layout/access', 1, 0, 'Coordinate with cable company', 4),
(@phase_id, 'Contact gas company for layout/access', 1, 0, 'Coordinate with gas company', 5),
(@phase_id, 'Contact backhoe operator', 1, 0, 'Schedule backhoe operator', 6),
(@phase_id, 'Contact truss company (if needed)', 1, 0, 'Coordinate with truss company', 7),
(@phase_id, 'Portable Toilet', 1, 0, 'Arrange portable toilet delivery', 8),
(@phase_id, 'Temporary Water (meter paid for)', 1, 0, 'Pay for water meter', 9),
(@phase_id, 'Sewer (paid for)', 1, 0, 'Pay for sewer connection', 10),
(@phase_id, 'Temporary Power', 1, 0, 'Set up temporary power', 11),
(@phase_id, 'Temporary Water installed', 1, 0, 'Install temporary water', 12),
(@phase_id, 'Dirt Work/tree removal to prep lot', 1, 0, 'Prepare lot', 13),
(@phase_id, 'One Call Lot', 1, -10, 'Schedule One Call for lot inspection', 14);

INSERT INTO `template_material` (`template_phase_id`, `material_title`, `material_offset`, `material_description`, `material_order`) VALUES
(@phase_id, 'Windows', 0, 'Order and arrange delivery of windows', 0),
(@phase_id, 'Siding', 0, 'Order and arrange delivery of siding materials', 1),
(@phase_id, 'Posts', 0, 'Order and arrange delivery of posts', 2),
(@phase_id, 'Exterior Doors', 0, 'Order and arrange delivery of exterior doors', 3),
(@phase_id, 'Shingles/Metal', 0, 'Order and arrange delivery of roofing materials', 4),
(@phase_id, 'Tub/Showers', 0, 'Order and arrange delivery of tub/shower units', 5),
(@phase_id, 'HVAC Equipment', 0, 'Order and arrange delivery of HVAC equipment', 6),
(@phase_id, 'Flooring', 0, 'Order and arrange delivery of flooring materials', 7),
(@phase_id, 'Materials ordered for block work', -5, 'Order blocks, vents, and anchors', 8);

-- Phase 2: Construction Start (order 1)
INSERT INTO `template_phase` (`template_id`, `phase_title`, `phase_description`, `phase_order`)
VALUES (@slab_id, 'Construction Start', 'Initial construction phase including foundation work', 1);
SET @phase_id = LAST_INSERT_ID();

INSERT INTO `template_task` (`template_phase_id`, `task_title`, `task_duration`, `task_offset`, `task_description`, `task_order`) VALUES
(@phase_id, 'Dig Footers & Pour Concrete', 2, 1, 'Excavate footers and pour concrete foundation', 0),
(@phase_id, 'Blocks layed', 3, 4, 'Lay concrete blocks for foundation', 1);

INSERT INTO `template_material` (`template_phase_id`, `material_title`, `material_offset`, `material_description`, `material_order`) VALUES
(@phase_id, 'Slab materials ordered/scheduled', 2, 'Fill/Plastic/Rebar/Concrete ordered and scheduled', 0),
(@phase_id, 'Foundation material (Rebar)', 0, 'Delivery of rebar and foundation materials', 1),
(@phase_id, 'Block work material', 3, 'Delivery of blocks and related materials', 2);

-- Phase 3: Foundation (order 2)
INSERT INTO `template_phase` (`template_id`, `phase_title`, `phase_description`, `phase_order`)
VALUES (@slab_id, 'Foundation', 'Foundation construction and slab work', 2);
SET @phase_id = LAST_INSERT_ID();

INSERT INTO `template_task` (`template_phase_id`, `task_title`, `task_duration`, `task_offset`, `task_description`, `task_order`) VALUES
(@phase_id, 'Termite company contacted', 1, 7, 'Contact termite company to spray lot', 0),
(@phase_id, 'Fill slab', 2, 7, 'Fill and prepare slab area', 1),
(@phase_id, 'Form Porch', 2, 7, 'Construct porch forms', 2),
(@phase_id, 'Rough plumbing installed', 2, 9, 'Install rough plumbing', 3),
(@phase_id, 'Plumber install dryer vent (if needed)', 2, 9, 'Install dryer vent', 4),
(@phase_id, 'Final blocks layed', 1, 11, 'Complete block laying', 5),
(@phase_id, 'Lay Plastic', 1, 12, 'Install plastic barrier', 6),
(@phase_id, 'Slabs poured', 1, 13, 'Pour concrete slabs', 7),
(@phase_id, 'Step Footer poured', 1, 13, 'Pour step footers', 8),
(@phase_id, 'Patios poured', 1, 13, 'Pour patio slabs', 9),
(@phase_id, 'Garages poured (if needed)', 2, 13, 'Pour garage slabs', 10);

INSERT INTO `template_material` (`template_phase_id`, `material_title`, `material_offset`, `material_description`, `material_order`) VALUES
(@phase_id, 'Slab Materials delivered', 10, 'Delivery of slab materials', 0),
(@phase_id, 'Termite spray', 12, 'Delivery of termite treatment', 1);

-- Phase 4: Framing (order 3)
INSERT INTO `template_phase` (`template_id`, `phase_title`, `phase_description`, `phase_order`)
VALUES (@slab_id, 'Framing', 'Framing construction and material ordering', 3);
SET @phase_id = LAST_INSERT_ID();

INSERT INTO `template_task` (`template_phase_id`, `task_title`, `task_duration`, `task_offset`, `task_description`, `task_order`) VALUES
(@phase_id, 'Install steps', 4, 18, 'Install house steps', 0),
(@phase_id, 'Frame house', 4, 18, 'Complete house framing', 1),
(@phase_id, 'Blocks painted (if needed)', 1, 22, 'Paint foundation blocks', 2);

INSERT INTO `template_material` (`template_phase_id`, `material_title`, `material_offset`, `material_description`, `material_order`) VALUES
(@phase_id, 'Deliver framing package', 15, 'Delivery of framing materials', 0),
(@phase_id, 'Trusses delivered (if needed)', 14, 'Delivery of roof trusses', 1),
(@phase_id, 'Deliver windows/exterior doors', 21, 'Delivery of windows and exterior doors', 2),
(@phase_id, 'Deliver shingles', 21, 'Delivery of roofing shingles', 3),
(@phase_id, 'Doors', 10, 'Order interior doors', 4),
(@phase_id, 'Door Knobs', 10, 'Order door hardware', 5),
(@phase_id, 'Cabinets/vanities', 15, 'Order cabinet and vanity units', 6),
(@phase_id, 'Cabinet pulls', 15, 'Order cabinet hardware', 7),
(@phase_id, 'Counter tops', 20, 'Order counter tops', 8),
(@phase_id, 'Kitchen sink', 10, 'Order kitchen sink', 9),
(@phase_id, 'Garage Door (if needed)', 20, 'Order garage door', 10),
(@phase_id, 'Trim Material', 20, 'Order trim materials', 11),
(@phase_id, 'Hand rail (if needed)', 10, 'Order handrails', 12),
(@phase_id, 'Specialty items', 10, 'Order specialty items', 13),
(@phase_id, 'Water heater', 20, 'Order water heater', 14),
(@phase_id, 'Vanity Faucet', 10, 'Order vanity faucets', 15),
(@phase_id, 'Kitchen Faucet', 10, 'Order kitchen faucet', 16),
(@phase_id, 'Tub/shower faucet', 10, 'Order tub and shower faucets', 17),
(@phase_id, 'Toilets', 20, 'Order toilets', 18),
(@phase_id, 'Light fixtures', 20, 'Order light fixtures', 19),
(@phase_id, 'Ceiling Fans', 25, 'Order ceiling fans', 20),
(@phase_id, 'Bathroom Kits', 20, 'Order bathroom accessory kits', 21),
(@phase_id, 'Vanity Mirrors', 25, 'Order vanity mirrors', 22),
(@phase_id, 'Sheetrock', 20, 'Order sheetrock materials', 23),
(@phase_id, 'Tile (if needed)', 10, 'Order tile materials', 24);

-- Phase 5: Rough in to Sheetrock (order 4)
INSERT INTO `template_phase` (`template_id`, `phase_title`, `phase_description`, `phase_order`)
VALUES (@slab_id, 'Rough in to Sheetrock', 'Rough-in work and major installations', 4);
SET @phase_id = LAST_INSERT_ID();

INSERT INTO `template_task` (`template_phase_id`, `task_title`, `task_duration`, `task_offset`, `task_description`, `task_order`) VALUES
(@phase_id, 'Install Roof', 1, 22, 'Install roofing materials', 0),
(@phase_id, 'Install Siding', 3, 26, 'Install siding materials', 1),
(@phase_id, 'Install Brick (if needed)', 4, 26, 'Install brick facade', 2),
(@phase_id, 'Electric Rough-in', 4, 23, 'Complete electrical rough-in', 3),
(@phase_id, 'HVAC Rough-in (including bath vents)', 4, 23, 'Complete HVAC system rough-in', 4),
(@phase_id, 'Plumbing Rough-in', 2, 22, 'Complete plumbing rough-in', 5),
(@phase_id, 'Insulate interior walls', 3, 27, 'Install wall insulation', 6),
(@phase_id, 'Install sheetrock', 6, 32, 'Install sheetrock throughout', 7),
(@phase_id, 'Insulate Attic', 2, 29, 'Install attic insulation', 8),
(@phase_id, 'Connect permanant power', 3, 36, 'Connect permanent electrical service', 9);

INSERT INTO `template_material` (`template_phase_id`, `material_title`, `material_offset`, `material_description`, `material_order`) VALUES
(@phase_id, 'Deliver Tubs', 22, 'Delivery of bathtubs and shower units', 0),
(@phase_id, 'Deliver Siding', 24, 'Delivery of siding materials', 1),
(@phase_id, 'Deliver sheetrock', 31, 'Delivery of sheetrock materials', 2),
(@phase_id, 'Mirrors', 30, 'Order additional mirrors', 3),
(@phase_id, 'Vanity Lights', 30, 'Order vanity lights', 4),
(@phase_id, 'Porch Light Front', 35, 'Order front porch light', 5),
(@phase_id, 'Porch Light Motion', 40, 'Order motion sensor porch light', 6);

-- Phase 6: Trim Out & Exterior Finish (order 5)
INSERT INTO `template_phase` (`template_id`, `phase_title`, `phase_description`, `phase_order`)
VALUES (@slab_id, 'Trim Out & Exterior Finish', 'Interior finishing and exterior completion', 5);
SET @phase_id = LAST_INSERT_ID();

INSERT INTO `template_task` (`template_phase_id`, `task_title`, `task_duration`, `task_offset`, `task_description`, `task_order`) VALUES
(@phase_id, 'Tile installed (if needed)', 4, 42, 'Install tile flooring', 0),
(@phase_id, 'Trim out/closet build out', 3, 39, 'Install trim and build closets', 1),
(@phase_id, 'Paint Interior', 5, 42, 'Paint interior surfaces', 2),
(@phase_id, 'Paint/Stain Exterior (if needed)', 5, 42, 'Paint or stain exterior surfaces', 3),
(@phase_id, 'Underground Utilities ran (if needed)', 1, 43, 'Run underground utilities', 4),
(@phase_id, 'Install Exterior Electric/Meter', 3, 43, 'Install exterior electrical and meter', 5),
(@phase_id, 'Call Entergy for Permanent Power', 3, 46, 'Arrange permanent power connection', 6),
(@phase_id, 'Install Flooring', 4, 51, 'Install flooring materials', 7),
(@phase_id, 'Install Cabinets', 2, 52, 'Install cabinet units', 8),
(@phase_id, 'Electric Top Out', 3, 48, 'Complete electrical finishing', 9),
(@phase_id, 'HVAC Top Out', 3, 48, 'Complete HVAC finishing', 10),
(@phase_id, 'Install appliances', 2, 56, 'Install all appliances', 11),
(@phase_id, 'Deck/patio installation', 2, 51, 'Install deck and patio', 12),
(@phase_id, 'Install Garage Door (if needed)', 2, 51, 'Install garage door', 13),
(@phase_id, 'Main water line/sewer connection', 2, 51, 'Connect main utilities', 14),
(@phase_id, 'Concrete driveway/sidewalks installed', 2, 49, 'Install concrete surfaces', 15);

INSERT INTO `template_material` (`template_phase_id`, `material_title`, `material_offset`, `material_description`, `material_order`) VALUES
(@phase_id, 'Deliver trim package/doors', 38, 'Delivery of trim and doors', 0),
(@phase_id, 'Deliver flooring', 49, 'Delivery of flooring materials', 1),
(@phase_id, 'Deliver cabinets', 47, 'Delivery of cabinet units', 2),
(@phase_id, 'Deliver electric fixtures', 47, 'Delivery of electrical fixtures', 3),
(@phase_id, 'Deliver Appliances', 55, 'Delivery of all appliances', 4),
(@phase_id, 'Deliver plumbing items', 55, 'Delivery of sink, water heater, disposal, fixtures', 5),
(@phase_id, 'Mail box', 30, 'Order mailbox', 6),
(@phase_id, 'Address numbers/letters', 30, 'Order address numbers and letters', 7),
(@phase_id, 'Sod (if needed)', 40, 'Order sod materials', 8),
(@phase_id, 'Privacy fence materials (if needed)', 40, 'Order privacy fence materials', 9);

-- Phase 7: Interior Finish (order 6)
INSERT INTO `template_phase` (`template_id`, `phase_title`, `phase_description`, `phase_order`)
VALUES (@slab_id, 'Interior Finish', 'Final interior finishing and inspections', 6);
SET @phase_id = LAST_INSERT_ID();

INSERT INTO `template_task` (`template_phase_id`, `task_title`, `task_duration`, `task_offset`, `task_description`, `task_order`) VALUES
(@phase_id, 'Pre punch out list', 2, 56, 'Complete pre-punch out inspection', 0),
(@phase_id, 'Plumbing Final', 3, 56, 'Final plumbing inspection', 1),
(@phase_id, 'Electric Final', 2, 59, 'Final electrical inspection', 2),
(@phase_id, 'Install mail box/address numbers', 1, 59, 'Install mailbox and address numbers', 3),
(@phase_id, 'Touch up paint/1/4 round', 1, 58, 'Complete paint touch ups and quarter round installation', 4);

-- Phase 8: Final (order 7)
INSERT INTO `template_phase` (`template_id`, `phase_title`, `phase_description`, `phase_order`)
VALUES (@slab_id, 'Final', 'Final completion tasks', 7);
SET @phase_id = LAST_INSERT_ID();

INSERT INTO `template_task` (`template_phase_id`, `task_title`, `task_duration`, `task_offset`, `task_description`, `task_order`) VALUES
(@phase_id, 'Final punch out', 2, 61, 'Complete final punch out inspection', 0),
(@phase_id, 'Final dirtwork', 2, 60, 'Complete final landscaping and dirt work', 1),
(@phase_id, 'Install privacy fence (if needed)', 2, 61, 'Install privacy fencing', 2),
(@phase_id, 'Clean house', 1, 63, 'Final house cleaning', 3);

INSERT INTO `template_task_contact` (`template_task_id`, `user_id`)
SELECT tt.template_task_id, u.user_id
FROM template_task tt
CROSS JOIN (SELECT 1 AS user_id UNION SELECT 2 UNION SELECT 3) u;

INSERT INTO `template_material_contact` (`template_material_id`, `user_id`)
SELECT tm.template_material_id, u.user_id
FROM template_material tm
CROSS JOIN (SELECT 1 AS user_id UNION SELECT 2 UNION SELECT 3) u;
