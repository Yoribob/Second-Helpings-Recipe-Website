"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, api } from "@/lib/api";
import { normalizeImageUrl } from "@/lib/normalize-image-url";
import { useAuth } from "@/lib/auth-context";
import {
  CATEGORIES,
  DIFFICULTIES,
  CUISINES,
  DIETARY_TAGS,
} from "@/lib/recipe-metadata";
import type {
  Difficulty,
  Ingredient,
  NewRecipeInput,
  Recipe,
} from "@/lib/types";
import { RecipeDetailView } from "@/components/recipes/RecipeDetailView";
import { RecipeImage } from "@/components/recipes/RecipeImage";
import styles from "./CreateRecipeForm.module.css";

const INGREDIENT_PATTERN = /^(.+?)\s+(\d+(?:[.,]\d+)?)\s*([a-zA-Z%]+)$/;

function parseIngredient(text: string): Ingredient | null {
  const match = text.trim().match(INGREDIENT_PATTERN);
  if (!match) return null;
  const name = match[1].trim();
  const amount = Number(match[2].replace(",", "."));
  const unit = match[3].trim();
  if (!name || !Number.isFinite(amount) || amount <= 0 || !unit) return null;
  return { name, amount, unit };
}

export function CreateRecipeForm({ recipe }: { recipe?: Recipe }) {
  const router = useRouter();
  const { status } = useAuth();
  const isEditMode = Boolean(recipe);
  const isPublishedLive =
    isEditMode && recipe!.status === "published" && recipe!.isGlobal;

  const [title, setTitle] = useState(recipe?.title ?? "");
  const [description, setDescription] = useState(recipe?.description ?? "");
  const [category, setCategory] = useState(recipe?.category ?? "");
  const [difficulty, setDifficulty] = useState<Difficulty | "">(
    recipe?.difficulty ?? "",
  );
  const [cookingTime, setCookingTime] = useState(
    recipe?.cookingTime != null ? String(recipe.cookingTime) : "",
  );
  const [cuisine, setCuisine] = useState(recipe?.cuisine ?? "");
  const [servings, setServings] = useState(
    recipe?.servings != null ? String(recipe.servings) : "",
  );
  const [dietaryTags, setDietaryTags] = useState<string[]>(
    recipe?.dietaryTags ?? [],
  );
  const [imageUrl, setImageUrl] = useState(recipe?.imageUrl ?? "");

  const [ingredients, setIngredients] = useState<Ingredient[]>(
    recipe?.ingredients ?? [],
  );
  const [ingredientInput, setIngredientInput] = useState("");
  const [ingredientError, setIngredientError] = useState<string | null>(null);

  const [steps, setSteps] = useState<string[]>(recipe?.steps ?? []);
  const [stepInput, setStepInput] = useState("");
  const [stepError, setStepError] = useState<string | null>(null);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (status === "anonymous") {
      router.replace(
        isEditMode
          ? `/login?next=/recipes/${recipe!.id}/edit`
          : "/login?next=/recipes/create",
      );
    }
  }, [status, router, isEditMode, recipe]);

  useEffect(() => {
    if (!previewOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPreviewOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [previewOpen]);

  const addIngredient = () => {
    const parsed = parseIngredient(ingredientInput);
    if (!parsed) {
      setIngredientError("Use “name amount unit”, e.g. “egg 100 g”");
      return;
    }
    setIngredients((prev) => [...prev, parsed]);
    setIngredientInput("");
    setIngredientError(null);
  };

  const removeIngredient = (index: number) => {
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  };

  const handleIngredientKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addIngredient();
    }
  };

  const addStep = () => {
    const step = stepInput.trim();
    if (!step) {
      setStepError("Write the step first, then press Add");
      return;
    }
    setSteps((prev) => [...prev, step]);
    setStepInput("");
    setStepError(null);
  };

  const removeStep = (index: number) => {
    setSteps((prev) => prev.filter((_, i) => i !== index));
  };

  const handleStepKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addStep();
    }
  };

  const toggleDietaryTag = (tag: string) => {
    setDietaryTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const previewRecipe: Recipe = useMemo(
    () => ({
      id: "preview",
      title: title.trim() || "Untitled recipe",
      description: description.trim() || null,
      steps,
      imageUrl: normalizeImageUrl(imageUrl) || null,
      isGlobal: false,
      category: category || null,
      difficulty: difficulty || null,
      cookingTime: cookingTime.trim() ? Number(cookingTime) : null,
      servings: servings.trim() ? Number(servings) : null,
      cuisine: cuisine || null,
      dietaryTags,
      ingredients,
      user: null,
    }),
    [
      title,
      description,
      steps,
      imageUrl,
      category,
      difficulty,
      cookingTime,
      servings,
      cuisine,
      dietaryTags,
      ingredients,
    ],
  );

  const validate = (): NewRecipeInput | null => {
    if (!title.trim()) {
      setError("Title is required");
      return null;
    }
    if (ingredients.length === 0) {
      setError("Add at least one ingredient");
      return null;
    }
    if (steps.length === 0) {
      setError("Add at least one step");
      return null;
    }

    const cookingTimeNum = cookingTime.trim() ? Number(cookingTime) : undefined;
    if (
      cookingTimeNum !== undefined &&
      (!Number.isFinite(cookingTimeNum) || cookingTimeNum < 1)
    ) {
      setError("Cooking time must be a positive number of minutes");
      return null;
    }

    const servingsNum = servings.trim() ? Number(servings) : undefined;
    if (
      servingsNum !== undefined &&
      (!Number.isFinite(servingsNum) || servingsNum < 1)
    ) {
      setError("Servings must be at least 1");
      return null;
    }

    return {
      title: title.trim(),
      description: description.trim() || null,
      steps,
      imageUrl: normalizeImageUrl(imageUrl) || null,
      isGlobal: false,
      category: category || null,
      difficulty: difficulty || null,
      cookingTime: cookingTimeNum,
      servings: servingsNum,
      cuisine: cuisine || null,
      dietaryTags,
      ingredients,
    };
  };

  const goToRecipe = (id: string) => {
    router.push(`/recipes/${id}`);
    router.refresh();
  };

  const handleSaveChanges = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setError(null);
    const payload = validate();
    if (!payload) return;

    setBusy(true);
    try {
      if (isEditMode) {
        if (isPublishedLive) {
          await api.updateRecipe(recipe!.id, { status: "draft" });
        }
        await api.updateRecipe(recipe!.id, payload);
        goToRecipe(recipe!.id);
      } else {
        const data = await api.createRecipe(payload);
        goToRecipe(data.recipe.id);
      }
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Something went wrong, please try again",
      );
      setBusy(false);
    }
  };

  const handleSaveAndPublish = async () => {
    setError(null);
    const payload = validate();
    if (!payload || !isEditMode) return;

    setBusy(true);
    try {
      await api.submitRecipeEdit(recipe!.id, payload);
      goToRecipe(recipe!.id);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Something went wrong, please try again",
      );
      setBusy(false);
    }
  };

  if (status !== "authenticated") {
    return (
      <main className={styles.page}>
        <p className={styles.loading}>Checking your session…</p>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.head}>
        <h1 className={styles.title}>
          {isEditMode ? "Edit recipe" : "Add a recipe"}
        </h1>
        <p className={styles.subtitle}>
          {isEditMode
            ? isPublishedLive
              ? "Save changes to keep this recipe private, or save edits and publish to send it for review."
              : "Save your changes, or save edits and publish to send the recipe for review."
            : "Write it down once, keep it in your collection forever."}
        </p>
      </div>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      <form className={styles.card} onSubmit={handleSaveChanges}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Basics</h2>

          <div className={styles.grid}>
            <label className={`${styles.field} ${styles.full}`}>
              <span className={styles.label}>Title</span>
              <input
                className={styles.input}
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="e.g. Grandma’s Tomato Soup"
                required
                maxLength={200}
              />
            </label>

            <label className={`${styles.field} ${styles.full}`}>
              <span className={styles.label}>Description (optional)</span>
              <textarea
                className={styles.input}
                rows={3}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="What makes this dish special?"
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Category</span>
              <select
                className={styles.input}
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              >
                <option value="">Choose…</option>
                {CATEGORIES.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Difficulty</span>
              <select
                className={styles.input}
                value={difficulty}
                onChange={(event) =>
                  setDifficulty(event.target.value as Difficulty | "")
                }
              >
                <option value="">Choose…</option>
                {DIFFICULTIES.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Cooking time</span>
              <input
                className={styles.input}
                type="number"
                min={1}
                value={cookingTime}
                onChange={(event) => setCookingTime(event.target.value)}
                placeholder="Minutes"
                inputMode="numeric"
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Cuisine</span>
              <select
                className={styles.input}
                value={cuisine}
                onChange={(event) => setCuisine(event.target.value)}
              >
                <option value="">Choose…</option>
                {CUISINES.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Servings (optional)</span>
              <input
                className={styles.input}
                type="number"
                min={1}
                value={servings}
                onChange={(event) => setServings(event.target.value)}
                placeholder="e.g. 4"
                inputMode="numeric"
              />
            </label>
          </div>

          <div className={styles.field}>
            <span className={styles.label}>Dietary tags (optional)</span>
            <div className={styles.chips}>
              {DIETARY_TAGS.map((tag) => {
                const active = dietaryTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    className={active ? styles.chipActive : styles.chip}
                    onClick={() => toggleDietaryTag(tag)}
                    aria-pressed={active}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          <label className={styles.field}>
            <span className={styles.label}>Image URL (optional)</span>
            <div className={styles.imageRow}>
              <input
                className={`${styles.input} ${styles.imageInput}`}
                type="text"
                value={imageUrl}
                onChange={(event) => setImageUrl(event.target.value)}
                placeholder="https://…"
              />
              {imageUrl.trim() && (
                <RecipeImage
                  className={styles.imagePreview}
                  src={imageUrl}
                  alt="Recipe image preview"
                  width={120}
                  height={80}
                />
              )}
            </div>
          </label>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Ingredients *</h2>
          <p className={styles.hint}>
            Type one ingredient as “name amount unit”, then press Add.
          </p>
          <div className={styles.addRow}>
            <input
              className={styles.input}
              type="text"
              value={ingredientInput}
              onChange={(event) => {
                setIngredientInput(event.target.value);
                setIngredientError(null);
              }}
              onKeyDown={handleIngredientKeyDown}
              placeholder="e.g. egg 100 g"
              aria-label="New ingredient"
            />
            <button
              type="button"
              className={styles.addButton}
              onClick={addIngredient}
            >
              + Add
            </button>
          </div>
          {ingredientError && (
            <p className={styles.listError} role="alert">
              {ingredientError}
            </p>
          )}
          {ingredients.length > 0 ? (
            <ul className={styles.list}>
              {ingredients.map((ingredient, index) => (
                <li
                  key={`${ingredient.name}-${index}`}
                  className={styles.listItem}
                >
                  <span className={styles.listText}>{ingredient.name}</span>
                  <span className={styles.listAmount}>
                    {ingredient.amount} {ingredient.unit}
                  </span>
                  <button
                    type="button"
                    className={styles.remove}
                    onClick={() => removeIngredient(index)}
                    aria-label={`Remove ${ingredient.name}`}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.listEmpty}>No ingredients yet.</p>
          )}
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Steps *</h2>
          <p className={styles.hint}>
            Type one step at a time, then press Add.
          </p>
          <div className={styles.addRow}>
            <input
              className={styles.input}
              type="text"
              value={stepInput}
              onChange={(event) => {
                setStepInput(event.target.value);
                setStepError(null);
              }}
              onKeyDown={handleStepKeyDown}
              placeholder="e.g. Boil the pasta in salted water"
              aria-label="New step"
            />
            <button
              type="button"
              className={styles.addButton}
              onClick={addStep}
            >
              + Add
            </button>
          </div>
          {stepError && (
            <p className={styles.listError} role="alert">
              {stepError}
            </p>
          )}
          {steps.length > 0 ? (
            <ol className={styles.stepsList}>
              {steps.map((step, index) => (
                <li key={index} className={styles.stepItem}>
                  <span className={styles.stepNumber}>{index + 1}</span>
                  <span className={styles.stepText}>{step}</span>
                  <button
                    type="button"
                    className={styles.remove}
                    onClick={() => removeStep(index)}
                    aria-label={`Remove step ${index + 1}`}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ol>
          ) : (
            <p className={styles.listEmpty}>No steps yet.</p>
          )}
        </section>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.review}
            onClick={() => setPreviewOpen(true)}
          >
            Review
          </button>
          {isEditMode && (
            <button
              type="button"
              className={styles.publish}
              onClick={handleSaveAndPublish}
              disabled={busy}
              title="Submit the changes for admin review before they go live"
            >
              {busy ? "Submitting…" : "Save edits and publish"}
            </button>
          )}
          <button type="submit" className={styles.submit} disabled={busy}>
            {busy
              ? isEditMode
                ? "Saving…"
                : "Uploading…"
              : isEditMode
                ? "Save changes"
                : "Add to your recipes"}
          </button>
        </div>
      </form>

      {previewOpen && (
        <div
          className={styles.overlay}
          role="dialog"
          aria-modal="true"
          aria-label="Recipe preview"
        >
          <div className={styles.overlayHeader}>
            <p className={styles.overlayLabel}>Preview</p>
            <button
              type="button"
              className={styles.closeButton}
              onClick={() => setPreviewOpen(false)}
            >
              Back to editing
            </button>
          </div>
          <div className={styles.overlayScroll}>
            <RecipeDetailView recipe={previewRecipe} bookmarkable={false} />
          </div>
        </div>
      )}
    </main>
  );
}
