"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";
import styles from "./RandomRecipeButton.module.css";

export function RandomRecipeButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const handleClick = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const { recipes } = await api.getRecipes({ limit: "100" });
      if (recipes.length === 0) return;
      const recipe = recipes[Math.floor(Math.random() * recipes.length)];
      router.push(`/recipes/${recipe.id}`);
    } catch {
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      className={styles.button}
      type="button"
      onClick={handleClick}
      disabled={busy}
    >
      Random recipe
    </button>
  );
}