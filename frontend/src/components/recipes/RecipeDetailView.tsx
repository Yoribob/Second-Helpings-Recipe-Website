import Image from "next/image";
import Link from "next/link";
import { formatMinutes } from "@/lib/format";
import type { Recipe } from "@/lib/types";
import { RecipeScaler } from "@/components/recipes/RecipeScaler";
import { RatingSection } from "@/components/recipes/RatingSection";
import { BookmarkButton } from "@/components/recipes/BookmarkButton";
import styles from "./RecipeDetailView.module.css";

type RecipeDetailViewProps = {
  recipe: Recipe;
  backHref?: string;
  bookmarkable?: boolean;
  actions?: React.ReactNode;
  readOnly?: boolean;
};

export function RecipeDetailView({
  recipe,
  backHref,
  bookmarkable = true,
  actions,
  readOnly = false,
}: RecipeDetailViewProps) {
  return (
    <div className={styles.main}>
      {backHref && (
        <Link href={backHref} className={styles.back}>
          All recipes
        </Link>
      )}

      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.title}>{recipe.title}</h1>
          {recipe.description && (
            <p className={styles.description}>{recipe.description}</p>
          )}
        </div>
        {(bookmarkable || actions) && (
          <div className={styles.headerActions}>
            {actions}
            {bookmarkable && <BookmarkButton recipeId={recipe.id} />}
          </div>
        )}
      </div>

      {recipe.imageUrl && (
        <div className={styles.hero}>
          <Image
            src={recipe.imageUrl}
            alt={recipe.title}
            fill
            priority
            sizes="(min-width: 940px) 940px, 100vw"
            style={{ objectFit: "cover" }}
          />
        </div>
      )}

      <dl className={styles.meta}>
        <div className={styles.metaItem}>
          <dt className={styles.metaLabel}>Cooking time</dt>
          <dd className={styles.metaValue}>
            {recipe.cookingTime ? formatMinutes(recipe.cookingTime) : "Not specified"}
          </dd>
        </div>
        {recipe.difficulty && (
          <div className={styles.metaItem}>
            <dt className={styles.metaLabel}>Difficulty</dt>
            <dd className={styles.metaValue}>{recipe.difficulty}</dd>
          </div>
        )}
        {recipe.category && (
          <div className={styles.metaItem}>
            <dt className={styles.metaLabel}>Category</dt>
            <dd className={styles.metaValue}>{recipe.category}</dd>
          </div>
        )}
        {recipe.cuisine && (
          <div className={styles.metaItem}>
            <dt className={styles.metaLabel}>Cuisine</dt>
            <dd className={styles.metaValue}>{recipe.cuisine}</dd>
          </div>
        )}
      </dl>

      {recipe.dietaryTags.length > 0 && (
        <div>
          <p className={styles.tagsLabel}>Dietary tags</p>
          <div className={styles.tags}>
            {recipe.dietaryTags.map((tag) => (
              <span key={tag} className={styles.tag}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      <RecipeScaler recipe={recipe} />

      {recipe.rating != null && (
        <RatingSection
          recipeId={recipe.id}
          myRating={recipe.myRating ?? null}
          comments={recipe.comments ?? []}
          average={recipe.rating?.average ?? null}
          count={recipe.rating?.count ?? null}
          readOnly={readOnly}
        />
      )}
    </div>
  );
}