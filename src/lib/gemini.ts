import { GoogleGenAI, Type } from '@google/genai';
import { AIGeneratedQuestion, GenerateQuestionsRequest, CognitiveTargetLevel } from '@/types';

// Helper to remove markdown code fences if model accidentally includes them
export function cleanJsonResponse(rawText: string): string {
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  return cleaned.trim();
}

// Fallback questions generator for occupational training if API key is absent or offline
// Strictly segmented by Cluster ID to prevent topic cross-bleeding
const FALLBACK_CLUSTER_POOLS: Record<string, AIGeneratedQuestion[]> = {
  // Cluster 1.1: The Receiving and Dispatch Environment
  '1.1': [
    {
      format: 'MCQ',
      body: 'What is the maximum allowable receiving core temperature for chilled dairy and fresh meat deliveries before mandatory quarantine or rejection?',
      additionalText: '🟢 Model Answer:\nChilled perishable stock must be received at or below +4°C (+5°C absolute maximum limit). Deliveries exceeding this threshold must be flagged for supervisor rejection.\n\n📝 How the Assessor Marks This:\n• 1 Mark for +4°C (+5°C max threshold).',
      options: [
        '+4°C (maximum +5°C threshold)',
        '+10°C (ambient room temperature)',
        '+15°C',
        'Any temperature as long as outer packaging is intact',
      ],
      correctOptions: [0],
      duration: 45,
      guideTopicHint: 'Cluster 1.1 • Cold Chain Receiving Thresholds',
    },
    {
      format: 'MCQ',
      body: 'In South African cold-chain warehouse logistics, what is the maximum permissible dock dwell time for palletized frozen cargo before returning to blast freezer temperature?',
      additionalText: '🟢 Model Answer:\nFrozen stock must not remain on the open receiving or dispatch dock for more than 30 minutes to prevent surface thawing and bacterial growth.\n\n📝 How the Assessor Marks This:\n• 1 Mark for 30-minute dock dwell rule.',
      options: [
        '30 minutes maximum',
        '2 hours',
        '4 hours',
        'Until the end of the shift',
      ],
      correctOptions: [0],
      duration: 45,
      guideTopicHint: 'Cluster 1.1 • Cold Chain Dock Dwell Limit',
    },
    {
      format: 'MCQ',
      body: 'In cross-docking operations, what is the maximum recommended staging dwell time for inbound cross-dock freight before outbound loading?',
      additionalText: '🟢 Model Answer:\nTrue cross-docking requires rapid turnaround, typically under 24 hours (and often under 4 hours for FMCG), with zero long-term storage putaway.\n\n📝 How the Assessor Marks This:\n• 1 Mark for under 24 hours direct transfer standard.',
      options: [
        'Under 24 hours (direct transfer without long-term storage)',
        '7 business days',
        '30 days',
        'Whenever warehouse staff have spare time',
      ],
      correctOptions: [0],
      duration: 45,
      guideTopicHint: 'Cluster 1.1 • Cross-Docking Staging Limits',
    },
    {
      format: 'BINARY',
      body: 'True or False: In a Third-Party Logistics (3PL) model, the outsourced contractor manages warehousing and transport operations while legal ownership of inventory remains with the client.',
      additionalText: '🟢 Model Answer:\nTrue. A 3PL provider provides logistics services, labor, and facilities, but never takes commercial ownership or title of the stock.\n\n📝 How the Assessor Marks This:\n• 1 Mark for True and recognizing 3PL inventory ownership principles.',
      options: ['True', 'False'],
      correctOptions: [0],
      duration: 30,
      guideTopicHint: 'Cluster 1.1 • 3PL Supply Chain Roles',
    },
    {
      format: 'MCQ',
      body: 'Which key document accompanies inbound goods to verify physical quantities against the original purchasing agreement?',
      additionalText: '🟢 Model Answer:\nThe Supplier Delivery Note / Inbound Waybill is physically reconciled line-by-line against the company Purchase Order (PO).\n\n📝 How the Assessor Marks This:\n• 1 Mark for Delivery Note matched against Purchase Order.',
      options: [
        'Supplier Delivery Note matched against Purchase Order (PO)',
        'Staff Time Sheet',
        'Equipment Maintenance Log',
        'Vehicle Roadworthy Certificate',
      ],
      correctOptions: [0],
      duration: 45,
      guideTopicHint: 'Cluster 1.1 • Inbound Information Flows',
    },
    {
      format: 'BINARY',
      body: 'True or False: A perpetual inventory tracking system records inventory balances continuously in real-time with every receiving and dispatch transaction, rather than waiting for annual stocktaking.',
      additionalText: '🟢 Model Answer:\nTrue. Perpetual inventory systems update balances immediately via ERP/WMS barcoding after every stock movement.\n\n📝 How the Assessor Marks This:\n• 1 Mark for True and defining perpetual vs periodic inventory.',
      options: ['True', 'False'],
      correctOptions: [0],
      duration: 30,
      guideTopicHint: 'Cluster 1.1 • Perpetual Inventory Systems',
    },
  ],

  // Cluster 1.2: Prevent Shrinkage and Losses
  '1.2': [
    {
      format: 'MCQ',
      body: 'Under the CRAVED loss prevention framework, what does the acronym CRAVED stand for when identifying high-theft warehouse stock?',
      additionalText: '🟢 Model Answer:\nCRAVED stands for: Concealable, Removable, Available, Valuable, Enjoyable, and Disposable.\n\n📝 How the Assessor Marks This:\n• 1 Mark for correctly identifying all 6 CRAVED attributes.',
      options: [
        'Concealable, Removable, Available, Valuable, Enjoyable, Disposable',
        'Counted, Reconciled, Audited, Verified, Evaluated, Dispatched',
        'Clean, Restocked, Arranged, Ventilated, Enclosed, Documented',
        'Cold, Refrigerated, Ambient, Ventilated, Evaporated, Drained',
      ],
      correctOptions: [0],
      duration: 45,
      guideTopicHint: 'Cluster 1.2 • CRAVED Shrinkage Framework',
    },
    {
      format: 'MCQ',
      body: 'At annual financial stocktake, the Book Inventory shows R450,000, while the Physical Count confirms R422,000. What is the stock shrinkage value and shrinkage percentage?',
      additionalText: '🟢 Model Answer:\nStep 1: Shrinkage Value = Book Inventory (R450,000) - Physical Count (R422,000) = R28,000.\nStep 2: Shrinkage % = (R28,000 / R450,000) x 100 = 6.22%.\n\n📝 How the Assessor Marks This:\n• 1 Mark for R28,000 variance.\n• 1 Mark for 6.22% shrinkage calculation.',
      options: [
        'R28,000 shrinkage (6.22%)',
        'R22,000 shrinkage (4.88%)',
        'R50,000 shrinkage (11.11%)',
        'Zero shrinkage (acceptable tolerance)',
      ],
      correctOptions: [0],
      duration: 60,
      marks: 2,
      guideTopicHint: 'Cluster 1.2 • Retail Shrinkage Calculations',
    },
    {
      format: 'MCQ',
      body: 'Who is authorized to hold the physical keys or access tokens to high-value secured bond cages inside the distribution centre?',
      additionalText: '🟢 Model Answer:\nOnly nominated, vetted supervisors or authorized inventory controllers may hold keys, with a mandatory signed key-register logbook.\n\n📝 How the Assessor Marks This:\n• 1 Mark for designated supervisor and signed key-register logbook.',
      options: [
        'Designated and vetted supervisor recorded in the signed key-register logbook',
        'Any warehouse temporary casual worker',
        'External third-party delivery drivers',
        'Keys may be left hanging on the cage lock for convenience',
      ],
      correctOptions: [0],
      duration: 45,
      guideTopicHint: 'Cluster 1.2 • High-Value Bond Cage Security',
    },
    {
      format: 'BINARY',
      body: 'True or False: Personal employee backpacks, jackets, and gym bags are permitted in warehouse storage aisles during active order picking shifts.',
      additionalText: '🟢 Model Answer:\nFalse. All personal bags, coats, and lockers must remain in designated staff changerooms outside the security perimeter to prevent opportunistic concealment and internal theft.\n\n📝 How the Assessor Marks This:\n• 1 Mark for False and explaining shrinkage prevention via bag segregation.',
      options: ['True', 'False'],
      correctOptions: [1],
      duration: 30,
      guideTopicHint: 'Cluster 1.2 • Internal Theft Prevention',
    },
    {
      format: 'MCQ',
      body: 'When a warehouse suffers an unrecovered R50,000 stock loss and operates at a 5% net profit margin, how much additional sales revenue must the business generate to recover the loss?',
      additionalText: '🟢 Model Answer:\nSales Recovery Revenue = Financial Loss / Net Profit Margin = R50,000 / 0.05 = R1,000,000 in new sales required to replace the lost margin.\n\n📝 How the Assessor Marks This:\n• 2 Marks for applying Loss / Margin formula to reach R1,000,000.',
      options: [
        'R1,000,000 in additional sales',
        'R50,000 in sales',
        'R250,000 in sales',
        'R500,000 in sales',
      ],
      correctOptions: [0],
      duration: 60,
      marks: 2,
      guideTopicHint: 'Cluster 1.2 • Sales Recovery Revenue Formula',
    },
    {
      format: 'MULTIPLE',
      body: 'Which physical security and storage controls are mandatory for high-theft Class A items (e.g. smartphones, razor blades, premium spirits)? (Select all that apply)',
      additionalText: '🟢 Model Answer:\nHigh-theft items require: (1) Fully enclosed floor-to-ceiling high-security wire mesh cage, (2) Dual-custody key / biometric access control, and (3) 24/7 dedicated CCTV coverage with zero blind spots.\n\n📝 How the Assessor Marks This:\n• 1 Mark for cage, dual access, and CCTV.',
      options: [
        'Fully enclosed floor-to-ceiling high-security wire mesh cage',
        'Dual-custody key / biometric access control',
        '24/7 dedicated CCTV coverage with zero blind spots',
        'Open pallets placed directly next to the driver exit door',
      ],
      correctOptions: [0, 1, 2],
      duration: 60,
      marks: 2,
      guideTopicHint: 'Cluster 1.2 • Physical Loss Controls',
    },
  ],

  // Cluster 1.3: Principles of Receiving and Checking Deliveries
  '1.3': [
    {
      format: 'MCQ',
      body: 'Order #409 requests 120 cartons of chilled beef. The supplier delivers 110 cartons with 2 cartons leaking. The delivery note states 120 cartons. What is the variance and what document must you immediately endorse?',
      additionalText: '🟢 Model Answer:\nPhysical Shortage = 120 - 110 = -10 cartons. Damaged Stock = -2 cartons. Total Variance = -12 cartons. The receiving clerk must endorse the Delivery Note before the driver departs and issue a Discrepancy Note.\n\n📝 How the Assessor Marks This:\n• 1 Mark for -12 cartons total variance.\n• 1 Mark for endorsing Delivery Note & issuing Discrepancy Note.',
      options: [
        '-12 cartons total variance; endorse Delivery Note & issue Discrepancy Note',
        '+10 cartons; sign delivery note as accepted',
        '-10 cartons; notify manager verbally without signing',
        '0 variance; accept total and adjust inventory tomorrow',
      ],
      correctOptions: [0],
      duration: 45,
      marks: 2,
      guideTopicHint: 'Cluster 1.3 • Receiving Variance Reconciliation',
    },
    {
      format: 'BINARY',
      body: 'True or False: A receiving clerk is legally permitted to endorse a supplier delivery note with "Subject to Check" to release a hurried delivery driver.',
      additionalText: '🟢 Model Answer:\nFalse. Modern logistics law and EISA criteria disallow "Subject to Check" signatures. Physical count and carton integrity must be checked before signing, or the receiving warehouse assumes full financial liability.\n\n📝 How the Assessor Marks This:\n• 1 Mark for identifying False and explaining legal liability transfer.',
      options: ['True', 'False'],
      correctOptions: [1],
      duration: 30,
      guideTopicHint: 'Cluster 1.3 • Document Endorsement Legality',
    },
    {
      format: 'MULTIPLE',
      body: 'Which pieces of information MUST match between the Purchase Order (PO) and Supplier Delivery Note before signing receipt? (Select all that apply)',
      additionalText: '🟢 Model Answer:\nCross-document verification: Purchase Order reference number, Product SKU/item codes & descriptions, and Supplier business entity name must match precisely before goods acceptance.\n\n📝 How the Assessor Marks This:\n• 1 Mark for PO number, SKU codes, and supplier name.',
      options: [
        'Purchase Order (PO) Reference Number',
        'Product SKU / Item Codes and descriptions',
        'Supplier Business Entity Name',
        'Driver personal cell phone number',
      ],
      correctOptions: [0, 1, 2],
      duration: 60,
      marks: 2,
      guideTopicHint: 'Cluster 1.3 • 3-Way Receiving Verification',
    },
    {
      format: 'MCQ',
      body: 'An inbound supplier arrives with goods, but no Delivery Note or Inbound Waybill is provided. What is the standard operating procedure?',
      additionalText: '🟢 Model Answer:\nInbound shipments without commercial delivery paperwork must not be booked into general stock. Goods must be quarantined in the designated holding bay until official documentation is produced.\n\n📝 How the Assessor Marks This:\n• 1 Mark for quarantining goods and refusing unpapered receipt.',
      options: [
        'Move goods to quarantine bay and refuse receipt until documentation is provided',
        'Sign a blank piece of paper and unpack directly into picking bins',
        'Allow the driver to leave and search for the invoice next week',
        'Accept the delivery only if the driver seems trustworthy',
      ],
      correctOptions: [0],
      duration: 45,
      guideTopicHint: 'Cluster 1.3 • Missing Documentation Protocols',
    },
    {
      format: 'CLOZE',
      body: 'Complete the receiving SOP rule using the Word Bank [GRN | Delivery Note | Purchase Order | Credit Request]: Only undamaged, physically verified stock may be entered onto the [1] as accepted into inventory.',
      additionalText: '🟢 Model Answer:\nOnly undamaged, physically verified stock is booked into warehouse inventory via the Goods Received Note (GRN). Damaged or missing items are endorsed on the Delivery Note and claimed via Credit Request.\n\n📝 How the Assessor Marks This:\n• 1 Mark for GRN.',
      options: ['GRN', 'Delivery Note', 'Purchase Order', 'Credit Request'],
      correctOptions: [0],
      duration: 60,
      marks: 2,
      guideTopicHint: 'Cluster 1.3 • Goods Received Note Rules',
    },
    {
      format: 'MCQ',
      body: 'A paper mill receiving clerk checks a delivery of industrial strapping rolls invoiced at R350 per roll. The delivery note lists 60 rolls. A physical tally confirms only 52 rolls on the pallet. What monetary value must be recorded on the Discrepancy Note?',
      additionalText: '🟢 Model Answer:\nStep 1: 60 invoiced - 52 received = 8 missing rolls.\nStep 2: 8 rolls x R350 = R2,800 discrepancy claim value.\n\n📝 How the Assessor Marks This:\n• 1 Mark for calculating 8 missing rolls.\n• 1 Mark for R2,800 total claim calculation.',
      options: ['R2,800', 'R21,000', 'R18,200', 'R3,500'],
      correctOptions: [0],
      duration: 60,
      marks: 2,
      guideTopicHint: 'Cluster 1.3 • Discrepancy Claim Valuation',
    },
  ],

  // Cluster 2.1: Dispatch Stock from the Business
  '2.1': [
    {
      format: 'MCQ',
      body: 'In the standard warehouse dispatch workflow, what operational step must be completed immediately prior to staging goods at the outbound loading dock?',
      additionalText: '🟢 Model Answer:\nEvery picked order must undergo independent picking validation and carton count checking against the picking slip before moving into outbound staging bays.\n\n📝 How the Assessor Marks This:\n• 1 Mark for picking validation against picking slip.',
      options: [
        'Order picking validation & quality checking against the picking slip',
        'Immediate loading into the delivery vehicle without checking',
        'Discarding all picked order paperwork into recycling',
        'Changing carton quantities to match whatever fits on the truck',
      ],
      correctOptions: [0],
      duration: 45,
      guideTopicHint: 'Cluster 2.1 • Dispatch Workflow Sequence',
    },
    {
      format: 'MCQ',
      body: 'When staging customer orders in dispatch marshalling bays, why must orders be strictly segregated into clearly demarcated floor bays?',
      additionalText: '🟢 Model Answer:\nClear bay demarcation prevents order cross-contamination, eliminates mixed destination loads, and stops cartons belonging to Customer A being erroneously loaded on Customer B truck.\n\n📝 How the Assessor Marks This:\n• 1 Mark for preventing cross-contamination and misrouting.',
      options: [
        'To prevent cross-contamination of customer orders and incorrect vehicle loading',
        'To allow forklift operators to drive at maximum speed without stopping',
        'To hide damaged stock from customer transport drivers',
        'Because floor paint improves warehouse aesthetic lighting',
      ],
      correctOptions: [0],
      duration: 45,
      guideTopicHint: 'Cluster 2.1 • Staging Bay Segregation',
    },
    {
      format: 'MULTIPLE',
      body: 'Which critical data fields on a picking slip must the picker verify before passing the order to the packing table? (Select all that apply)',
      additionalText: '🟢 Model Answer:\nThe picker must verify SKU code, quantity picked, batch/lot number, and destination customer/branch code against the order line items.\n\n📝 How the Assessor Marks This:\n• 1 Mark for SKU code, picked quantity, batch number, and destination code.',
      options: [
        'Item SKU code and description',
        'Quantity picked matching requested units',
        'Batch / Lot / Expiry number for regulated stock',
        'Destination customer or branch delivery code',
      ],
      correctOptions: [0, 1, 2, 3],
      duration: 60,
      marks: 2,
      guideTopicHint: 'Cluster 2.1 • Picking Slip Validation',
    },
    {
      format: 'BINARY',
      body: 'True or False: Outbound orders may be temporarily staged directly in front of emergency fire escape doors if the collection vehicle is expected to arrive within 15 minutes.',
      additionalText: '🟢 Model Answer:\nFalse. Statutory OHS regulations strictly prohibit blocking fire escape doors, emergency routes, or fire hose reels at ANY time, regardless of how soon a truck will arrive.\n\n📝 How the Assessor Marks This:\n• 1 Mark for False and citing statutory emergency exit clearance.',
      options: ['True', 'False'],
      correctOptions: [1],
      duration: 30,
      guideTopicHint: 'Cluster 2.1 • Dispatch Staging Clearances',
    },
    {
      format: 'MCQ',
      body: 'If an order picker discovers that a designated picking bin contains fewer items than requested on the picking slip, what is the immediate required protocol?',
      additionalText: '🟢 Model Answer:\nThe picker must report the shortage immediately to the inventory controller / supervisor, endorse the shortage on the picking slip, and never pull random stock from unallocated bins without authorization.\n\n📝 How the Assessor Marks This:\n• 1 Mark for reporting shortage and stopping unauthorized picking.',
      options: [
        'Report stock shortage to supervisor, endorse picking slip, and do not pick from unallocated bins',
        'Take similar items from an adjacent aisle without recording',
        'Mark the order as complete and let the customer discover the shortage',
        'Cancel the entire customer order without notifying anyone',
      ],
      correctOptions: [0],
      duration: 45,
      guideTopicHint: 'Cluster 2.1 • Order Picking Discrepancies',
    },
    {
      format: 'MCQ',
      body: 'When consolidating multi-item orders onto outbound dispatch pallets, which stacking principle must always be followed?',
      additionalText: '🟢 Model Answer:\nHeavier, rigid master cartons must be placed on the bottom tiers, with progressively lighter and smaller packages stacked above to prevent crushing and load instability.\n\n📝 How the Assessor Marks This:\n• 1 Mark for heaviest cartons on bottom tiers.',
      options: [
        'Heaviest, most rigid cartons on the bottom tiers; lighter items on top',
        'Lightest and most fragile items on the bottom to support the load',
        'Random order based purely on which items were picked first',
        'Pyramid stacking with heavy items balanced on top corners',
      ],
      correctOptions: [0],
      duration: 45,
      guideTopicHint: 'Cluster 2.1 • Pallet Staging & Consolidation',
    },
  ],

  // Cluster 2.2: Principles for Recording Dispatches
  '2.2': [
    {
      format: 'MCQ',
      body: 'While operating an electric pallet jack in the dispatch staging bay, the operator notices hydraulic fluid weeping from the lift cylinder. What is the mandatory 3-step Faulty Equipment Protocol?',
      additionalText: '🟢 Model Answer:\nThe standard 3-step protocol is: (1) STOP operating the equipment immediately, (2) TAG OUT the equipment with a high-visibility Out-of-Service tag and remove keys, and (3) REPORT the fault in writing to the dispatch supervisor / workshop.\n\n📝 How the Assessor Marks This:\n• 2 Marks for stating STOP, TAG OUT, and REPORT in sequence.',
      options: [
        'STOP operation immediately, TAG OUT equipment with Out-of-Service tag, and REPORT to supervisor',
        'Wipe the oil with a rag and continue driving until shift end',
        'Park the equipment in an empty aisle and leave it for the next shift',
        'Top up the cylinder with motor oil without logging a fault',
      ],
      correctOptions: [0],
      duration: 45,
      marks: 2,
      guideTopicHint: 'Cluster 2.2 • 3-Step Faulty Equipment Protocol',
    },
    {
      format: 'MCQ',
      body: 'Which Material Handling Equipment (MHE) is most appropriate for safely loading pallets onto a curtain-side line-haul road freight trailer from ground level?',
      additionalText: '🟢 Model Answer:\nA Counterbalance Forklift equipped with certified fork tines and rated load capacity is standard for outdoor ground-level vehicle loading.\n\n📝 How the Assessor Marks This:\n• 1 Mark for Counterbalance Forklift.',
      options: [
        'Counterbalance Forklift with certified fork tines',
        'Manual 2-wheel hand sack barrow',
        'Narrow-aisle turret truck',
        'High-reach order picker platform',
      ],
      correctOptions: [0],
      duration: 45,
      guideTopicHint: 'Cluster 2.2 • MHE Selection Standards',
    },
    {
      format: 'MCQ',
      body: 'Before releasing an outbound delivery vehicle from the dispatch bay, what documentation must the collecting carrier driver sign and date in legible handwriting?',
      additionalText: '🟢 Model Answer:\nThe driver must physically verify carton/pallet count and sign, date, print their full legal name, and record their vehicle registration number on the official Dispatch Advice / Proof of Delivery (POD).\n\n📝 How the Assessor Marks This:\n• 1 Mark for Dispatch Advice / POD signed with name and vehicle registration.',
      options: [
        'Official Dispatch Advice / Delivery Note with driver name and vehicle registration',
        'Warehouse visitor register badge only',
        'ERP picking slip copy without driver details',
        'Driver personal delivery logbook only',
      ],
      correctOptions: [0],
      duration: 45,
      guideTopicHint: 'Cluster 2.2 • Driver Handover & Dispatch Register',
    },
    {
      format: 'BINARY',
      body: 'True or False: An MHE operator whose forklift driver certification expired last week may continue driving during peak dispatch periods if authorized verbally by a peer.',
      additionalText: '🟢 Model Answer:\nFalse. Driving mechanical equipment without valid statutory accreditation contravenes the Driven Machinery Regulations (OHS Act) and invalidates warehouse insurance.\n\n📝 How the Assessor Marks This:\n• 1 Mark for False and citing statutory licensing compliance.',
      options: ['True', 'False'],
      correctOptions: [1],
      duration: 30,
      guideTopicHint: 'Cluster 2.2 • MHE Operator Licensing Compliance',
    },
    {
      format: 'CLOZE',
      body: 'According to the Dispatch Documentation & Handover Sequence, the official Dispatch Advice must record the driver details. The driver must then provide their full name, legible [1], date, and vehicle [2] on the dispatch register.',
      additionalText: '🟢 Model Answer:\nGap 1: signature; Gap 2: registration.\nHandover sequence mandates full legal driver signature and vehicle registration before gate pass issuance.\n\n📝 How the Assessor Marks This:\n• 1 Mark per correct gap assignment.',
      options: ['signature', 'registration', 'fingerprint', 'invoice'],
      correctOptions: [0, 1],
      duration: 60,
      marks: 2,
      guideTopicHint: 'Cluster 2.2 • Dispatch Register Sign-Off',
    },
    {
      format: 'MULTIPLE',
      body: 'Which documents must be matched and reconciled in the dispatch office before confirming electronic shipment departure in the ERP system? (Select all that apply)',
      additionalText: '🟢 Model Answer:\nThe dispatch clerk must reconcile: (1) Sales Order, (2) Signed Picking Slip, and (3) Carrier-signed Dispatch Advice / POD.\n\n📝 How the Assessor Marks This:\n• 1 Mark for Sales Order, Picking Slip, and signed Dispatch Advice.',
      options: [
        'Sales Order reference and customer line items',
        'Completed and signed Order Picking Slip',
        'Dispatch Advice / POD signed by collecting carrier driver',
        'Supplier inbound credit note from previous week',
      ],
      correctOptions: [0, 1, 2],
      duration: 60,
      marks: 2,
      guideTopicHint: 'Cluster 2.2 • Dispatch Documentation Matching',
    },
  ],

  // Cluster 2.3: Principles of Packing and Labelling Dispatches
  '2.3': [
    {
      format: 'MCQ',
      body: 'A dispatch consignment contains 4 cartons measuring 50cm x 40cm x 30cm each. The actual scale weight for all 4 cartons combined is 36kg. Using the courier volumetric divisor of 5000, what is the volumetric weight, and which weight will the carrier bill for?',
      additionalText: '🟢 Model Answer:\nStep 1: Single box volume = (50 x 40 x 30) / 5000 = 60,000 / 5000 = 12kg volumetric per box.\nStep 2: Total volumetric weight = 12kg x 4 cartons = 48kg.\nStep 3: Carrier bills on greater of actual (36kg) vs volumetric (48kg) = 48kg volumetric weight billed.\n\n📝 How the Assessor Marks This:\n• 1 Mark for calculating 48kg volumetric weight.\n• 1 Mark for identifying carrier bills on greater weight (48kg).',
      options: [
        '48kg, billed at volumetric weight',
        '36kg, billed at actual weight',
        '12kg, billed at actual weight',
        '60kg, billed at volumetric weight',
      ],
      correctOptions: [0],
      duration: 60,
      marks: 3,
      guideTopicHint: 'Cluster 2.3 • Courier Volumetric Weight Calculation',
    },
    {
      format: 'MCQ',
      body: 'A customer dispatch advice lists taxable merchandise at a subtotal of R18,000. Under South African tax regulations, what is the mandatory 15% VAT amount and the final invoice total?',
      additionalText: '🟢 Model Answer:\nStep 1: VAT = R18,000 x 0.15 = R2,700.\nStep 2: Final Total = R18,000 + R2,700 = R20,700.\n\n📝 How the Assessor Marks This:\n• 1 Mark for calculating R2,700 VAT.\n• 1 Mark for calculating R20,700 total.',
      options: [
        'VAT: R2,700; Final Total: R20,700',
        'VAT: R1,800; Final Total: R19,800',
        'VAT: R2,500; Final Total: R20,500',
        'VAT: R0; Final Total: R18,000',
      ],
      correctOptions: [0],
      duration: 60,
      marks: 2,
      guideTopicHint: 'Cluster 2.3 • South African 15% VAT Math',
    },
    {
      format: 'MULTIPLE',
      body: 'Which four pieces of mandatory shipping information must appear on all exterior dispatch carton labels? (Select all that apply)',
      additionalText: '🟢 Model Answer:\nMandatory carton labels must record: (1) Consignee name & destination address, (2) Consignment/Waybill number, (3) Carton box count sequence (e.g. Box 1 of 3), and (4) Handling symbols (e.g. Fragile / This Way Up).\n\n📝 How the Assessor Marks This:\n• 1 Mark for consignee address, waybill number, box count, and handling symbols.',
      options: [
        'Consignee business name and physical destination delivery address',
        'Master consignment tracking or waybill number',
        'Box sequence number of total shipment (e.g. Box 1 of 4)',
        'Handling warning pictograms (e.g. Fragile glass or This Way Up)',
      ],
      correctOptions: [0, 1, 2, 3],
      duration: 60,
      marks: 2,
      guideTopicHint: 'Cluster 2.3 • Mandatory Dispatch Labelling',
    },
    {
      format: 'BINARY',
      body: 'True or False: For fragile electronic goods, loose-fill expanded polystyrene peanuts provide sufficient protection without secondary inner bubble wrap or corner edge protectors.',
      additionalText: '🟢 Model Answer:\nFalse. Loose-fill peanuts settle and shift during vehicle transit, allowing fragile items to migrate to outer box walls and shatter on impact. Fragile goods require tight bubble wrapping and rigid corner protectors.\n\n📝 How the Assessor Marks This:\n• 1 Mark for False and explaining why loose-fill shifts during transit.',
      options: ['True', 'False'],
      correctOptions: [1],
      duration: 30,
      guideTopicHint: 'Cluster 2.3 • Protective Packaging Selection',
    },
    {
      format: 'CLOZE',
      body: 'A factory pallet holds 8 cartons per layer, stacked 5 layers high. To stage an outbound order of 160 cartons, the dispatch clerk must prepare [1] full pallets. (Type number only)',
      additionalText: '🟢 Model Answer:\nStep 1: 8 cartons/layer x 5 layers = 40 cartons/pallet.\nStep 2: 160 cartons / 40 cartons per pallet = 4 full pallets.\n\n📝 How the Assessor Marks This:\n• 1 Mark for 4.',
      options: ['4', '3', '5', '20'],
      correctOptions: [0],
      duration: 60,
      marks: 2,
      guideTopicHint: 'Cluster 2.3 • Pallet Layering Calculations',
    },
    {
      format: 'MCQ',
      body: 'Which strapping material is most appropriate for securing heavy unitized pallet loads of corrugated board or automotive parts during long-haul transport?',
      additionalText: '🟢 Model Answer:\nHeavy-duty tensioned steel strapping or high-tensile polyester (PET) strapping provides the mandatory tensile strength and elongation resistance for heavy cargo unitization.\n\n📝 How the Assessor Marks This:\n• 1 Mark for high-tensile polyester or steel strapping.',
      options: [
        'High-tensile polyester (PET) or steel strapping with metal seals',
        'Standard clear household adhesive tape',
        'Elastic rubber bands',
        'Twisted jute garden twine',
      ],
      correctOptions: [0],
      duration: 45,
      guideTopicHint: 'Cluster 2.3 • Pallet Securing & Strapping',
    },
  ],

  // Cluster 2.4: General Standards of Housekeeping
  '2.4': [
    {
      format: 'MCQ',
      body: 'According to your Learner Guide and South African OHS regulations, what is the minimum required clearance perimeter that must remain unobstructed around electrical distribution boards and emergency exit paths at all times?',
      additionalText: '🟢 Model Answer:\nLearner Guide Section 2.4 and statutory safety standards mandate a minimum 1.2-meter unobstructed clear perimeter around all electrical distribution boards and exit pathways to ensure rapid emergency egress and fire crew access.\n\n📝 How the Assessor Marks This:\n• 1 Mark for 1.2 meters clearance standard.',
      options: [
        '1.2 meters',
        '0.5 meters',
        '2.5 meters',
        'Only clearance for the door swing (0.8m)',
      ],
      correctOptions: [0],
      duration: 45,
      guideTopicHint: 'Cluster 2.4 • Electrical Panel Clearances',
    },
    {
      format: 'BINARY',
      body: 'True or False: The principle of "Clean-As-You-Go" requires warehouse clerks to clean up discarded plastic wrap, strapping, and timber offcuts immediately, rather than waiting for end-of-shift sweeping.',
      additionalText: '🟢 Model Answer:\nTrue. Clean-as-you-go eliminates slips, trips, and wheel entanglement hazards in real time throughout operational shifts, preventing warehouse accidents.\n\n📝 How the Assessor Marks This:\n• 1 Mark for True and defining Clean-As-You-Go preventative safety.',
      options: ['True', 'False'],
      correctOptions: [0],
      duration: 30,
      guideTopicHint: 'Cluster 2.4 • Clean-As-You-Go Standards',
    },
    {
      format: 'MCQ',
      body: 'If an employee splashes corrosive battery acid or industrial solvent into their eyes, what is the mandatory immediate emergency eyewash protocol?',
      additionalText: '🟢 Model Answer:\nThe statutory emergency protocol is: (1) Flush eyes immediately at the emergency eyewash station for a continuous minimum of 15 minutes with eyelids held open, (2) Call for first aider assistance immediately, and (3) Retrieve the chemical Safety Data Sheet (SDS) and transfer for professional medical care.\n\n📝 How the Assessor Marks This:\n• 1 Mark for 15 minutes continuous flushing standard.\n• 1 Mark for retrieving SDS and seeking medical attention.',
      options: [
        'Flush eyes continuously for a minimum of 15 minutes at eyewash station, notify first aider, and seek medical attention with the SDS',
        'Rinse eyes for 30 seconds and resume work',
        'Rub eyes vigorously with dry cotton towels',
        'Apply neutralising vinegar drops directly into the eyes',
      ],
      correctOptions: [0],
      duration: 45,
      marks: 2,
      guideTopicHint: 'Cluster 2.4 • Emergency Eyewash & Chemical SDS',
    },
    {
      format: 'BINARY',
      body: 'True or False: Standard warehouse safety operating procedures permit pallets to be stacked up to 5 tiers high on open warehouse floor space without racking bays.',
      additionalText: '🟢 Model Answer:\nFalse. Pallets must never be stacked more than 3 tiers high on open floors unless locked within calibrated drive-in racking bays to prevent catastrophic collapse and crush hazards.\n\n📝 How the Assessor Marks This:\n• 1 Mark for False and citing 3 tiers maximum floor stacking limit.',
      options: ['True', 'False'],
      correctOptions: [1],
      duration: 30,
      guideTopicHint: 'Cluster 2.4 • Pallet Stacking Limits',
    },
    {
      format: 'MCQ',
      body: 'Which fire extinguisher type is strictly prohibited for use on an energized electrical distribution board fire?',
      additionalText: '🟢 Model Answer:\nWater / Hydrant fire extinguishers conduct electricity back through the stream, causing fatal electrocution. Only Class C / CO2 or Dry Chemical Powder extinguishers are safe for electrical fires.\n\n📝 How the Assessor Marks This:\n• 1 Mark for Water / Hydrant extinguisher prohibition.',
      options: [
        'Water / Hydrant Extinguisher (causes fatal electrocution)',
        'Carbon Dioxide (CO2) Extinguisher',
        'Dry Chemical Powder (DCP) Extinguisher',
        'Fire Suppression Blanket',
      ],
      correctOptions: [0],
      duration: 45,
      guideTopicHint: 'Cluster 2.4 • Warehouse Fire Safety',
    },
    {
      format: 'MULTIPLE',
      body: 'Which of the following are direct indicators of pest or vermin infestation in a warehouse storage area? (Select all that apply)',
      additionalText: '🟢 Model Answer:\nOHS and hygiene audit indicators: Droppings along skirting boards/racking, gnawed cardboard corners or grain sacks, and shredded plastic/paper nesting materials require immediate quarantine and pest contractor escalation.\n\n📝 How the Assessor Marks This:\n• 1 Mark for droppings, gnawed corners, and nesting material.',
      options: [
        'Droppings along walls or underneath pallet racking',
        'Gnawed corners on cardboard cartons or grain bags',
        'Shredded shrink-wrap and paper nesting material in corners',
        'Properly positioned ultrasonic pest repellent beacons',
      ],
      correctOptions: [0, 1, 2],
      duration: 60,
      marks: 2,
      guideTopicHint: 'Cluster 2.4 • Pest Contamination Protocols',
    },
  ],
};

export function getSampleOccupationalQuestions(
  clusterKey: string = '1.1',
  count: number = 6
): AIGeneratedQuestion[] {
  let matchedCluster = '1.1';
  const numMatch = clusterKey.match(/(\d+\.\d+)/);
  if (numMatch && FALLBACK_CLUSTER_POOLS[numMatch[1]]) {
    matchedCluster = numMatch[1];
  } else {
    const lower = clusterKey.toLowerCase();
    if (lower.includes('shrinkage') || lower.includes('loss')) matchedCluster = '1.2';
    else if (lower.includes('check') || lower.includes('receiving') || lower.includes('variance')) matchedCluster = '1.3';
    else if (lower.includes('dispatch stock') || lower.includes('picking')) matchedCluster = '2.1';
    else if (lower.includes('record') || lower.includes('mhe') || lower.includes('equipment')) matchedCluster = '2.2';
    else if (lower.includes('pack') || lower.includes('label') || lower.includes('courier')) matchedCluster = '2.3';
    else if (lower.includes('housekeep') || lower.includes('safety') || lower.includes('clearance')) matchedCluster = '2.4';
    else if (lower.includes('environment') || lower.includes('cold')) matchedCluster = '1.1';
  }

  const pool = FALLBACK_CLUSTER_POOLS[matchedCluster] || FALLBACK_CLUSTER_POOLS['1.1'];

  if (count <= pool.length) {
    return pool.slice(0, count);
  }

  const expanded: AIGeneratedQuestion[] = [];
  for (let i = 0; i < count; i++) {
    const template = pool[i % pool.length];
    expanded.push({ ...template });
  }
  return expanded;
}

// Real production Gemini Flash models (eliminates 404 roundtrips from UI display aliases)
const MODEL_CASCADE = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
];

function resolveGeminiModel(requested?: string): string {
  if (!requested) return 'gemini-2.5-flash';
  if (
    requested === 'gemini-3.8-flash' ||
    requested === 'gemini-3.7-flash' ||
    requested === 'gemini-3.6-flash'
  ) {
    return 'gemini-2.5-flash';
  }
  return requested;
}

const BATCH_VARIANT_DIRECTIVES = [
  'BATCH VARIANT A (Questions 1–20 — Core Operations, Inbound Verification & SOPs): Focus primarily on receiving verification, PO vs. Delivery Note vs. GRN matching, foundational terminology, storage/housekeeping standards, and first-line compliance checks.',
  'BATCH VARIANT B (Questions 21–40 — Quantitative Calculations, Variances & Safety Thresholds): Focus heavily on numerical workplace calculations (pallet tier/layer counts, volumetric vs. scale weight, % shrinkage, discrepancy credit note claims, 15% VAT, cold-chain temperature limits) using fresh numerical values.',
  'BATCH VARIANT C (Questions 41–60 — Exception Handling, Dispatch, MHE & Audit Scenarios): Focus on non-conformance troubleshooting, damaged/leaking stock quarantine, Material Handling Equipment (MHE) selection & tag-out protocols, multi-fault rejections, and high-value stock security.',
];

export async function generateQuestionsWithGemini(
  request: GenerateQuestionsRequest
): Promise<AIGeneratedQuestion[]> {
  const count = request.questionCount || 6;
  const apiKey = request.apiKey || process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === '' || apiKey.includes('your-gemini')) {
    console.warn('No Gemini API key provided. Using rich occupational curriculum fallback questions.');
    return getSampleOccupationalQuestions(request.clusterNumber || request.clusterTitle || request.prompt, count);
  }

  // Parallel distinct-angle batching for large pools (e.g. 60-question BrainCert bank -> 3x20)
  if (count > 20) {
    const batchSize = 20;
    const numBatches = Math.ceil(count / batchSize);
    const batchPromises: Promise<AIGeneratedQuestion[]>[] = [];

    for (let i = 0; i < numBatches; i++) {
      const currentCount = i === numBatches - 1 ? count - i * batchSize : batchSize;
      const variantDirective = BATCH_VARIANT_DIRECTIVES[i % BATCH_VARIANT_DIRECTIVES.length];
      batchPromises.push(
        generateQuestionsWithGemini({
          ...request,
          questionCount: currentCount,
          customBackground: [request.customBackground, variantDirective].filter(Boolean).join('\n\n'),
        })
      );
    }

    const batchResults = await Promise.all(batchPromises);
    const combined = batchResults.flat();

    // Deduplicate by normalized question stem to guarantee a unique rotation pool
    const seenStems = new Set<string>();
    const unique: AIGeneratedQuestion[] = [];
    for (const q of combined) {
      const normKey = q.body.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 80);
      if (!seenStems.has(normKey)) {
        seenStems.add(normKey);
        unique.push(q);
      }
    }
    return unique.length >= Math.min(count, 10) ? unique.slice(0, count) : combined.slice(0, count);
  }

  // Determine cognitive level guidance
  const level: CognitiveTargetLevel = request.targetLevel || 'operational';
  let bloomDirective = '';
  if (level === 'foundational') {
    bloomDirective = 'COGNITIVE LEVEL (Foundational): ~70% Remember/Understand (definitions, terminology, regulatory thresholds), ~30% Apply (simple direct workplace choices). Keep language plain and accessible. Avoid multi-step traps.';
  } else if (level === 'advanced') {
    bloomDirective = 'COGNITIVE LEVEL (Advanced): ~40% Understand, ~40% Apply, ~20% Analyze/Evaluate (compare procedures, spot flawed step in SOP, audit non-conformance).';
  } else {
    // operational default
    bloomDirective = 'COGNITIVE LEVEL (Operational Workplace): ~55% Remember/Understand, ~35% Apply (single-step workplace decisions), ~10% short operational scenario. Ground questions in practical daily duties.';
  }

  const fsaDirective = request.isFsaMock
    ? `AUTHENTIC GENERIC IAC FSA MOCK EXAM MODE:
1. YOU ARE DESIGNING A MOCK FINAL SUMMATIVE ASSESSMENT (EISA EXAM SIMULATION) covering all Integrated Assessment Criteria (IAC) for the specified cluster.
2. CRITICAL QUANTITATIVE & PROCEDURAL CRITERIA TO TEST:
   - If Cluster 2.3 (Packing & Dispatch Advice): MANDATORY inclusion of South African 15% VAT calculation on Dispatch Advice (Subtotal + 15% VAT = Grand Total), line extensions, courier freight rate calculations (base carton + additional boxes + VAT), protective packaging combinations, and the 4 mandatory exterior container label details.
   - If Cluster 2.2 (Recording Dispatches & MHE): Test Material Handling Equipment selection (Forklift, Flatbed trolley, Roll cage trolley, Reach truck) and the 3-step Faulty Equipment Protocol (STOP, TAG OUT, REPORT).
   - If Cluster 1.3 (Receiving & Checking Deliveries): Test 3-way delivery note variance reconciliation (-11 total variance calculation: shortage + damage), standard procedure when documents differ from PO, and refusal of "Subject to Check".
   - If Cluster 1.2 (Prevent Shrinkage & Losses): Test the Retail Stocktake equation (Book Inventory - Physical Count = Shrinkage), Sales Recovery Revenue formula (Financial Loss / Net Profit Margin), and the C.R.A.V.E.D. hot product framework.
   - If Cluster 1.1 (Receiving & Dispatch Environment): Test the Cold-Chain 30-minute rule, 3PL requirements, and warehousing vs. cross-docking financial impacts.
   - If Cluster 2.4 (General Standards of Housekeeping): Test 1.2m DB clearances, Clean-As-You-Go, yellow safety cones, and chemical MSDS/SDS protocols.
3. STRICT FORMAT FOR "additionalText":
   Every question's "additionalText" MUST be structured in two distinct sections without using academic jargon like "rubric":
   🟢 Model Answer:
   [Provide the exact step-by-step mathematical calculations with line items or concrete step-by-step SOP procedures]

   📝 How the Assessor Marks This:
   [Detail point allocations, what the external national examiner awards marks for, and common learner traps or incorrect assumptions].`
    : request.isBrainCertBank
      ? `BRAINCERT LMS MULTI-FORMAT EISA QUESTION BANK MODE:
1. MULTI-FORMAT DISTRIBUTION: Generate a varied mix across BrainCert's auto-assessed question types:
   - ~40% Single-Select MCQ ('MCQ'): Realistic warehouse scenario stems and calculated distractors.
   - ~25% Fill in the Blanks ('CLOZE'): Must contain a SINGLE blank marked as [1] (BrainCert Type 1 grades a single exact answer string). Use TWO templates:
     * Template A (Terminology): Embed a clear Word Bank directly in the question stem, e.g. "Complete the SOP rule from the Word Bank [GRN / Delivery Note / Purchase Order / Credit Note]: Only undamaged stock is entered on the [1]." (Options: ["GRN", "Delivery Note", "Purchase Order", "Credit Note"], correctOptions: [0]).
     * Template B (Calculations): Pre-supply units outside the blank, e.g. "A pallet holds 8 cartons per layer x 5 layers high. Staging 160 cartons requires [1] full pallets. (Type number only)" (Options: ["4", "3", "5", "20"], correctOptions: [0]).
   - ~20% Multiple Answer Checkboxes ('MULTIPLE'): Checklist items testing multiple simultaneous compliance actions. MANDATORY: The question stem MUST end with "(Select 2)" or "(Select 3)".
   - ~15% True/False ('BINARY'): Rapid regulatory and HACCP safety threshold statements.
   - DO NOT generate 'WORD_CLOUD' or 'SCALE'.
2. METACOGNITIVE REMEDIATION IN "additionalText":
   Format every explanation strictly with:
   🟢 Correct Answer: [Exact target option or number]
   📐 Rule / Calculation: [Exact SOP rule or step-by-step arithmetic]
   📝 Distractor Review: [Why each incorrect option is a trap]`
      : `6. WORKPLACE RATIONALE & SCORING: In "additionalText", format with:
   🟢 Model Answer: [Exact answer/calculation steps]
   📝 How the Assessor Marks This: [Why correct & where marks are awarded].`;

  const clozeRule = request.isBrainCertBank
    ? `6. "FILL IN THE BLANK" (CLOZE) FORMAT FOR BRAINCERT TYPE 1: When generating 'CLOZE' format for BrainCert, the 'body' must have a SINGLE gap marked as [1]. The 'options' array must contain the exact correct answer at index 0 plus 3 plausible distractors, and 'correctOptions' must be [0].`
    : `6. "FILL IN THE GAP" (CLOZE) FORMAT: When generating 'CLOZE' format, the 'body' must be an occupational procedure or regulation passage with gaps marked as [1], [2], and optionally [3]. The 'options' array is the Word Bank containing the correct words/phrases plus 1-2 plausible distractors. The 'correctOptions' array contains the zero-based indexes of the options corresponding to gap [1], [2], [3] in order. Award 1 mark per gap.`;

  const systemInstruction = `YOU ARE: An Expert Occupational Curriculum & Live Classroom Assessment Designer.
YOUR OBJECTIVE: Generate high-impact live polling and quiz questions for adult workplace learners (teams and individuals).

${bloomDirective}

STRICT CLUSTER & TOPIC ISOLATION MANDATE:
You are generating assessment questions EXCLUSIVELY for Cluster ${request.clusterNumber || ''}: "${request.clusterTitle || ''}".
- Scope & Topics: ${request.clusterDescription || 'Focus only on the defined topics of this cluster'}
- Mapped Criteria / IACs: ${request.mappedIacs || 'Relevant Integrated Assessment Criteria for this cluster'}
- Primary Focus Area: ${request.eisaFocusArea || request.clusterTitle || ''}

NEGATIVE CONSTRAINT:
NEVER generate questions belonging to other qualification clusters or modules!
- If Cluster 2.2 (Principles for Recording Dispatches / MHE): ONLY test MHE selection (Forklifts, Reach Trucks, Trolleys), 3-step Faulty Equipment Protocol (STOP, TAG OUT, REPORT), dispatch register matching, and driver verification signatures. DO NOT generate cold-chain receiving questions (Cluster 1.1) or warehouse housekeeping/spill questions (Cluster 2.4).
- If Cluster 2.4 (Housekeeping): ONLY test 1.2m DB clearance perimeters, Clean-As-You-Go, liquid spill containment, chemical SDS / eyewash stations, and pest prevention. DO NOT generate receiving variance calculations or dispatch documentation.
- If Cluster 1.1 (Receiving & Dispatch Environment): ONLY test cold chain core receiving temperatures (+4°C), 30-min dock dwell rule, supply chain role players, 3PL providers, and warehousing vs cross-docking.
- Every question's "guideTopicHint" MUST be formatted as: "Cluster ${request.clusterNumber || 'X.Y'} • [Specific Topic Element]".

CRITICAL FRAMING RULES & STEM VARIETY:
1. BALANCED STEM DISTRIBUTION (Do NOT force every question to cite the Learner Guide):
   - ~30-35% Learner Guide Reference: Prompt learners to navigate their physical/digital guide or SOPs ("According to your Learner Guide, what is...", "In Section 2 of your guide, which symbol...").
   - ~45-50% EISA Exam Workplace Scenarios & Document Discrepancy Checks: Direct applied workplace problem-solving with numbers, stock characteristics, variance calculations, or shrinkage control risks (e.g. "Order #409 requests 120 cartons... delivery note states 110 cartons with 2 leaking... what is the variance?"). DO NOT mention "Learner Guide" in these scenario stems; test applied workplace judgment.
   - ~20% Rapid Diagnostic / Safety Checks: Direct, punchy compliance questions ("Which fire extinguisher class is strictly prohibited on an electrical DB fire?").
2. STRICT CONSTRAINT: DO NOT output explicit page numbers in the question stem or options! Learners must navigate by module headings, standard operating procedure titles, and table of contents.
3. PLAUSIBLE DISTRACTORS: For MCQ/MULTIPLE, wrong choices must represent genuine, realistic workplace misconceptions, calculation pitfalls, or commonly confused numbers/terms. Never use obvious joke options.
4. BALANCED POSITIONS: Distribute correct options roughly evenly across option positions (A, B, C, D). Avoid always making the second option correct.
5. STANDALONE STRINGS: Never include order prefixes like "1.", "2.", "A." or "Step 1:" in the options array.
${clozeRule}
${fsaDirective}
7. RECOMMENDED DURATION: 30s (Binary/True-False), 45s (Standard MCQ), 60s (Multiple Choice/Calculations), 90s (Complex Workplace Scenarios).
8. MARKS ALLOCATION: Allocate realistic integer marks per question: 1 mark for basic recall / SOP rules, 2 to 3 marks for multi-step math calculations (e.g. 15% VAT, delivery note variance, CRAVED shrinkage) or applied workplace scenarios.

Return ONLY a valid JSON array of question objects adhering strictly to the response schema.`;

  // Build the rich context from Curriculum Framework + Gemini Notebook modular extractions
  const contextParts: string[] = [];

  if (request.courseCode || request.courseTitle) {
    contextParts.push(`COURSE: ${request.courseCode || ''} - ${request.courseTitle || 'Occupational Training'}`);
  }
  if (request.clusterNumber || request.clusterTitle) {
    contextParts.push(`TARGET CLUSTER: Cluster ${request.clusterNumber || ''} — ${request.clusterTitle || 'Core Competency'}`);
    if (request.clusterDescription) {
      contextParts.push(`CLUSTER SCOPE & TOPICS: ${request.clusterDescription}`);
    }
    if (request.mappedIacs) {
      contextParts.push(`MAPPED IAC / AAC ASSESSMENT CRITERIA: ${request.mappedIacs}`);
    }
    if (request.eisaFocusArea) {
      contextParts.push(`PRIMARY EISA FOCUS AREA: ${request.eisaFocusArea}`);
    }
  }

  if (request.courseContext && request.courseContext.trim()) {
    contextParts.push(`\n=== 1. OFFICIAL CURRICULUM FRAMEWORK & OUTCOMES ===\n${request.courseContext.slice(0, 30000)}`);
  }

  if (request.learnerGuideNotes && request.learnerGuideNotes.trim()) {
    contextParts.push(`\n=== 2. LEARNER GUIDE CORE CONCEPTS & SOPS (From Gemini Notebook) ===\n${request.learnerGuideNotes}`);
  } else if (request.rawNotebookExtract && request.rawNotebookExtract.trim()) {
    contextParts.push(`\n=== 2. GEMINI NOTEBOOK / NOTEBOOKLM EXTRACT ===\n${request.rawNotebookExtract}`);
  }

  if (request.assessmentActivitiesNotes && request.assessmentActivitiesNotes.trim()) {
    contextParts.push(`\n=== 3. FORMATIVE ASSESSMENT ACTIVITIES & WORKBOOK EXERCISES ===\n${request.assessmentActivitiesNotes}`);
  }

  if (request.practicalActivitiesNotes && request.practicalActivitiesNotes.trim()) {
    contextParts.push(`\n=== 4. PRACTICAL WORKPLACE TASKS & CHECKLISTS ===\n${request.practicalActivitiesNotes}`);
  }

  if (request.customBackground && request.customBackground.trim()) {
    contextParts.push(`\n=== 5. CUSTOM CLIENT WORKPLACE REALITY / BATCH FOCUS ===\n${request.customBackground.trim()}`);
  }

  if (request.isFsaMock) {
    contextParts.push(`\n=== 6. FSA MOCK EXAM SIMULATION MANDATE ===\nTarget all official Integrated Assessment Criteria (IAC) for this cluster. Include realistic numerical scenarios, South African regulatory standards (such as statutory 15% VAT for dispatch calculations), and concrete equipment/packaging decisions.`);
  }

  const promptText = `Generate exactly ${count} live assessment questions based EXCLUSIVELY on the target cluster curriculum and outcomes.
${contextParts.join('\n\n')}

Ensure each question connects the official Curriculum outcomes for Cluster ${request.clusterNumber || ''} to practical Formative Assessment activities, strictly avoiding content from other clusters.`;

  // Strict structured JSON response schema
  const responseSchema = {
    type: Type.ARRAY,
    description: 'A list of live polling quiz questions',
    items: {
      type: Type.OBJECT,
      properties: {
        format: {
          type: Type.STRING,
          enum: ['MCQ', 'MULTIPLE', 'BINARY', 'SCALE', 'WORD_CLOUD', 'CLOZE'],
          description: 'Question format enum',
        },
        body: {
          type: Type.STRING,
          description: 'Question stem prompting search in the learner guide without page numbers',
        },
        additionalText: {
          type: Type.STRING,
          description: 'Classroom debrief and workplace rationale explaining why the answer is correct and why the distractor was a trap',
        },
        options: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'Array of option strings (empty for WORD_CLOUD)',
        },
        correctOptions: {
          type: Type.ARRAY,
          items: { type: Type.INTEGER },
          description: 'Zero-based indices of correct options',
        },
        duration: {
          type: Type.INTEGER,
          description: 'Timer in seconds: 30, 45, 60, or 90',
        },
        marks: {
          type: Type.INTEGER,
          description: 'Mark allocation: 1 mark for recall/SOP identification, 2-3 marks for multi-step variance/math/applied scenarios',
        },
        guideTopicHint: {
          type: Type.STRING,
          description: 'Relevant heading or SOP title in the Learner Guide',
        },
      },
      required: ['format', 'body', 'additionalText', 'options', 'correctOptions', 'duration'],
    },
  };

  const ai = new GoogleGenAI({ apiKey });

  // Resolve real production model to avoid 404 latency
  const resolvedPrimary = resolveGeminiModel(request.model);
  const modelsToTry = [resolvedPrimary, ...MODEL_CASCADE.filter(m => m !== resolvedPrimary)];

  for (const modelName of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: promptText,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema,
        },
      });

      const rawText = response.text || '[]';
      const cleaned = cleanJsonResponse(rawText);
      const parsed = JSON.parse(cleaned) as AIGeneratedQuestion[];

      if (Array.isArray(parsed) && parsed.length > 0) {
        // Post-processing normalizer
        return parsed.map((q) => {
          // Normalise options
          if (!Array.isArray(q.options)) q.options = [];
          if (!Array.isArray(q.correctOptions)) q.correctOptions = [];
          q.options = q.options.map(o => String(o).trim()).filter(Boolean);

          if (q.format === 'BINARY') {
            if (q.options.length < 2) q.options = ['True', 'False'];
            if (q.correctOptions.length === 0) q.correctOptions = [0];
          }

          if (q.format === 'MCQ') {
            if (q.correctOptions.length === 0 && q.options.length > 0) q.correctOptions = [0];
          }

          if (q.format === 'WORD_CLOUD') {
            q.options = [];
            q.correctOptions = [];
          }

          if (q.format === 'CLOZE') {
            if (!Array.isArray(q.options) || q.options.length === 0) {
              q.options = ['Standard Operating Procedure', 'Quality Quarantine', 'Delivery Note'];
              q.correctOptions = [0];
            }
            if (!Array.isArray(q.correctOptions) || q.correctOptions.length === 0) {
              q.correctOptions = [0];
            }
            if (!q.marks || q.marks < 1) {
              q.marks = Math.max(2, q.correctOptions.length);
            }
          }

          // Enforce timing defaults
          if (!q.duration || q.duration <= 0) {
            if (q.format === 'BINARY') q.duration = 30;
            else if (q.format === 'MULTIPLE' || q.format === 'CLOZE') q.duration = 60;
            else q.duration = 45;
          }

          return q;
        });
      }
    } catch (err: any) {
      console.warn(`Model ${modelName} failed or returned error:`, err?.message || err);
      // Continue to next model in cascade
    }
  }

  console.error('All Gemini Flash models in cascade failed. Falling back to preloaded occupational question bank.');
  return getSampleOccupationalQuestions(request.clusterNumber || request.clusterTitle || request.prompt, count);
}
