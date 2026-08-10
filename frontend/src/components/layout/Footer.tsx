import Link from "next/link";
import styles from "./Footer.module.css";

const exploreLinks = [
  { label: "Categories", href: "/recipes" },
  { label: "Ingredients", href: "/recipes" },
  { label: "Cuisines", href: "/recipes" },
];

const infoLinks = [
  { label: "About", href: "#" },
  { label: "Privacy Policy", href: "#" },
  { label: "Terms of Service", href: "#" },
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

          <ul className={styles.linkList}>
            {exploreLinks.map((link) => (
              <li key={link.label}>
                <Link href={link.href}>{link.label}</Link>
              </li>
            ))}
          </ul>

          <ul className={styles.linkList}>
            {infoLinks.map((link) => (
              <li key={link.label}>
                <a href={link.href}>{link.label}</a>
              </li>
            ))}
          </ul>
        </nav>

        <div className={styles.footerBottom}>
          <span>&copy; {year} Second Helpings. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}
