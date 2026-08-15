ALTER TABLE "Recipe" ADD COLUMN     "ratingAvg" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "ratingCount" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "RecipeRating" (
    "id" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecipeRating_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RecipeComment" (
    "id" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecipeComment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RecipeRating_userId_recipeId_key" ON "RecipeRating"("userId", "recipeId");

CREATE INDEX "RecipeRating_recipeId_idx" ON "RecipeRating"("recipeId");

CREATE UNIQUE INDEX "RecipeComment_userId_recipeId_key" ON "RecipeComment"("userId", "recipeId");

CREATE INDEX "RecipeComment_recipeId_idx" ON "RecipeComment"("recipeId");

ALTER TABLE "RecipeRating" ADD CONSTRAINT "RecipeRating_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RecipeRating" ADD CONSTRAINT "RecipeRating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RecipeComment" ADD CONSTRAINT "RecipeComment_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RecipeComment" ADD CONSTRAINT "RecipeComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
