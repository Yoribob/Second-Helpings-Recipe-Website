import Link from "next/link";
import styles from "./Footer.module.css";




const CATEGORY_LINKS = ["Breakfast", "Lunch", "Dinner", "Dessert", "Soup"].map(
  (value) => ({ label: value, href: `/recipes?category=${encodeURIComponent(value)}` }),
);

const CUISINE_LINKS = ["Italian", "Mexican", "Japanese", "Thai", "Indian"].map(
  (value) => ({ label: value, href: `/recipes?cuisine=${encodeURIComponent(value)}` }),
);

const DIETARY_LINKS = [
  "Vegetarian",
  "Vegan",
  "Gluten-Free",
  "Dairy-Free",
  "Keto",
].map((value) => ({
  label: value,
  href: `/recipes?dietaryTags=${encodeURIComponent(value)}`,
}));

const exploreColumns = [
  {
    label: "Categories",
    links: [{ label: "All recipes", href: "/recipes" }, ...CATEGORY_LINKS],
  },
  { label: "Cuisines", links: CUISINE_LINKS },
  { label: "Dietary", links: DIETARY_LINKS },
];

const infoLinks = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        <nav className={styles.footerTop} aria-label="Footer">
          <div className={styles.brandBlock}>
            <Link href="/" className={styles.brand}>
              <span className={styles.logoMark} aria-hidden="true">
                SH
              </span>
              <span className={styles.brandName}>Second Helpings</span>
            </Link>
          </div>

          {exploreColumns.map((column) => (
            <div key={column.label} className={styles.column}>
              <h2 className={styles.columnTitle}>{column.label}</h2>
              <ul className={styles.linkList}>
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <ul className={styles.linkList}>
            {infoLinks.map((link) => (
              <li key={link.label}>
                <Link href={link.href}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className={styles.footerBottom}>
          <span className={styles.credits}>
            Recipes and photos provided by{" "}
            <a
              href="https://www.themealdb.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              TheMealDB
            </a>
          </span>
          <span>&copy; {year} Second Helpings. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}