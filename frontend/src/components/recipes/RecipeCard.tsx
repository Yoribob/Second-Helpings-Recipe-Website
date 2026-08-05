import styles from "@/components/recipes/RecipeCard.module.css";
import type { Recipe } from "@/lib/types";
import { formatMinutes } from "@/lib/format";
type RecipeCardProps = {
  recipe: Recipe;
};

export function RecipeCard({ recipe }: RecipeCardProps) {
  return (
    <article className={styles.card}>
      <img className={styles.image} src={recipe.imageUrl} alt={recipe.title} />
      <h3 className={styles.title}>{recipe.title}</h3>
      {recipe.description && <span>{recipe.description}</span>}
      <span>{formatMinutes(recipe.cookingTime)}</span>
      <span>{recipe.servings} servings</span>
      <ul>
        {recipe.dietaryTags.slice(0, 3).map((tag) => (
          <li key={tag}>{tag}</li>
        ))}
      </ul>
    </article>
  );
}
