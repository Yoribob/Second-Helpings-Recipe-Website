import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { serverGetJson } from "@/lib/server-api";
import { getServerSession } from "@/lib/auth-server";
import type { Recipe } from "@/lib/types";
import { RecipeDetailView } from "@/components/recipes/RecipeDetailView";
import { PublishGlobalButton } from "@/components/recipes/PublishGlobalButton";

export const dynamic = "force-dynamic";

type RecipePageParams = { id: string };

async function fetchRecipe(id: string): Promise<Recipe | null> {
  try {
    const data = await serverGetJson<{ recipe: Recipe }>(
      `/api/recipes/${encodeURIComponent(id)}`,
    );
    return data?.recipe ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<RecipePageParams>;
}): Promise<Metadata> {
  const { id } = await params;
  const recipe = await fetchRecipe(id);
  return { title: recipe ? recipe.title : "Recipe not found" };
}

export default async function RecipePage({
  params,
}: {
  params: Promise<RecipePageParams>;
}) {
  const { id } = await params;
  const recipe = await fetchRecipe(id);

  if (!recipe) notFound();

  const session = await getServerSession();
  const userId = session.user?.id;
  const ownsRecipe =
    Boolean(userId) &&
    recipe.user != null &&
    recipe.user.id === userId &&
    !recipe.isGlobal;

  return (
    <RecipeDetailView
      recipe={recipe}
      backHref="/recipes"
      actions={
        ownsRecipe ? (
          <PublishGlobalButton recipeId={recipe.id} status={recipe.status ?? "draft"} />
        ) : null
      }
    />
  );
}