"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RecipeCard } from "@/components/recipes/RecipeCard";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useBookmarks } from "@/lib/bookmark-context";
import type { Recipe } from "@/lib/types";
import styles from "./page.module.css";

export function BookmarksContent() {
  const { status } = useAuth();
  const { bookmarkedIds, ready } = useBookmarks();
  const router = useRouter();
  const [recipes, setRecipes] = useState<Recipe[]>([]);

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;
    api
      .getRecipes({ limit: "100" })
      .then((data) => {
        if (!cancelled) setRecipes(data.recipes);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [status]);

  useEffect(() => {
    if (status === "anonymous") router.replace("/login?next=/bookmarks");
  }, [status, router]);

  if (status === "loading" || status === "anonymous" || !ready) {
    return <p className={styles.empty}>Loading your bookmarks…</p>;
  }

  const saved = bookmarkedIds
    .map((id) => recipes.find((recipe) => recipe.id === id))
    .filter((recipe): recipe is Recipe => Boolean(recipe));

  return (
    <main className={styles.main}>
      <h1 className={styles.title}>My bookmarks</h1>
      <p className={styles.subtitle}>
        {saved.length} {saved.length === 1 ? "recipe" : "recipes"} saved
      </p>

      {saved.length === 0 ? (
        <p className={styles.empty}>
          You have no saved recipes yet. Browse the{" "}
          <Link className={styles.link} href="/recipes">
            recipes
          </Link>{" "}
          and tap the bookmark icon.
        </p>
      ) : (
        <div className="recipe-grid">
          {saved.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}
    </main>
  );
}