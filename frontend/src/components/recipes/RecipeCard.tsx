import Image from "next/image";
import Link from "next/link";
import styles from "@/components/recipes/RecipeCard.module.css";
import type { Recipe } from "@/lib/types";
import { formatMinutes } from "@/lib/format";

type RecipeCardProps = {
  recipe: Recipe;
};

export function RecipeCard({ recipe }: RecipeCardProps) {
  const recipeUrl = `/recipes/${recipe.id}`;

  return (
    <article className={styles.card}>
      {recipe.imageUrl && (
        <Link href={recipeUrl} className={styles.imageLink}>
          <Image
            className={styles.image}
            src={recipe.imageUrl}
            alt={recipe.title}
            fill
            sizes="(min-width: 640px) 33vw, 100vw"
            style={{ objectFit: "cover" }}
          />
        </Link>
      )}

      <div className={styles.body}>
        <h3 className={styles.title}>
          <Link href={recipeUrl} className={styles.titleLink}>
            {recipe.title}
          </Link>
        </h3>

        {recipe.description && (
          <p className={styles.description}>{recipe.description}</p>
        )}

        <p className={styles.meta}>
          {formatMinutes(recipe.cookingTime)} | {recipe.servings} servings
        </p>

        {(recipe.category || recipe.difficulty || recipe.cuisine) && (
          <div className={styles.chips}>
            {recipe.category && (
              <Link
                className={styles.chip}
                href={`/recipes?category=${encodeURIComponent(recipe.category)}`}
              >
                {recipe.category}
              </Link>
            )}
            {recipe.difficulty && (
              <Link
                className={styles.chip}
                href={`/recipes?difficulty=${encodeURIComponent(recipe.difficulty)}`}
              >
                {recipe.difficulty}
              </Link>
            )}
            {recipe.cuisine && (
              <Link
                className={styles.chip}
                href={`/recipes?cuisine=${encodeURIComponent(recipe.cuisine)}`}
              >
                {recipe.cuisine}
              </Link>
            )}
          </div>
        )}

        {recipe.dietaryTags.length > 0 && (
          <div>
            <p className={styles.tagsLabel}>Dietary tags</p>
            <ul className={styles.tags}>
              {recipe.dietaryTags.slice(0, 3).map((tag) => (
                <li key={tag}>
                  <Link
                    className={styles.chip}
                    href={`/recipes?dietaryTags=${encodeURIComponent(tag)}`}
                  >
                    {tag}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <Link href={recipeUrl} className={styles.moreLink}>
          Show recipe
        </Link>
      </div>
    </article>
  );
}
