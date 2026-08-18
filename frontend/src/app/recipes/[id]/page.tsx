import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ServerApiError, serverGetJson } from "@/lib/server-api";
import { getServerSession } from "@/lib/auth-server";
import type { Recipe } from "@/lib/types";
import { RecipeDetailView } from "@/components/recipes/RecipeDetailView";
import { PublishGlobalButton } from "@/components/recipes/PublishGlobalButton";
import { DeleteRecipeButton } from "@/components/recipes/DeleteRecipeButton";
import { EditRecipeButton } from "@/components/recipes/EditRecipeButton";

export const dynamic = "force-dynamic";

type RecipePageParams = { id: string };

type RecipeFetch = {
  recipe: Recipe | null;
  authRequired: boolean;
};

async function fetchRecipe(id: string): Promise<RecipeFetch> {
  try {
    const data = await serverGetJson<{ recipe: Recipe }>(
      `/api/recipes/${encodeURIComponent(id)}`,
    );
    return { recipe: data?.recipe ?? null, authRequired: false };
  } catch (err) {
    if (
      err instanceof ServerApiError &&
      (err.status === 401 || err.status === 403)
    ) {
      return { recipe: null, authRequired: true };
    }
    return { recipe: null, authRequired: false };
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<RecipePageParams>;
}): Promise<Metadata> {
  const { id } = await params;
  const { recipe } = await fetchRecipe(id);
  return { title: recipe ? recipe.title : "Recipe not found" };
}

export default async function RecipePage({
  params,
}: {
  params: Promise<RecipePageParams>;
}) {
  const { id } = await params;

  const session = await getServerSession();
  const { recipe, authRequired } = await fetchRecipe(id);

  if (!recipe) {
    if (authRequired && !session.hasToken) {
      redirect(`/login?next=/recipes/${encodeURIComponent(id)}`);
    }
    notFound();
  }

  const userId = session.user?.id;
  const ownsRecipe =
    Boolean(userId) &&
    recipe.user != null &&
    recipe.user.id === userId;

  return (
    <RecipeDetailView
      recipe={recipe}
      backHref="/recipes"
      readOnly={ownsRecipe}
      actions={
        ownsRecipe ? (
          <>
            <DeleteRecipeButton recipeId={recipe.id} />
            <EditRecipeButton
              recipeId={recipe.id}
              hasPendingEdit={Boolean(recipe.pendingEdit)}
            />
            <PublishGlobalButton
              recipeId={recipe.id}
              status={recipe.status ?? "draft"}
            />
          </>
        ) : null
      }
    />
  );
}