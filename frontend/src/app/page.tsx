"use client";

import { RecipeCard } from "@/components/recipes/RecipeCard";
import { sampleRecipes } from "@/lib/sample-data";
import { useState } from "react";
import { SearchBar } from "@/components/ui/SearchBar";

export default function Home() {
  const [query, setQuery] = useState("");

  const filtered = sampleRecipes.filter((recipe) => {
    const haystack = [
      recipe.title,
      recipe.description,
      recipe.cuisine,
      ...recipe.dietaryTags,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(query.trim().toLowerCase());
  });

  return (
    <main>
      <SearchBar value={query} onChange={setQuery}></SearchBar>
      <div className="recipe-grid">
        {filtered.map((recipe) => (
          <RecipeCard key={recipe.id} recipe={recipe}></RecipeCard>
        ))}
      </div>
    </main>
  );
}
