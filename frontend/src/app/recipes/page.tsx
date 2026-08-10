import type { Metadata } from "next";
import { Suspense } from "react";
import { RecipesContent } from "./RecipesContent";

export const metadata: Metadata = {
  title: "Browse recipes",
};

export default function RecipesPage() {
  return (
    <Suspense fallback={<p>Loading recipes…</p>}>
      <RecipesContent />
    </Suspense>
  );
}
