import { Course, CourseDocument, CourseCluster, QuestionSet, Session, Question, Participant, ResponseRecord, HiddenWord } from '@/types';
import { getSupabaseClient, isSupabaseConfigured } from './supabase';

const COURSES_STORAGE_KEY = 'liveengage_courses';
const CLUSTERS_STORAGE_KEY = 'liveengage_clusters';
const QUESTION_SETS_STORAGE_KEY = 'liveengage_question_sets';
const SESSIONS_STORAGE_KEY = 'liveengage_sessions';
const PARTICIPANTS_STORAGE_KEY = 'liveengage_participants';
const RESPONSES_STORAGE_KEY = 'liveengage_responses';
const HIDDEN_WORDS_STORAGE_KEY = 'liveengage_hidden_words';
const ACTIVE_SELECTION_KEY = 'liveengage_active_selection';

// Initial preloaded data demonstrating Course -> Clusters -> Multiple Question Sets
const INITIAL_COURSES: Course[] = [
  {
    id: 'course-oq99446',
    code: 'OQ99446',
    title: 'Occupational Store Person: Warehouse Housekeeping & Safety',
    description: 'Unit standard covering workplace safety, chemical hazard identification, PPE compliance, and housekeeping procedures.',
    is_qcto: true,
    created_at: new Date().toISOString(),
    documents: [
      {
        id: 'doc-oq99446-curriculum',
        course_id: 'course-oq99446',
        doc_type: 'curriculum',
        file_name: 'Curriculum_Framework_OQ99446.pdf',
        extracted_text: `CURRICULUM FRAMEWORK: OQ99446 Store Person
Module Outcomes & Assessment Criteria:
1. Demonstrate knowledge of occupational health, emergency clearance, and warehouse safety regulations.
2. Comply with chemical hazard protocols, SDS data interpretation, and mandatory personal protective equipment.
3. Execute standard operating procedures for pallet stacking, aisle clear perimeters, and liquid spill containment.
4. Conduct pre-shift inspections and document operational non-conformances in receiving and dispatch bays.`,
        uploaded_at: new Date().toISOString(),
      },
      {
        id: 'doc-oq99446-eisa',
        course_id: 'course-oq99446',
        doc_type: 'eisa_specification',
        file_name: 'External_Assessment_Specifications_EISA_432102000.pdf',
        extracted_text: `QCTO EXTERNAL ASSESSMENT SPECIFICATIONS (EISA) - CURRICULUM 432102000:
Occupational Certificate: Dispatching and Receiving Clerk (NQF Level 3, Credits 43)
Focus Area 1 (50% Weighting): Receive stock and record receipt of stock in a manner that minimizes losses and shrinkage.
- Criteria 1.1: Reconcile delivery note against order, identify discrepancies (over-deliveries, short-deliveries, damaged goods), and accurately calculate variance.
- Criteria 1.2: Select appropriate stock movement and handling method based on stock characteristics (perishables, hazardous chemicals, fragile goods, cold storage).
- Criteria 1.3: Identify good and bad shrinkage control practices in receiving, analyze case studies of warehouse stock loss, and propose practical corrective measures.
Focus Area 2 (50% Weighting): Dispatch stock and record dispatch of stock in a manner that minimizes losses.
- Criteria 2.1: Complete dispatch documentation correctly (dispatch advice, packing slips, customer delivery note).
- Criteria 2.2: Select correct packaging materials and securing methods based on physical and transport characteristics.
- Criteria 2.3: Identify shrinkage risks in dispatch operations (unauthorized loading, incorrect staging, missed scanning).`,
        uploaded_at: new Date().toISOString(),
      }
    ]
  }
];

const INITIAL_CLUSTERS: CourseCluster[] = [
  {
    id: 'cluster-1-1',
    course_id: 'course-oq99446',
    cluster_number: '1.1',
    title: 'The Receiving and Dispatch Environment',
    description: 'Supply chain role players, cold chain 30-min rule, financial/stock/info flows, 3PL outsourcing, warehousing vs. cross-docking, and perpetual inventory.',
    eisa_focus_area: 'Enabling Foundational Knowledge (KM-01)',
    mapped_iacs: 'KM-01-KT01 to KT06 (IAC0101–IAC0603)',
    weighting_percentage: 15,
    recommended_question_count: 8,
    created_at: new Date().toISOString(),
  },
  {
    id: 'cluster-1-2',
    course_id: 'course-oq99446',
    cluster_number: '1.2',
    title: 'Prevent Shrinkage and Losses',
    description: 'Causes & prevention of shrinkage, stock vs. paperwork matrix, CRAVED framework, retail shrinkage math, and XYZ/ABC case audits.',
    eisa_focus_area: 'Focus Area 1 (Receiving 50%) & Focus Area 2 (Dispatch 50%)',
    mapped_iacs: 'KM-02-KT01 (IAC0101–IAC0103), PM-03-PS01/PS02 (IAC0101–IAC0202), EISA AAC 4 & AAC 3',
    weighting_percentage: 50,
    recommended_question_count: 15,
    created_at: new Date().toISOString(),
  },
  {
    id: 'cluster-1-3',
    course_id: 'course-oq99446',
    cluster_number: '1.3',
    title: 'Principles of Receiving and Checking Deliveries',
    description: 'Manual vs. computerised receiving, 4 verification elements, 5 shrinkage controls, PO vs. Delivery Note variance reconciliation, and ABCo simulation.',
    eisa_focus_area: 'Focus Area 1 (Receive Stock — 50%)',
    mapped_iacs: 'KM-03-KT01/KT02 (IAC0101–IAC0203), PM-01-PS01/PS02 (IAC0101–IAC0203), EISA AAC 1 & AAC 2',
    weighting_percentage: 50,
    recommended_question_count: 15,
    created_at: new Date().toISOString(),
  },
  {
    id: 'cluster-2-1',
    course_id: 'course-oq99446',
    cluster_number: '2.1',
    title: 'Dispatch Stock from the Business',
    description: 'Dispatch workflow overview, staging area controls, order picking validation, and picking slip reconciliation.',
    eisa_focus_area: 'Focus Area 2 (Dispatch Stock — 50%)',
    mapped_iacs: 'KM-04 / PM-02 Foundational Context, WM-02 Workplace Staging Protocols',
    weighting_percentage: 20,
    recommended_question_count: 10,
    created_at: new Date().toISOString(),
  },
  {
    id: 'cluster-2-2',
    course_id: 'course-oq99446',
    cluster_number: '2.2',
    title: 'Principles for Recording Dispatches',
    description: 'Reasons for dispatching stock, manual/computerised matching, MHE selection (Forklift, Flatbed, Cage, Reach), and 3-step Faulty Equipment Protocol.',
    eisa_focus_area: 'Focus Area 2 (Dispatch Advice) & Focus Area 1 (Stock Moving)',
    mapped_iacs: 'KM-04-KT01 (IAC0101–IAC0103), KM-03-KT03 (IAC0301–IAC0303), EISA AAC 3 & AAC 1',
    weighting_percentage: 25,
    recommended_question_count: 10,
    created_at: new Date().toISOString(),
  },
  {
    id: 'cluster-2-3',
    course_id: 'course-oq99446',
    cluster_number: '2.3',
    title: 'Principles of Packing and Labelling Dispatches',
    description: 'Protective packaging selection, dispatch container labelling, courier calculations, South African 15% VAT math, and GadgetCO simulation.',
    eisa_focus_area: 'Focus Area 2 (Dispatch Stock — 50%)',
    mapped_iacs: 'KM-04-KT02 (IAC0201–IAC0203), PM-02-PS01/PS02 (IAC0101–IAC0202), EISA AAC 1 & AAC 2',
    weighting_percentage: 25,
    recommended_question_count: 10,
    created_at: new Date().toISOString(),
  },
  {
    id: 'cluster-2-4',
    course_id: 'course-oq99446',
    cluster_number: '2.4',
    title: 'General Standards of Housekeeping',
    description: '5 Pillars of Housekeeping, Clean-As-You-Go, wet floor safety, 1.2m DB clearance, chemical MSDS/SDS safety, and pest prevention.',
    eisa_focus_area: 'Focus Area 1 & Focus Area 2 (Underpinning Safety/Losses)',
    mapped_iacs: 'KM-02-KT02 (IAC0201–IAC0204)',
    weighting_percentage: 10,
    recommended_question_count: 8,
    created_at: new Date().toISOString(),
  }
];

const INITIAL_QUESTION_SETS: QuestionSet[] = [
  {
    id: 'set-generic-1-1',
    cluster_id: 'cluster-1-1',
    set_number: 1,
    title: 'Generic Standard Assessment',
    is_custom: false,
    client_name: 'Generic Standard',
    eisa_focus_area: 'EISA Focus Area 1: Inbound Receiving & Variance Reconciliation',
    raw_notebook_extract: `### 1. RECEIVING SOPS & DISCREPANCIES
- Reconcile physical delivery against Purchase Order and Supplier Delivery Note.
- Endorse Delivery Notes immediately before the driver departs for all variances.
- Discrepancy Note issued for shortages and damages.`,
    target_level: 'operational',
    default_entry_mode: 'group',
    total_marks: 12,
    time_allowed_minutes: 20,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    questions: [
      {
        id: 'q-rec-1',
        question_order: 1,
        format: 'MCQ',
        body: 'A delivery arrives with 150 cartons invoiced. Physical count shows 142 sound cartons and 3 torn cartons with content missing. What is the total variance that must be endorsed on the delivery note before the driver departs?',
        additional_text: `🟢 Model Answer:
Physical Shortage = 150 invoiced - 142 delivered = -8 cartons.
Damaged Goods = -3 cartons.
Total Variance = (-8) + (-3) = -11 cartons.
The receiving clerk must endorse: 'Received 142 sound, -8 short, -3 damaged (-11 total variance)' on the delivery note before the driver departs.

📝 How the Assessor Marks This:
• 1 Mark for calculating shortage (-8 cartons).
• 1 Mark for combining total variance (-11 cartons).`,
        options: ['-11 cartons total variance', '-8 cartons variance', '+5 cartons variance', 'No variance; accept intact goods only'],
        correct_options: [0],
        duration: 45,
        marks: 2,
        guide_topic_hint: 'Receiving Discrepancies'
      },
      {
        id: 'q-rec-2',
        question_order: 2,
        format: 'BINARY',
        body: 'True or False: If a delivery note has unendorsed shortages after the driver has left the DC gate, the receiving company assumes full financial liability for the missing stock.',
        additional_text: `🟢 Model Answer:
True. Without gate endorsement co-signed by the delivery driver, suppliers reject all subsequent credit claims, transferring full financial loss to the receiving warehouse.

📝 How the Assessor Marks This:
• 1 Mark for identifying True and understanding legal transfer of liability.`,
        options: ['True', 'False'],
        correct_options: [0],
        duration: 30,
        marks: 1,
        guide_topic_hint: 'Legal Document Endorsement'
      },
      {
        id: 'q-rec-3',
        question_order: 3,
        format: 'MCQ',
        body: 'In professional South African warehouse operations, what are the three foundational commercial documents required to perform an authentic 3-Way Match before accepting stock?',
        additional_text: `🟢 Model Answer:
The 3-way match requires: (1) Approved Purchase Order (verifying authorization & pricing), (2) Supplier Delivery Note / Waybill (verifying supplier dispatch), and (3) Physical Piece Count / Goods Received Note (actual verified stock).

📝 How the Assessor Marks This:
• 1 Mark for naming PO and Delivery Note
• 1 Mark for Physical Count / GRN confirmation.`,
        options: [
          'Approved Purchase Order, Supplier Delivery Note, and Physical Goods Count Receipt',
          'Supplier Tax Invoice, DC Floor Plan, and Driver Driver License',
          'Customer Quotation, Bank Statement, and Credit Note',
          'Vehicle Logbook, Forklift Inspection Sheet, and Attendance Register'
        ],
        correct_options: [0],
        duration: 45,
        marks: 2,
        guide_topic_hint: '3-Way Match Verification'
      },
      {
        id: 'q-rec-4',
        question_order: 4,
        format: 'MCQ',
        body: 'When offloading a refrigerated delivery of fresh dairy or chilled beef into the receiving staging area, what is the mandatory South African cold-chain receiving temperature threshold?',
        additional_text: `🟢 Model Answer:
Chilled perishables must strictly measure between 0°C and +4°C upon delivery probe inspection. If temperature exceeds +5°C, bacterial growth accelerates and the load must be quarantined or rejected.

📝 How the Assessor Marks This:
• 1 Mark for identifying 0°C to +4°C standard.`,
        options: [
          'Between 0°C and +4°C (never exceeding +5°C)',
          'Between +8°C and +12°C',
          'Below -25°C at all times',
          'Any temperature as long as the delivery truck was clean'
        ],
        correct_options: [0],
        duration: 45,
        marks: 1,
        guide_topic_hint: 'Perishable Cold Chain Standards'
      },
      {
        id: 'q-rec-5',
        question_order: 5,
        format: 'MULTIPLE',
        body: 'Before permitting the delivery vehicle driver to open the truck rear container doors at the receiving dock, which visual safety and security checks are mandatory? (Select all that apply)',
        additional_text: `🟢 Model Answer:
Mandatory vehicle dock checks: (1) Verifying tamper-evident seal number against the manifest, (2) Inspecting for hazardous spills/leaks, (3) Checking cargo stability to prevent crush injuries when unlatching doors. Driver uniform is irrelevant.

📝 How the Assessor Marks This:
• 1 Mark for identifying security seal match
• 1 Mark for identifying hazard leakage and load shift checks.`,
        options: [
          'Intact numbered security bolt / cable seal matching the waybill number',
          'No evidence of liquid leakage, chemical spills, or foul odors from container floor',
          'Cargo has not shifted against the doors posing a tip-over crush hazard upon opening',
          'Driver uniform matches the receiving company brand colors'
        ],
        correct_options: [0, 1, 2],
        duration: 60,
        marks: 2,
        guide_topic_hint: 'Dock Arrival Verification Protocols'
      },
      {
        id: 'q-rec-6',
        question_order: 6,
        format: 'MCQ',
        body: 'What is the maximum permissible staging duration for cross-docking perishable foodstuffs in an ambient receiving staging bay before quality deterioration occurs?',
        additional_text: `🟢 Model Answer:
Perishables offloaded onto ambient temperature staging docks must be verified and transferred into calibrated cold storage within 30 minutes maximum to maintain cold-chain integrity.

📝 How the Assessor Marks This:
• 1 Mark for 30 minutes threshold.`,
        options: [
          'Maximum 30 minutes before transfer into temperature-controlled cold rooms',
          'Up to 6 hours during a standard work shift',
          'Until the end of the day when all trucks have finished offloading',
          'No time limit if covered with shrink-wrap'
        ],
        correct_options: [0],
        duration: 30,
        marks: 1,
        guide_topic_hint: 'Cross-Docking Time Limits'
      },
      {
        id: 'q-rec-7',
        question_order: 7,
        format: 'BINARY',
        body: 'True or False: If a delivery truck arrives without an official approved Purchase Order (PO) on the ERP system, the receiving clerk is permitted to offload and store the goods if the delivery driver verbally promises the buyer will generate the PO tomorrow.',
        additional_text: `🟢 Model Answer:
False! Unsolicited or unapproved deliveries must never be received into warehouse inventory without a valid Purchase Order. Accepting blind deliveries leads to unauthorized stock commitments and payment disputes.

📝 How the Assessor Marks This:
• 1 Mark for identifying False and explaining unauthorized receipt risk.`,
        options: ['True', 'False'],
        correct_options: [1],
        duration: 30,
        marks: 1,
        guide_topic_hint: 'Purchase Order Compliance'
      },
      {
        id: 'q-rec-8',
        question_order: 8,
        format: 'MCQ',
        body: 'During delivery offloading, you discover 5 cartons of cooking oil leaking profusely over other grocery cartons. What is the correct standard operating sequence?',
        additional_text: `🟢 Model Answer:
The correct SOP sequence is: (1) Halt offloading, (2) Immediately isolate damaged stock into a bunded containment salvage tub to prevent cross-contamination, (3) Endorse the exact damaged quantity on the Delivery Note, and (4) Obtain the driver co-signature and issue a Discrepancy Note.

📝 How the Assessor Marks This:
• 1 Mark for halt and isolate protocol
• 1 Mark for driver endorsement and discrepancy note issuance.`,
        options: [
          '1. Halt offloading; 2. Isolate leaking cartons in a salvage tub; 3. Endorse delivery note with damaged carton count; 4. Co-sign with driver and issue Discrepancy Note',
          '1. Sign the delivery note as complete; 2. Wipe cartons with rags; 3. Store in grocery aisle; 4. Inform supervisor next week',
          '1. Reject the entire delivery truck and send it away without inspection',
          '1. Leave the oil leaking on the dock floor until the end of the shift'
        ],
        correct_options: [0],
        duration: 45,
        marks: 2,
        guide_topic_hint: 'Damaged Stock & Discrepancy SOP'
      }
    ]
  },
  {
    id: 'set-generic-2-1',
    cluster_id: 'cluster-2-1',
    set_number: 1,
    title: 'Generic Standard Assessment',
    is_custom: false,
    client_name: 'Generic Standard',
    eisa_focus_area: 'EISA Focus Area 1 & 2: Storage & Stock Preservation',
    raw_notebook_extract: `### 1. STORAGE SOPS & STOCK PRESERVATION
- Pallet stacking limits on open floors: Maximum 3 tiers high.
- FIFO rotation: First In, First Out for all perishable items.
- Cold chain: Keep frozen goods below -18C during internal transit.`,
    target_level: 'operational',
    default_entry_mode: 'group',
    total_marks: 14,
    time_allowed_minutes: 25,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    questions: [
      {
        id: 'q-stor-1',
        question_order: 1,
        format: 'MCQ',
        body: 'According to South African occupational warehouse standards, what is the maximum permissible pallet stacking height on open floor staging areas without racking support?',
        additional_text: `🟢 Model Answer:
Floor stacking limit is strictly 3 tiers high on open floors to prevent catastrophic collapse and tip-over crush hazards.

📝 How the Assessor Marks This:
• 1 Mark for 3 tiers high.`,
        options: ['3 tiers high', '4 tiers high', '5 tiers high', 'No limit if shrink-wrapped'],
        correct_options: [0],
        duration: 45,
        marks: 1,
        guide_topic_hint: 'Pallet Stacking Standards'
      },
      {
        id: 'q-stor-2',
        question_order: 2,
        format: 'MCQ',
        body: 'What is the primary operational objective of the First-In, First-Out (FIFO) stock rotation system in warehouse storage management?',
        additional_text: `🟢 Model Answer:
FIFO guarantees that the oldest inventory received is picked and dispatched first, directly preventing product expiration, stock obsolescence, and packaging deterioration.

📝 How the Assessor Marks This:
• 1 Mark for identifying dispatching oldest inventory first.`,
        options: [
          'Ensuring the oldest received inventory is dispatched first to prevent obsolescence and expiry',
          'Dispatching the newest stock first to satisfy customer preferences',
          'Stacking heavier pallets on top of lighter pallets',
          'Grouping stock by supplier brand rather than receipt date'
        ],
        correct_options: [0],
        duration: 45,
        marks: 1,
        guide_topic_hint: 'FIFO Stock Rotation Protocols'
      },
      {
        id: 'q-stor-3',
        question_order: 3,
        format: 'MCQ',
        body: 'During internal warehouse transfer between blast freezers and cold storage staging bays, frozen food inventory must remain below what statutory temperature threshold?',
        additional_text: `🟢 Model Answer:
Frozen perishables must strictly remain at or below -18°C throughout all warehouse movements. Any thaw temperature above -12°C triggers quarantine inspection.

📝 How the Assessor Marks This:
• 1 Mark for -18°C temperature standard.`,
        options: [
          '-18°C or colder at all times',
          '0°C to +4°C',
          '-5°C to -10°C',
          '+5°C for up to 4 hours'
        ],
        correct_options: [0],
        duration: 30,
        marks: 1,
        guide_topic_hint: 'Frozen Cold Chain Integrity'
      },
      {
        id: 'q-stor-4',
        question_order: 4,
        format: 'MCQ',
        body: 'What is the maximum permissible carton overhang beyond the perimeter edge of a standard 1,000mm x 1,200mm timber wooden pallet?',
        additional_text: `🟢 Model Answer:
Zero overhang is the strict warehouse ideal. Maximum allowable tolerance is 25mm under strict supervision. Any greater overhang reduces carton corner stacking strength by up to 32% and creates racking snagging hazards.

📝 How the Assessor Marks This:
• 2 Marks for identifying zero overhang ideal (max 25mm) and explaining carton crush risk.`,
        options: [
          'Zero overhang is preferred; maximum 25mm to prevent carton corner crushing and racking snagging',
          'Up to 150mm if secured with plastic strapping',
          'No limit if cartons are wrapped with black pallet stretch film',
          'Half the width of the bottom carton'
        ],
        correct_options: [0],
        duration: 45,
        marks: 2,
        guide_topic_hint: 'Pallet Stacking & Overhang Standards'
      },
      {
        id: 'q-stor-5',
        question_order: 5,
        format: 'MCQ',
        body: 'What is the minimum required vertical clearance between top pallet loads on high-bay racking beams and warehouse ceiling fire sprinkler heads?',
        additional_text: `🟢 Model Answer:
Statutory fire safety standards (ASIB / SANS) mandate a minimum 500mm (0.5 meter) clear perimeter below fire sprinkler deflectors to guarantee unobstructed water distribution in fire emergencies.

📝 How the Assessor Marks This:
• 1 Mark for 500mm / 0.5m clearance standard.`,
        options: [
          'Minimum 500mm (0.5 meters) clear unobstructed perimeter',
          'Minimum 100mm clearance',
          'Sprinkler heads may touch top shrink-wrap',
          'Clearance is only required for ground-level goods'
        ],
        correct_options: [0],
        duration: 45,
        marks: 1,
        guide_topic_hint: 'Fire Sprinkler Clearance Standards'
      },
      {
        id: 'q-stor-6',
        question_order: 6,
        format: 'MULTIPLE',
        body: 'When storing flammable aerosol spray cans and industrial solvent thinners in the warehouse, which safety controls are legally mandatory? (Select all that apply)',
        additional_text: `🟢 Model Answer:
Flammables require: (1) Approved heavy-gauge steel safety cabinet with self-closing doors, (2) Bunded containment sump to capture spills, (3) Flameproof explosion-proof electrical fittings nearby, and (4) Proximity to dedicated dry powder fire extinguishers. Never store near food or exit aisles.

📝 How the Assessor Marks This:
• 1 Mark for designated steel cabinet and bunding.
• 1 Mark for fire suppression proximity and food segregation.`,
        options: [
          'Heavy-gauge steel flammable liquid safety cabinet with self-closing doors',
          'Secondary leak containment sump or bunding in cabinet base',
          'Dedicated dry chemical powder fire extinguisher within 5 meters',
          'Open shelf storage directly above retail dry food provisions'
        ],
        correct_options: [0, 1, 2],
        duration: 60,
        marks: 2,
        guide_topic_hint: 'Flammable Goods Storage Controls'
      },
      {
        id: 'q-stor-7',
        question_order: 7,
        format: 'MCQ',
        body: 'What is the minimum designated clear width required for pedestrian safety walkways inside high-traffic warehouse storage aisles shared with forklifts?',
        additional_text: `🟢 Model Answer:
Occupational health and safety guidelines mandate a minimum 1.2-meter wide clear pedestrian walking corridor, demarcated with high-visibility yellow floor paint lines.

📝 How the Assessor Marks This:
• 1 Mark for 1.2m pedestrian demarcation standard.`,
        options: [
          '1.2 meters clear width, demarcated with high-visibility floor paint',
          '0.5 meters wide',
          'No walkway is required if employees wear reflective vests',
          '3.5 meters wide'
        ],
        correct_options: [0],
        duration: 45,
        marks: 1,
        guide_topic_hint: 'Aisle Housekeeping & Pedestrian Safety'
      },
      {
        id: 'q-stor-8',
        question_order: 8,
        format: 'BINARY',
        body: 'True or False: A damaged wooden pallet with cracked bottom deckboards or protruding nails may be placed on upper high-bay racking beams if the pallet load is shrink-wrapped tightly.',
        additional_text: `🟢 Model Answer:
False! Structural pallet defects (broken deckboards, split stringers, loose nails) compromise load distribution across racking beam flanges, creating severe racking collapse and falling pallet risks. Damaged pallets must be repalletized immediately.

📝 How the Assessor Marks This:
• 1 Mark for identifying False and explaining racking collapse hazard.`,
        options: ['True', 'False'],
        correct_options: [1],
        duration: 30,
        marks: 1,
        guide_topic_hint: 'Pallet Structural Integrity'
      },
      {
        id: 'q-stor-9',
        question_order: 9,
        format: 'MCQ',
        body: 'Under standard perpetual inventory counting procedures, how frequently should fast-moving Class A high-value warehouse stock undergo cycle counting?',
        additional_text: `🟢 Model Answer:
Class A items (high value, high velocity) must be cycle counted weekly or monthly on a perpetual cycle count schedule. Waiting for annual financial stocktake allows undiscovered shrinkage and variance accumulation.

📝 How the Assessor Marks This:
• 1 Mark for weekly / monthly perpetual frequency.
• 1 Mark for contrasting with annual stocktake delays.`,
        options: [
          'Weekly or monthly perpetual cycle counts',
          'Only once every 3 years',
          'Only during annual financial year-end stocktake',
          'Whenever a customer files an order shortage complaint'
        ],
        correct_options: [0],
        duration: 45,
        marks: 2,
        guide_topic_hint: 'Cycle Counting & Stock Preservation'
      },
      {
        id: 'q-stor-10',
        question_order: 10,
        format: 'MCQ',
        body: 'While conducting morning warehouse aisle inspections, you discover rodent droppings and chewed cardboard corners on pallet #84 in storage aisle 4. What is the mandatory immediate operational action?',
        additional_text: `🟢 Model Answer:
The clerk must immediately: (1) Place the entire pallet in the designated Quarantine Bay, (2) Affix high-visibility 'QUARANTINE - DO NOT MOVE' tags, (3) Notify the warehouse supervisor and approved pest control contractor, and (4) Initiate a stock loss / write-off assessment. Contaminated goods must never be dispatched to customers!

📝 How the Assessor Marks This:
• 1 Mark for immediate quarantine and isolation.
• 1 Mark for reporting to pest control and preventing customer dispatch.`,
        options: [
          'Move the pallet immediately to Quarantine Bay, attach Quarantine tags, and report to pest control & supervisor',
          'Brush off the droppings with a broom and pick goods for orders as usual',
          'Move the pallet to the dispatch bay so customers receive it before further damage occurs',
          'Spray household insect insecticide directly onto the food packaging'
        ],
        correct_options: [0],
        duration: 45,
        marks: 2,
        guide_topic_hint: 'Quarantine & Pest Contamination Protocols'
      }
    ]
  },
  {
    id: 'set-generic-2-4',
    cluster_id: 'cluster-2-4',
    set_number: 1,
    title: 'Generic Standard Assessment',
    is_custom: false,
    client_name: 'Generic Standard',
    eisa_focus_area: 'EISA Focus Area 1: Receiving & Loss Prevention',
    raw_notebook_extract: `### 1. LEARNER GUIDE CORE CONCEPTS & SOPS
- Aisle & Distribution Board Clearance: Minimum 1.2m perimeter unobstructed at all times.
- Pallet Stacking: Maximum 3 tiers on open floors.
- Liquid Spills: Barricade with warning cones within 60 seconds. Neutralise with designated spill kits.
- PPE: Nitrile gloves (>=0.4mm) & chemical splash goggles for industrial degreasers.

### 2. FORMATIVE ASSESSMENT ACTIVITIES
- Formative Activity 2.1: Calculation of perimeter distances around electrical panels.
- Formative Activity 2.2: Identification of GHS pictograms for corrosive cleaning chemicals.`,
    target_level: 'operational',
    default_entry_mode: 'group',
    total_marks: 10,
    time_allowed_minutes: 20,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    questions: [
      {
        id: 'q-gen-1',
        question_order: 1,
        format: 'MCQ',
        body: 'Order #409 requests 120 cartons of chilled beef. The supplier delivers 110 cartons with 2 cartons leaking. The delivery note states 120 cartons. What is the variance and what document must you immediately endorse?',
        additional_text: 'EISA Assessment Standard 1.1: Physical shortage (-10) plus damaged stock (-2) equals -12 cartons total variance. The receiving clerk must endorse the supplier Delivery Note before the driver departs and issue a Discrepancy Note.',
        options: [
          '-12 cartons; endorse Delivery Note & issue Discrepancy Note',
          '+10 cartons; sign delivery note as accepted',
          '-10 cartons; notify manager verbally without signing',
          '0 variance; accept total and adjust inventory tomorrow'
        ],
        correct_options: [0],
        duration: 45,
        marks: 1,
        guide_topic_hint: 'EISA Focus Area 1: Receiving Variance Checks'
      },
      {
        id: 'q-gen-2',
        question_order: 2,
        format: 'MCQ',
        body: 'According to your Learner Guide, what is the minimum required clearance perimeter that must remain unobstructed around electrical distribution boards and emergency exit paths?',
        additional_text: 'Learner Guide Section 2.1 mandates a minimum 1.2-meter clear perimeter at all times to ensure unhindered emergency egress and rapid fire department access. Door swing alone (0.8m) is not sufficient.',
        options: ['0.5 meters', '1.2 meters', '2.5 meters', 'Only clearance for the door swing'],
        correct_options: [1],
        duration: 45,
        marks: 1,
        guide_topic_hint: 'Section 2.1 - Core Workplace Housekeeping Duties'
      },
      {
        id: 'q-gen-3',
        question_order: 3,
        format: 'MULTIPLE',
        body: 'When receiving Class 8 Corrosive Industrial Cleaning Chemicals into the warehouse, which safety controls are mandatory? (Select all that apply)',
        additional_text: 'EISA Criterion 1.2 & SDS protocols mandate storing corrosives in designated bunded chemical containment, ensuring eyewash stations are within 10 seconds, and wearing chemical splash goggles with nitrile PPE. Never store corrosives above eye level.',
        options: [
          'Secondary bunded containment pallets',
          'Accessible emergency eyewash station within 10 seconds',
          'Nitrile gloves (>=0.4mm) and indirect ventilation goggles',
          'Stacking on top rack level above dry food provisions'
        ],
        correct_options: [0, 1, 2],
        duration: 60,
        marks: 1,
        guide_topic_hint: 'EISA Criterion 1.2: Stock Characteristics & Hazchem'
      },
      {
        id: 'q-gen-4',
        question_order: 4,
        format: 'BINARY',
        body: 'True or False: Standard warehouse safety operating procedures permit pallets to be stacked up to 5 tiers high on open warehouse floor space without racking bays.',
        additional_text: 'False. Pallets must never be stacked more than 3 tiers high on open floors unless locked within calibrated drive-in racking bays to avoid tip-over hazard.',
        options: ['True', 'False'],
        correct_options: [1],
        duration: 30,
        marks: 1,
        guide_topic_hint: 'Pallet Stacking Limits'
      },
      {
        id: 'q-gen-5',
        question_order: 5,
        format: 'WORD_CLOUD',
        body: 'In one or two words, what is the very first standard action taken upon discovering an unidentified liquid chemical spill on the receiving bay?',
        additional_text: 'Barricade / Isolate / Contain! Immediate isolation with chevron warning cones protects other personnel before clean-up begins.',
        options: [],
        correct_options: [],
        duration: 45,
        marks: 1,
        guide_topic_hint: 'Spill Management Protocols'
      },
      {
        id: 'q-gen-6',
        question_order: 6,
        format: 'MCQ',
        body: 'If an employee splashes corrosive battery acid or industrial solvent into their eyes, what is the mandatory immediate emergency eyewash protocol?',
        additional_text: `🟢 Model Answer:
The statutory workplace safety protocol is:
1. Flush eyes immediately at the emergency eyewash station for a continuous minimum of 15 minutes with eyelids held open.
2. Call for designated first aider assistance immediately.
3. Retrieve the chemical Safety Data Sheet (SDS) and transfer the patient for professional medical examination.

📝 How the Assessor Marks This:
• 1 Mark for 15 minutes continuous flushing standard.
• 1 Mark for retrieving SDS and seeking medical attention.`,
        options: [
          'Flush eyes continuously for a minimum of 15 minutes with eyelids held open, notify first aider, and seek medical attention with the SDS',
          'Rinse eyes for 30 seconds and resume work',
          'Rub eyes vigorously with dry cotton towels',
          'Apply neutralising vinegar drops directly into the eyes'
        ],
        correct_options: [0],
        duration: 45,
        marks: 2,
        guide_topic_hint: 'Emergency Eyewash & Chemical Exposure SOP'
      },
      {
        id: 'q-gen-7',
        question_order: 7,
        format: 'MCQ',
        body: 'Under standard warehouse manual handling and stacking guidelines, what is the maximum recommended height for manually building a carton load on a pallet without mechanical assistance?',
        additional_text: `🟢 Model Answer:
Manual carton stacking must not exceed shoulder/eye height (1.8 meters maximum) to avoid spinal strain, unstable overreaching, and carton toppling accidents onto workers.

📝 How the Assessor Marks This:
• 1 Mark for 1.8 meters / shoulder-level limit.`,
        options: [
          'Maximum 1.8 meters (shoulder height) to maintain stability and prevent ergonomic injury',
          'Up to 3.5 meters as long as the worker stands on an empty carton',
          'No limit if cartons are light',
          'Strictly 0.5 meters high'
        ],
        correct_options: [0],
        duration: 30,
        marks: 1,
        guide_topic_hint: 'Manual Handling & Pallet Building Limits'
      },
      {
        id: 'q-gen-8',
        question_order: 8,
        format: 'MCQ',
        body: 'What is the primary operational purpose of the "Clean-As-You-Go" housekeeping policy in high-traffic warehouse storage aisles?',
        additional_text: `🟢 Model Answer:
Clean-As-You-Go requires workers to remove shrink-wrap off-cuts, timber splinters, and banding straps immediately after task completion, directly preventing forklift wheel entanglement and slip/trip injuries.

📝 How the Assessor Marks This:
• 1 Mark for immediate debris removal and slip/trip/forklift hazard prevention.`,
        options: [
          'Immediate removal of strapping, timber fragments, and plastic debris to eliminate trip and forklift entanglement hazards',
          'Cleaning only once a week during Friday afternoon shutdowns',
          'Passing waste material to dispatch staging lanes for others to clear',
          'Sweeping debris under racking uprights to keep aisles looking clear'
        ],
        correct_options: [0],
        duration: 30,
        marks: 2,
        guide_topic_hint: 'Clean-As-You-Go Housekeeping Policy'
      }
    ]
  },
  {
    id: 'set-spur-2-4',
    cluster_id: 'cluster-2-4',
    set_number: 2,
    title: 'Spur Corporation - Montague Gardens DC',
    is_custom: true,
    client_name: 'Spur Corporation',
    eisa_focus_area: 'Cold Storage & Chemical Spills',
    custom_background_context: 'Spur Corporation employees working in a distribution warehouse in Montague Gardens, dealing with cold storage freezers, forklift aisles, hot oil spills, and heavy frozen poultry pallet transfers.',
    raw_notebook_extract: `Pasted from Gemini Notebook for Spur Montague Gardens:\n- Focus on slip hazards from cold storage condensation.\n- Oil drum handling near dispatch bay 4.\n- Emergency clearance around compressor room.`,
    target_level: 'operational',
    default_entry_mode: 'group',
    total_marks: 10,
    time_allowed_minutes: 20,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    questions: [
      {
        id: 'q-spur-1',
        question_order: 1,
        format: 'MCQ',
        body: 'At the Spur Montague Gardens distribution center, condensation creates a slip hazard right outside the blast freezer. According to your Learner Guide, what must the receiving clerk deploy within 60 seconds?',
        additional_text: 'Learner Guide Section 2.1 requires immediate isolation of slip hazards using high-visibility chevron warning cones and universal dry absorbent before any cleaning takes place.',
        options: [
          'High-visibility chevron warning cones and barricade',
          'A bucket of cold soapy water',
          'A handwritten cardboard warning note',
          'Wait until the shift ends to mop'
        ],
        correct_options: [0],
        duration: 45,
        marks: 1,
        guide_topic_hint: 'Spill Management Protocols'
      },
      {
        id: 'q-spur-2',
        question_order: 2,
        format: 'BINARY',
        body: 'True or False: In the Montague Gardens cold storage staging area, frozen poultry pallets can be stacked 4 tiers high on open floor space to save forklift staging space.',
        additional_text: 'False. The standard safety limit remains strictly 3 tiers maximum on open warehouse floor space. Ice build-up increases tip-over hazards.',
        options: ['True', 'False'],
        correct_options: [1],
        duration: 30,
        marks: 1,
        guide_topic_hint: 'Pallet Stacking Limits'
      },
      {
        id: 'q-spur-3',
        question_order: 3,
        format: 'MULTIPLE',
        body: 'When decanting industrial degreaser to sanitize the Montague Gardens dispatch forklift charging bay, which PPE items are mandatory under your guide? (Select all that apply)',
        additional_text: 'Section 2.2 specifies nitrile gloves (>=0.4mm) and chemical splash goggles with indirect ventilation to prevent corneal and chemical burns.',
        options: [
          'Nitrile gloves (min 0.4mm thickness)',
          'Chemical splash goggles with indirect ventilation',
          'Steel-toe safety boots',
          'Standard kitchen cleaning gloves'
        ],
        correct_options: [0, 1, 2],
        duration: 60,
        marks: 1,
        guide_topic_hint: 'Section 2.2 - PPE Compliance'
      },
      {
        id: 'q-spur-4',
        question_order: 4,
        format: 'WORD_CLOUD',
        body: 'In one word, what is the most critical safety item required before entering the Montague Gardens sub-zero freezer room?',
        additional_text: 'Thermal PPE / Thermal Jacket! Cold-chain safety compliance requires thermal protection and radio communication.',
        options: [],
        correct_options: [],
        duration: 45,
        marks: 1,
        guide_topic_hint: 'Cold Chain Safety'
      },
      {
        id: 'q-spur-5',
        question_order: 5,
        format: 'MCQ',
        body: 'At the Spur Montague Gardens cold store entrance, warm ambient air meets sub-zero air, forming ice patches on the threshold concrete. What is the mandatory immediate housekeeping corrective action?',
        additional_text: `🟢 Model Answer:
The threshold must be immediately treated with food-safe non-corrosive de-icer grit, scraped clean, and dried with industrial rubber squeegees to prevent forklift drive-wheel skidding and rollover hazards.

📝 How the Assessor Marks This:
• 1 Mark for de-icing grit/scraper protocol and preventing forklift skids.`,
        options: [
          'Apply non-corrosive food-safe de-icer grit, scrape clear, and squeegee dry immediately',
          'Spray hot tap water over the ice and leave it to drain',
          'Ignore ice unless a forklift gets stuck',
          'Place cardboard boxes over the ice'
        ],
        correct_options: [0],
        duration: 45,
        marks: 2,
        guide_topic_hint: 'Cold Store Threshold Ice Abatement'
      },
      {
        id: 'q-spur-6',
        question_order: 6,
        format: 'MCQ',
        body: 'When moving heavy poultry marinade and cooking oil drums (210-litre steel drums) in Spur Montague Gardens DC, what equipment must be used to prevent back injury and drum puncturing?',
        additional_text: `🟢 Model Answer:
210-litre drums weigh upwards of 200 kg and must strictly be handled using a certified Hydraulic Drum Trolley / Drum Grab attachment fitted to a forklift. Rolling drums by hand or using standard pallet tines is strictly prohibited.

📝 How the Assessor Marks This:
• 1 Mark for identifying specialized drum handler/clamp and prohibiting manual rolling.`,
        options: [
          'Certified hydraulic drum trolley or forklift drum clamp attachment',
          'Tipping the drum and rolling it manually across the concrete floor',
          'Two workers lifting it by hand',
          'Pushing it with standard pallet forks'
        ],
        correct_options: [0],
        duration: 45,
        marks: 2,
        guide_topic_hint: 'Heavy Drum Handling SOP'
      },
      {
        id: 'q-spur-7',
        question_order: 7,
        format: 'MCQ',
        body: 'Under occupational cold storage regulations at Spur, what is the maximum continuous duration an order picker is permitted to work inside the -20°C blast freezer without taking a warm-up recovery break?',
        additional_text: `🟢 Model Answer:
Occupational health regulations specify a maximum continuous exposure of 90 minutes inside sub-zero freezers (-20°C) with full thermal PPE, followed by a mandatory warm-room recovery break.

📝 How the Assessor Marks This:
• 1 Mark for 90 minutes maximum threshold.`,
        options: [
          'Maximum 90 minutes continuous exposure, followed by mandatory warm-room recovery',
          '4 continuous hours without a break',
          'Full 8-hour shift as long as thermal gloves are worn',
          '15 minutes only'
        ],
        correct_options: [0],
        duration: 30,
        marks: 1,
        guide_topic_hint: 'Sub-Zero Working Time Limits & Thermal Ergonomics'
      },
      {
        id: 'q-spur-8',
        question_order: 8,
        format: 'BINARY',
        body: 'True or False: Damaged wooden pallets and discarded corrugated boxes may be stacked in the outdoor alleyway against the warehouse exterior wall if they are scheduled for scrap collection by Friday.',
        additional_text: `🟢 Model Answer:
False! Stacking flammable timber and carton scrap against exterior warehouse walls creates a severe arson/fire hazard and breaches municipal bylaws. Waste must be locked inside designated scrap skip bins 10 meters away from building perimeters.

📝 How the Assessor Marks This:
• 1 Mark for False and identifying fire/pest hazard.`,
        options: ['True', 'False'],
        correct_options: [1],
        duration: 30,
        marks: 1,
        guide_topic_hint: 'External Waste Management & Fire Separation'
      }
    ]
  },
  {
    id: 'set-fsa-2-3',
    cluster_id: 'cluster-2-3',
    set_number: 1,
    title: 'Cluster 2.3 — Generic IAC FSA Mock Exam',
    is_custom: false,
    is_fsa_mock: true,
    client_name: 'Generic IAC FSA Mock',
    eisa_focus_area: 'EISA Focus Area 2: Dispatch Packing, Labelling & 15% VAT Math',
    raw_notebook_extract: `### FSA MOCK EXAM: CLUSTER 2.3 (PACKING, LABELLING & DISPATCH ADVICE)
- South African statutory 15% VAT calculation on Dispatch Advice.
- Courier fee calculations (base carton + additional cartons).
- Protective packaging matrix for delicate vs heavy consignments.
- 4 mandatory criteria on exterior dispatch labels.`,
    target_level: 'operational',
    default_entry_mode: 'group',
    total_marks: 25,
    time_allowed_minutes: 30,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    questions: [
      {
        id: 'q-fsa-23-1',
        question_order: 1,
        format: 'MCQ',
        body: 'GadgetCO receives an order for 5 cartons of heavy-duty packing tape @ R20.00 each, and 4 rolls of bubble wrap @ R60.00 each. As the dispatch clerk completing the official Dispatch Advice, what is the statutory 15% VAT amount and the final Grand Total payable?',
        additional_text: `🟢 Model Answer:
Line 1: 5 cartons x R20.00 = R100.00
Line 2: 4 rolls x R60.00 = R240.00
Subtotal (Excl. VAT) = R340.00
Statutory 15% VAT: R340.00 x 0.15 = R51.00
Grand Total (Incl. VAT) = R340.00 + R51.00 = R391.00

📝 How the Assessor Marks This:
Total: 5 Marks in the National Exam paper (Question 4).
• 1 Mark for line totals (R100 + R240)
• 1 Mark for Subtotal (R340.00)
• 2 Marks for calculating 15% VAT (R51.00)
• 1 Mark for Grand Total (R391.00)
Common pitfall: Using the obsolete 14% VAT rate or forgetting to add VAT to the subtotal.`,
        options: [
          'VAT: R51.00 • Grand Total: R391.00',
          'VAT: R47.60 • Grand Total: R387.60',
          'VAT: R51.00 • Grand Total: R340.00',
          'VAT: R34.00 • Grand Total: R374.00'
        ],
        correct_options: [0],
        duration: 60,
        marks: 5,
        guide_topic_hint: 'Dispatch Advice 15% VAT Calculation'
      },
      {
        id: 'q-fsa-23-2',
        question_order: 2,
        format: 'MCQ',
        body: 'A fragile consignment requires 6 outer dispatch cartons. Courier contract rates are R150.00 base charge for the first carton plus R45.00 for each additional carton, subject to 15% VAT. What is the total courier charge payable?',
        additional_text: `🟢 Model Answer:
First carton base fee = R150.00
Remaining 5 cartons @ R45.00 each = R225.00
Subtotal = R150.00 + R225.00 = R375.00
15% VAT = R375.00 x 0.15 = R56.25
Grand Total = R375.00 + R56.25 = R431.25

📝 How the Assessor Marks This:
• 1 Mark for base carton separation
• 1 Mark for 5 additional cartons calculation (5 x R45 = R225)
• 1 Mark for subtotal (R375.00)
• 1 Mark for applying 15% VAT to grand total. 0 marks awarded if VAT is omitted.`,
        options: [
          'R431.25 (Subtotal R375.00 + 15% VAT R56.25)',
          'R375.00 (Forgot to calculate 15% VAT)',
          'R310.50 (Calculated additional cartons at R30 each)',
          'R483.00 (Charged R150 base rate for all 6 cartons)'
        ],
        correct_options: [0],
        duration: 60,
        marks: 4,
        guide_topic_hint: 'Courier Freight Calculations'
      },
      {
        id: 'q-fsa-23-3',
        question_order: 3,
        format: 'MCQ',
        body: 'You are packing 10 sensitive electronic tablets for road courier freight across provinces. Which packaging pairing strictly complies with protective dispatch standards?',
        additional_text: `🟢 Model Answer:
High-value electronics require anti-static cushioning, edge shock protection, double-wall corrugated exterior casing, and tamper-evident security tape to deter and reveal transit shrinkage.

📝 How the Assessor Marks This:
Assessor evaluates 3 distinct layers: internal anti-static cushioning, structural outer packaging, and anti-shrinkage tamper seals. Generic answers like 'wrap carefully' receive 0 marks.`,
        options: [
          'Anti-static bubble wrap per unit, rigid corner edge protectors, double-wall corrugated carton, sealed with tamper-evident security tape',
          'Single-wall lightweight carton filled with shredded office paper',
          'Standard pallet stretch wrap directly around bare retail tablet boxes',
          'Plastic supermarket carrier bags inside a loose timber crate'
        ],
        correct_options: [0],
        duration: 45,
        marks: 3,
        guide_topic_hint: 'Protective Packaging Selection Matrix'
      },
      {
        id: 'q-fsa-23-4',
        question_order: 4,
        format: 'MCQ',
        body: 'Before loading dispatch cartons into the third-party courier vehicle, which four details are mandatory on the exterior carton dispatch label?',
        additional_text: `🟢 Model Answer:
The 4 mandatory dispatch label criteria are: (1) Consignee delivery address & contact, (2) Unique Dispatch Advice / Waybill reference number, (3) Sequential carton count (e.g. Box 1 of 3), and (4) Handling symbols (Fragile / This Way Up / Keep Dry).

📝 How the Assessor Marks This:
All 4 elements must be identified. Disclosing internal pricing or profit margins on exterior labels is a severe security non-conformance.`,
        options: [
          'Consignee delivery address, Dispatch Advice / Waybill number, Carton sequence count (e.g. Box 1 of 3), and Handling / Fragile symbols',
          'Supplier cost price, DC manager home address, product retail margin, and picker clock number',
          'Customer cell phone number only',
          'Gross profit per item and delivery vehicle license plate'
        ],
        correct_options: [0],
        duration: 45,
        marks: 4,
        guide_topic_hint: 'Dispatch Label Mandatory Elements'
      },
      {
        id: 'q-fsa-23-5',
        question_order: 5,
        format: 'MCQ',
        body: 'You are preparing an overland freight consignment note. The wooden export pallet weighs 25 kg empty (tare weight). It carries 40 master cartons weighing 12.5 kg each. What is the Net Weight and Gross Weight to declare on the Dispatch Advice?',
        additional_text: `🟢 Model Answer:
Net Weight = 40 cartons x 12.5 kg = 500 kg.
Tare Weight = 25 kg.
Gross Weight = Net Weight (500 kg) + Tare Weight (25 kg) = 525 kg.

📝 How the Assessor Marks This:
• 1 Mark for Net Weight calculation (500 kg)
• 1 Mark for Gross Weight calculation (525 kg). Assessor deducts marks if tare weight is forgotten or subtracted.`,
        options: [
          'Net Weight: 500 kg • Gross Weight: 525 kg',
          'Net Weight: 525 kg • Gross Weight: 500 kg',
          'Net Weight: 475 kg • Gross Weight: 500 kg',
          'Net Weight: 500 kg • Gross Weight: 500 kg'
        ],
        correct_options: [0],
        duration: 45,
        marks: 2,
        guide_topic_hint: 'Tare, Net & Gross Weight Calculation'
      },
      {
        id: 'q-fsa-23-6',
        question_order: 6,
        format: 'MCQ',
        body: 'A customer returns 3 cartons of damaged goods with the carrier. Which formal warehouse document must the dispatch clerk cross-reference and endorse before accepting the return into the warehouse return bay?',
        additional_text: `🟢 Model Answer:
The dispatch clerk must reconcile the carrier Return Waybill against the original Sales Invoice / Dispatch Advice, issue a Goods Return Voucher (GRV) or Credit Requisition, and quarantine the stock.

📝 How the Assessor Marks This:
• 1 Mark for naming Goods Return Voucher / Credit Requisition and invoice cross-reference.`,
        options: [
          'Goods Return Voucher (GRV) / Credit Requisition cross-referenced against the original Dispatch Advice',
          'Cash payment receipt from the driver',
          'Warehouse floor cleaning logbook',
          'No paperwork required for customer returns'
        ],
        correct_options: [0],
        duration: 45,
        marks: 2,
        guide_topic_hint: 'Customer Returns & GRV Protocol'
      },
      {
        id: 'q-fsa-23-7',
        question_order: 7,
        format: 'MCQ',
        body: 'Under international ISO and SABS packaging standards, what does the universal "Two Parallel Upward Arrows" symbol printed on outer dispatch cartons indicate to freight handlers?',
        additional_text: `🟢 Model Answer:
The two upward pointing arrows symbolize 'This Way Up', indicating the correct vertical orientation of the container to prevent fluid leakage, internal component inversion, or base crushing.

📝 How the Assessor Marks This:
• 1 Mark for 'This Way Up' orientation standard.`,
        options: [
          '"This Way Up" — container must always remain in an upright vertical orientation',
          'Do not stack more than two cartons high',
          'Lift using two forklift operators simultaneously',
          'Recyclable corrugated cardboard packaging'
        ],
        correct_options: [0],
        duration: 30,
        marks: 1,
        guide_topic_hint: 'ISO Handling Pictograms'
      },
      {
        id: 'q-fsa-23-8',
        question_order: 8,
        format: 'MCQ',
        body: 'During dispatch final inspection, you notice the picking slip requires 80 units of Product #X, but the packed box only contains 75 units. The carrier collection driver is waiting to load. What is the mandatory immediate action?',
        additional_text: `🟢 Model Answer:
The clerk must immediately: (1) Do NOT seal or hand over short cargo without correction, (2) Fetch the 5 missing units from bulk pick faces or immediately endorse the Dispatch Advice and carrier waybill as short-shipped (75 units) with supervisor authorization.

📝 How the Assessor Marks This:
• 1 Mark for halting dispatch and preventing unendorsed short shipments.
• 1 Mark for correcting documentation before driver departs.`,
        options: [
          'Halt dispatch handover, retrieve 5 missing units or immediately endorse the Dispatch Advice and waybill for 75 units with supervisor authorization',
          'Hand over the box and tell the driver to explain to the customer',
          'Change the picking slip quantity with a pen without supervisor sign-off',
          'Pack 5 units of a completely different product to make up the count'
        ],
        correct_options: [0],
        duration: 45,
        marks: 2,
        guide_topic_hint: 'Pre-Dispatch Shortage Reconciliation'
      },
      {
        id: 'q-fsa-23-9',
        question_order: 9,
        format: 'MCQ',
        body: 'Which of the following cushioning materials is mandatory when packing high-fragility glassware consignments for multi-stop courier road transport?',
        additional_text: `🟢 Model Answer:
Fragile glassware requires partitioned corrugated carton cells, individualized bubble wrap wrapping per item, and loose-fill polystyrene peanut void fill to prevent glass-to-glass contact during transit vibration.

📝 How the Assessor Marks This:
• 1 Mark for partitioned dividers and individualized shock cushioning.`,
        options: [
          'Individual bubble wrapping per item with corrugated cell dividers and void-fill cushioning',
          'Packing items tightly with barcode shrink-wrap only',
          'Placing items loose inside an oversized wooden box',
          'Wrapping items in single-layer brown kraft paper'
        ],
        correct_options: [0],
        duration: 30,
        marks: 1,
        guide_topic_hint: 'Protective Packaging for Fragile Consignments'
      },
      {
        id: 'q-fsa-23-10',
        question_order: 10,
        format: 'BINARY',
        body: 'True or False: If a third-party courier driver loses or misplaces their company copy of the signed Waybill, the dispatch clerk should hand over the warehouse master copy to the driver.',
        additional_text: `🟢 Model Answer:
False! The warehouse master copy is a statutory audit record that must strictly remain in warehouse archives. The clerk may only provide a certified photocopy or reprint marked 'DUPLICATE COPY'.

📝 How the Assessor Marks This:
• 1 Mark for identifying False and explaining protection of master audit records.`,
        options: ['True', 'False'],
        correct_options: [1],
        duration: 30,
        marks: 1,
        guide_topic_hint: 'Dispatch Document Control & Retention'
      }
    ]
  },
  {
    id: 'set-fsa-1-3',
    cluster_id: 'cluster-1-3',
    set_number: 1,
    title: 'Cluster 1.3 — Generic IAC FSA Mock Exam',
    is_custom: false,
    is_fsa_mock: true,
    client_name: 'Generic IAC FSA Mock',
    eisa_focus_area: 'EISA Focus Area 1: Receiving Verification & Discrepancy Endorsements',
    raw_notebook_extract: `### FSA MOCK EXAM: CLUSTER 1.3 (RECEIVING & CHECKING DELIVERIES)
- Discrepancy calculations (physical shortage + damaged stock = total variance).
- Refusal of 'Subject to Check' signatures.
- 4 mandatory inbound verification checks.
- Mandla vs Lindiwe receiving bay shrinkage audit case study.`,
    target_level: 'operational',
    default_entry_mode: 'group',
    total_marks: 23,
    time_allowed_minutes: 30,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    questions: [
      {
        id: 'q-fsa-13-1',
        question_order: 1,
        format: 'MCQ',
        body: 'Purchase Order #782 ordered 200 cartons of premium ceramic floor tiles. The supplier Delivery Note indicates 200 cartons dispatched. During offloading, the receiving clerk counts 188 sound cartons, 4 smashed cartons, and 8 cartons missing. What is the total variance that must be endorsed on the Delivery Note before the driver departs?',
        additional_text: `🟢 Model Answer:
Physical Shortage = 200 invoiced - 192 delivered = -8 cartons.
Damaged Goods = -4 cartons.
Total Variance = (-8) + (-4) = -12 cartons.
The receiving clerk must endorse the supplier Delivery Note as: 'Received 188 sound cartons, -8 short, -4 damaged (Total -12 variance)', co-signed by the delivery driver, and generate a Discrepancy Advice.

📝 How the Assessor Marks This:
• 1 Mark for calculating shortage (-8)
• 1 Mark for calculating damage (-4)
• 1 Mark for combining total variance (-12)
• 1 Mark for naming the exact endorsement on the delivery note before driver leaves. Endorsing shortage only receives partial credit.`,
        options: [
          '-12 cartons total variance (-8 shortage and -4 damaged)',
          '-8 cartons variance (counting only missing cartons)',
          '-4 cartons variance (counting only damaged cartons)',
          '0 variance; sign the note and submit an internal report next week'
        ],
        correct_options: [0],
        duration: 45,
        marks: 4,
        guide_topic_hint: 'Receiving Discrepancy Calculation'
      },
      {
        id: 'q-fsa-13-2',
        question_order: 2,
        format: 'MCQ',
        body: 'A third-party delivery driver is running late for another delivery and pressures you to sign the Delivery Note with "Subject to Check" so he can leave. What is the correct standard operating procedure?',
        additional_text: `🟢 Model Answer:
The receiving clerk must strictly refuse to sign 'Subject to Check'. Once the driver leaves the premises, 'Subject to Check' has zero legal standing, and the supplier will reject any subsequent shortage or damage claims, leaving the receiving warehouse with full shrinkage liability.

📝 How the Assessor Marks This:
National exam standard: Assessor awards 2 marks for stating that 'Subject to Check' is prohibited and explaining that financial liability shifts entirely to the receiving business.`,
        options: [
          'Refuse to sign "Subject to Check"; halt the driver and complete full physical count and carton verification before signing',
          'Sign "Subject to Check" with your signature to maintain good supplier relationships',
          'Refuse the entire delivery and send the driver back without offloading',
          'Sign a blank delivery note and check the stock at the end of the shift'
        ],
        correct_options: [0],
        duration: 30,
        marks: 2,
        guide_topic_hint: 'Prohibition of Subject to Check Clause'
      },
      {
        id: 'q-fsa-13-3',
        question_order: 3,
        format: 'MCQ',
        body: 'Under QCTO EISA Assessment Standard KM-03, what are the four mandatory verification checks a receiving clerk must perform before signing for stock?',
        additional_text: `🟢 Model Answer:
The 4 mandatory verification checks are:
1. Destination verification (confirming goods are addressed to this facility)
2. 3-Way Match (Delivery Note vs. valid approved Purchase Order)
3. Physical quantity count (matching actual units to delivery document)
4. Quality & seal inspection (identifying crushed, punctured, leaking, or tampered cartons).

📝 How the Assessor Marks This:
Assessor marks 1 mark for each of the 4 verification elements. Any procedural order that signs before inspection receives 0 marks.`,
        options: [
          '1. Check delivery address & recipient; 2. Match delivery note against Purchase Order; 3. Verify physical piece count; 4. Inspect external carton condition for damage/tampering',
          '1. Check driver identity; 2. Inspect truck tire tread; 3. Check warehouse temperature; 4. Review company credit rating',
          '1. Scan barcode; 2. Weigh truck; 3. Unpack every individual item; 4. Issue invoice',
          '1. Sign delivery note; 2. Offload stock; 3. Count stock; 4. File delivery note'
        ],
        correct_options: [0],
        duration: 45,
        marks: 4,
        guide_topic_hint: '4 Inbound Verification Checks'
      },
      {
        id: 'q-fsa-13-4',
        question_order: 4,
        format: 'MCQ',
        body: 'Case Study: Mandla signs the delivery note while goods are still on the truck, then leaves the offloaded pallets in the open receiving yard while having lunch. Lindiwe verifies each pallet against the PO, checks tamper seals, endorses a 2-carton shortage with the driver, and moves goods immediately into the locked receiving bay. How would an EISA assessor evaluate Mandla vs Lindiwe?',
        additional_text: `🟢 Model Answer:
Mandla violated two foundational receiving SOPs: (1) Signing before physical verification shifts financial liability to the company; (2) Leaving unattended stock in an open yard exposes inventory to opportunistic theft and weather shrinkage. Lindiwe followed the complete EISA standard: verified count, endorsed shortage with driver co-signature, and staged stock in a secure, controlled area.

📝 How the Assessor Marks This:
EISA Focus Area 1 (AAC 4): Assessor awards marks for identifying bad shrinkage control with specific failure causes (signing blind, unattended staging) and contrasting with correct procedural controls.`,
        options: [
          'Mandla demonstrates bad shrinkage control (signing blind, leaving stock vulnerable). Lindiwe demonstrates compliant good control (3-way check, driver co-signature, secure staging).',
          'Mandla saved time and followed fast-track protocol; Lindiwe was overly slow.',
          'Both clerks met the minimum standard because the stock was eventually offloaded.',
          'Mandla should be promoted for speeding up truck turnaround time.'
        ],
        correct_options: [0],
        duration: 60,
        marks: 4,
        guide_topic_hint: 'Receiving Shrinkage Audit Case Study'
      },
      {
        id: 'q-fsa-13-5',
        question_order: 5,
        format: 'MCQ',
        body: 'When scanning GS1-128 barcode labels on incoming master pallets, which three data identifiers are decoded to verify stock authenticity and batch tracking?',
        additional_text: `🟢 Model Answer:
GS1-128 barcode Application Identifiers (AI) encode: (1) SSCC - Serial Shipping Container Code, (2) Batch / Lot Number (AI 10), and (3) Expiration / Best Before Date (AI 15/17).

📝 How the Assessor Marks This:
• 2 Marks for identifying SSCC, Batch/Lot number, and Expiry date.`,
        options: [
          'Serial Shipping Container Code (SSCC), Batch / Lot Number, and Expiration Date',
          'Driver cell phone number, vehicle registration, and truck fuel level',
          'Company tax number, DC manager initials, and weather forecast',
          'Retail sales margin, customer discount percentage, and store aisle number'
        ],
        correct_options: [0],
        duration: 45,
        marks: 2,
        guide_topic_hint: 'GS1-128 Inbound Barcode Standards'
      },
      {
        id: 'q-fsa-13-6',
        question_order: 6,
        format: 'MCQ',
        body: 'A supplier delivers 150 cases of canned tuna when Purchase Order #892 only authorized 100 cases. The driver insists you accept all 150 because his truck is empty. What is the mandatory standard operating procedure?',
        additional_text: `🟢 Model Answer:
The receiving clerk must: (1) Accept ONLY the authorized 100 cases, (2) Refuse the unapproved 50 excess cases and endorse the Delivery Note as '50 cases over-delivery rejected — unauthorized stock', and (3) Never receive unauthorized stock without an approved amended PO from procurement.

📝 How the Assessor Marks This:
• 1 Mark for accepting authorized PO quantity only.
• 1 Mark for rejecting excess and endorsing delivery note.`,
        options: [
          'Accept only the 100 authorized cases; reject the unapproved 50 cases and endorse Delivery Note with driver co-signature',
          'Accept all 150 cases and hide the extra 50 cases in the bulk warehouse',
          'Reject the entire delivery truck including the 100 ordered cases',
          'Accept all 150 cases and sell the extra 50 cases to staff for cash'
        ],
        correct_options: [0],
        duration: 45,
        marks: 2,
        guide_topic_hint: 'Surplus & Over-Delivery Protocol'
      },
      {
        id: 'q-fsa-13-7',
        question_order: 7,
        format: 'MCQ',
        body: 'A delivery of fresh poultry arrives at the dock. The probe thermometer reading records +8.5°C (statutory standard is 0°C to +4°C). What immediate operational procedure must be executed?',
        additional_text: `🟢 Model Answer:
Cold chain violation (>+5°C): (1) Immediately quarantine the load and halt offloading, (2) Take calibration photos and log probe readings in the Receiving Temperature Register, (3) Endorse Delivery Note as 'Cold chain breach: +8.5°C — load rejected', and (4) Issue formal Rejection Note signed by the driver.

📝 How the Assessor Marks This:
• 1 Mark for immediate quarantine and refusal of out-of-spec perishable stock.
• 1 Mark for document endorsement with driver co-signature.`,
        options: [
          'Quarantine load, log temperature breach (+8.5°C), endorse Delivery Note as rejected, and issue formal Rejection Note signed by driver',
          'Offload immediately and place directly into blast freezer to cool down',
          'Accept stock if driver gives verbal assurance that truck chiller was working earlier',
          'Sign delivery note as complete and file an internal note next week'
        ],
        correct_options: [0],
        duration: 45,
        marks: 2,
        guide_topic_hint: 'Cold Chain Receiving Rejection Protocol'
      },
      {
        id: 'q-fsa-13-8',
        question_order: 8,
        format: 'BINARY',
        body: 'True or False: If a delivery arrives 15 minutes before warehouse shift closing, the receiving clerk is permitted to sign the Delivery Note without counting, provided the stock is locked inside the staging cage overnight.',
        additional_text: `🟢 Model Answer:
False! Signing a Delivery Note before counting stock legally confirms receipt in good order. If shortages or damage are discovered the next morning, the supplier will legally decline credit, transferring 100% financial loss to the receiving company.

📝 How the Assessor Marks This:
• 1 Mark for False and explaining immediate transfer of liability upon signature.`,
        options: ['True', 'False'],
        correct_options: [1],
        duration: 30,
        marks: 1,
        guide_topic_hint: 'Prohibition of Blind Signatures at Shift End'
      },
      {
        id: 'q-fsa-13-9',
        question_order: 9,
        format: 'MCQ',
        body: 'Who in the warehouse organizational hierarchy has statutory authority to authorize the release or disposal of goods held in the designated Quarantine Bay?',
        additional_text: `🟢 Model Answer:
Only the designated Warehouse Quality Assurance (QA) Manager or DC Operations Manager has formal authority to release or write off quarantined goods after completing a technical inspection. General receiving clerks and offloaders may never release quarantined items.

📝 How the Assessor Marks This:
• 1 Mark for QA / DC Operations Manager authorization rule.`,
        options: [
          'Designated Quality Assurance (QA) Manager or DC Operations Manager after formal written inspection',
          'Any warehouse forklift driver or receiving general worker',
          'The external delivery truck driver',
          'Quarantined goods release automatically after 48 hours without inspection'
        ],
        correct_options: [0],
        duration: 30,
        marks: 1,
        guide_topic_hint: 'Quarantine Area Governance & Release Protocols'
      },
      {
        id: 'q-fsa-13-10',
        question_order: 10,
        format: 'MCQ',
        body: 'During physical piece counting of a mixed pallet of retail goods, which counting methodology provides the highest verification accuracy according to EISA assessment standards?',
        additional_text: `🟢 Model Answer:
EISA standards require Blind Piece-by-Piece Counting or Double-Independent Counting where two checkers count separately without viewing invoice totals, and reconcile discrepancies before signing the GRN.

📝 How the Assessor Marks This:
• 1 Mark for double-independent / blind counting standard.`,
        options: [
          'Blind piece-by-piece counting or double-independent checking before signing',
          'Estimating carton quantities based on pallet height only',
          'Counting only the top layer and multiplying by total pallet tiers',
          'Accepting the supplier carton count printed on the exterior pallet shrink-wrap'
        ],
        correct_options: [0],
        duration: 30,
        marks: 1,
        guide_topic_hint: 'Inbound Verification Counting Methodology'
      }
    ]
  },
  {
    id: 'set-fsa-2-2',
    cluster_id: 'cluster-2-2',
    set_number: 1,
    title: 'Cluster 2.2 — Generic IAC FSA Mock Exam',
    is_custom: false,
    is_fsa_mock: true,
    client_name: 'Generic IAC FSA Mock',
    eisa_focus_area: 'EISA Focus Area 1 & 2: MHE Selection & Equipment Safety Protocols',
    raw_notebook_extract: `### FSA MOCK EXAM: CLUSTER 2.2 (RECORDING DISPATCHES & MHE SELECTION)
- Material Handling Equipment (MHE) selection matrix.
- 3-step Faulty Equipment Protocol (STOP, TAG OUT, REPORT).
- Reconciling picking slips, dispatch registers, and carrier waybills.`,
    target_level: 'operational',
    default_entry_mode: 'group',
    total_marks: 18,
    time_allowed_minutes: 25,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    questions: [
      {
        id: 'q-fsa-22-1',
        question_order: 1,
        format: 'MCQ',
        body: 'You need to transfer two full timber pallets of heavy printer paper (total weight 1,800 kg) from the bulk staging bay into a high-bay racking lane. Which Material Handling Equipment (MHE) is strictly required?',
        additional_text: `🟢 Model Answer:
Heavy bulk palletized goods (1,800 kg) destined for racking require certified power-driven lifting equipment: a Counterbalance Forklift or Reach Truck with the rated SWL (Safe Working Load) exceeding 2,000 kg. Manual pallet jacks cannot elevate above floor level.

📝 How the Assessor Marks This:
Assessor looks for: correct MHE category matching load weight and destination height, plus reference to safe load ratings.`,
        options: [
          'Counterbalance Forklift or Reach Truck with minimum 2,000 kg SWL rating',
          'Standard manual hydraulic hand pallet jack (pump trolley)',
          'Two-wheel upright hand sack barrow',
          'Heavy-duty mesh security roll cage'
        ],
        correct_options: [0],
        duration: 45,
        marks: 2,
        guide_topic_hint: 'MHE Selection Matrix'
      },
      {
        id: 'q-fsa-22-2',
        question_order: 2,
        format: 'MCQ',
        body: 'During your pre-use inspection of an electric pallet truck in the dispatch staging bay, you notice hydraulic fluid leaking from the lift cylinder. What is the mandatory 3-step Faulty Equipment Protocol?',
        additional_text: `🟢 Model Answer:
The statutory 3-step protocol is:
1. STOP: Cease operation immediately and remove the equipment key.
2. TAG OUT: Affix a high-visibility 'OUT OF SERVICE - DO NOT OPERATE' danger tag to the controls.
3. REPORT: Notify the warehouse supervisor and record the hydraulic fault in the MHE maintenance defect logbook.

📝 How the Assessor Marks This:
Full 3 marks awarded for all three steps in sequence: STOP, TAG OUT, and REPORT. Omitting the tag-out step risks severe crushing accidents and receives zero for safety compliance.`,
        options: [
          '1. STOP operation immediately; 2. TAG OUT with "OUT OF SERVICE" danger tag; 3. REPORT to supervisor & log defect in register',
          '1. Continue moving urgent dispatches; 2. Wipe up oil; 3. Report at the end of the shift',
          '1. Park truck in the charging bay; 2. Leave key in ignition; 3. Ask a colleague to inspect it tomorrow',
          '1. Fill hydraulic oil reservoir; 2. Cover leak with tape; 3. Resume normal operations'
        ],
        correct_options: [0],
        duration: 45,
        marks: 3,
        guide_topic_hint: 'Faulty Equipment 3-Step Protocol'
      },
      {
        id: 'q-fsa-22-3',
        question_order: 3,
        format: 'MCQ',
        body: 'Which MHE is most appropriate when picking 4 small, loose cartons of fragile glassware destined for local express delivery?',
        additional_text: `🟢 Model Answer:
Small, fragile, loose cartons require a Flatbed Platform Trolley with non-slip rubber matting or a Padded Hand Trolley. Operating a massive forklift for 4 small cartons increases transit collision risks and fuel waste.

📝 How the Assessor Marks This:
Assessor evaluates matching load size, fragility, and equipment ergonomics. Selecting oversized equipment for small cartons loses marks.`,
        options: [
          'Flatbed platform trolley or mesh shelf trolley with non-slip matting',
          'Counterbalance diesel forklift truck',
          'Rough-terrain container reach stacker',
          'Dragging cartons manually along the warehouse concrete floor'
        ],
        correct_options: [0],
        duration: 30,
        marks: 2,
        guide_topic_hint: 'Light Fragile Goods Equipment Selection'
      },
      {
        id: 'q-fsa-22-4',
        question_order: 4,
        format: 'MCQ',
        body: 'A counterbalance forklift has a certified Safe Working Load (SWL) capacity of 2,500 kg at a 500mm load center. If a pallet load has an extended load center of 750mm, what is the effect on the forklift lifting capacity?',
        additional_text: `🟢 Model Answer:
As load center distance increases away from the forklift mast, leverage increases. The safe lifting capacity decreases significantly (down to ~1,800 kg). Attempting to lift the full 2,500 kg at 750mm will tip the forklift forward.

📝 How the Assessor Marks This:
• 2 Marks for explaining that capacity decreases due to increased tipping leverage and identifying forward rollover risk.`,
        options: [
          'Safe lifting capacity decreases significantly; lifting maximum rated load will cause forward tip-over',
          'Lifting capacity increases because the load is further away',
          'Load center distance has zero impact on forklift lifting capacity',
          'The forklift will automatically double its counterweight'
        ],
        correct_options: [0],
        duration: 45,
        marks: 2,
        guide_topic_hint: 'Forklift Load Center & SWL Dynamics'
      },
      {
        id: 'q-fsa-22-5',
        question_order: 5,
        format: 'MULTIPLE',
        body: 'Before starting an electric forklift shift, which pre-trip safety checks are legally mandatory in the operator inspection logbook? (Select all that apply)',
        additional_text: `🟢 Model Answer:
Mandatory pre-trip MHE checks: (1) Service and parking brake function, (2) Steering and horn responsiveness, (3) Hydraulic lift and tilt cylinders for leaks, (4) Tire condition and fork blade integrity, and (5) Seatbelt and emergency disconnect switch. Radio channel check is not an MHE statutory safety check.

📝 How the Assessor Marks This:
• 1 Mark for brake, steering, and horn checks.
• 1 Mark for hydraulic leaks and fork inspection.`,
        options: [
          'Brake responsiveness and parking brake lock',
          'Horn, reverse alarm, and steering operation',
          'Hydraulic hoses, lift chains, and fork tines for cracks/leaks',
          'Checking FM radio entertainment volume'
        ],
        correct_options: [0, 1, 2],
        duration: 60,
        marks: 2,
        guide_topic_hint: 'MHE Pre-Trip Statutory Inspection'
      },
      {
        id: 'q-fsa-22-6',
        question_order: 6,
        format: 'MCQ',
        body: 'When staging customer orders in dispatch marshalling lanes, why must pallets be aligned within marked yellow floor demarcation lines without encroaching into thoroughfare lanes?',
        additional_text: `🟢 Model Answer:
Encroaching pallets restrict forklift turning radiuses, cause blind-corner collisions, crush pedestrian corridors, and obstruct rapid evacuation routes during warehouse emergencies.

📝 How the Assessor Marks This:
• 1 Mark for explaining collision prevention and fire evacuation clearance.`,
        options: [
          'Prevents forklift collisions, preserves turning radius, and keeps emergency egress unobstructed',
          'Makes the warehouse look full for visiting suppliers',
          'Enables drivers to park their personal cars inside the warehouse',
          'Allows pallets to be shrink-wrapped faster'
        ],
        correct_options: [0],
        duration: 30,
        marks: 1,
        guide_topic_hint: 'Dispatch Marshalling Demarcation Standards'
      },
      {
        id: 'q-fsa-22-7',
        question_order: 7,
        format: 'MCQ',
        body: 'When charging industrial forklift traction batteries in the warehouse battery charging bay, what two hazardous atmospheric conditions require continuous powered extraction ventilation?',
        additional_text: `🟢 Model Answer:
Lead-acid battery charging releases explosive Hydrogen gas (H2) and corrosive sulfuric acid vapor. Without continuous spark-proof ventilation, hydrogen accumulates near ceilings, creating catastrophic explosion risks upon spark contact.

📝 How the Assessor Marks This:
• 2 Marks for identifying Hydrogen explosion risk and acid gas extraction.`,
        options: [
          'Explosive hydrogen gas accumulation and corrosive sulfuric acid vapor',
          'Carbon dioxide gas and nitrogen leaks',
          'Methane gas and freon coolant fumes',
          'Steam condensation and static electricity build-up'
        ],
        correct_options: [0],
        duration: 45,
        marks: 2,
        guide_topic_hint: 'Battery Charging Room Hazardous Atmosphere SOP'
      },
      {
        id: 'q-fsa-22-8',
        question_order: 8,
        format: 'BINARY',
        body: 'True or False: In shared warehouse dispatch traffic lanes, pedestrians on designated walkways have statutory right-of-way over operating forklifts and pallet trucks at all times.',
        additional_text: `🟢 Model Answer:
True! OHS regulations mandate that mechanical equipment operators must yield right-of-way to pedestrians, stop at zebra crossings, and sound horns at blind intersections.

📝 How the Assessor Marks This:
• 1 Mark for True and identifying pedestrian priority rule.`,
        options: ['True', 'False'],
        correct_options: [0],
        duration: 30,
        marks: 1,
        guide_topic_hint: 'Pedestrian Priority in Warehouse Traffic Lanes'
      },
      {
        id: 'q-fsa-22-9',
        question_order: 9,
        format: 'MCQ',
        body: 'What is the primary document cross-referenced when reconciling the carrier driver manifest against staged pallets in the dispatch bay prior to releasing the vehicle gate pass?',
        additional_text: `🟢 Model Answer:
The dispatch clerk must cross-check the carrier manifest against the authorized Dispatch Advice / Waybill and verified Picking Slips to ensure zero excess or omitted consignments before issuing the Gate Pass.

📝 How the Assessor Marks This:
• 1 Mark for Dispatch Advice / Waybill reconciliation.`,
        options: [
          'Authorized Dispatch Advice and Carrier Waybill against physical staged pallets',
          'Supplier annual price catalog',
          'Warehouse staff shift roster',
          'DC utility electricity bill'
        ],
        correct_options: [0],
        duration: 30,
        marks: 1,
        guide_topic_hint: 'Carrier Manifest Reconciliation & Gate Pass SOP'
      },
      {
        id: 'q-fsa-22-10',
        question_order: 10,
        format: 'MCQ',
        body: 'If a forklift driver discovers a severe crack in the steel heel of a lifting fork tine during pre-operation checks, what is the mandatory immediate action?',
        additional_text: `🟢 Model Answer:
A cracked fork tine represents catastrophic failure risk. Mandatory protocol: (1) Park forklift immediately, (2) Remove ignition key, (3) Affix 'OUT OF SERVICE - DO NOT OPERATE' tag to steering wheel, and (4) Report to MHE maintenance engineer for certified magnetic particle inspection or fork replacement. Welding fork tines is strictly illegal!

📝 How the Assessor Marks This:
• 1 Mark for immediate lockout/tagout (STOP, TAG, REPORT) and noting that welding forks is prohibited.`,
        options: [
          'Immediate lockout/tagout: Stop machine, remove key, tag out as Out of Service, and report for fork replacement',
          'Weld the crack with a standard workshop stick welder and resume lifting',
          'Use the forklift only for loads under 500 kg',
          'Wrap heavy duct tape around the crack'
        ],
        correct_options: [0],
        duration: 45,
        marks: 2,
        guide_topic_hint: 'Fork Tine Defect & Prohibition of Welding'
      }
    ]
  },
  {
    id: 'set-fsa-1-2',
    cluster_id: 'cluster-1-2',
    set_number: 1,
    title: 'Cluster 1.2 — Generic IAC FSA Mock Exam',
    is_custom: false,
    is_fsa_mock: true,
    client_name: 'Generic IAC FSA Mock',
    eisa_focus_area: 'Focus Area 1 & 2: Retail Shrinkage Equations & CRAVED Analysis',
    raw_notebook_extract: `### FSA MOCK EXAM: CLUSTER 1.2 (PREVENT SHRINKAGE & LOSSES)
- Retail stocktake equation: Book Inventory - Physical Count = Shrinkage.
- Sales recovery revenue formula: Financial Loss / Net Profit Margin.
- CRAVED framework for high-theft products.
- Receiving & dispatch shrinkage audit case studies.`,
    target_level: 'operational',
    default_entry_mode: 'group',
    total_marks: 23,
    time_allowed_minutes: 30,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    questions: [
      {
        id: 'q-fsa-12-1',
        question_order: 1,
        format: 'MCQ',
        body: 'At annual financial stocktake, the DC inventory ledger records R850,000 in book stock. The verified physical stock count reveals R818,000 worth of stock on hand. What is the shrinkage value and shrinkage rate percentage?',
        additional_text: `🟢 Model Answer:
Shrinkage Value = Book Inventory (R850,000) - Physical Count (R818,000) = R32,000 Loss.
Shrinkage Rate (%) = (Shrinkage Value R32,000 / Book Value R850,000) x 100 = 3.76%.

📝 How the Assessor Marks This:
• 2 Marks for calculating Shrinkage Value (R32,000)
• 2 Marks for correctly dividing by recorded book inventory and multiplying by 100 to yield 3.76%. Dividing by physical count is a common mistake and loses 1 mark.`,
        options: [
          'Shrinkage Value: R32,000 • Shrinkage Rate: 3.76%',
          'Shrinkage Value: R32,000 • Shrinkage Rate: 3.91%',
          'Shrinkage Value: R18,000 • Shrinkage Rate: 2.12%',
          'Shrinkage Value: R50,000 • Shrinkage Rate: 5.88%'
        ],
        correct_options: [0],
        duration: 60,
        marks: 4,
        guide_topic_hint: 'Retail Stocktake Shrinkage Equation'
      },
      {
        id: 'q-fsa-12-2',
        question_order: 2,
        format: 'MCQ',
        body: 'A warehouse suffers an internal theft loss of high-value tools worth R10,000. If the business operates on a 2% net profit margin, how much additional sales revenue must the business generate simply to recover the lost profit?',
        additional_text: `🟢 Model Answer:
Sales Recovery Revenue = Financial Loss / Net Profit Margin
= R10,000 / 0.02 = R500,000.
The business must make an additional half a million Rand in sales just to cover the single R10,000 theft loss!

📝 How the Assessor Marks This:
• 1 Mark for stating the recovery formula (Loss / Margin)
• 2 Marks for the correct calculation: R10,000 / 0.02 = R500,000. Common error: Multiplying R10,000 x 0.02 = R200 (earns 0 marks).`,
        options: [
          'R500,000 in additional sales revenue (R10,000 / 0.02)',
          'R200 in additional sales revenue (R10,000 x 0.02)',
          'R20,000 in additional sales revenue (R10,000 x 2)',
          'R10,200 in additional sales revenue (R10,000 + 2%)'
        ],
        correct_options: [0],
        duration: 45,
        marks: 3,
        guide_topic_hint: 'Sales Recovery Revenue Formula'
      },
      {
        id: 'q-fsa-12-3',
        question_order: 3,
        format: 'MCQ',
        body: 'In warehouse security and loss prevention, what does the criminological acronym C.R.A.V.E.D. stand for when identifying hot shrinkage products?',
        additional_text: `🟢 Model Answer:
C.R.A.V.E.D. stands for:
Concealable (easy to hide on a person)
Removable (easy to move out of the facility)
Available (accessible on open shelves)
Valuable (high monetary or resale worth)
Enjoyable (desirable personal consumer goods)
Disposable (easy to sell quickly on the street).

📝 How the Assessor Marks This:
Assessor checks all 6 letters. Candidates must correctly identify the framework to qualify high-risk products for secured cage storage.`,
        options: [
          'Concealable, Removable, Available, Valuable, Enjoyable, Disposable',
          'Counted, Recorded, Audited, Verified, Evaluated, Dispatched',
          'Certified, Regulated, Authorized, Vetted, Enclosed, Documented',
          'Caution, Risk, Alert, Vulnerability, Emergency, Damage'
        ],
        correct_options: [0],
        duration: 45,
        marks: 3,
        guide_topic_hint: 'CRAVED Hot Products Framework'
      },
      {
        id: 'q-fsa-12-4',
        question_order: 4,
        format: 'MCQ',
        body: 'During physical stock count, the warehouse ledger records R1,200,000 in inventory. Stock counters identify R35,000 in missing stock and R10,000 in unrecorded stock found. What is the Net Shrinkage and Net Shrinkage Percentage?',
        additional_text: `🟢 Model Answer:
Gross Shrinkage (Shortages) = -R35,000
Stock Surpluses (Overs) = +R10,000
Net Shrinkage = -R35,000 + R10,000 = -R25,000 Loss.
Net Shrinkage % = (R25,000 / R1,200,000) x 100 = 2.08%.

📝 How the Assessor Marks This:
• 2 Marks for Net Shrinkage calculation (-R25,000)
• 2 Marks for calculating percentage (2.08%). Subtracting surplus from shortage to obtain net value is the national assessment standard.`,
        options: [
          'Net Shrinkage: R25,000 • Net Shrinkage Rate: 2.08%',
          'Net Shrinkage: R35,000 • Net Shrinkage Rate: 2.92%',
          'Net Shrinkage: R45,000 • Net Shrinkage Rate: 3.75%',
          'Net Shrinkage: R10,000 • Net Shrinkage Rate: 0.83%'
        ],
        correct_options: [0],
        duration: 45,
        marks: 4,
        guide_topic_hint: 'Net vs Gross Shrinkage Equation'
      },
      {
        id: 'q-fsa-12-5',
        question_order: 5,
        format: 'MCQ',
        body: 'Which physical security and storage controls are mandatory for high-theft Class A items (e.g. smartphones, razor blades, premium whiskey) in a South African retail distribution warehouse?',
        additional_text: `🟢 Model Answer:
High-theft items require: (1) Fully enclosed floor-to-ceiling high-security wire mesh cage, (2) Dual-custody key / biometric access control, (3) 24/7 dedicated CCTV coverage with zero blind spots, and (4) Daily perpetual piece counting.

📝 How the Assessor Marks This:
• 2 Marks for naming secured security cage, biometric/dual access, and dedicated CCTV.`,
        options: [
          'Secured wire-mesh security cage with dual-custody access, dedicated CCTV, and daily cycle counts',
          'Open lower pallet racking near the main receiving roller doors',
          'Storing in the staff canteen tea room',
          'Leaving loose in open plastic totes along main pedestrian corridors'
        ],
        correct_options: [0],
        duration: 45,
        marks: 2,
        guide_topic_hint: 'High-Theft Stock Caging Protocols'
      },
      {
        id: 'q-fsa-12-6',
        question_order: 6,
        format: 'MCQ',
        body: 'In retail loss prevention, what is "Sweethearting" or collusion between warehouse dispatch staff and third-party collection drivers, and how is it detected?',
        additional_text: `🟢 Model Answer:
Sweethearting is fraudulent collusion where a dispatch worker deliberately loads extra unpaid cartons or gives fake signatures to an accomplice driver. It is detected through independent security gate auditing, surprise random truck unloads, and blind reconciliation.

📝 How the Assessor Marks This:
• 1 Mark for defining dishonest collusion/loading extra goods.
• 1 Mark for naming independent gate audit / blind check control.`,
        options: [
          'Fraudulent collusion where staff load unauthorized extra cartons for accomplice drivers; detected by independent security gate audits',
          'Polite customer service when speaking to delivery drivers',
          'Providing complimentary coffee to truck drivers on cold mornings',
          'Sharing warehouse Wi-Fi passwords with visitors'
        ],
        correct_options: [0],
        duration: 45,
        marks: 2,
        guide_topic_hint: 'Sweethearting Fraud & Gate Audit Controls'
      },
      {
        id: 'q-fsa-12-7',
        question_order: 7,
        format: 'MCQ',
        body: 'When perishable food stock reaches 30 days before its statutory Best Before / Expiry date, what standard operating procedure prevents total inventory write-off?',
        additional_text: `🟢 Model Answer:
Proactive expiry control: (1) Flag stock on ERP Short-Dated Goods report, (2) Apply promotional markdown / clearance pricing, or (3) Issue Return to Vendor (RTV) if covered under supplier buy-back agreements.

📝 How the Assessor Marks This:
• 1 Mark for short-dated notification and markdown / RTV buyback action.`,
        options: [
          'Flag on short-dated report, notify merchandising for promotional markdown, or initiate Return to Vendor (RTV)',
          'Change the printed expiry date label with a marker pen',
          'Wait until expired and dump the stock in the municipal garbage skip',
          'Mix expired food cartons with fresh deliveries to conceal dates'
        ],
        correct_options: [0],
        duration: 30,
        marks: 1,
        guide_topic_hint: 'Short-Dated Stock Mitigation & Write-off Prevention'
      },
      {
        id: 'q-fsa-12-8',
        question_order: 8,
        format: 'MCQ',
        body: 'A forklift operator accidentally strikes a racking upright, puncturing 6 master cartons of cooking oil. What standard internal document must be immediately generated to record this loss?',
        additional_text: `🟢 Model Answer:
The operator and supervisor must immediately complete an Internal Stock Damage & Scrap Report, recording item code, lot number, exact damaged quantity, monetary cost, and root cause investigation.

📝 How the Assessor Marks This:
• 1 Mark for Internal Stock Damage / Scrap Report and cause investigation.`,
        options: [
          'Internal Stock Damage / Scrap Report with supervisor sign-off and root cause investigation',
          'Delivery Note to customer',
          'Purchase Order to supplier',
          'Driver daily trip log'
        ],
        correct_options: [0],
        duration: 30,
        marks: 1,
        guide_topic_hint: 'Internal Stock Damage & Scrap Documentation'
      },
      {
        id: 'q-fsa-12-9',
        question_order: 9,
        format: 'BINARY',
        body: 'True or False: Personal employee backpacks, jackets, and gym bags are permitted in warehouse storage aisles during active order picking shifts.',
        additional_text: `🟢 Model Answer:
False! All personal bags, coats, and lockers must remain in designated staff changerooms outside the security perimeter turnstiles to prevent opportunistic concealment and internal theft.

📝 How the Assessor Marks This:
• 1 Mark for False and explaining shrinkage prevention via bag segregation.`,
        options: ['True', 'False'],
        correct_options: [1],
        duration: 30,
        marks: 1,
        guide_topic_hint: 'Personal Belongings & Security Access Perimeter'
      },
      {
        id: 'q-fsa-12-10',
        question_order: 10,
        format: 'MCQ',
        body: 'Under the CRAVED loss prevention framework, why are small high-value electronic accessories (such as flash drives, wireless earbuds, and memory cards) classified as high shrinkage risk?',
        additional_text: `🟢 Model Answer:
Electronic accessories score high across CRAVED: Concealable (fits in pockets), Removable (easy to carry out), Available (small bulk on shelves), Valuable (high Rand cost per gram), and Disposable (immediate cash resale on informal markets).

📝 How the Assessor Marks This:
• 1 Mark for evaluating multiple CRAVED attributes (Concealable, Valuable, Disposable).`,
        options: [
          'They are easily Concealable in clothing, highly Valuable per gram, and immediately Disposable for cash on street markets',
          'They are too heavy for forklifts to lift safely',
          'They attract rodents and pests in warehouse aisles',
          'They dissolve in water during rainy weather'
        ],
        correct_options: [0],
        duration: 30,
        marks: 2,
        guide_topic_hint: 'CRAVED Analysis for High-Value Goods'
      }
    ]
  }
];

const INITIAL_SESSIONS: Session[] = [];

export class AppStore {
  private static broadcastChannels: Map<string, BroadcastChannel> = new Map();

  private static getChannel(roomCode: string): BroadcastChannel | null {
    if (typeof window === 'undefined') return null;
    if (!this.broadcastChannels.has(roomCode)) {
      try {
        const channel = new BroadcastChannel(`liveengage_${roomCode}`);
        this.broadcastChannels.set(roomCode, channel);
      } catch {
        return null;
      }
    }
    return this.broadcastChannels.get(roomCode) || null;
  }

  // --- Course Operations ---
  static getCourses(): Course[] {
    if (typeof window === 'undefined') return INITIAL_COURSES;
    const raw = localStorage.getItem(COURSES_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(COURSES_STORAGE_KEY, JSON.stringify(INITIAL_COURSES));
      return INITIAL_COURSES;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_COURSES;
    }
  }

  static async fetchCourses(): Promise<Course[]> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('courses')
          .select('*, documents:course_documents(*)');
        if (!error && data && data.length > 0) {
          localStorage.setItem(COURSES_STORAGE_KEY, JSON.stringify(data));
          return data;
        }
      } catch (err) {
        console.warn('Supabase fetchCourses error, falling back to local:', err);
      }
    }
    return this.getCourses();
  }

  static async saveCourse(course: Course): Promise<Course> {
    const courses = this.getCourses();
    const index = courses.findIndex(c => c.id === course.id);
    if (index >= 0) {
      courses[index] = course;
    } else {
      courses.unshift(course);
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem(COURSES_STORAGE_KEY, JSON.stringify(courses));
    }

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('courses').upsert({
          id: course.id,
          code: course.code,
          title: course.title,
          description: course.description,
          is_qcto: course.is_qcto || false,
          master_iac_mapping: course.master_iac_mapping || null,
          created_at: course.created_at,
        });

        if (course.documents && course.documents.length > 0) {
          for (const doc of course.documents) {
            await supabase.from('course_documents').upsert({
              id: doc.id,
              course_id: doc.course_id,
              doc_type: doc.doc_type,
              file_name: doc.file_name,
              extracted_text: doc.extracted_text,
              uploaded_at: doc.uploaded_at,
            });
          }
        }
      } catch (e) {
        console.warn('Supabase saveCourse failed, stored locally:', e);
      }
    }
    return course;
  }

  static async deleteCourse(courseId: string): Promise<void> {
    const courses = this.getCourses().filter(c => c.id !== courseId);
    if (typeof window !== 'undefined') {
      localStorage.setItem(COURSES_STORAGE_KEY, JSON.stringify(courses));
    }
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('courses').delete().eq('id', courseId);
      } catch (e) {
        console.warn('Supabase deleteCourse error:', e);
      }
    }
  }

  // --- Cluster Operations ---
  static getClusters(courseId?: string): CourseCluster[] {
    if (typeof window === 'undefined') return INITIAL_CLUSTERS;
    const raw = localStorage.getItem(CLUSTERS_STORAGE_KEY);
    let all: CourseCluster[] = INITIAL_CLUSTERS;
    if (raw) {
      try {
        all = JSON.parse(raw);
        // Ensure standard clusters exist and match official curriculum titles
        let changed = false;
        for (const initCl of INITIAL_CLUSTERS) {
          const existing = all.find(c => c.cluster_number === initCl.cluster_number);
          if (!existing) {
            all.push(initCl);
            changed = true;
          } else {
            if (
              existing.title !== initCl.title || 
              existing.description !== initCl.description ||
              existing.recommended_question_count !== initCl.recommended_question_count ||
              !existing.eisa_focus_area ||
              !existing.mapped_iacs
            ) {
              existing.title = initCl.title;
              existing.description = initCl.description;
              existing.eisa_focus_area = initCl.eisa_focus_area;
              existing.mapped_iacs = initCl.mapped_iacs;
              existing.weighting_percentage = initCl.weighting_percentage;
              existing.recommended_question_count = initCl.recommended_question_count;
              changed = true;
            }
          }
        }
        if (changed) {
          localStorage.setItem(CLUSTERS_STORAGE_KEY, JSON.stringify(all));
        }
      } catch {
        all = INITIAL_CLUSTERS;
      }
    } else {
      localStorage.setItem(CLUSTERS_STORAGE_KEY, JSON.stringify(INITIAL_CLUSTERS));
    }
    // Sort clusters numerically by cluster_number (1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4)
    all.sort((a, b) => a.cluster_number.localeCompare(b.cluster_number, undefined, { numeric: true }));
    return courseId ? all.filter(c => c.course_id === courseId) : all;
  }

  static async fetchClusters(courseId?: string): Promise<CourseCluster[]> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        let query = supabase.from('course_clusters').select('*');
        if (courseId) {
          query = query.eq('course_id', courseId);
        }
        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          const local = this.getClusters();
          data.forEach(remoteCl => {
            const idx = local.findIndex(l => l.id === remoteCl.id);
            if (idx >= 0) local[idx] = remoteCl;
            else local.push(remoteCl);
          });
          if (typeof window !== 'undefined') {
            localStorage.setItem(CLUSTERS_STORAGE_KEY, JSON.stringify(local));
          }
          return courseId ? local.filter(c => c.course_id === courseId) : local;
        }
      } catch (e) {
        console.warn('Supabase fetchClusters error:', e);
      }
    }
    return this.getClusters(courseId);
  }

  static async saveCluster(cluster: CourseCluster): Promise<CourseCluster> {
    const all = this.getClusters();
    const index = all.findIndex(c => c.id === cluster.id);
    if (index >= 0) {
      all[index] = cluster;
    } else {
      all.push(cluster);
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem(CLUSTERS_STORAGE_KEY, JSON.stringify(all));
    }
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('course_clusters').upsert({
          id: cluster.id,
          course_id: cluster.course_id,
          cluster_number: cluster.cluster_number,
          title: cluster.title,
          description: cluster.description,
          eisa_focus_area: cluster.eisa_focus_area || null,
          mapped_iacs: cluster.mapped_iacs || null,
          weighting_percentage: cluster.weighting_percentage || 25,
          recommended_question_count: cluster.recommended_question_count || 10,
          created_at: cluster.created_at,
        });
      } catch (e) {
        console.warn('Supabase saveCluster failed:', e);
      }
    }
    return cluster;
  }

  static async deleteCluster(clusterId: string): Promise<void> {
    const all = this.getClusters().filter(c => c.id !== clusterId);
    if (typeof window !== 'undefined') {
      localStorage.setItem(CLUSTERS_STORAGE_KEY, JSON.stringify(all));
    }
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('course_clusters').delete().eq('id', clusterId);
      } catch (e) {
        console.warn('Supabase deleteCluster error:', e);
      }
    }
    // Also delete associated question sets
    const sets = this.getQuestionSets().filter(s => s.cluster_id !== clusterId);
    if (typeof window !== 'undefined') {
      localStorage.setItem(QUESTION_SETS_STORAGE_KEY, JSON.stringify(sets));
    }
    if (supabase) {
      try {
        await supabase.from('question_sets').delete().eq('cluster_id', clusterId);
      } catch (e) {
        console.warn('Supabase delete associated question sets error:', e);
      }
    }
  }

  // --- Question Set Operations (Multi-Bank) ---
  static getQuestionSets(clusterId?: string): QuestionSet[] {
    if (typeof window === 'undefined') return INITIAL_QUESTION_SETS;
    const raw = localStorage.getItem(QUESTION_SETS_STORAGE_KEY);
    let all: QuestionSet[] = INITIAL_QUESTION_SETS;
    if (raw) {
      try {
        all = JSON.parse(raw);
        let changed = false;
        // Merge missing initial sets
        for (const initSet of INITIAL_QUESTION_SETS) {
          const existingIdx = all.findIndex(s => s.id === initSet.id);
          if (existingIdx === -1) {
            all.push(initSet);
            changed = true;
          } else {
            // Clean up any legacy repetitive titles like "Cluster 2.4"
            if (all[existingIdx].title === 'Cluster 2.4') {
              all[existingIdx].title = 'Generic Standard Assessment';
              changed = true;
            }
            // Sync marks & total_marks for standard sets if missing or expanded
            if (
              !all[existingIdx].total_marks || 
              all[existingIdx].questions.length < initSet.questions.length || 
              all[existingIdx].questions.some(q => !q.marks)
            ) {
              all[existingIdx].questions = initSet.questions;
              all[existingIdx].total_marks = initSet.total_marks;
              all[existingIdx].time_allowed_minutes = initSet.time_allowed_minutes;
              all[existingIdx].eisa_focus_area = initSet.eisa_focus_area;
              changed = true;
            }
          }
        }

        // Ensure every question across all sets has at least marks = 1 and total_marks is accurate
        all.forEach(s => {
          let sMutated = false;
          s.questions.forEach(q => {
            if (!q.marks || q.marks < 1) {
              q.marks = 1;
              sMutated = true;
            }
          });
          const sum = s.questions.reduce((tot, q) => tot + (q.marks || 1), 0);
          if (s.total_marks !== sum) {
            s.total_marks = sum;
            sMutated = true;
          }
          if (sMutated) changed = true;
        });
        if (changed) {
          localStorage.setItem(QUESTION_SETS_STORAGE_KEY, JSON.stringify(all));
        }
      } catch {
        all = INITIAL_QUESTION_SETS;
      }
    } else {
      localStorage.setItem(QUESTION_SETS_STORAGE_KEY, JSON.stringify(INITIAL_QUESTION_SETS));
    }

    const filtered = clusterId ? all.filter(s => s.cluster_id === clusterId) : all;

    // FSA Mock sets sort first, then Generic Standard, then Custom Workplace
    return filtered.sort((a, b) => {
      const getPriority = (s: QuestionSet) => {
        if (s.is_fsa_mock) return 0;
        if (!s.is_custom || s.client_name === 'Generic Standard') return 1;
        return 2;
      };
      const prioDiff = getPriority(a) - getPriority(b);
      if (prioDiff !== 0) return prioDiff;
      return (a.set_number || 1) - (b.set_number || 1);
    });
  }

  static getQuestionSetById(id: string): QuestionSet | null {
    const all = this.getQuestionSets();
    return all.find(s => s.id === id) || null;
  }

  static async fetchQuestionSets(clusterId?: string): Promise<QuestionSet[]> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        let query = supabase.from('question_sets').select('*');
        if (clusterId) {
          query = query.eq('cluster_id', clusterId);
        }
        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          const local = this.getQuestionSets();
          data.forEach(remoteSet => {
            const idx = local.findIndex(l => l.id === remoteSet.id);
            if (idx >= 0) local[idx] = remoteSet;
            else local.push(remoteSet);
          });
          if (typeof window !== 'undefined') {
            localStorage.setItem(QUESTION_SETS_STORAGE_KEY, JSON.stringify(local));
          }
          return clusterId ? local.filter(s => s.cluster_id === clusterId) : local;
        }
      } catch (e) {
        console.warn('Supabase fetchQuestionSets error:', e);
      }
    }
    return this.getQuestionSets(clusterId);
  }

  static async saveQuestionSet(set: QuestionSet): Promise<QuestionSet> {
    const all = this.getQuestionSets();
    const index = all.findIndex(s => s.id === set.id);
    if (index >= 0) {
      all[index] = { ...set, updated_at: new Date().toISOString() };
    } else {
      all.unshift(set);
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem(QUESTION_SETS_STORAGE_KEY, JSON.stringify(all));
    }
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('question_sets').upsert({
          id: set.id,
          cluster_id: set.cluster_id,
          set_number: set.set_number || 1,
          title: set.title,
          is_custom: set.is_custom || false,
          is_fsa_mock: set.is_fsa_mock || false,
          client_name: set.client_name || 'Generic Standard',
          eisa_focus_area: set.eisa_focus_area || null,
          raw_notebook_extract: set.raw_notebook_extract || null,
          custom_background_context: set.custom_background_context || null,
          target_level: set.target_level || 'operational',
          default_entry_mode: set.default_entry_mode || 'group',
          total_marks: set.total_marks || 10,
          time_allowed_minutes: set.time_allowed_minutes || 20,
          questions: set.questions || [],
          created_at: set.created_at,
          updated_at: set.updated_at || new Date().toISOString(),
        });
      } catch (e) {
        console.warn('Supabase saveQuestionSet failed:', e);
      }
    }
    return set;
  }

  static async deleteQuestionSet(questionSetId: string): Promise<void> {
    const all = this.getQuestionSets().filter(s => s.id !== questionSetId);
    if (typeof window !== 'undefined') {
      localStorage.setItem(QUESTION_SETS_STORAGE_KEY, JSON.stringify(all));
    }
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('question_sets').delete().eq('id', questionSetId);
      } catch (e) {
        console.warn('Supabase deleteQuestionSet error:', e);
      }
    }
  }

  static getSessions(): Session[] {
    if (typeof window === 'undefined') return [];
    const raw = localStorage.getItem(SESSIONS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify([]));
      return [];
    }
    try {
      const list: Session[] = JSON.parse(raw);
      // Filter out legacy dummy test sessions from local storage
      const cleaned = list.filter(s => !s.id.startsWith('sess-hist-') && s.id !== 'sess-active-1' && !s.id.startsWith('test-room-'));
      if (cleaned.length !== list.length) {
        localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(cleaned));
      }
      return cleaned;
    } catch {
      return [];
    }
  }

  static getSessionsForCluster(clusterId: string): Session[] {
    const sessions = this.getSessions();
    return sessions.filter(s => s.cluster_id === clusterId);
  }

  static getDocumentStatus(courseId: string): {
    hasCurriculum: boolean;
    hasEisa: boolean;
    curriculumDoc?: CourseDocument;
    eisaDoc?: CourseDocument;
  } {
    const courses = this.getCourses();
    const course = courses.find(c => c.id === courseId);
    const docs = course?.documents || [];
    const curriculumDoc = docs.find(d => d.doc_type === 'curriculum');
    const eisaDoc = docs.find(d => d.doc_type === 'eisa_specification');
    return {
      hasCurriculum: !!curriculumDoc,
      hasEisa: !!eisaDoc,
      curriculumDoc,
      eisaDoc,
    };
  }

  static async saveDocument(courseId: string, doc: CourseDocument): Promise<void> {
    const courses = this.getCourses();
    const course = courses.find(c => c.id === courseId);
    if (!course) return;

    const existingDocs = course.documents || [];
    const filtered = existingDocs.filter(d => d.doc_type !== doc.doc_type);
    course.documents = [...filtered, doc];
    await this.saveCourse(course);
  }

  static async getSessionByRoomCode(roomCode: string): Promise<Session | null> {
    const normalized = roomCode.trim().toUpperCase();
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('sessions')
          .select('*, questions(*), participants(*)')
          .eq('room_code', normalized)
          .single();

        if (!error && data) {
          if (data.questions) {
            data.questions.sort((a: Question, b: Question) => a.question_order - b.question_order);
          }
          return data as Session;
        }
      } catch (err) {
        console.warn('Supabase getSession error, falling back to local:', err);
      }
    }

    const sessions = this.getSessions();
    return sessions.find(s => s.room_code.toUpperCase() === normalized) || null;
  }

  static async saveSession(session: Session): Promise<Session> {
    const sessions = this.getSessions();
    const index = sessions.findIndex(s => s.id === session.id || s.room_code === session.room_code);
    if (index >= 0) {
      sessions[index] = session;
    } else {
      sessions.unshift(session);
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
    }

    const channel = this.getChannel(session.room_code);
    if (channel) {
      channel.postMessage({ type: 'SESSION_UPDATED', payload: session });
    }

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('sessions').upsert({
          id: session.id,
          group_id: session.group_id,
          course_id: session.course_id,
          cluster_id: session.cluster_id || null,
          question_set_id: session.question_set_id || null,
          title: session.title,
          room_code: session.room_code,
          client_name: session.client_name || 'Generic Standard',
          cohort_number: session.cohort_number || 1,
          entry_mode: session.entry_mode,
          status: session.status,
          current_question_index: session.current_question_index,
          facilitator_instructions: session.facilitator_instructions,
          question_timer_end: session.question_timer_end,
          created_at: session.created_at,
        });

        if (session.questions && session.questions.length > 0) {
          for (const q of session.questions) {
            await supabase.from('questions').upsert({
              id: q.id,
              session_id: session.id,
              question_order: q.question_order,
              format: q.format,
              body: q.body,
              additional_text: q.additional_text,
              options: q.options,
              correct_options: q.correct_options,
              duration: q.duration,
              marks: q.marks || 1,
              guide_topic_hint: q.guide_topic_hint,
            });
          }
        }
      } catch (err) {
        console.warn('Supabase saveSession error:', err);
      }
    }

    return session;
  }

  // --- Participants Operations ---
  static getParticipants(sessionId: string): Participant[] {
    if (typeof window === 'undefined') return [];
    const raw = localStorage.getItem(PARTICIPANTS_STORAGE_KEY);
    if (!raw) return [];
    try {
      const all: Participant[] = JSON.parse(raw);
      return all.filter(p => p.session_id === sessionId);
    } catch {
      return [];
    }
  }

  static async joinSession(
    sessionId: string,
    roomCode: string,
    displayName: string,
    deviceIdentifier: string
  ): Promise<Participant> {
    const existing = this.getParticipants(sessionId);
    let participant = existing.find(p => p.device_identifier === deviceIdentifier);

    if (!participant) {
      participant = {
        id: 'p-' + Math.random().toString(36).substring(2, 9),
        session_id: sessionId,
        display_name: displayName,
        device_identifier: deviceIdentifier,
        score: 0,
        joined_at: new Date().toISOString(),
      };
      const allRaw = localStorage.getItem(PARTICIPANTS_STORAGE_KEY);
      const all: Participant[] = allRaw ? JSON.parse(allRaw) : [];
      all.push(participant);
      localStorage.setItem(PARTICIPANTS_STORAGE_KEY, JSON.stringify(all));
    } else {
      participant.display_name = displayName;
      const allRaw = localStorage.getItem(PARTICIPANTS_STORAGE_KEY);
      const all: Participant[] = allRaw ? JSON.parse(allRaw) : [];
      const idx = all.findIndex(p => p.id === participant!.id);
      if (idx >= 0) all[idx] = participant;
      localStorage.setItem(PARTICIPANTS_STORAGE_KEY, JSON.stringify(all));
    }

    const channel = this.getChannel(roomCode);
    if (channel) {
      channel.postMessage({ type: 'PARTICIPANT_JOINED', payload: participant });
    }

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('participants').upsert({
          id: participant.id,
          session_id: sessionId,
          display_name: participant.display_name,
          device_identifier: participant.device_identifier,
          score: participant.score,
          joined_at: participant.joined_at,
        });
      } catch (err) {
        console.warn('Supabase joinSession error:', err);
      }
    }

    return participant;
  }

  // --- Responses & Scoring Operations ---
  static getResponses(sessionId: string, questionId?: string): ResponseRecord[] {
    if (typeof window === 'undefined') return [];
    const raw = localStorage.getItem(RESPONSES_STORAGE_KEY);
    if (!raw) return [];
    try {
      const all: ResponseRecord[] = JSON.parse(raw);
      return all.filter(r => r.session_id === sessionId && (!questionId || r.question_id === questionId));
    } catch {
      return [];
    }
  }

  static async submitResponse(
    session: Session,
    question: Question,
    participant: Participant,
    selectedOptions: number[] | string,
    elapsedSeconds: number
  ): Promise<ResponseRecord> {
    let isCorrect: boolean | null = null;
    let pointsAwarded = 0;

    if (question.format === 'WORD_CLOUD') {
      isCorrect = null;
      pointsAwarded = 0;
    } else {
      const selected = Array.isArray(selectedOptions) ? selectedOptions : [];
      const correct = question.correct_options || [];

      const sortedSelected = [...selected].sort((a, b) => a - b);
      const sortedCorrect = [...correct].sort((a, b) => a - b);
      isCorrect = (
        sortedSelected.length === sortedCorrect.length &&
        sortedSelected.every((val, idx) => val === sortedCorrect[idx])
      );

      if (isCorrect) {
        if (session.entry_mode === 'group') {
          // Flat 100 points, zero speed bonuses
          pointsAwarded = 100;
        } else {
          // Individual: 100 base + 10 bonus if within first 50% of countdown timer
          pointsAwarded = 100;
          if (question.duration > 0 && elapsedSeconds <= (question.duration / 2)) {
            pointsAwarded += 10;
          }
        }
      }
    }

    const response: ResponseRecord = {
      id: 'resp-' + Math.random().toString(36).substring(2, 9),
      session_id: session.id,
      question_id: question.id,
      participant_id: participant.id,
      selected_options: selectedOptions,
      is_correct: isCorrect,
      points_awarded: pointsAwarded,
      submitted_at: new Date().toISOString(),
    };

    const raw = localStorage.getItem(RESPONSES_STORAGE_KEY);
    let all: ResponseRecord[] = raw ? JSON.parse(raw) : [];
    all = all.filter(r => !(r.question_id === question.id && r.participant_id === participant.id));
    all.push(response);
    localStorage.setItem(RESPONSES_STORAGE_KEY, JSON.stringify(all));

    const pRaw = localStorage.getItem(PARTICIPANTS_STORAGE_KEY);
    if (pRaw) {
      const pAll: Participant[] = JSON.parse(pRaw);
      const targetP = pAll.find(p => p.id === participant.id);
      if (targetP) {
        const pResponses = all.filter(r => r.participant_id === participant.id);
        targetP.score = pResponses.reduce((sum, r) => sum + r.points_awarded, 0);
        localStorage.setItem(PARTICIPANTS_STORAGE_KEY, JSON.stringify(pAll));
      }
    }

    const channel = this.getChannel(session.room_code);
    if (channel) {
      channel.postMessage({ type: 'RESPONSE_SUBMITTED', payload: response });
    }

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('responses').upsert({
          session_id: session.id,
          question_id: question.id,
          participant_id: participant.id,
          selected_options: selectedOptions,
          is_correct: isCorrect,
          points_awarded: pointsAwarded,
          submitted_at: response.submitted_at,
        }, {
          onConflict: 'question_id,participant_id'
        });

        await supabase.from('participants').update({
          score: participant.score + pointsAwarded
        }).eq('id', participant.id);
      } catch (err) {
        console.warn('Supabase submitResponse error, queued locally:', err);
      }
    }

    return response;
  }

  // --- Hidden Words Moderation (Word Cloud) ---
  static getHiddenWords(questionId: string): string[] {
    if (typeof window === 'undefined') return [];
    const raw = localStorage.getItem(HIDDEN_WORDS_STORAGE_KEY);
    if (!raw) return [];
    try {
      const all: HiddenWord[] = JSON.parse(raw);
      return all.filter(h => h.question_id === questionId).map(h => h.word.toLowerCase());
    } catch {
      return [];
    }
  }

  static async hideWord(questionId: string, roomCode: string, word: string): Promise<void> {
    const normalized = word.trim().toLowerCase();
    const raw = localStorage.getItem(HIDDEN_WORDS_STORAGE_KEY);
    const all: HiddenWord[] = raw ? JSON.parse(raw) : [];
    if (!all.some(h => h.question_id === questionId && h.word === normalized)) {
      all.push({
        id: 'hw-' + Math.random().toString(36).substring(2, 9),
        question_id: questionId,
        word: normalized,
        created_at: new Date().toISOString(),
      });
      localStorage.setItem(HIDDEN_WORDS_STORAGE_KEY, JSON.stringify(all));
    }

    const channel = this.getChannel(roomCode);
    if (channel) {
      channel.postMessage({ type: 'WORD_HIDDEN', payload: { questionId, word: normalized } });
    }

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('hidden_words').upsert({
          question_id: questionId,
          word: normalized,
        }, { onConflict: 'question_id,word' });
      } catch (err) {
        console.warn('Supabase hideWord error:', err);
      }
    }
  }

  // --- Realtime Subscription Listener ---
  static subscribeToRoom(roomCode: string, callback: (event: { type: string; payload: any }) => void) {
    if (typeof window === 'undefined') return () => {};

    const channel = this.getChannel(roomCode);
    const localHandler = (e: MessageEvent) => {
      callback(e.data);
    };
    if (channel) {
      channel.addEventListener('message', localHandler);
    }

    const supabase = getSupabaseClient();
    let supabaseChannel: any = null;
    if (supabase) {
      try {
        supabaseChannel = supabase
          .channel(`room_${roomCode}`)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions' }, (payload) => {
            callback({ type: 'SESSION_UPDATED', payload: payload.new });
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'participants' }, (payload) => {
            callback({ type: 'PARTICIPANT_JOINED', payload: payload.new });
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'responses' }, (payload) => {
            callback({ type: 'RESPONSE_SUBMITTED', payload: payload.new });
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'hidden_words' }, (payload) => {
            callback({ type: 'WORD_HIDDEN', payload: payload.new });
          })
          .subscribe();
      } catch (e) {
        console.warn('Supabase Realtime subscribe error:', e);
      }
    }

    return () => {
      if (channel) {
        channel.removeEventListener('message', localHandler);
      }
      if (supabase && supabaseChannel) {
        supabase.removeChannel(supabaseChannel);
      }
    };
  }

  // --- Active Context Selection Tracker ---
  static setActiveSelection(courseId?: string, clusterId?: string, setId?: string) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(ACTIVE_SELECTION_KEY, JSON.stringify({ courseId, clusterId, setId }));
    } catch (e) {
      console.warn('Error saving active selection:', e);
    }
  }

  static getActiveSelection(): { courseId?: string; clusterId?: string; setId?: string } | null {
    if (typeof window === 'undefined') return null;
    try {
      const data = localStorage.getItem(ACTIVE_SELECTION_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }
}
