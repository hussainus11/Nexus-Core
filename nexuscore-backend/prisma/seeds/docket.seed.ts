import { PrismaClient } from '@prisma/client';

const documentTypeCards = [
  // DESIGN
  { name: 'Tech Pack', code: 'TECH_PACK', category: 'design', allowedFormats: ['pdf'], requiresApproval: true, maxSizeMb: 50 },
  { name: 'CAD File', code: 'CAD_FILE', category: 'design', allowedFormats: ['pdf', 'dwg'], requiresApproval: false, maxSizeMb: 100 },
  { name: 'Style Sketch', code: 'STYLE_SKETCH', category: 'design', allowedFormats: ['pdf', 'jpg', 'png'], requiresApproval: false, maxSizeMb: 20 },
  { name: 'Grading Spec', code: 'GRADING_SPEC', category: 'design', allowedFormats: ['pdf', 'xlsx'], requiresApproval: true, maxSizeMb: 20 },
  // SAMPLE
  { name: 'Proto Approval Sheet', code: 'PROTO_APPROVAL', category: 'sample', allowedFormats: ['pdf'], requiresApproval: true, maxSizeMb: 20 },
  { name: 'Fit Comments Form', code: 'FIT_COMMENTS', category: 'sample', allowedFormats: ['pdf', 'docx'], requiresApproval: true, maxSizeMb: 20 },
  { name: 'PP Approval Report', code: 'PP_APPROVAL', category: 'sample', allowedFormats: ['pdf'], requiresApproval: true, maxSizeMb: 20 },
  { name: 'TOP Sign-off Sheet', code: 'TOP_SIGNOFF', category: 'sample', allowedFormats: ['pdf'], requiresApproval: true, maxSizeMb: 20 },
  { name: 'AQL Inspection Report', code: 'AQL_REPORT', category: 'sample', allowedFormats: ['pdf', 'xlsx'], requiresApproval: true, maxSizeMb: 30 },
  // MATERIAL
  { name: 'Fabric Test Report', code: 'FABRIC_TEST', category: 'material', allowedFormats: ['pdf'], requiresApproval: true, maxSizeMb: 20, expiryDays: 365 },
  { name: 'Trim Card', code: 'TRIM_CARD', category: 'material', allowedFormats: ['pdf', 'jpg'], requiresApproval: true, maxSizeMb: 20 },
  { name: 'Lab Dip Approval', code: 'LAB_DIP', category: 'material', allowedFormats: ['pdf', 'jpg'], requiresApproval: true, maxSizeMb: 20 },
  { name: 'Wash Test Report', code: 'WASH_TEST', category: 'material', allowedFormats: ['pdf'], requiresApproval: true, maxSizeMb: 20, expiryDays: 180 },
  { name: 'BOM — Bill of Materials', code: 'BOM', category: 'material', allowedFormats: ['pdf', 'xlsx'], requiresApproval: true, maxSizeMb: 30 },
  // COMPLIANCE
  { name: 'Test Report (Safety)', code: 'SAFETY_TEST', category: 'compliance', allowedFormats: ['pdf'], requiresApproval: true, maxSizeMb: 20, expiryDays: 365 },
  { name: 'Social Compliance Cert', code: 'SOCIAL_CERT', category: 'compliance', allowedFormats: ['pdf'], requiresApproval: true, maxSizeMb: 20, expiryDays: 365 },
  { name: 'OEKO-TEX Certificate', code: 'OEKOTEX', category: 'compliance', allowedFormats: ['pdf'], requiresApproval: true, maxSizeMb: 20, expiryDays: 365 },
  { name: 'Country of Origin Cert', code: 'COO_CERT', category: 'compliance', allowedFormats: ['pdf'], requiresApproval: true, maxSizeMb: 20 },
  // COMMERCIAL
  { name: 'Buyer Purchase Order', code: 'BUYER_PO', category: 'commercial', allowedFormats: ['pdf', 'xlsx'], requiresApproval: false, maxSizeMb: 30 },
  { name: 'Proforma Invoice', code: 'PRO_INVOICE', category: 'commercial', allowedFormats: ['pdf'], requiresApproval: false, maxSizeMb: 20 },
  { name: 'Costing Sheet', code: 'COSTING_SHEET', category: 'commercial', allowedFormats: ['pdf', 'xlsx'], requiresApproval: true, maxSizeMb: 30 },
  { name: 'Packing Instructions', code: 'PACKING_INST', category: 'commercial', allowedFormats: ['pdf'], requiresApproval: false, maxSizeMb: 20 },
  { name: 'Shipping Documents', code: 'SHIPPING_DOCS', category: 'commercial', allowedFormats: ['pdf'], requiresApproval: false, maxSizeMb: 30 },
  // QUALITY
  { name: 'Measurement Spec Sheet', code: 'MEAS_SPEC', category: 'quality', allowedFormats: ['pdf', 'xlsx'], requiresApproval: true, maxSizeMb: 20 },
  { name: 'Quality Checklist', code: 'QC_CHECKLIST', category: 'quality', allowedFormats: ['pdf', 'xlsx'], requiresApproval: true, maxSizeMb: 20 },
  { name: 'Defect Report', code: 'DEFECT_REPORT', category: 'quality', allowedFormats: ['pdf', 'xlsx'], requiresApproval: false, maxSizeMb: 20 },
];

type TemplateItemDef = { code: string; isRequired: boolean; dueDays?: number };

const templates: {
  name: string;
  code: string;
  entityType: string;
  isDefault: boolean;
  description: string;
  items: TemplateItemDef[];
}[] = [
  {
    name: 'Standard Style Docket',
    code: 'STYLE_STD',
    entityType: 'style_card',
    isDefault: true,
    description: 'Standard document checklist for style cards',
    items: [
      { code: 'TECH_PACK', isRequired: true, dueDays: 14 },
      { code: 'STYLE_SKETCH', isRequired: true, dueDays: 7 },
      { code: 'MEAS_SPEC', isRequired: true, dueDays: 14 },
      { code: 'TRIM_CARD', isRequired: true, dueDays: 21 },
      { code: 'BOM', isRequired: true, dueDays: 21 },
      { code: 'LAB_DIP', isRequired: true, dueDays: 30 },
      { code: 'CAD_FILE', isRequired: false, dueDays: 14 },
      { code: 'GRADING_SPEC', isRequired: false, dueDays: 21 },
      { code: 'WASH_TEST', isRequired: false, dueDays: 45 },
    ],
  },
  {
    name: 'Sample Docket — Proto',
    code: 'SAMPLE_PROTO',
    entityType: 'sample_card',
    isDefault: false,
    description: 'Proto sample approval docket',
    items: [
      { code: 'PROTO_APPROVAL', isRequired: true, dueDays: 14 },
      { code: 'FIT_COMMENTS', isRequired: true, dueDays: 14 },
      { code: 'MEAS_SPEC', isRequired: true, dueDays: 7 },
      { code: 'AQL_REPORT', isRequired: false, dueDays: 21 },
    ],
  },
  {
    name: 'Sample Docket — PP/TOP',
    code: 'SAMPLE_PP_TOP',
    entityType: 'sample_card',
    isDefault: true,
    description: 'Pre-production and top-of-production sample docket',
    items: [
      { code: 'PP_APPROVAL', isRequired: true, dueDays: 14 },
      { code: 'TOP_SIGNOFF', isRequired: true, dueDays: 21 },
      { code: 'AQL_REPORT', isRequired: true, dueDays: 21 },
      { code: 'MEAS_SPEC', isRequired: true, dueDays: 7 },
      { code: 'FABRIC_TEST', isRequired: true, dueDays: 30 },
      { code: 'DEFECT_REPORT', isRequired: false, dueDays: 21 },
      { code: 'QC_CHECKLIST', isRequired: false, dueDays: 14 },
    ],
  },
  {
    name: 'Standard Product Docket',
    code: 'PRODUCT_STD',
    entityType: 'product_card',
    isDefault: true,
    description: 'Standard document checklist for product cards',
    items: [
      { code: 'TECH_PACK', isRequired: true, dueDays: 14 },
      { code: 'MEAS_SPEC', isRequired: true, dueDays: 14 },
      { code: 'BOM', isRequired: true, dueDays: 21 },
      { code: 'COSTING_SHEET', isRequired: true, dueDays: 21 },
      { code: 'GRADING_SPEC', isRequired: true, dueDays: 21 },
      { code: 'CAD_FILE', isRequired: false, dueDays: 14 },
      { code: 'STYLE_SKETCH', isRequired: false, dueDays: 7 },
    ],
  },
  {
    name: 'Export Order Docket',
    code: 'ORDER_EXPORT',
    entityType: 'plm_order',
    isDefault: false,
    description: 'Full compliance document set for export orders',
    items: [
      { code: 'BUYER_PO', isRequired: true, dueDays: 3 },
      { code: 'TECH_PACK', isRequired: true, dueDays: 7 },
      { code: 'MEAS_SPEC', isRequired: true, dueDays: 7 },
      { code: 'FABRIC_TEST', isRequired: true, dueDays: 30 },
      { code: 'TRIM_CARD', isRequired: true, dueDays: 21 },
      { code: 'BOM', isRequired: true, dueDays: 21 },
      { code: 'COSTING_SHEET', isRequired: true, dueDays: 14 },
      { code: 'SAFETY_TEST', isRequired: true, dueDays: 45 },
      { code: 'SOCIAL_CERT', isRequired: true, dueDays: 45 },
      { code: 'COO_CERT', isRequired: true, dueDays: 30 },
      { code: 'PACKING_INST', isRequired: true, dueDays: 21 },
      { code: 'OEKOTEX', isRequired: false, dueDays: 45 },
      { code: 'PRO_INVOICE', isRequired: false, dueDays: 14 },
    ],
  },
  {
    name: 'Local Order Docket',
    code: 'ORDER_LOCAL',
    entityType: 'plm_order',
    isDefault: true,
    description: 'Standard document set for local/domestic orders',
    items: [
      { code: 'BUYER_PO', isRequired: true, dueDays: 3 },
      { code: 'TECH_PACK', isRequired: true, dueDays: 7 },
      { code: 'MEAS_SPEC', isRequired: true, dueDays: 7 },
      { code: 'BOM', isRequired: true, dueDays: 21 },
      { code: 'COSTING_SHEET', isRequired: true, dueDays: 14 },
      { code: 'QC_CHECKLIST', isRequired: true, dueDays: 21 },
      { code: 'PACKING_INST', isRequired: false, dueDays: 21 },
      { code: 'DEFECT_REPORT', isRequired: false, dueDays: 21 },
    ],
  },
];

export async function seedDocketManagement(prisma: PrismaClient) {
  console.log('🗂️  Seeding Docket Management...');

  // ── Document Type Cards ────────────────────────────────────────────────────
  const createdDocTypes: Record<string, string> = {}; // code -> id

  for (const dt of documentTypeCards) {
    const record = await (prisma as any).documentTypeCard?.upsert?.({
      where: { code: dt.code },
      create: {
        name: dt.name,
        code: dt.code,
        category: dt.category,
        allowedFormats: dt.allowedFormats,
        requiresApproval: dt.requiresApproval,
        maxSizeMb: (dt as any).maxSizeMb ?? null,
        expiryDays: (dt as any).expiryDays ?? null,
        isActive: true,
      },
      update: {
        name: dt.name,
        category: dt.category,
        allowedFormats: dt.allowedFormats,
        requiresApproval: dt.requiresApproval,
      },
    }).catch(() => null);

    if (record) {
      createdDocTypes[dt.code] = record.id;
    }
  }

  const docTypeCount = Object.keys(createdDocTypes).length;
  console.log(`✓ Seeded ${docTypeCount} document type cards`);

  // ── Docket Templates ───────────────────────────────────────────────────────
  for (const tmpl of templates) {
    const existing = await (prisma as any).docketTemplate?.findFirst?.({
      where: { code: tmpl.code },
    }).catch(() => null);

    if (existing) {
      console.log(`✓ Template already exists: ${tmpl.name}`);
      continue;
    }

    const itemsToCreate = tmpl.items
      .filter((item) => createdDocTypes[item.code])
      .map((item, idx) => ({
        documentTypeCardId: createdDocTypes[item.code],
        isRequired: item.isRequired,
        dueDays: item.dueDays ?? null,
        sequence: idx + 1,
      }));

    await (prisma as any).docketTemplate?.create?.({
      data: {
        name: tmpl.name,
        code: tmpl.code,
        entityType: tmpl.entityType,
        isDefault: tmpl.isDefault,
        description: tmpl.description,
        isActive: true,
        items: {
          create: itemsToCreate,
        },
      },
    }).catch((e: any) => {
      console.warn(`⚠️  Could not seed template ${tmpl.name}: ${e.message}`);
    });

    console.log(`✓ Template seeded: ${tmpl.name} (${itemsToCreate.length} items)`);
  }

  console.log('✓ Docket Management seeding complete');
}
