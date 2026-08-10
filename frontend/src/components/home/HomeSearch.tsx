"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "./HomeSearch.module.css";

export function HomeSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const q = query.trim();
    router.push(q ? `/recipes?q=${encodeURIComponent(q)}` : "/recipes");
  };

  return (
    <form className={styles.form} role="search" onSubmit={handleSubmit}>
      <label className={styles.srOnly} htmlFor="home-search">
        Search recipes
      </label>
      <input
        id="home-search"
        className={styles.input}
        type="search"
        placeholder="I'm looking for..."
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <button className={styles.button} type="submit">
        Search
      </button>
    </form>
  );
}
