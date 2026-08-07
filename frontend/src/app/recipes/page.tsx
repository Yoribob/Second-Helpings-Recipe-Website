"use client";

import { RecipeCard } from "@/components/recipes/RecipeCard";
import { sampleRecipes } from "@/lib/sample-data";
import { useMemo, useState } from "react";
import { SearchBar } from "@/components/ui/SearchBar";
import {
  CATEGORIES,
  DIFFICULTIES,
  CUISINES,
  DIETARY_TAGS,
  MAX_COOKING_TIME,
} from "@/lib/recipe-metadata";

export default function RecipesPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("All");
  const [difficulty, setDifficulty] = useState<string>("All");
  const [cuisine, setCuisine] = useState<string>("All");
  const [dietaryTags, setDietaryTags] = useState<string[]>(["All"]);
  const [maxCookingTime, setMaxCookingTime] = useState<number | "All">("All");
  const [sortBy, setSortBy] = useState<"title" | "cookingTime">("title");

  const handleDietaryToggle = (selectedTag: string) => {
    if (selectedTag === "All") {
      setDietaryTags(["All"]);
      return;
    }

    setDietaryTags((prev) => {
      const withoutAll = prev.filter((tag) => tag !== "All");

      if (withoutAll.includes(selectedTag)) {
        const updated = withoutAll.filter((tag) => tag !== selectedTag);
        return updated.length === 0 ? ["All"] : updated;
      } else {
        return [...withoutAll, selectedTag];
      }
    });
  };

  const sorted = useMemo(() => {
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

      const categoryOK = category === "All" || recipe.category === category;
      const difficultyOK =
        difficulty === "All" || recipe.difficulty === difficulty;
      const cuisineOK = cuisine === "All" || recipe.cuisine === cuisine;
      const maxCookingTimeOK =
        maxCookingTime === "All" || recipe.cookingTime <= maxCookingTime;
      const dietaryTagsOK =
        dietaryTags.includes("All") ||
        dietaryTags.every((tag) => recipe.dietaryTags.includes(tag));

      const matches =
        categoryOK &&
        difficultyOK &&
        cuisineOK &&
        dietaryTagsOK &&
        maxCookingTimeOK;

      return haystack.includes(query.trim().toLowerCase()) && matches;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "title") return a.title.localeCompare(b.title); 
      return a.cookingTime - b.cookingTime;
    });
  }, [
    query,
    category,
    difficulty,
    cuisine,
    dietaryTags,
    maxCookingTime,
    sortBy,
  ]);

  return (
    <main>
      <SearchBar value={query} onChange={setQuery} />

      <div className="chips">
        {["All", ...CATEGORIES].map((value) => (
          <button
            key={value}
            onClick={() => setCategory(value)}
            className={category === value ? "chip active" : "chip"}
          >
            {value}
          </button>
        ))}
      </div>

      <div className="chips">
        {["All", ...DIFFICULTIES].map((value) => (
          <button
            key={value}
            onClick={() => setDifficulty(value)}
            className={difficulty === value ? "chip active" : "chip"}
          >
            {value}
          </button>
        ))}
      </div>

      <div className="chips">
        {["All", ...CUISINES].map((value) => (
          <button
            key={value}
            onClick={() => setCuisine(value)}
            className={cuisine === value ? "chip active" : "chip"}
          >
            {value}
          </button>
        ))}
      </div>

      <div className="chips">
        {["All", ...DIETARY_TAGS].map((value) => {
          const isActive = dietaryTags.includes(value);

          return (
            <button
              key={value}
              onClick={() => handleDietaryToggle(value)}
              className={isActive ? "chip active" : "chip"}
            >
              {value}
            </button>
          );
        })}
      </div>

      <div className="chips">
        {["All", ...MAX_COOKING_TIME].map((value) => (
          <button
            key={String(value)}
            onClick={() => setMaxCookingTime(value as number | "All")}
            className={maxCookingTime === value ? "chip active" : "chip"}
          >
            {value === "All" ? "All" : `≤ ${value} mins`}
          </button>
        ))}
      </div>

      <select
        value={sortBy}
        onChange={(e) => setSortBy(e.target.value as "title" | "cookingTime")}
      >
        <option value="title">Title (A–Z)</option>
        <option value="cookingTime">Fastest first</option>
      </select>

      <div className="recipe-grid">
        {sorted.length === 0 && <p>No matching recipes</p>}
        {sorted.map((recipe) => (
          <RecipeCard key={recipe.id} recipe={recipe} />
        ))}
      </div>
    </main>
  );
}
