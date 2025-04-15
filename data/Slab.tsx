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
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    },
    { 
      id: "", 
      title: "Survey", 
      startDate: "", 
      duration: "1",
      offset: 0,
      details: "Complete property survey",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    },
    { 
      id: "", 
      title: "Contact electric company for layout/access", 
      startDate: "", 
      duration: "1",
      offset: 0,
      details: "Coordinate with electric company",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    },
    { 
      id: "", 
      title: "Contact water/sewer company for layout/access", 
      startDate: "", 
      duration: "1",
      offset: 0,
      details: "Coordinate with water/sewer company",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    },
    { 
      id: "", 
      title: "Contact cable company for layout/access", 
      startDate: "", 
      duration: "1",
      offset: 0,
      details: "Coordinate with cable company",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    },
    { 
      id: "", 
      title: "Contact gas company for layout/access", 
      startDate: "", 
      duration: "1",
      offset: 0,
      details: "Coordinate with gas company",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    },
    { 
      id: "", 
      title: "Contact backhoe operator", 
      startDate: "", 
      duration: "1",
      offset: 0,
      details: "Schedule backhoe operator",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    },
    { 
      id: "", 
      title: "Contact truss company (if needed)", 
      startDate: "", 
      duration: "1",
      offset: 0,
      details: "Coordinate with truss company",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    },
    { 
      id: "", 
      title: "Portable Toilet", 
      startDate: "", 
      duration: "1",
      offset: 0,
      details: "Arrange portable toilet delivery",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    },
    { 
      id: "", 
      title: "Temporary Water (meter paid for)", 
      startDate: "", 
      duration: "1",
      offset: 0,
      details: "Pay for water meter",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    },
    { 
      id: "", 
      title: "Sewer (paid for)", 
      startDate: "", 
      duration: "1",
      offset: 0,
      details: "Pay for sewer connection",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    },
    { 
      id: "", 
      title: "Temporary Power", 
      startDate: "", 
      duration: "1",
      offset: 0,
      details: "Set up temporary power",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    },
    { 
      id: "", 
      title: "Temporary Water installed", 
      startDate: "", 
      duration: "1",
      offset: 0,
      details: "Install temporary water",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    },
    { 
      id: "", 
      title: "Dirt Work/tree removal to prep lot", 
      startDate: "", 
      duration: "1",
      offset: 0,
      details: "Prepare lot",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    },
    { 
      id: "", 
      title: "One Call Lot", 
      startDate: "", 
      duration: "1",
      offset: -10,  // 2 weeks before start date
      details: "Schedule One Call for lot inspection",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
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
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    },
    { 
      id: "", 
      title: "Siding", 
      dueDate: "",
      offset: 0,
      details: "Order and arrange delivery of siding materials",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    },
    { 
      id: "", 
      title: "Posts", 
      dueDate: "",
      offset: 0,
      details: "Order and arrange delivery of posts",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    },
    { 
      id: "", 
      title: "Exterior Doors", 
      dueDate: "",
      offset: 0,
      details: "Order and arrange delivery of exterior doors",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    },
    { 
      id: "", 
      title: "Shingles/Metal", 
      dueDate: "",
      offset: 0,
      details: "Order and arrange delivery of roofing materials",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    },
    { 
      id: "", 
      title: "Tub/Showers", 
      dueDate: "",
      offset: 0,
      details: "Order and arrange delivery of tub/shower units",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    },
    { 
      id: "", 
      title: "HVAC Equipment", 
      dueDate: "",
      offset: 0,
      details: "Order and arrange delivery of HVAC equipment",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    },
    { 
      id: "", 
      title: "Flooring", 
      dueDate: "",
      offset: 0,
      details: "Order and arrange delivery of flooring materials",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    },
    { 
      id: "", 
      title: "Materials ordered for block work", 
      dueDate: "", 
      offset: -5,   // 1 week before start date
      details: "Order blocks, vents, and anchors",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
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
      offset: 1,
      details: "Excavate footers and pour concrete foundation",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    },
    { 
      id: "", 
      title: "Blocks layed", 
      startDate: "", 
      duration: "3",
      offset: 4,
      details: "Lay concrete blocks for foundation",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    }
  ],
  materials: [
    { 
      id: "", 
      title: "Slab materials ordered/scheduled", 
      dueDate: "",
      offset: 2,
      details: "Fill/Plastic/Rebar/Concrete ordered and scheduled",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    },
    { 
      id: "", 
      title: "Foundation material (Rebar)", 
      dueDate: "",
      offset: 0,
      details: "Delivery of rebar and foundation materials",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    },
    { 
      id: "", 
      title: "Block work material", 
      dueDate: "",
      offset: 3,
      details: "Delivery of blocks and related materials",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    }
  ],
  notes: []
};

const FOUNDATION_PHASE: FormPhase = {
  tempId: "",
  title: "Foundation",
  startDate: "",
  description: "Foundation construction and slab work",
  tasks: [
    { 
      id: "", 
      title: "Termite company contacted", 
      startDate: "", 
      duration: "1",
      offset: 7,
      details: "Contact termite company to spray lot",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    },
    { 
      id: "", 
      title: "Fill slab", 
      startDate: "", 
      duration: "2",
      offset: 7,
      details: "Fill and prepare slab area",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    },
    { 
      id: "", 
      title: "Form Porch", 
      startDate: "", 
      duration: "2",
      offset: 7,
      details: "Construct porch forms",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    },
    { 
      id: "", 
      title: "Rough plumbing installed", 
      startDate: "", 
      duration: "2",
      offset: 9,
      details: "Install rough plumbing",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    },
    { 
      id: "", 
      title: "Plumber install dryer vent (if needed)", 
      startDate: "", 
      duration: "2",
      offset: 9,
      details: "Install dryer vent",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    },
    { 
      id: "", 
      title: "Final blocks layed", 
      startDate: "", 
      duration: "1",
      offset: 11,
      details: "Complete block laying",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    },
    { 
      id: "", 
      title: "Lay Plastic", 
      startDate: "", 
      duration: "1",
      offset: 12,
      details: "Install plastic barrier",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    },
    { 
      id: "", 
      title: "Slabs poured", 
      startDate: "", 
      duration: "1",
      offset: 13,
      details: "Pour concrete slabs",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    },
    { 
      id: "", 
      title: "Step Footer poured", 
      startDate: "", 
      duration: "1",
      offset: 13,
      details: "Pour step footers",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    },
    { 
      id: "", 
      title: "Patios poured", 
      startDate: "", 
      duration: "1",
      offset: 13,
      details: "Pour patio slabs",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    },
    { 
      id: "", 
      title: "Garages poured (if needed)", 
      startDate: "", 
      duration: "2",
      offset: 13,
      details: "Pour garage slabs",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    }
  ],
  materials: [
    { 
      id: "", 
      title: "Slab Materials delivered", 
      dueDate: "",
      offset: 10,
      details: "Delivery of slab materials",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    },
    { 
      id: "", 
      title: "Termite spray", 
      dueDate: "",
      offset: 12,
      details: "Delivery of termite treatment",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
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
      title: "Install steps", 
      startDate: "", 
      duration: "4",
      offset: 18,
      details: "Install house steps",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    },
    { 
      id: "", 
      title: "Frame house", 
      startDate: "", 
      duration: "4",
      offset: 18,
      details: "Complete house framing",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    },
    { 
      id: "", 
      title: "Blocks painted (if needed)", 
      startDate: "", 
      duration: "1",
      offset: 22,
      details: "Paint foundation blocks",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    }
  ],
  materials: [
    { 
      id: "", 
      title: "Deliver framing package", 
      dueDate: "",
      offset: 15,
      details: "Delivery of framing materials",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    },
    { 
      id: "", 
      title: "Trusses delivered (if needed)", 
      dueDate: "",
      offset: 14,
      details: "Delivery of roof trusses",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    },
    { 
      id: "", 
      title: "Deliver windows/exterior doors", 
      dueDate: "",
      offset: 21,
      details: "Delivery of windows and exterior doors",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    },
    { 
      id: "", 
      title: "Deliver shingles", 
      dueDate: "",
      offset: 21,
      details: "Delivery of roofing shingles",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    },
    { 
      id: "", 
      title: "Doors", 
      dueDate: "",
      offset: 10,
      details: "Order interior doors",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    },
    { 
      id: "", 
      title: "Door Knobs", 
      dueDate: "",
      offset: 10,
      details: "Order door hardware",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    },
    { 
      id: "", 
      title: "Cabinets/vanities", 
      dueDate: "",
      offset: 15,
      details: "Order cabinet and vanity units",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    },
    { 
      id: "", 
      title: "Cabinet pulls", 
      dueDate: "",
      offset: 15,
      details: "Order cabinet hardware",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    },
    { 
      id: "", 
      title: "Counter tops", 
      dueDate: "",
      offset: 20,
      details: "Order counter tops",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    },
    { 
      id: "", 
      title: "Kitchen sink", 
      dueDate: "",
      offset: 10,
      details: "Order kitchen sink",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    },
    { 
      id: "", 
      title: "Garage Door (if needed)", 
      dueDate: "",
      offset: 20,
      details: "Order garage door",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    },
    { 
      id: "", 
      title: "Trim Material", 
      dueDate: "",
      offset: 20,
      details: "Order trim materials",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    },
    { 
      id: "", 
      title: "Hand rail (if needed)", 
      dueDate: "",
      offset: 10,
      details: "Order handrails",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    },
    { 
      id: "", 
      title: "Specialty items", 
      dueDate: "",
      offset: 10,
      details: "Order specialty items",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    },
    { 
      id: "", 
      title: "Water heater", 
      dueDate: "",
      offset: 20,
      details: "Order water heater",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    },
    { 
      id: "", 
      title: "Vanity Faucet", 
      dueDate: "",
      offset: 10,
      details: "Order vanity faucets",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    },
    { 
      id: "", 
      title: "Kitchen Faucet", 
      dueDate: "",
      offset: 10,
      details: "Order kitchen faucet",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    },
    { 
      id: "", 
      title: "Tub/shower faucet", 
      dueDate: "",
      offset: 10,
      details: "Order tub and shower faucets",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    },
    { 
      id: "", 
      title: "Toilets", 
      dueDate: "",
      offset: 20,
      details: "Order toilets",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    },
    { 
      id: "", 
      title: "Light fixtures", 
      dueDate: "",
      offset: 20,
      details: "Order light fixtures",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    },
    { 
      id: "", 
      title: "Ceiling Fans", 
      dueDate: "",
      offset: 25,
      details: "Order ceiling fans",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    },
    { 
      id: "", 
      title: "Bathroom Kits", 
      dueDate: "",
      offset: 20,
      details: "Order bathroom accessory kits",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    },
    { 
      id: "", 
      title: "Vanity Mirrors", 
      dueDate: "",
      offset: 25,
      details: "Order vanity mirrors",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    },
    { 
      id: "", 
      title: "Sheetrock", 
      dueDate: "",
      offset: 20,
      details: "Order sheetrock materials",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    },
    { 
      id: "", 
      title: "Tile (if needed)", 
      dueDate: "",
      offset: 10,
      details: "Order tile materials",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
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
      duration: "1",
      offset: 22,
      details: "Install roofing materials",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    },
    { 
      id: "", 
      title: "Install Siding", 
      startDate: "", 
      duration: "3",
      offset: 26,
      details: "Install siding materials",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    },
    { 
      id: "", 
      title: "Install Brick (if needed)", 
      startDate: "", 
      duration: "4",
      offset: 26,
      details: "Install brick facade",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    },
    { 
      id: "", 
      title: "Electric Rough-in", 
      startDate: "", 
      duration: "4",
      offset: 23,
      details: "Complete electrical rough-in",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    },
    { 
      id: "", 
      title: "HVAC Rough-in (including bath vents)", 
      startDate: "", 
      duration: "4",
      offset: 23,
      details: "Complete HVAC system rough-in",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    },
    { 
      id: "", 
      title: "Plumbing Rough-in", 
      startDate: "", 
      duration: "2",
      offset: 22,
      details: "Complete plumbing rough-in",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    },
    { 
      id: "", 
      title: "Insulate interior walls", 
      startDate: "", 
      duration: "3",
      offset: 27,
      details: "Install wall insulation",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    },
    { 
      id: "", 
      title: "Install sheetrock", 
      startDate: "", 
      duration: "6",
      offset: 32,
      details: "Install sheetrock throughout",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    },
    { 
      id: "", 
      title: "Insulate Attic", 
      startDate: "", 
      duration: "2",
      offset: 29,
      details: "Install attic insulation",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    },
    { 
      id: "", 
      title: "Connect permanant power", 
      startDate: "", 
      duration: "3",
      offset: 36,
      details: "Connect permanent electrical service",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    }
  ],
  materials: [
    { 
      id: "", 
      title: "Deliver Tubs", 
      dueDate: "",
      offset: 22,
      details: "Delivery of bathtubs and shower units",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    },
    { 
      id: "", 
      title: "Deliver Siding", 
      dueDate: "",
      offset: 24,
      details: "Delivery of siding materials",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    },
    { 
      id: "", 
      title: "Deliver sheetrock", 
      dueDate: "",
      offset: 31,
      details: "Delivery of sheetrock materials",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    },
    { 
      id: "", 
      title: "Mirrors", 
      dueDate: "",
      offset: 30,
      details: "Order additional mirrors",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    },
    { 
      id: "", 
      title: "Vanity Lights", 
      dueDate: "",
      offset: 30,
      details: "Order vanity lights",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    },
    { 
      id: "", 
      title: "Porch Light Front", 
      dueDate: "",
      offset: 35,
      details: "Order front porch light",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    },
    { 
      id: "", 
      title: "Porch Light Motion", 
      dueDate: "",
      offset: 40,
      details: "Order motion sensor porch light",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
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
      duration: "4",
      offset: 42,
      details: "Install tile flooring",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    },
    { 
      id: "", 
      title: "Trim out/closet build out", 
      startDate: "", 
      duration: "3",
      offset: 39,
      details: "Install trim and build closets",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    },
    { 
      id: "", 
      title: "Paint Interior", 
      startDate: "", 
      duration: "5",
      offset: 42,
      details: "Paint interior surfaces",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    },
    { 
      id: "", 
      title: "Paint/Stain Exterior (if needed)", 
      startDate: "", 
      duration: "5",
      offset: 42,
      details: "Paint or stain exterior surfaces",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    },
    { 
      id: "", 
      title: "Underground Utilities ran (if needed)", 
      startDate: "", 
      duration: "1",
      offset: 43,
      details: "Run underground utilities",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    },
    { 
      id: "", 
      title: "Install Exterior Electric/Meter", 
      startDate: "", 
      duration: "3",
      offset: 43,
      details: "Install exterior electrical and meter",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    },
    { 
      id: "", 
      title: "Call Entergy for Permanent Power", 
      startDate: "", 
      duration: "3",
      offset: 46,
      details: "Arrange permanent power connection",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    },
    { 
      id: "", 
      title: "Install Flooring", 
      startDate: "", 
      duration: "4",
      offset: 51,
      details: "Install flooring materials",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    },
    { 
      id: "", 
      title: "Install Cabinets", 
      startDate: "", 
      duration: "2",
      offset: 52,
      details: "Install cabinet units",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    },
    { 
      id: "", 
      title: "Electric Top Out", 
      startDate: "", 
      duration: "3",
      offset: 48,
      details: "Complete electrical finishing",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    },
    { 
      id: "", 
      title: "HVAC Top Out", 
      startDate: "", 
      duration: "3",
      offset: 48,
      details: "Complete HVAC finishing",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    },
    { 
      id: "", 
      title: "Install appliances", 
      startDate: "", 
      duration: "2",
      offset: 56,
      details: "Install all appliances",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    },
    { 
      id: "", 
      title: "Deck/patio installation", 
      startDate: "", 
      duration: "2",
      offset: 51,
      details: "Install deck and patio",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    },
    { 
      id: "", 
      title: "Install Garage Door (if needed)", 
      startDate: "", 
      duration: "2",
      offset: 51,
      details: "Install garage door",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    },
    { 
      id: "", 
      title: "Main water line/sewer connection", 
      startDate: "", 
      duration: "2",
      offset: 51,
      details: "Connect main utilities",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    },
    { 
      id: "", 
      title: "Concrete driveway/sidewalks installed", 
      startDate: "", 
      duration: "2",
      offset: 49,
      details: "Install concrete surfaces",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    }
  ],
  materials: [
    { 
      id: "", 
      title: "Deliver trim package/doors", 
      dueDate: "",
      offset: 38,
      details: "Delivery of trim and doors",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    },
    { 
      id: "", 
      title: "Deliver flooring", 
      dueDate: "",
      offset: 49,
      details: "Delivery of flooring materials",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    },
    { 
      id: "", 
      title: "Deliver cabinets", 
      dueDate: "",
      offset: 47,
      details: "Delivery of cabinet units",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    },
    { 
      id: "", 
      title: "Deliver electric fixtures", 
      dueDate: "",
      offset: 47,
      details: "Delivery of electrical fixtures",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    },
    { 
      id: "", 
      title: "Deliver Appliances", 
      dueDate: "",
      offset: 55,
      details: "Delivery of all appliances",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    },
    { 
      id: "", 
      title: "Deliver plumbing items", 
      dueDate: "",
      offset: 55,
      details: "Delivery of sink, water heater, disposal, fixtures",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    },
    { 
      id: "", 
      title: "Mail box", 
      dueDate: "",
      offset: 30, // 6 weeks * 5 days = 30 days
      details: "Order mailbox",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    },
    { 
      id: "", 
      title: "Address numbers/letters", 
      dueDate: "",
      offset: 30, // 6 weeks * 5 days = 30 days
      details: "Order address numbers and letters",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    },
    { 
      id: "", 
      title: "Sod (if needed)", 
      dueDate: "",
      offset: 40, // 8 weeks * 5 days = 40 days
      details: "Order sod materials",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    },
    { 
      id: "", 
      title: "Privacy fence materials (if needed)", 
      dueDate: "",
      offset: 40, // 8 weeks * 5 days = 40 days
      details: "Order privacy fence materials",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
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
      offset: 56,
      details: "Complete pre-punch out inspection",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    },
    { 
      id: "", 
      title: "Plumbing Final", 
      startDate: "", 
      duration: "3",
      offset: 56,
      details: "Final plumbing inspection",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    },
    { 
      id: "", 
      title: "Electric Final", 
      startDate: "", 
      duration: "2",
      offset: 59,
      details: "Final electrical inspection",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    },
    { 
      id: "", 
      title: "Install mail box/address numbers", 
      startDate: "", 
      duration: "1",
      offset: 59,
      details: "Install mailbox and address numbers",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    },
    { 
      id: "", 
      title: "Touch up paint/1/4 round", 
      startDate: "", 
      duration: "1",
      offset: 58,
      details: "Complete paint touch ups and quarter round installation",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
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
      offset: 61,
      details: "Complete final punch out inspection",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    },
    { 
      id: "", 
      title: "Final dirtwork", 
      startDate: "", 
      duration: "2",
      offset: 60,
      details: "Complete final landscaping and dirt work",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    },
    { 
      id: "", 
      title: "Install privacy fence (if needed)", 
      startDate: "", 
      duration: "2",
      offset: 61,
      details: "Install privacy fencing",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
    },
    { 
      id: "", 
      title: "Clean house", 
      startDate: "", 
      duration: "1",
      offset: 63,
      details: "Final house cleaning",
      isExpanded: false,
      selectedContacts: [{id: '1'}, {id: '2'}, {id: '3'}]
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
