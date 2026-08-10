import type { Metadata } from "next";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { HomeSearch } from "@/components/home/HomeSearch";
import { RandomRecipeButton } from "@/components/home/RandomRecipeButton";
import { RecipeCard } from "@/components/recipes/RecipeCard";
import { sampleRecipes } from "@/lib/sample-data";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Welcome",
};

export default function Home() {
  const trending = sampleRecipes.slice(0, 4);

  return (
    <main>
      <HeroCarousel />

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
        <div className="recipe-grid">
          {trending.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      </section>
    </main>
  );
}
