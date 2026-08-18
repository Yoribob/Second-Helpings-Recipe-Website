CREATE TABLE "RecipeEdit" (
    "id" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "steps" TEXT[],
    "imageUrl" TEXT,
    "category" TEXT,
    "difficulty" TEXT,
    "cookingTime" INTEGER,
    "servings" INTEGER,
    "cuisine" TEXT,
    "dietaryTags" TEXT[],
    "ingredients" JSONB NOT NULL,
    "rejectedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "RecipeEdit_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RecipeEdit_status_idx" ON "RecipeEdit"("status");

CREATE INDEX "RecipeEdit_recipeId_idx" ON "RecipeEdit"("recipeId");

ALTER TABLE "RecipeEdit" ADD CONSTRAINT "RecipeEdit_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RecipeEdit" ADD CONSTRAINT "RecipeEdit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
