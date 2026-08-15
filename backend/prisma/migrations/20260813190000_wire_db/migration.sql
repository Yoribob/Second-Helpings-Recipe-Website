ALTER TABLE "Recipe" DROP CONSTRAINT "Recipe_userId_fkey";

ALTER TABLE "Ingredient" DROP CONSTRAINT "Ingredient_recipeId_fkey";

ALTER TABLE "User" ADD COLUMN     "usernameOriginal" TEXT NOT NULL DEFAULT '';

UPDATE "User" SET "usernameOriginal" = "username" WHERE "usernameOriginal" = '';

ALTER TABLE "User" ALTER COLUMN "usernameOriginal" DROP DEFAULT;

ALTER TABLE "Recipe" ADD COLUMN     "category" TEXT,
ADD COLUMN     "cookingTime" INTEGER,
ADD COLUMN     "cuisine" TEXT,
ADD COLUMN     "dietaryTags" TEXT[],
ADD COLUMN     "difficulty" TEXT,
ADD COLUMN     "isGlobal" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "servings" INTEGER,
ALTER COLUMN "userId" DROP NOT NULL;

UPDATE "Recipe" SET "isGlobal" = true WHERE "userId" IS NULL;

CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "device" TEXT,
    "ip" TEXT,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Bookmark" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Bookmark_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RefreshToken_userId_key" ON "RefreshToken"("userId");

CREATE INDEX "Bookmark_userId_idx" ON "Bookmark"("userId");

CREATE UNIQUE INDEX "Bookmark_userId_recipeId_key" ON "Bookmark"("userId", "recipeId");

ALTER TABLE "Recipe" ADD CONSTRAINT "Recipe_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Ingredient" ADD CONSTRAINT "Ingredient_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Bookmark" ADD CONSTRAINT "Bookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
