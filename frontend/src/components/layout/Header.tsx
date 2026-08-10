import Link from "next/link";
import {
  CATEGORIES,
  DIFFICULTIES,
  CUISINES,
  DIETARY_TAGS,
  MAX_COOKING_TIME,
} from "@/lib/recipe-metadata";
import { sampleRecipes } from "@/lib/sample-data";
import styles from "./Header.module.css";

type NavGroup = {
  label: string;
  items: { label: string; href: string }[];
};

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
    items: sampleRecipes.slice(0, 5).map((recipe) => ({
      label: recipe.title,
      href: `/recipes/${recipe.id}`,
    })),
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
];

export function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.brand}>
          <span className={styles.logoMark} aria-hidden="true">
            SH
          </span>
          <span className={styles.brandName}>Second Helpings</span>
        </Link>

        <nav aria-label="Main">
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
      </div>

      <button
        type="button"
        className={styles.profile}
        title="Profile — coming soon"
      >
        Profile
      </button>
    </header>
  );
}
