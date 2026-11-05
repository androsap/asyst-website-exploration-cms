-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `role` ENUM('ADMIN', 'EDITOR') NOT NULL DEFAULT 'EDITOR',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `lastLoginAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Media` (
    `id` VARCHAR(191) NOT NULL,
    `url` VARCHAR(1024) NOT NULL,
    `pathname` VARCHAR(512) NOT NULL,
    `filename` VARCHAR(255) NOT NULL,
    `mimeType` VARCHAR(191) NOT NULL,
    `size` INTEGER NOT NULL,
    `width` INTEGER NULL,
    `height` INTEGER NULL,
    `alt` JSON NOT NULL,
    `caption` JSON NULL,
    `focalPoint` JSON NULL,
    `uploadedById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Media_pathname_key`(`pathname`),
    INDEX `Media_createdAt_idx`(`createdAt` DESC),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Term` (
    `id` VARCHAR(191) NOT NULL,
    `vocabulary` ENUM('NEWS_CATEGORY', 'PRODUCT_CATEGORY', 'JOB_DEPARTMENT', 'JOB_EXPERIENCE', 'JOB_LOCATION', 'JOB_EMPLOYMENT_TYPE', 'JOB_SKILL', 'CASE_INDUSTRY', 'CASE_SOLUTION', 'CASE_TECHNOLOGY', 'TAG') NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `label` JSON NOT NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `isPopular` BOOLEAN NOT NULL DEFAULT false,
    `searchText` VARCHAR(4000) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Term_vocabulary_order_idx`(`vocabulary`, `order`),
    UNIQUE INDEX `Term_vocabulary_key_key`(`vocabulary`, `key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Office` (
    `id` VARCHAR(191) NOT NULL,
    `title` JSON NOT NULL,
    `addressLines` JSON NOT NULL,
    `mapUrl` VARCHAR(1024) NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `searchText` VARCHAR(4000) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Client` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `logoId` VARCHAR(191) NOT NULL,
    `logoColorId` VARCHAR(191) NULL,
    `website` VARCHAR(1024) NULL,
    `placements` JSON NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `order` INTEGER NOT NULL DEFAULT 0,
    `searchText` VARCHAR(4000) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Client_isActive_order_idx`(`isActive`, `order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Testimonial` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `role` JSON NOT NULL,
    `company` VARCHAR(191) NULL,
    `clientId` VARCHAR(191) NULL,
    `quote` JSON NOT NULL,
    `photoId` VARCHAR(191) NULL,
    `placements` JSON NOT NULL,
    `status` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `publishedAt` DATETIME(3) NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `searchText` VARCHAR(4000) NOT NULL DEFAULT '',
    `createdById` VARCHAR(191) NULL,
    `updatedById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Testimonial_status_order_idx`(`status`, `order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Award` (
    `id` VARCHAR(191) NOT NULL,
    `title` JSON NOT NULL,
    `subtitle` JSON NOT NULL,
    `imageId` VARCHAR(191) NULL,
    `year` INTEGER NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `searchText` VARCHAR(4000) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Leader` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `position` JSON NOT NULL,
    `photoId` VARCHAR(191) NOT NULL,
    `linkedin` VARCHAR(1024) NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `searchText` VARCHAR(4000) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Author` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `avatarId` VARCHAR(191) NULL,
    `bio` JSON NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `searchText` VARCHAR(4000) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PageSeo` (
    `id` VARCHAR(191) NOT NULL,
    `path` VARCHAR(512) NOT NULL,
    `seo` JSON NOT NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `searchText` VARCHAR(4000) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PageSeo_path_key`(`path`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `NewsArticle` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `legacyId` VARCHAR(191) NULL,
    `title` JSON NOT NULL,
    `excerpt` JSON NOT NULL,
    `content` JSON NOT NULL,
    `coverImageId` VARCHAR(191) NOT NULL,
    `categoryId` VARCHAR(191) NOT NULL,
    `authorId` VARCHAR(191) NULL,
    `isFeatured` BOOLEAN NOT NULL DEFAULT false,
    `seo` JSON NULL,
    `status` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `publishedAt` DATETIME(3) NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `searchText` VARCHAR(4000) NOT NULL DEFAULT '',
    `createdById` VARCHAR(191) NULL,
    `updatedById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `NewsArticle_slug_key`(`slug`),
    UNIQUE INDEX `NewsArticle_legacyId_key`(`legacyId`),
    INDEX `NewsArticle_status_publishedAt_idx`(`status`, `publishedAt` DESC),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Job` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `title` JSON NOT NULL,
    `summary` JSON NOT NULL,
    `departmentId` VARCHAR(191) NOT NULL,
    `experienceId` VARCHAR(191) NOT NULL,
    `employmentTypeId` VARCHAR(191) NOT NULL,
    `locationId` VARCHAR(191) NOT NULL,
    `skills` JSON NULL,
    `about` JSON NOT NULL,
    `responsibilities` JSON NOT NULL,
    `requirements` JSON NOT NULL,
    `applyUrl` VARCHAR(1024) NULL,
    `postedDate` DATE NOT NULL,
    `closingDate` DATE NULL,
    `status` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `publishedAt` DATETIME(3) NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `searchText` VARCHAR(4000) NOT NULL DEFAULT '',
    `createdById` VARCHAR(191) NULL,
    `updatedById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Job_slug_key`(`slug`),
    INDEX `Job_status_postedDate_idx`(`status`, `postedDate` DESC),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CaseStudy` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `title` JSON NOT NULL,
    `clientId` VARCHAR(191) NULL,
    `cardImageId` VARCHAR(191) NOT NULL,
    `industryId` VARCHAR(191) NOT NULL,
    `solutionId` VARCHAR(191) NOT NULL,
    `detail` JSON NULL,
    `seo` JSON NULL,
    `status` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `publishedAt` DATETIME(3) NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `searchText` VARCHAR(4000) NOT NULL DEFAULT '',
    `createdById` VARCHAR(191) NULL,
    `updatedById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `CaseStudy_slug_key`(`slug`),
    INDEX `CaseStudy_status_order_idx`(`status`, `order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProductCategory` (
    `id` VARCHAR(191) NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `label` JSON NOT NULL,
    `shortLabel` JSON NULL,
    `title` JSON NOT NULL,
    `description` JSON NOT NULL,
    `menuTitle` JSON NULL,
    `menuDescription` JSON NULL,
    `button` JSON NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `searchText` VARCHAR(4000) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ProductCategory_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProductCategoryProduct` (
    `categoryId` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `order` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`categoryId`, `productId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Product` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `tagline` JSON NOT NULL,
    `shortDescription` JSON NOT NULL,
    `cardImageId` VARCHAR(191) NOT NULL,
    `homeCategoryId` VARCHAR(191) NULL,
    `featuredOnHome` BOOLEAN NOT NULL DEFAULT false,
    `template` ENUM('BLOCKS', 'CLASSIC', 'LEGACY_API') NOT NULL DEFAULT 'BLOCKS',
    `hero` JSON NOT NULL,
    `sections` JSON NULL,
    `classic` JSON NULL,
    `legacy` JSON NULL,
    `faq` JSON NULL,
    `cta` JSON NULL,
    `seo` JSON NOT NULL,
    `searchKeywords` JSON NULL,
    `status` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `publishedAt` DATETIME(3) NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `searchText` VARCHAR(4000) NOT NULL DEFAULT '',
    `createdById` VARCHAR(191) NULL,
    `updatedById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Product_slug_key`(`slug`),
    INDEX `Product_status_order_idx`(`status`, `order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Solution` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `menuLabel` JSON NOT NULL,
    `menuIcon` VARCHAR(191) NULL,
    `template` ENUM('BLOCKS', 'SOC') NOT NULL DEFAULT 'BLOCKS',
    `hero` JSON NOT NULL,
    `sections` JSON NULL,
    `soc` JSON NULL,
    `faq` JSON NULL,
    `cta` JSON NULL,
    `seo` JSON NOT NULL,
    `searchKeywords` JSON NULL,
    `status` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `publishedAt` DATETIME(3) NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `searchText` VARCHAR(4000) NOT NULL DEFAULT '',
    `createdById` VARCHAR(191) NULL,
    `updatedById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Solution_slug_key`(`slug`),
    INDEX `Solution_status_order_idx`(`status`, `order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Industry` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `menuLabel` JSON NOT NULL,
    `menuIcon` VARCHAR(191) NULL,
    `template` ENUM('BLOCKS', 'AVIATION') NOT NULL DEFAULT 'BLOCKS',
    `hero` JSON NOT NULL,
    `sections` JSON NULL,
    `aviation` JSON NULL,
    `faq` JSON NULL,
    `cta` JSON NULL,
    `seo` JSON NOT NULL,
    `searchKeywords` JSON NULL,
    `status` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `publishedAt` DATETIME(3) NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `searchText` VARCHAR(4000) NOT NULL DEFAULT '',
    `createdById` VARCHAR(191) NULL,
    `updatedById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Industry_slug_key`(`slug`),
    INDEX `Industry_status_order_idx`(`status`, `order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Singleton` (
    `key` ENUM('SITE_SETTINGS', 'NAVIGATION', 'FOOTER', 'UI_STRINGS', 'ASK_ASYST_FORM', 'HOME', 'ABOUT', 'CONTACT', 'NEWS_PAGE', 'CAREER', 'CAREER_JOBS', 'CAREER_JOB_DETAIL', 'CASE_STUDY_PAGE', 'PRODUCT_LANDING', 'SOLUTION_LANDING', 'INDUSTRY_LANDING', 'NOT_FOUND', 'SEARCH') NOT NULL,
    `draft` JSON NOT NULL,
    `published` JSON NULL,
    `publishedAt` DATETIME(3) NULL,
    `updatedById` VARCHAR(191) NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FormSubmission` (
    `id` VARCHAR(191) NOT NULL,
    `source` ENUM('CONTACT_US', 'ASK_ASYST', 'CAREER_APPLY') NOT NULL,
    `topic` VARCHAR(191) NULL,
    `fullName` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `company` VARCHAR(191) NOT NULL,
    `jobTitle` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `subject` VARCHAR(255) NULL,
    `message` TEXT NOT NULL,
    `pageUrl` VARCHAR(1000) NULL,
    `language` VARCHAR(191) NULL,
    `status` ENUM('NEW', 'IN_PROGRESS', 'CLOSED') NOT NULL DEFAULT 'NEW',
    `notes` TEXT NULL,
    `ipHash` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `FormSubmission_source_status_createdAt_idx`(`source`, `status`, `createdAt` DESC),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_SolutionClients` (
    `A` VARCHAR(191) NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_SolutionClients_AB_unique`(`A`, `B`),
    INDEX `_SolutionClients_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_NewsTags` (
    `A` VARCHAR(191) NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_NewsTags_AB_unique`(`A`, `B`),
    INDEX `_NewsTags_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_JobSkills` (
    `A` VARCHAR(191) NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_JobSkills_AB_unique`(`A`, `B`),
    INDEX `_JobSkills_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_CaseTechnologies` (
    `A` VARCHAR(191) NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_CaseTechnologies_AB_unique`(`A`, `B`),
    INDEX `_CaseTechnologies_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_CaseTags` (
    `A` VARCHAR(191) NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_CaseTags_AB_unique`(`A`, `B`),
    INDEX `_CaseTags_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_CaseRelated` (
    `A` VARCHAR(191) NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_CaseRelated_AB_unique`(`A`, `B`),
    INDEX `_CaseRelated_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Media` ADD CONSTRAINT `Media_uploadedById_fkey` FOREIGN KEY (`uploadedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Client` ADD CONSTRAINT `Client_logoId_fkey` FOREIGN KEY (`logoId`) REFERENCES `Media`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Client` ADD CONSTRAINT `Client_logoColorId_fkey` FOREIGN KEY (`logoColorId`) REFERENCES `Media`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Testimonial` ADD CONSTRAINT `Testimonial_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Testimonial` ADD CONSTRAINT `Testimonial_photoId_fkey` FOREIGN KEY (`photoId`) REFERENCES `Media`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Award` ADD CONSTRAINT `Award_imageId_fkey` FOREIGN KEY (`imageId`) REFERENCES `Media`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Leader` ADD CONSTRAINT `Leader_photoId_fkey` FOREIGN KEY (`photoId`) REFERENCES `Media`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Author` ADD CONSTRAINT `Author_avatarId_fkey` FOREIGN KEY (`avatarId`) REFERENCES `Media`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NewsArticle` ADD CONSTRAINT `NewsArticle_coverImageId_fkey` FOREIGN KEY (`coverImageId`) REFERENCES `Media`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NewsArticle` ADD CONSTRAINT `NewsArticle_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `Term`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NewsArticle` ADD CONSTRAINT `NewsArticle_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `Author`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Job` ADD CONSTRAINT `Job_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `Term`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Job` ADD CONSTRAINT `Job_experienceId_fkey` FOREIGN KEY (`experienceId`) REFERENCES `Term`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Job` ADD CONSTRAINT `Job_employmentTypeId_fkey` FOREIGN KEY (`employmentTypeId`) REFERENCES `Term`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Job` ADD CONSTRAINT `Job_locationId_fkey` FOREIGN KEY (`locationId`) REFERENCES `Term`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CaseStudy` ADD CONSTRAINT `CaseStudy_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CaseStudy` ADD CONSTRAINT `CaseStudy_cardImageId_fkey` FOREIGN KEY (`cardImageId`) REFERENCES `Media`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CaseStudy` ADD CONSTRAINT `CaseStudy_industryId_fkey` FOREIGN KEY (`industryId`) REFERENCES `Term`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CaseStudy` ADD CONSTRAINT `CaseStudy_solutionId_fkey` FOREIGN KEY (`solutionId`) REFERENCES `Term`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductCategoryProduct` ADD CONSTRAINT `ProductCategoryProduct_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `ProductCategory`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductCategoryProduct` ADD CONSTRAINT `ProductCategoryProduct_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Product` ADD CONSTRAINT `Product_cardImageId_fkey` FOREIGN KEY (`cardImageId`) REFERENCES `Media`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Product` ADD CONSTRAINT `Product_homeCategoryId_fkey` FOREIGN KEY (`homeCategoryId`) REFERENCES `Term`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_SolutionClients` ADD CONSTRAINT `_SolutionClients_A_fkey` FOREIGN KEY (`A`) REFERENCES `Client`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_SolutionClients` ADD CONSTRAINT `_SolutionClients_B_fkey` FOREIGN KEY (`B`) REFERENCES `Solution`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_NewsTags` ADD CONSTRAINT `_NewsTags_A_fkey` FOREIGN KEY (`A`) REFERENCES `NewsArticle`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_NewsTags` ADD CONSTRAINT `_NewsTags_B_fkey` FOREIGN KEY (`B`) REFERENCES `Term`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_JobSkills` ADD CONSTRAINT `_JobSkills_A_fkey` FOREIGN KEY (`A`) REFERENCES `Job`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_JobSkills` ADD CONSTRAINT `_JobSkills_B_fkey` FOREIGN KEY (`B`) REFERENCES `Term`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_CaseTechnologies` ADD CONSTRAINT `_CaseTechnologies_A_fkey` FOREIGN KEY (`A`) REFERENCES `CaseStudy`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_CaseTechnologies` ADD CONSTRAINT `_CaseTechnologies_B_fkey` FOREIGN KEY (`B`) REFERENCES `Term`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_CaseTags` ADD CONSTRAINT `_CaseTags_A_fkey` FOREIGN KEY (`A`) REFERENCES `CaseStudy`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_CaseTags` ADD CONSTRAINT `_CaseTags_B_fkey` FOREIGN KEY (`B`) REFERENCES `Term`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_CaseRelated` ADD CONSTRAINT `_CaseRelated_A_fkey` FOREIGN KEY (`A`) REFERENCES `CaseStudy`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_CaseRelated` ADD CONSTRAINT `_CaseRelated_B_fkey` FOREIGN KEY (`B`) REFERENCES `CaseStudy`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
