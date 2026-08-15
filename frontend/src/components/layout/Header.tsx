import Link from "next/link";
import {
  CATEGORIES,
  DIFFICULTIES,
  CUISINES,
  DIETARY_TAGS,
  MAX_COOKING_TIME,
} from "@/lib/recipe-metadata";
import { serverGetJson } from "@/lib/server-api";
import type { Recipe } from "@/lib/types";
import { AuthNav } from "@/components/layout/AuthNav";
import styles from "./Header.module.css";

type NavGroup = {
  label: string;
  items: { label: string; href: string }[];
};

export async function Header() {
  let popularItems: { label: string; href: string }[] = [];
  try {
    const data = await serverGetJson<{ recipes: Recipe[] }>(
      "/api/recipes?limit=5",
    );
    popularItems = (data?.recipes ?? []).map((recipe) => ({
      label: recipe.title,
      href: `/recipes/${recipe.id}`,
    }));
  } catch {}

  const navGroups: NavGroup[] = [
    {
      label: "Categories",
      items: [
        { label: "All recipes", href: "/recipes" },
        ...CATEGORIES.map((value) => ({
          label: value,
          href: `/recipes?category=${encodeURIComponent(value)}`,
        })),
      ],
    },
    {
      label: "Popular",
      items: popularItems,
    },
    {
      label: "Difficulties",
      items: DIFFICULTIES.map((value) => ({
        label: value,
        href: `/recipes?difficulty=${encodeURIComponent(value)}`,
      })),
    },
    {
      label: "Cuisines",
      items: CUISINES.map((value) => ({
        label: value,
        href: `/recipes?cuisine=${encodeURIComponent(value)}`,
      })),
    },
    {
      label: "Dietary",
      items: DIETARY_TAGS.map((value) => ({
        label: value,
        href: `/recipes?dietaryTags=${encodeURIComponent(value)}`,
      })),
    },
    {
      label: "Cooking time",
      items: MAX_COOKING_TIME.map((value) => ({
        label: `≤ ${value} mins`,
        href: `/recipes?maxCookingTime=${value}`,
      })),
    },
  ].filter((group) => group.items.length > 0);

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.brand}>
          <span className={styles.logoMark} aria-hidden="true">
            SH
          </span>
          <span className={styles.brandName}>Second Helpings</span>
        </Link>

        <nav aria-label="Main" className={styles.navRow}>
          <ul className={styles.nav}>
            {navGroups.map((group) => (
              <li key={group.label} className={styles.navItem}>
                <Link href="/recipes" className={styles.navButton}>
                  {group.label}
                </Link>

                <ul className={styles.dropdown}>
                  {group.items.map((item) => (
                    <li key={item.label}>
                      <Link href={item.href} className={styles.dropdownItem}>
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </nav>

        <AuthNav />
      </div>
    </header>
  );
}