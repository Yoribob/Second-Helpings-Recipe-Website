import type { Metadata } from "next";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { HomeSearch } from "@/components/home/HomeSearch";
import { RandomRecipeButton } from "@/components/home/RandomRecipeButton";
import { RecipeCard } from "@/components/recipes/RecipeCard";
import { serverGetJson } from "@/lib/server-api";
import type { Recipe } from "@/lib/types";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Welcome",
};

export default async function Home() {
  let recipes: Recipe[] = [];
  try {
    const data = await serverGetJson<{ recipes: Recipe[] }>(
      "/api/recipes?limit=100",
    );
    recipes = data?.recipes ?? [];
  } catch {
    recipes = [];
  }

  const trending = recipes.slice(0, 4);
  const slides = recipes
    .filter((recipe) => recipe.imageUrl)
    .slice(0, 4)
    .map((recipe) => ({
      src: recipe.imageUrl as string,
      title: recipe.title,
      description: recipe.description ?? "",
    }));

  return (
    <main>
      <HeroCarousel slides={slides} />

      <section className={styles.hero}>
        <h1 className={styles.title}>Second Helpings</h1>
        <p className={styles.subtitle}>
          A cozy corner of the internet for weeknight dinners, lazy weekend
          bakes, and everything you can make with what&apos;s already in the
          fridge.
        </p>

        <div className={styles.actions}>
          <HomeSearch />
          <RandomRecipeButton />
        </div>
      </section>

      <section className={styles.trending}>
        <h2 className={styles.sectionTitle}>Trending this week</h2>
        {trending.length === 0 ? (
          <p className={styles.empty}>No recipes yet.</p>
        ) : (
          <div className="recipe-grid">
            {trending.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}