"use client";

import { useState } from "react";
import type { ChangeEvent } from "react";
import type { Recipe } from "@/lib/types";
import styles from "./RecipeScaler.module.css";

type RecipeScalerProps = {
  recipe: Recipe;
};

export function RecipeScaler({ recipe }: RecipeScalerProps) {
  const baseServings = recipe.servings ?? 1;
  const [servingsText, setServingsText] = useState(String(baseServings));

  const servings = Math.max(
    baseServings,
    Math.round(Number(servingsText) || baseServings),
  );
  const canDecrease = servings > baseServings;
  const scaled = servings !== baseServings;
  const scale = servings / baseServings;

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setServingsText(event.target.value);
  };

  const handleBlur = () => {
    setServingsText(String(servings));
  };

  const decrease = () => {
    setServingsText(String(Math.max(baseServings, servings - 1)));
  };

  const increase = () => {
    setServingsText(String(servings + 1));
  };

  const formatValue = (value: number): string => {
    const rounded = Math.round(value * 10) / 10;
    return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  };

  return (
    <div className={styles.root}>
      <div className={styles.serveBar}>
        <span className={styles.serveLabel}>Servings</span>
        <div className={styles.stepper}>
          <button
            type="button"
            className={styles.stepButton}
            onClick={decrease}
            disabled={!canDecrease}
            aria-label="Fewer servings"
          >
            −
          </button>
          <input
            className={styles.serveInput}
            type="number"
            value={servingsText}
            onChange={handleChange}
            onBlur={handleBlur}
            min={baseServings}
            inputMode="numeric"
            aria-label="Number of servings"
          />
          <button
            type="button"
            className={styles.stepButton}
            onClick={increase}
            aria-label="More servings"
          >
            +
          </button>
        </div>
      </div>

      <section>
        <h2 className={styles.sectionTitle}>Ingredients</h2>
        <ul className={styles.ingredients}>
          {recipe.ingredients.map((ingredient) => (
            <li key={ingredient.name} className={styles.ingredient}>
              <span className={styles.ingredientName}>
                {ingredient.name}
              </span>
              <span className={styles.ingredientAmount}>
                <span className={styles.originalAmount}>
                  {formatValue(ingredient.amount)} {ingredient.unit}
                </span>
                {scaled && (
                  <span className={styles.scaledAmount}>
                    {formatValue(ingredient.amount * scale)} {ingredient.unit}
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className={styles.sectionTitle}>Steps</h2>
        <ol className={styles.steps}>
          {recipe.steps.map((step, index) => (
            <li key={index} className={styles.step}>
              <span className={styles.stepNumber}>{index + 1}</span>
              {step}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}