import bcrypt from "bcryptjs";
import { db, rolesTable, permissionsTable, rolePermissionsTable, usersTable, settingsTable } from "@workspace/db";
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

export async function seed() {
  logger.info("Starting database seed...");

  const existingRoles = await db.select().from(rolesTable).limit(1);
  if (existingRoles.length > 0) {
    logger.info("Database already seeded, skipping.");
    return;
  }

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
    await db.insert(usersTable).values({
      email: u.email,
      passwordHash,
      fullNameAr: u.fullNameAr,
      fullNameEn: u.fullNameEn,
      roleId,
      isActive: true,
    });
    logger.info({ email: u.email, role: u.role }, "Demo user created");
  }

  await db.insert(settingsTable).values(DEFAULT_SETTINGS);
  logger.info("Settings seeded");

  logger.info("Seed complete.");
}
