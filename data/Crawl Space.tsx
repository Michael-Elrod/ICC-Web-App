import { FormPhase } from "@/app/types/database";

const PREPLANNING_PHASE: FormPhase = {
  tempId: "",
  title: "Pre-Planning",
  startDate: "",
  description: "Initial planning and preparation phase",
  tasks: [
    { 
      id: "", 
      title: "Architect Plans Printed", 
      startDate: "", 
      duration: "1",
      offset: 0,
      details: "Get architectural plans printed",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    },
    { 
      id: "", 
      title: "Survey", 
      startDate: "", 
      duration: "1",
      offset: 0,
      details: "Complete property survey",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    },
    { 
      id: "", 
      title: "Contact electric company for layout/access", 
      startDate: "", 
      duration: "1",
      offset: 0,
      details: "Coordinate with electric company",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    },
    { 
      id: "", 
      title: "Contact water/sewer company for layout/access", 
      startDate: "", 
      duration: "1",
      offset: 0,
      details: "Coordinate with water/sewer company",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    },
    { 
      id: "", 
      title: "Contact cable company for layout/access", 
      startDate: "", 
      duration: "1",
      offset: 0,
      details: "Coordinate with cable company",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    },
    { 
      id: "", 
      title: "Contact gas company for layout/access", 
      startDate: "", 
      duration: "1",
      offset: 0,
      details: "Coordinate with gas company",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    },
    { 
      id: "", 
      title: "Contact backhoe operator", 
      startDate: "", 
      duration: "1",
      offset: 0,
      details: "Schedule backhoe operator",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    },
    { 
      id: "", 
      title: "Contact truss company (if needed)", 
      startDate: "", 
      duration: "1",
      offset: 0,
      details: "Coordinate with truss company",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    },
    { 
      id: "", 
      title: "Portable Toilet", 
      startDate: "", 
      duration: "1",
      offset: 0,
      details: "Arrange portable toilet delivery",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    },
    { 
      id: "", 
      title: "Temporary Water (meter paid for)", 
      startDate: "", 
      duration: "1",
      offset: 0,
      details: "Pay for water meter",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    },
    { 
      id: "", 
      title: "Sewer (paid for)", 
      startDate: "", 
      duration: "1",
      offset: 0,
      details: "Pay for sewer connection",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    },
    { 
      id: "", 
      title: "Temporary Power", 
      startDate: "", 
      duration: "1",
      offset: 0,
      details: "Set up temporary power",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    },
    { 
      id: "", 
      title: "Temporary Water installed", 
      startDate: "", 
      duration: "1",
      offset: 0,
      details: "Install temporary water",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    },
    { 
      id: "", 
      title: "Dirt Work/tree removal to prep lot", 
      startDate: "", 
      duration: "1",
      offset: 0,
      details: "Prepare lot",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    },
    { 
      id: "", 
      title: "One Call Lot", 
      startDate: "", 
      duration: "1",
      offset: -10,  // 2 weeks before start date
      details: "Schedule One Call for lot inspection",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    }
  ],
  materials: [
    { 
      id: "", 
      title: "Windows", 
      dueDate: "",
      offset: 0,
      details: "Order and arrange delivery of windows",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    },
    { 
      id: "", 
      title: "Siding", 
      dueDate: "",
      offset: 0,
      details: "Order and arrange delivery of siding materials",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    },
    { 
      id: "", 
      title: "Posts", 
      dueDate: "",
      offset: 0,
      details: "Order and arrange delivery of posts",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    },
    { 
      id: "", 
      title: "Exterior Doors", 
      dueDate: "",
      offset: 0,
      details: "Order and arrange delivery of exterior doors",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    },
    { 
      id: "", 
      title: "Shingles/Metal", 
      dueDate: "",
      offset: 0,
      details: "Order and arrange delivery of roofing materials",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    },
    { 
      id: "", 
      title: "Tub/Showers", 
      dueDate: "",
      offset: 0,
      details: "Order and arrange delivery of tub/shower units",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    },
    { 
      id: "", 
      title: "HVAC Equipment", 
      dueDate: "",
      offset: 0,
      details: "Order and arrange delivery of HVAC equipment",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    },
    { 
      id: "", 
      title: "Flooring", 
      dueDate: "",
      offset: 0,
      details: "Order and arrange delivery of flooring materials",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    },
    { 
      id: "", 
      title: "Materials ordered for block work", 
      dueDate: "", 
      offset: -5,   // 1 week before start date
      details: "Order blocks, vents, and anchors",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    }
  ],
  notes: []
};

const CONSTRUCTION_START_PHASE: FormPhase = {
  tempId: "",
  title: "Construction Start",
  startDate: "",
  description: "Initial construction phase including foundation work",
  tasks: [
    { 
      id: "", 
      title: "Dig Footers & Pour Concrete", 
      startDate: "", 
      duration: "2",
      offset: 0,
      details: "Excavate footers and pour concrete foundation",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    },
    { 
      id: "", 
      title: "Termite company contacted", 
      startDate: "", 
      duration: "1",
      offset: 4,
      details: "Contact termite company to spray lot",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    },
    { 
      id: "", 
      title: "Blocks layed", 
      startDate: "", 
      duration: "3",
      offset: 4,
      details: "Lay concrete blocks for foundation",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    }
  ],
  materials: [
    { 
      id: "", 
      title: "Foundation material (Rebar)", 
      dueDate: "",
      offset: 2,
      details: "Delivery of rebar and foundation materials",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    },
    { 
      id: "", 
      title: "Block work material", 
      dueDate: "",
      offset: 3,
      details: "Delivery of blocks and related materials",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    }
  ],
  notes: []
 };

 const FOUNDATION_PHASE: FormPhase = {
  tempId: "",
  title: "Foundation",
  startDate: "",
  description: "Main foundation work and utilities",
  tasks: [
    { 
      id: "", 
      title: "Rough plumbing installed", 
      startDate: "", 
      duration: "2",
      offset: 12,
      details: "Install rough plumbing",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    },
    { 
      id: "", 
      title: "Lay Plastic", 
      startDate: "", 
      duration: "1",
      offset: 7,
      details: "Install plastic barrier",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    },
    { 
      id: "", 
      title: "Garages poured (if needed)", 
      startDate: "", 
      duration: "1",
      offset: 7,
      details: "Pour garage slabs",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    },
  ],
  materials: [
    { 
      id: "", 
      title: "Deliver Tubs", 
      dueDate: "",
      offset: 5,
      details: "Delivery of bathtubs and shower units",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    },
    { 
      id: "", 
      title: "Deliver framing package", 
      dueDate: "",
      offset: 7,
      details: "Delivery of framing materials",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    },
    { 
      id: "", 
      title: "Trusses delivered (if needed)", 
      dueDate: "",
      offset: 6,
      details: "Delivery of roof trusses",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    }
  ],
  notes: []
 };

 const FRAMING_PHASE: FormPhase = {
  tempId: "",
  title: "Framing",
  startDate: "",
  description: "Framing construction and material ordering",
  tasks: [
    { 
      id: "", 
      title: "Frame house", 
      startDate: "", 
      duration: "4",
      offset: 8,
      details: "Complete house framing",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    },
    { 
      id: "", 
      title: "Blocks painted (if needed)", 
      startDate: "", 
      duration: "1",
      offset: 12,
      details: "Paint foundation blocks",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    }
  ],
  materials: [
    { 
      id: "", 
      title: "Deliver windows/exterior doors", 
      dueDate: "",
      offset: 11,
      details: "Delivery of windows and exterior doors",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    },
    { 
      id: "", 
      title: "Deliver shingles", 
      dueDate: "",
      offset: 11,
      details: "Delivery of roofing shingles",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    },
    { 
      id: "", 
      title: "Doors", 
      dueDate: "",
      offset: 10, // 2 weeks * 5 days
      details: "Order interior doors",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    },
    { 
      id: "", 
      title: "Door Knobs", 
      dueDate: "",
      offset: 10, // 2 weeks * 5 days
      details: "Order door hardware",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    },
    { 
      id: "", 
      title: "Cabinets/vanities", 
      dueDate: "",
      offset: 15, // 3 weeks * 5 days
      details: "Order cabinet and vanity units",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    },
    { 
      id: "", 
      title: "Cabinet pulls", 
      dueDate: "",
      offset: 15, // 3 weeks * 5 days
      details: "Order cabinet hardware",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    },
    { 
      id: "", 
      title: "Kitchen sink", 
      dueDate: "",
      offset: 10, // 2 weeks * 5 days
      details: "Order kitchen sink",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    },

    { 
      id: "", 
      title: "Hand rail (if needed)", 
      dueDate: "",
      offset: 10, // 2 weeks * 5 days
      details: "Order handrails",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    },
    { 
      id: "", 
      title: "Specialty items", 
      dueDate: "",
      offset: 10, // 2 weeks * 5 days
      details: "Order specialty items",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    },
    { 
      id: "", 
      title: "Vanity Faucet", 
      dueDate: "",
      offset: 10, // 2 weeks * 5 days
      details: "Order vanity faucets",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    },
    { 
      id: "", 
      title: "Kitchen Faucet", 
      dueDate: "",
      offset: 10, // 2 weeks * 5 days
      details: "Order kitchen faucet",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    },
    { 
      id: "", 
      title: "Tub/shower faucet", 
      dueDate: "",
      offset: 10, // 2 weeks * 5 days
      details: "Order tub and shower faucets",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    },
    { 
      id: "", 
      title: "Tile (if needed)", 
      dueDate: "",
      offset: 10, // 2 weeks * 5 days
      details: "Order tile materials",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    }
  ],
  notes: []
 };

 const ROUGH_IN_PHASE: FormPhase = {
  tempId: "",
  title: "Rough in to Sheetrock",
  startDate: "",
  description: "Rough-in work and major installations",
  tasks: [
    { 
      id: "", 
      title: "Install Roof", 
      startDate: "", 
      duration: "3",
      offset: 12,
      details: "Install roofing materials",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    },
    { 
      id: "", 
      title: "Install Siding", 
      startDate: "", 
      duration: "3",
      offset: 16,
      details: "Install siding materials",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    },
    { 
      id: "", 
      title: "Install Brick (if needed)", 
      startDate: "", 
      duration: "4",
      offset: 16,
      details: "Install brick facade",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    },
    { 
      id: "", 
      title: "Electric Rough-in", 
      startDate: "", 
      duration: "4",
      offset: 13,
      details: "Complete electrical rough-in",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    },
    { 
      id: "", 
      title: "HVAC Rough-in (including bath vents)", 
      startDate: "", 
      duration: "4",
      offset: 13,
      details: "Complete HVAC system rough-in",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    },
    { 
      id: "", 
      title: "Plumbing Rough-in", 
      startDate: "", 
      duration: "2",
      offset: 12,
      details: "Complete plumbing rough-in",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    },
    { 
      id: "", 
      title: "Insulate exterior walls", 
      startDate: "", 
      duration: "3",
      offset: 17,
      details: "Install exterior wall insulation",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    },
    { 
      id: "", 
      title: "Install sheetrock", 
      startDate: "", 
      duration: "6",
      offset: 22,
      details: "Install sheetrock throughout",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    },
    { 
      id: "", 
      title: "Insulate Attic", 
      startDate: "", 
      duration: "2",
      offset: 29,
      details: "Install attic insulation",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    },
    { 
      id: "", 
      title: "Inspection day", 
      startDate: "", 
      duration: "1",
      offset: 20,
      details: "Complete inspection",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    }
  ],
  materials: [
    { 
      id: "", 
      title: "Deliver Siding", 
      dueDate: "",
      offset: 15,
      details: "Delivery of siding materials",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    },
    { 
      id: "", 
      title: "Garage Door (if needed)", 
      dueDate: "",
      offset: 20, // 4 weeks * 5 days
      details: "Order garage door",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    },
    { 
      id: "", 
      title: "Trim Material", 
      dueDate: "",
      offset: 20, // 4 weeks * 5 days
      details: "Order trim materials",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    },
    { 
      id: "", 
      title: "Counter tops", 
      dueDate: "",
      offset: 20, // 4 weeks * 5 days
      details: "Order counter tops",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    },
    { 
      id: "", 
      title: "Sheetrock", 
      dueDate: "",
      offset: 20, // 4 weeks * 5 days
      details: "Order sheetrock materials",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    },
    { 
      id: "", 
      title: "Water heater", 
      dueDate: "",
      offset: 20, // 4 weeks * 5 days
      details: "Order water heater",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    },
    { 
      id: "", 
      title: "Toilets", 
      dueDate: "",
      offset: 20, // 4 weeks * 5 days
      details: "Order toilets",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    },
    { 
      id: "", 
      title: "Light fixtures", 
      dueDate: "",
      offset: 20, // 4 weeks * 5 days
      details: "Order light fixtures",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    },
    { 
      id: "", 
      title: "Bathroom Kits", 
      dueDate: "",
      offset: 20, // 4 weeks * 5 days
      details: "Order bathroom accessory kits",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    },
    { 
      id: "", 
      title: "Deliver sheetrock", 
      dueDate: "",
      offset: 21,
      details: "Delivery of sheetrock materials",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    }
  ],
  notes: []
 };

 const TRIM_OUT_PHASE: FormPhase = {
  tempId: "",
  title: "Trim Out & Exterior Finish",
  startDate: "",
  description: "Interior finishing and exterior completion",
  tasks: [
    { 
      id: "", 
      title: "Tile installed (if needed)", 
      startDate: "", 
      duration: "1",
      offset: 32,
      details: "Install tile flooring",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    },
    { 
      id: "", 
      title: "Trim out", 
      startDate: "", 
      duration: "3",
      offset: 29,
      details: "Install trim throughout",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    },
    { 
      id: "", 
      title: "Termite spray", 
      startDate: "", 
      duration: "1",
      offset: 31,
      details: "Apply termite treatment",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    },
    { 
      id: "", 
      title: "Paint Interior", 
      startDate: "", 
      duration: "5",
      offset: 32,
      details: "Paint interior surfaces",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    },
    { 
      id: "", 
      title: "Paint/Stain Exterior (if needed)", 
      startDate: "", 
      duration: "5",
      offset: 32,
      details: "Paint or stain exterior surfaces",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    },
    { 
      id: "", 
      title: "Underground Utilities ran (if needed)", 
      startDate: "", 
      duration: "1",
      offset: 33,
      details: "Run underground utilities",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    },
    { 
      id: "", 
      title: "Install Exterior Electric/Meter", 
      startDate: "", 
      duration: "3",
      offset: 33,
      details: "Install exterior electrical and meter",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    },
    { 
      id: "", 
      title: "Call Entergy for Permanent Power", 
      startDate: "", 
      duration: "3",
      offset: 40,
      details: "Arrange permanent power connection",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    },
    { 
      id: "", 
      title: "Install Flooring", 
      startDate: "", 
      duration: "4",
      offset: 41,
      details: "Install flooring materials",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    },
    { 
      id: "", 
      title: "Install Cabinets", 
      startDate: "", 
      duration: "2",
      offset: 38,
      details: "Install cabinet units",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    },
    { 
      id: "", 
      title: "Electric Top Out", 
      startDate: "", 
      duration: "3",
      offset: 38,
      details: "Complete electrical finishing",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    },
    { 
      id: "", 
      title: "HVAC Top Out", 
      startDate: "", 
      duration: "3",
      offset: 38,
      details: "Complete HVAC finishing",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    },
    { 
      id: "", 
      title: "Install appliances", 
      startDate: "", 
      duration: "2",
      offset: 46,
      details: "Install all appliances",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    },
    { 
      id: "", 
      title: "Install Garage Door (if needed)", 
      startDate: "", 
      duration: "2",
      offset: 41,
      details: "Install garage door",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    },
    { 
      id: "", 
      title: "Main water line/sewer connection", 
      startDate: "", 
      duration: "2",
      offset: 46,
      details: "Connect main utilities",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    },
    { 
      id: "", 
      title: "Concrete driveway/sidewalks installed", 
      startDate: "", 
      duration: "2",
      offset: 49,
      details: "Install concrete surfaces",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    },
    { 
      id: "", 
      title: "Install steps", 
      startDate: "", 
      duration: "2",
      offset: 41,
      details: "Install house steps",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    },
    { 
      id: "", 
      title: "Deck/patio installation", 
      startDate: "", 
      duration: "2",
      offset: 41,
      details: "Install deck and patio",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    }
  ],
  materials: [
    { 
      id: "", 
      title: "Ceiling Fans", 
      dueDate: "",
      offset: 25, // 5 weeks * 5 days
      details: "Order ceiling fans",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    },
    { 
      id: "", 
      title: "Vanity Lights", 
      dueDate: "",
      offset: 30, // 6 weeks * 5 days
      details: "Order vanity lights",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    },
    { 
      id: "", 
      title: "Porch Light Front", 
      dueDate: "",
      offset: 35, // 7 weeks * 5 days
      details: "Order front porch light",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    },
    { 
      id: "", 
      title: "Porch Light Motion", 
      dueDate: "",
      offset: 40, // 8 weeks * 5 days
      details: "Order motion sensor porch light",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    },
    { 
      id: "", 
      title: "Vanity Mirrors", 
      dueDate: "",
      offset: 25, // 5 weeks * 5 days
      details: "Order vanity mirrors",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    },
    { 
      id: "", 
      title: "Mirrors", 
      dueDate: "",
      offset: 30, // 6 weeks * 5 days
      details: "Order additional mirrors",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    },
    { 
      id: "", 
      title: "Deliver trim package/doors", 
      dueDate: "",
      offset: 28,
      details: "Delivery of trim and doors",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    },
    { 
      id: "", 
      title: "Deliver flooring", 
      dueDate: "",
      offset: 40,
      details: "Delivery of flooring materials",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    },
    { 
      id: "", 
      title: "Deliver cabinets", 
      dueDate: "",
      offset: 37,
      details: "Delivery of cabinet units",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    },
    { 
      id: "", 
      title: "Deliver electric fixtures", 
      dueDate: "",
      offset: 37,
      details: "Delivery of electrical fixtures",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    },
    { 
      id: "", 
      title: "Deliver Appliances", 
      dueDate: "",
      offset: 45,
      details: "Delivery of all appliances",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    },
    { 
      id: "", 
      title: "Deliver plumbing items", 
      dueDate: "",
      offset: 45,
      details: "Delivery of sink, water heater, disposal, fixtures",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    },
    { 
      id: "", 
      title: "Mail box", 
      dueDate: "",
      offset: 30, // 6 weeks * 5 days
      details: "Order mailbox",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    },
    { 
      id: "", 
      title: "Address numbers/letters", 
      dueDate: "",
      offset: 30, // 6 weeks * 5 days
      details: "Order address numbers and letters",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    },
    { 
      id: "", 
      title: "Sod (if needed)", 
      dueDate: "",
      offset: 40, // 8 weeks * 5 days
      details: "Order sod materials",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    },
    { 
      id: "", 
      title: "Privacy fence materials (if needed)", 
      dueDate: "",
      offset: 40, // 8 weeks * 5 days
      details: "Order privacy fence materials",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    }
  ],
  notes: []
 };

 const INTERIOR_FINISH_PHASE: FormPhase = {
  tempId: "",
  title: "Interior Finish", 
  startDate: "",
  description: "Final interior finishing and inspections",
  tasks: [
    { 
      id: "", 
      title: "Pre punch out list", 
      startDate: "", 
      duration: "2",
      offset: 46,
      details: "Complete pre-punch out inspection",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    },
    { 
      id: "", 
      title: "Plumbing Final", 
      startDate: "", 
      duration: "3",
      offset: 46,
      details: "Final plumbing inspection",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    },
    { 
      id: "", 
      title: "Electric Final", 
      startDate: "", 
      duration: "2", 
      offset: 49,
      details: "Final electrical inspection",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    },
    { 
      id: "", 
      title: "Install mail box/address numbers", 
      startDate: "", 
      duration: "1",
      offset: 49,
      details: "Install mailbox and address numbers",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    },
    { 
      id: "", 
      title: "Touch up paint/1/4 round", 
      startDate: "", 
      duration: "1",
      offset: 48,
      details: "Complete paint touch ups and quarter round installation",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    }
  ],
  materials: [],
  notes: []
 };

 const FINAL_PHASE: FormPhase = {
  tempId: "",
  title: "Final",
  startDate: "",
  description: "Final completion tasks",
  tasks: [
    { 
      id: "", 
      title: "Final punch out", 
      startDate: "", 
      duration: "2",
      offset: 51,
      details: "Complete final punch out inspection",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    },
    { 
      id: "", 
      title: "Final dirtwork", 
      startDate: "", 
      duration: "2",
      offset: 50,
      details: "Complete final landscaping and dirt work",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    },
    { 
      id: "", 
      title: "Install privacy fence (if needed)", 
      startDate: "", 
      duration: "2",
      offset: 51,
      details: "Install privacy fencing",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    },
    { 
      id: "", 
      title: "Clean house", 
      startDate: "", 
      duration: "1",
      offset: 53,
      details: "Final house cleaning",
      isExpanded: false,
      selectedContacts: [{id: '1'}]
    }
  ],
  materials: [],
  notes: []
 };

export const PHASES: FormPhase[] = [
  PREPLANNING_PHASE,
  CONSTRUCTION_START_PHASE,
  FOUNDATION_PHASE,
  FRAMING_PHASE,
  ROUGH_IN_PHASE,
  TRIM_OUT_PHASE,
  INTERIOR_FINISH_PHASE,
  FINAL_PHASE,
];