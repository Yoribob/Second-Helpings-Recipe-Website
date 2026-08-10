"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { sampleRecipes } from "@/lib/sample-data";
import styles from "./HeroCarousel.module.css";

const slides = sampleRecipes
  .filter((recipe) => recipe.imageUrl)
  .slice(0, 4)
  .map((recipe) => ({
    src: recipe.imageUrl as string,
    title: recipe.title,
    description: recipe.description ?? "",
  }));

export function HeroCarousel() {
  const [index, setIndex] = useState(0);
  const total = slides.length;

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((current) => (current + 1) % total);
    }, 5000);
    return () => clearInterval(timer);
  }, [total, index]);

  const goTo = (target: number) => {
    setIndex((target + total) % total);
  };

  return (
    <div className={styles.carousel}>
      <div
        className={styles.slides}
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {slides.map((slide, i) => (
          <figure key={slide.title} className={styles.slide}>
            <Image
              src={slide.src}
              alt={slide.title}
              fill
              priority={i === 0}
              sizes="100vw"
              style={{ objectFit: "cover" }}
            />
            <figcaption className={styles.caption}>
              <span className={styles.captionTitle}>{slide.title}</span>
              <span className={styles.captionText}>{slide.description}</span>
            </figcaption>
          </figure>
        ))}
      </div>

      <button
        type="button"
        className={styles.arrow}
        aria-label="Previous slide"
        onClick={() => goTo(index - 1)}
      >
        &lsaquo;
      </button>
      <button
        type="button"
        className={styles.arrow}
        aria-label="Next slide"
        onClick={() => goTo(index + 1)}
      >
        &rsaquo;
      </button>

      <div className={styles.dots} aria-label="Slides">
        {slides.map((slide, i) => (
          <button
            key={slide.title}
            type="button"
            className={i === index ? styles.dotActive : styles.dot}
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => goTo(i)}
          />
        ))}
      </div>
    </div>
  );
}
