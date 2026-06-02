import bcrypt from "bcryptjs";
import {
  db,
  rolesTable,
  permissionsTable,
  rolePermissionsTable,
  usersTable,
  settingsTable,
  specialtiesTable,
  branchesTable,
  patientsTable,
  doctorsTable,
} from "@workspace/db";
import { logger } from "./logger";

const PERMISSIONS = [
  { key: "manage_users", descriptionAr: "إدارة المستخدمين", descriptionEn: "Manage Users" },
  { key: "manage_templates", descriptionAr: "إدارة القوالب", descriptionEn: "Manage Templates" },
  { key: "map_template_fields", descriptionAr: "ربط حقول القوالب", descriptionEn: "Map Template Fields" },
  { key: "create_patient", descriptionAr: "إنشاء مريض", descriptionEn: "Create Patient" },
  { key: "create_consent", descriptionAr: "إنشاء موافقة", descriptionEn: "Create Consent" },
  { key: "create_report", descriptionAr: "إنشاء تقرير", descriptionEn: "Create Report" },
  { key: "finalize_document", descriptionAr: "إتمام المستند", descriptionEn: "Finalize Document" },
  { key: "view_archive", descriptionAr: "عرض الأرشيف", descriptionEn: "View Archive" },
  { key: "share_document", descriptionAr: "مشاركة المستند", descriptionEn: "Share Document" },
  { key: "view_audit_logs", descriptionAr: "عرض سجل المراجعة", descriptionEn: "View Audit Logs" },
  { key: "manage_settings", descriptionAr: "إدارة الإعدادات", descriptionEn: "Manage Settings" },
];

const ROLES = [
  {
    name: "super_admin",
    displayNameAr: "مدير عام",
    displayNameEn: "Super Admin",
    permissions: PERMISSIONS.map((p) => p.key),
  },
  {
    name: "admin",
    displayNameAr: "مشرف",
    displayNameEn: "Admin",
    permissions: [
      "manage_users", "manage_templates", "map_template_fields",
      "create_patient", "create_consent", "create_report",
      "finalize_document", "view_archive", "share_document",
      "view_audit_logs", "manage_settings",
    ],
  },
  {
    name: "doctor",
    displayNameAr: "طبيب",
    displayNameEn: "Doctor",
    permissions: ["create_patient", "create_consent", "create_report", "finalize_document", "view_archive", "share_document"],
  },
  {
    name: "reception",
    displayNameAr: "استقبال",
    displayNameEn: "Reception",
    permissions: ["create_patient", "create_consent", "create_report", "view_archive", "share_document"],
  },
  {
    name: "nurse",
    displayNameAr: "ممرضة",
    displayNameEn: "Nurse",
    permissions: ["create_patient", "create_consent", "view_archive"],
  },
];

const DEFAULT_SETTINGS = [
  { key: "clinic_name_ar", value: "مجمع السن الرقمي الطبي" },
  { key: "clinic_name_en", value: "Digital Tooth Medical Complex" },
  { key: "default_whatsapp_message_ar", value: "مرحبًا،\nمرفق لكم نسخة من النموذج / التقرير الخاص بزيارتكم في مجمع السن الرقمي الطبي.\n\nمع تمنياتنا لكم بالصحة والعافية.\nمجمع السن الرقمي الطبي" },
  { key: "default_whatsapp_message_en", value: "Hello,\nAttached is a copy of the consent form / medical report related to your visit at Digital Tooth Medical Complex.\n\nWishing you good health.\nDigital Tooth Medical Complex" },
  { key: "pdf_footer_text", value: "مجمع السن الرقمي الطبي - جميع الحقوق محفوظة" },
  { key: "link_expiry_minutes", value: "1440" },
  { key: "max_file_size_mb", value: "20" },
  { key: "sharing_enabled", value: "true" },
  { key: "handwriting_lab_enabled", value: "true" },
];

const SPECIALTIES = [
  { nameAr: "طب الأسنان العام", nameEn: "General Dentistry" },
  { nameAr: "تقويم الأسنان", nameEn: "Orthodontics" },
  { nameAr: "زراعة الأسنان", nameEn: "Dental Implants" },
  { nameAr: "علاج جذور الأسنان", nameEn: "Endodontics" },
  { nameAr: "أمراض اللثة", nameEn: "Periodontics" },
  { nameAr: "طب أسنان الأطفال", nameEn: "Pediatric Dentistry" },
];

const BRANCHES = [
  { nameAr: "الفرع الرئيسي - الرياض", nameEn: "Main Branch - Riyadh", address: "شارع الملك فهد، الرياض" },
  { nameAr: "فرع جدة", nameEn: "Jeddah Branch", address: "شارع التحلية، جدة" },
];

export async function seed() {
  logger.info("Starting database seed...");

  // Core: only run if roles table is empty
  const existingRoles = await db.select().from(rolesTable).limit(1);
  if (existingRoles.length === 0) {
    await seedCore();
  } else {
    logger.info("Core data already seeded, skipping.");
  }

  // Phase 2: independently seed each new table if empty
  await seedPhase2();

  logger.info("Seed complete.");
}

async function seedCore() {
  const insertedPerms = await db.insert(permissionsTable).values(PERMISSIONS).returning();
  const permMap = new Map(insertedPerms.map((p) => [p.key, p.id]));
  logger.info({ count: insertedPerms.length }, "Permissions created");

  for (const roleDef of ROLES) {
    const [role] = await db
      .insert(rolesTable)
      .values({ name: roleDef.name, displayNameAr: roleDef.displayNameAr, displayNameEn: roleDef.displayNameEn })
      .returning();

    const rolePerms = roleDef.permissions
      .filter((pk) => permMap.has(pk))
      .map((pk) => ({ roleId: role.id, permissionId: permMap.get(pk)! }));

    if (rolePerms.length > 0) {
      await db.insert(rolePermissionsTable).values(rolePerms);
    }
    logger.info({ role: roleDef.name }, "Role created");
  }

  const allRoles = await db.select().from(rolesTable);
  const roleMap = new Map(allRoles.map((r) => [r.name, r.id]));

  const demoUsers = [
    { email: "superadmin@medconsent.com", password: "Admin@1234", fullNameAr: "المدير العام", fullNameEn: "Super Admin", role: "super_admin" },
    { email: "admin@medconsent.com", password: "Admin@1234", fullNameAr: "محمد العدواني", fullNameEn: "Mohammed Al-Adwani", role: "admin" },
    { email: "doctor@medconsent.com", password: "Doctor@1234", fullNameAr: "د. أحمد الزهراني", fullNameEn: "Dr. Ahmed Al-Zahrani", role: "doctor" },
    { email: "reception@medconsent.com", password: "Recept@1234", fullNameAr: "سارة المطيري", fullNameEn: "Sara Al-Mutairi", role: "reception" },
    { email: "nurse@medconsent.com", password: "Nurse@1234", fullNameAr: "نورة القحطاني", fullNameEn: "Noura Al-Qahtani", role: "nurse" },
  ];

  for (const u of demoUsers) {
    const roleId = roleMap.get(u.role);
    if (!roleId) continue;
    const passwordHash = await bcrypt.hash(u.password, 12);
    await db.insert(usersTable).values({ email: u.email, passwordHash, fullNameAr: u.fullNameAr, fullNameEn: u.fullNameEn, roleId, isActive: true });
    logger.info({ email: u.email, role: u.role }, "Demo user created");
  }

  await db.insert(settingsTable).values(DEFAULT_SETTINGS);
  logger.info("Settings seeded");
}

async function seedPhase2() {
  // Specialties
  const existingSpecialties = await db.select().from(specialtiesTable).limit(1);
  if (existingSpecialties.length === 0) {
    const insertedSpecialties = await db.insert(specialtiesTable).values(SPECIALTIES).returning();
    logger.info({ count: insertedSpecialties.length }, "Specialties seeded");

    const specialtyMap = new Map(insertedSpecialties.map((s) => [s.nameAr, s.id]));

    // Branches
    const insertedBranches = await db.insert(branchesTable).values(BRANCHES).returning();
    logger.info({ count: insertedBranches.length }, "Branches seeded");

    const mainBranchId = insertedBranches[0]!.id;
    const jeddahBranchId = insertedBranches[1]!.id;

    // Patients
    const PATIENTS = [
      { fullNameAr: "أحمد محمد الغامدي", fileNumber: "PT-001", nationalId: "1234567890", mobile: "0501234567", gender: "male", allergies: "بنسلين", medicalHistory: "ضغط الدم" },
      { fullNameAr: "فاطمة عبدالله القحطاني", fileNumber: "PT-002", nationalId: "2345678901", mobile: "0512345678", gender: "female", allergies: undefined, medicalHistory: "سكري النوع الثاني" },
      { fullNameAr: "خالد سعد العتيبي", fileNumber: "PT-003", nationalId: "3456789012", mobile: "0523456789", gender: "male", allergies: "مضادات الالتهاب", medicalHistory: undefined },
      { fullNameAr: "نورة يوسف الشمري", fileNumber: "PT-004", nationalId: "4567890123", mobile: "0534567890", gender: "female", allergies: undefined, medicalHistory: "حمل - الأسبوع الثامن" },
      { fullNameAr: "عبدالرحمن إبراهيم الدوسري", fileNumber: "PT-005", nationalId: "5678901234", mobile: "0545678901", gender: "male", allergies: undefined, medicalHistory: "لا يوجد" },
    ];

    await db.insert(patientsTable).values(PATIENTS.map((p) => ({ ...p, isActive: true })));
    logger.info({ count: PATIENTS.length }, "Patients seeded");

    // Doctors
    const DOCTORS = [
      { fullNameAr: "د. عبدالله سالم الحربي", fullNameEn: "Dr. Abdullah Al-Harbi", specialty: "طب الأسنان العام", branchId: mainBranchId, mobile: "0556789012", email: "dr.harbi@medconsent.com" },
      { fullNameAr: "د. منى أحمد الزهراني", fullNameEn: "Dr. Mona Al-Zahrani", specialty: "تقويم الأسنان", branchId: mainBranchId, mobile: "0567890123", email: "dr.mona@medconsent.com" },
      { fullNameAr: "د. فيصل عمر السبيعي", fullNameEn: "Dr. Faisal Al-Subaie", specialty: "زراعة الأسنان", branchId: mainBranchId, mobile: "0578901234", email: "dr.faisal@medconsent.com" },
      { fullNameAr: "د. ريم خالد المطيري", fullNameEn: "Dr. Reem Al-Mutairi", specialty: "أمراض اللثة", branchId: jeddahBranchId, mobile: "0589012345", email: "dr.reem@medconsent.com" },
      { fullNameAr: "د. سلطان ناصر العنزي", fullNameEn: "Dr. Sultan Al-Anzi", specialty: "طب أسنان الأطفال", branchId: jeddahBranchId, mobile: "0590123456", email: "dr.sultan@medconsent.com" },
    ];

    for (const doc of DOCTORS) {
      const specialtyId = specialtyMap.get(doc.specialty);
      if (!specialtyId) continue;
      await db.insert(doctorsTable).values({
        fullNameAr: doc.fullNameAr,
        fullNameEn: doc.fullNameEn,
        specialtyId,
        branchId: doc.branchId,
        mobile: doc.mobile,
        email: doc.email,
        isActive: true,
      });
    }
    logger.info({ count: DOCTORS.length }, "Doctors seeded");
  } else {
    logger.info("Phase 2 data already seeded, skipping.");
  }
}
