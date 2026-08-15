ALTER TABLE "Recipe" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'draft';

UPDATE "Recipe" SET "status" = 'published' WHERE "isGlobal" = true;
