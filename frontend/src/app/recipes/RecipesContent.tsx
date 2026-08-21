"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RecipeCard } from "@/components/recipes/RecipeCard";
import { api } from "@/lib/api";
import type { Recipe } from "@/lib/types";
import { SearchBar } from "@/components/ui/SearchBar";
import {
  FilterGroup,
  type FilterChip,
} from "@/components/filters/FilterGroup";
import {
  SortSelect,
  type SortOption,
} from "@/components/filters/SortSelect";
import {
  CATEGORIES,
  DIFFICULTIES,
  CUISINES,
  DIETARY_TAGS,
  MAX_COOKING_TIME,
} from "@/lib/recipe-metadata";
import styles from "./page.module.css";

const categoryChips: FilterChip[] = ["All", ...CATEGORIES].map((value) => ({
  value,
  label: value,
}));
const difficultyChips: FilterChip[] = ["All", ...DIFFICULTIES].map((value) => ({
  value,
  label: value,
}));
const cuisineChips: FilterChip[] = ["All", ...CUISINES].map((value) => ({
  value,
  label: value,
}));
const dietaryChips: FilterChip[] = ["All", ...DIETARY_TAGS].map((value) => ({
  value,
  label: value,
}));
const timeChips: FilterChip[] = ["All", ...MAX_COOKING_TIME.map(String)].map(
  (value) => ({
    value,
    label: value === "All" ? "All" : `≤ ${value} mins`,
  }),
);

const sortOptions: SortOption[] = [
  { value: "rating", label: "Top rated" },
  { value: "title", label: "Title (A-Z)" },
  { value: "cookingTime", label: "Fastest first" },
];



const PAGE_SIZE = 100;
const INITIAL_VISIBLE = 24;
const RENDER_BATCH = 24;

export function RecipesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlQuery = searchParams.get("q") ?? "";
  const urlCategory = searchParams.get("category") ?? "All";
  const urlDifficulty = searchParams.get("difficulty") ?? "All";
  const urlCuisine = searchParams.get("cuisine") ?? "All";
  const urlDietaryTags = searchParams.get("dietaryTags");
  const urlMaxTime = searchParams.get("maxCookingTime");

  const [query, setQuery] = useState(urlQuery);
  const [category, setCategory] = useState<string>(urlCategory);
  const [difficulty, setDifficulty] = useState<string>(urlDifficulty);
  const [cuisine, setCuisine] = useState<string>(urlCuisine);
  const [dietaryTags, setDietaryTags] = useState<string[]>(
    urlDietaryTags ? urlDietaryTags.split(",") : ["All"],
  );
  const [maxCookingTime, setMaxCookingTime] = useState<number | "All">(
    urlMaxTime && Number.isFinite(Number(urlMaxTime))
      ? Number(urlMaxTime)
      : "All",
  );
  const [sortBy, setSortBy] = useState<"title" | "cookingTime" | "rating">(
    "title",
  );
  const [panelOpen, setPanelOpen] = useState(false);

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  
  
  const [visible, setVisible] = useState(INITIAL_VISIBLE);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    const seen = new Set<string>();
    const loaded: Recipe[] = [];

    async function loadAll() {
      let page = 1;
      let total: number | null = null;

      for (;;) {
        if (cancelled) return;
        let data;
        try {
          data = await api.getRecipes({
            limit: String(PAGE_SIZE),
            page: String(page),
          });
        } catch (err) {
          
          if (page === 1) throw err;
          return;
        }
        if (cancelled) return;

        const list = data.recipes ?? [];
        const fresh = list.filter((recipe) => !seen.has(recipe.id));
        for (const recipe of fresh) {
          seen.add(recipe.id);
          loaded.push(recipe);
        }
        setRecipes([...loaded]);
        setLoading(false);

        const pagination = data.pagination as { total?: number } | null | undefined;
        if (typeof pagination?.total === "number") total = pagination.total;

        const finished =
          list.length === 0 ||
          fresh.length === 0 ||
          page >= 200 ||
          (total != null && seen.size >= total) ||
          (total == null && list.length < PAGE_SIZE);
        if (finished) return;

        page++;
        setLoadingMore(true);
      }
    }

    loadAll()
      .catch(() => {
        if (!cancelled) {
          setLoadError(true);
          setLoading(false);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingMore(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  
  
  const filterKey = [
    query,
    category,
    difficulty,
    cuisine,
    dietaryTags.join(","),
    maxCookingTime,
    sortBy,
  ].join("|");
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (prevFilterKey !== filterKey) {
    setPrevFilterKey(filterKey);
    setVisible(INITIAL_VISIBLE);
  }

  const [prevSearchParams, setPrevSearchParams] = useState(searchParams);

  if (prevSearchParams !== searchParams) {
    setPrevSearchParams(searchParams);
    setQuery(searchParams.get("q") ?? "");
    setCategory(searchParams.get("category") ?? "All");
    setDifficulty(searchParams.get("difficulty") ?? "All");
    setCuisine(searchParams.get("cuisine") ?? "All");
    const tags = searchParams.get("dietaryTags");
    setDietaryTags(tags ? tags.split(",") : ["All"]);
    const max = searchParams.get("maxCookingTime");
    setMaxCookingTime(
      max && Number.isFinite(Number(max)) ? Number(max) : "All",
    );
  }

  const handleDietaryToggle = (value: string) => {
    if (value === "All") {
      setDietaryTags(["All"]);
      return;
    }

    setDietaryTags((prev) => {
      const withoutAll = prev.filter((tag) => tag !== "All");

      if (withoutAll.includes(value)) {
        const updated = withoutAll.filter((tag) => tag !== value);
        return updated.length === 0 ? ["All"] : updated;
      } else {
        return [...withoutAll, value];
      }
    });
  };

  const handleReset = () => {
    setQuery("");
    setCategory("All");
    setDifficulty("All");
    setCuisine("All");
    setDietaryTags(["All"]);
    setMaxCookingTime("All");
    router.replace("/recipes");
  };

  const sorted = useMemo(() => {
    const filtered = recipes.filter((recipe) => {
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
        maxCookingTime === "All" ||
        (recipe.cookingTime != null && recipe.cookingTime <= maxCookingTime);
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
      if (sortBy === "rating") {
        return (b.rating?.average ?? 0) - (a.rating?.average ?? 0);
      }
      if (sortBy === "title") return a.title.localeCompare(b.title);
      return (a.cookingTime ?? Infinity) - (b.cookingTime ?? Infinity);
    });
  }, [
    query,
    category,
    difficulty,
    cuisine,
    dietaryTags,
    maxCookingTime,
    sortBy,
    recipes,
  ]);

  const count = sorted.length;
  const shown = sorted.slice(0, Math.min(visible, sorted.length));

  
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisible((value) => value + RENDER_BATCH);
        }
      },
      { rootMargin: "800px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [sorted.length, loading, loadError]);

  return (
    <main className={styles.main}>
      <div className={styles.toolbar}>
        <button
          type="button"
          className={panelOpen ? styles.toggleActive : styles.toggle}
          aria-expanded={panelOpen}
          onClick={() => setPanelOpen((open) => !open)}
        >
          <svg
            className={styles.burger}
            width="16"
            height="12"
            viewBox="0 0 16 12"
            aria-hidden="true"
          >
            <rect
              x="0"
              y="0"
              width="16"
              height="2"
              rx="1"
              fill="currentColor"
            />
            <rect
              x="0"
              y="5"
              width="16"
              height="2"
              rx="1"
              fill="currentColor"
            />
            <rect
              x="0"
              y="10"
              width="16"
              height="2"
              rx="1"
              fill="currentColor"
            />
          </svg>
          Filters
        </button>

        <SearchBar
          className={styles.search}
          value={query}
          onChange={setQuery}
          hideLabel
        />

        <span className={styles.sortLabel}>Sort</span>
        <SortSelect
          options={sortOptions}
          value={sortBy}
          onChange={(value) =>
            setSortBy(value as "title" | "cookingTime" | "rating")
          }
        />

        <p className={styles.count}>
          {count} {count === 1 ? "recipe" : "recipes"}
        </p>
      </div>

      <div className={panelOpen ? styles.panelOpen : styles.panel}>
        <div className={styles.panelInner}>
          <div className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>Filters</h2>
            <button
              type="button"
              className={styles.reset}
              onClick={handleReset}
            >
              Reset all
            </button>
          </div>

          <div className={styles.groups}>
            <FilterGroup
              label="Category"
              chips={categoryChips}
              isActive={(value) => category === value}
              onSelect={setCategory}
            />
            <FilterGroup
              label="Difficulty"
              chips={difficultyChips}
              isActive={(value) => difficulty === value}
              onSelect={setDifficulty}
            />
            <FilterGroup
              label="Cuisine"
              chips={cuisineChips}
              isActive={(value) => cuisine === value}
              onSelect={setCuisine}
            />
            <FilterGroup
              label="Dietary tags"
              chips={dietaryChips}
              isActive={(value) => dietaryTags.includes(value)}
              onSelect={handleDietaryToggle}
            />
            <FilterGroup
              label="Max cooking time"
              chips={timeChips}
              isActive={(value) =>
                value === "All"
                  ? maxCookingTime === "All"
                  : maxCookingTime === Number(value)
              }
              onSelect={(value) =>
                setMaxCookingTime(value === "All" ? "All" : Number(value))
              }
            />
          </div>
        </div>
      </div>

      <div className="recipe-grid">
        {loading ? (
          <p>Loading recipes…</p>
        ) : loadError ? (
          <p>Couldn&apos;t load recipes from the server.</p>
        ) : sorted.length === 0 ? (
          <p>No matching recipes</p>
        ) : (
          shown.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))
        )}
      </div>

      <div ref={sentinelRef} className={styles.loadMore}>
        {!loading &&
          !loadError &&
          sorted.length > 0 &&
          (loadingMore ? (
            <span>Loading more recipes…</span>
          ) : shown.length < sorted.length ? (
            <span>Keep scrolling for more recipes…</span>
          ) : (
            <span>You&apos;ve seen all {count} recipes</span>
          ))}
      </div>
    </main>
  );
}