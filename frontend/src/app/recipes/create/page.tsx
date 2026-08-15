import type { Metadata } from "next";
import { CreateRecipeForm } from "@/components/recipes/CreateRecipeForm";

export const metadata: Metadata = {
  title: "Add a recipe",
};

export default function CreateRecipePage() {
  return <CreateRecipeForm />;
}