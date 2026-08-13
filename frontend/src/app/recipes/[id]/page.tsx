import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatMinutes } from "@/lib/format";
import { sampleRecipes } from "@/lib/sample-data";
import { RecipeScaler } from "@/components/recipes/RecipeScaler";
import { RatingSection } from "@/components/recipes/RatingSection";
import styles from "./page.module.css";

type RecipePageParams = { id: string };

export function generateStaticParams(): RecipePageParams[] {
  return sampleRecipes.map((recipe) => ({ id: recipe.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<RecipePageParams>;
}): Promise<Metadata> {
  const { id } = await params;
  const recipe = sampleRecipes.find((recipe) => recipe.id === id);
  return { title: recipe ? recipe.title : "Recipe not found" };
}

export default async function RecipePage({
  params,
}: {
  params: Promise<RecipePageParams>;
}) {
  const { id } = await params;
  const recipe = sampleRecipes.find((recipe) => recipe.id === id);

  if (!recipe) notFound();

  return (
    <main className={styles.main}>
      <Link href="/recipes" className={styles.back}>
        All recipes
      </Link>

      <h1 className={styles.title}>{recipe.title}</h1>

      {recipe.description && (
        <p className={styles.description}>{recipe.description}</p>
      )}

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
            {formatMinutes(recipe.cookingTime)}
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

      <RatingSection />
    </main>
  );
}