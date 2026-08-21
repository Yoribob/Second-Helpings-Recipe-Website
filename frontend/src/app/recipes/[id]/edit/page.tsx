import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ServerApiError, serverGetJson } from "@/lib/server-api";
import { getServerSession } from "@/lib/auth-server";
import type { Recipe } from "@/lib/types";
import { CreateRecipeForm } from "@/components/recipes/CreateRecipeForm";

export const dynamic = "force-dynamic";

type EditRecipeParams = { id: string };

async function fetchRecipe(id: string): Promise<Recipe | null> {
  try {
    const data = await serverGetJson<{ recipe: Recipe }>(
      `/api/recipes/${encodeURIComponent(id)}`,
    );
    return data?.recipe ?? null;
  } catch (err) {
    if (err instanceof ServerApiError) return null;
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<EditRecipeParams>;
}): Promise<Metadata> {
  const { id } = await params;
  const recipe = await fetchRecipe(id);
  return { title: recipe ? `Edit ${recipe.title}` : "Edit recipe" };
}

export default async function EditRecipePage({
  params,
}: {
  params: Promise<EditRecipeParams>;
}) {
  const { id } = await params;

  const session = await getServerSession();
  if (!session.hasToken) {
    redirect(`/login?next=/recipes/${encodeURIComponent(id)}/edit`);
  }

  const recipe = await fetchRecipe(id);
  if (!recipe) notFound();
  if (!session.user?.id || recipe.user?.id !== session.user.id) notFound();

  return <CreateRecipeForm recipe={recipe} />;
}