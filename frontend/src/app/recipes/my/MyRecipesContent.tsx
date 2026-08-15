"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RecipeCard } from "@/components/recipes/RecipeCard";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { Recipe } from "@/lib/types";
import styles from "./page.module.css";

export function MyRecipesContent() {
  const router = useRouter();
  const { status } = useAuth();

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (status === "anonymous") {
      router.replace("/login?next=/recipes/my");
      return;
    }
    if (status !== "authenticated") return;

    let cancelled = false;
    api
      .getMyRecipes()
      .then((data) => {
        if (!cancelled) setRecipes(data.recipes);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [status, router]);

  if (status === "loading") {
    return <p className={styles.empty}>Loading your recipes…</p>;
  }

  return (
    <main className={styles.main}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>My recipes</h1>
          <p className={styles.subtitle}>
            {loading
              ? "Loading…"
              : `${recipes.length} ${recipes.length === 1 ? "recipe" : "recipes"}`}
          </p>
        </div>
        <Link href="/recipes/create" className={styles.addButton}>
          Add recipe
        </Link>
      </div>

      {loading ? (
        <p className={styles.empty}>Loading your recipes…</p>
      ) : loadError ? (
        <p className={styles.empty}>Couldn&apos;t load your recipes.</p>
      ) : recipes.length === 0 ? (
        <p className={styles.empty}>
          You don&apos;t have any recipes yet - click{" "}
          <Link className={styles.link} href="/recipes/create">
            &lsquo;Add recipe&rsquo;
          </Link>{" "}
          to make one.
        </p>
      ) : (
        <div className="recipe-grid">
          {recipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}
    </main>
  );
}