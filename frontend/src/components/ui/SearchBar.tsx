"use client";

import styles from "./SearchBar.module.css";

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  hideLabel?: boolean;
  className?: string;
};

export function SearchBar({
  value,
  onChange,
  hideLabel = false,
  className,
}: SearchBarProps) {
  const classes = className ? `${styles.field} ${className}` : styles.field;

  return (
    <label className={classes}>
      {!hideLabel && <span className={styles.label}>Search</span>}
      <input
        type="search"
        className={styles.input}
        placeholder="I'm looking for..."
        aria-label="Search recipes"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
