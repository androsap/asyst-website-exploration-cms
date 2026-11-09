-- Role dinamis: enum User.role (ADMIN/EDITOR) → tabel Role + User.roleKey.
-- Data dipertahankan: ADMIN → role Super Admin, EDITOR → role Editor dengan izin setara sebelumnya
-- (semua konten & media; form masuk tanpa hapus; tanpa Pengguna/Menu/Role).

-- CreateTable
CREATE TABLE `Role` (
    `id` VARCHAR(191) NOT NULL,
    `key` VARCHAR(64) NOT NULL,
    `name` VARCHAR(80) NOT NULL,
    `description` VARCHAR(255) NULL,
    `isSuperAdmin` BOOLEAN NOT NULL DEFAULT false,
    `isSystem` BOOLEAN NOT NULL DEFAULT false,
    `permissions` JSON NOT NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Role_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Seed role bawaan
INSERT INTO `Role` (`id`, `key`, `name`, `description`, `isSuperAdmin`, `isSystem`, `permissions`, `order`, `updatedAt`) VALUES
    ('role_admin', 'ADMIN', 'Super Admin', 'Akses penuh ke semua modul, termasuk pengguna, menu, dan role.', true, true, '{}', 0, CURRENT_TIMESTAMP(3)),
    ('role_editor', 'EDITOR', 'Editor', 'Kelola konten & media.', false, true, '{"c:news":["view","create","update","delete","publish"],"c:authors":["view","create","update","delete"],"c:jobs":["view","create","update","delete","publish"],"c:case-studies":["view","create","update","delete","publish"],"c:products":["view","create","update","delete","publish"],"c:product-categories":["view","create","update","delete"],"c:solutions":["view","create","update","delete","publish"],"c:industries":["view","create","update","delete","publish"],"c:clients":["view","create","update","delete"],"c:testimonials":["view","create","update","delete","publish"],"c:awards":["view","create","update","delete"],"c:leaders":["view","create","update","delete"],"c:offices":["view","create","update","delete"],"c:terms":["view","create","update","delete"],"c:page-seo":["view","create","update","delete"],"s:site-settings":["view","update"],"s:navigation":["view","update","publish"],"s:footer":["view","update"],"s:ask-asyst-form":["view","update"],"s:ui-strings":["view","update"],"s:home":["view","update","publish"],"s:about":["view","update","publish"],"s:contact":["view","update","publish"],"s:news-page":["view","update"],"s:career":["view","update","publish"],"s:career-jobs":["view","update","publish"],"s:career-job-detail":["view","update"],"s:case-study-page":["view","update","publish"],"s:product-landing":["view","update","publish"],"s:solution-landing":["view","update","publish"],"s:industry-landing":["view","update","publish"],"s:not-found":["view","update"],"s:search":["view","update"],"sys:media":["view","create","update","delete"],"sys:submissions":["view","update"]}', 1, CURRENT_TIMESTAMP(3));

-- AlterTable: pindahkan role lama ke roleKey
ALTER TABLE `User` ADD COLUMN `roleKey` VARCHAR(64) NOT NULL DEFAULT 'EDITOR';
UPDATE `User` SET `roleKey` = CAST(`role` AS CHAR);
ALTER TABLE `User` DROP COLUMN `role`;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_roleKey_fkey` FOREIGN KEY (`roleKey`) REFERENCES `Role`(`key`) ON DELETE RESTRICT ON UPDATE CASCADE;
