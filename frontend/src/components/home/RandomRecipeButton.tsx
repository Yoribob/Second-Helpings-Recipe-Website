"use client";

import { useRouter } from "next/navigation";
import { sampleRecipes } from "@/lib/sample-data";
import styles from "./RandomRecipeButton.module.css";

export function RandomRecipeButton() {
  const router = useRouter();

  const handleClick = () => {
    const recipe =
      sampleRecipes[Math.floor(Math.random() * sampleRecipes.length)];
    router.push(`/recipes/${recipe.id}`);
  };

  return (
    <button className={styles.button} type="button" onClick={handleClick}>
      Random recipe
    </button>
  );
}
