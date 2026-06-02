import bcrypt from "bcryptjs";
import {
  db,
  rolesTable,
  permissionsTable,
  rolePermissionsTable,
  usersTable,
  settingsTable,
  doctorsTable,
} from "@workspace/db";
import { logger } from "./logger";

const PERMISSIONS = [
  { key: "manage_users", descriptionAr: "إدارة المستخدمين", descriptionEn: "Manage Users" },
  { key: "manage_templates", descriptionAr: "إدارة القوالب", descriptionEn: "Manage Templates" },
  { key: "map_template_fields", descriptionAr: "ربط حقول القوالب", descriptionEn: "Map Template Fields" },
  { key: "create_consent", descriptionAr: "إنشاء موافقة", descriptionEn: "Create Consent" },
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
      "create_consent", "finalize_document", "view_archive",
      "share_document", "view_audit_logs", "manage_settings",
    ],
  },
  {
    name: "doctor",
    displayNameAr: "طبيب",
    displayNameEn: "Doctor",
    permissions: ["create_consent", "finalize_document", "view_archive", "share_document"],
  },
  {
    name: "reception",
    displayNameAr: "استقبال",
    displayNameEn: "Reception",
    permissions: ["create_consent", "view_archive", "share_document"],
  },
  {
    name: "nurse",
    displayNameAr: "ممرضة",
    displayNameEn: "Nurse",
    permissions: ["create_consent", "view_archive"],
  },
];

const DEFAULT_SETTINGS = [
  { key: "clinic_name_ar", value: "نظام موافقات الأطباء" },
  { key: "clinic_name_en", value: "Doctor Consent Manager" },
  { key: "default_whatsapp_message_ar", value: "مرحبًا،\nمرفق لكم نسخة من نموذج الموافقة الخاص بزيارتكم.\n\nمع تمنياتنا لكم بالصحة والعافية." },
  { key: "default_whatsapp_message_en", value: "Hello,\nAttached is a copy of your consent form.\n\nWishing you good health." },
  { key: "pdf_footer_text", value: "نظام موافقات الأطباء - جميع الحقوق محفوظة" },
  { key: "link_expiry_minutes", value: "1440" },
  { key: "max_file_size_mb", value: "20" },
  { key: "sharing_enabled", value: "true" },
  { key: "handwriting_lab_enabled", value: "true" },
];

const DEMO_DOCTORS = [
  { fullNameAr: "د. عبدالله سالم الحربي", fullNameEn: "Dr. Abdullah Al-Harbi", department: "طب الأسنان العام", mobile: "0556789012", email: "dr.harbi@medconsent.com" },
  { fullNameAr: "د. منى أحمد الزهراني", fullNameEn: "Dr. Mona Al-Zahrani", department: "تقويم الأسنان", mobile: "0567890123", email: "dr.mona@medconsent.com" },
  { fullNameAr: "د. فيصل عمر السبيعي", fullNameEn: "Dr. Faisal Al-Subaie", department: "زراعة الأسنان", mobile: "0578901234", email: "dr.faisal@medconsent.com" },
  { fullNameAr: "د. ريم خالد المطيري", fullNameEn: "Dr. Reem Al-Mutairi", department: "أمراض اللثة", mobile: "0589012345", email: "dr.reem@medconsent.com" },
  { fullNameAr: "د. سلطان ناصر العنزي", fullNameEn: "Dr. Sultan Al-Anzi", department: "طب أسنان الأطفال", mobile: "0590123456", email: "dr.sultan@medconsent.com" },
];

export async function seed() {
  logger.info("Starting database seed...");

  const existingRoles = await db.select().from(rolesTable).limit(1);
  if (existingRoles.length === 0) {
    await seedCore();
  } else {
    logger.info("Core data already seeded, skipping.");
  }

  await seedDoctors();

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

async function seedDoctors() {
  const existing = await db.select().from(doctorsTable).limit(1);
  if (existing.length === 0) {
    await db.insert(doctorsTable).values(
      DEMO_DOCTORS.map((d) => ({ ...d, isActive: true }))
    );
    logger.info({ count: DEMO_DOCTORS.length }, "Doctors seeded");
  } else {
    logger.info("Doctors already seeded, skipping.");
  }
}
