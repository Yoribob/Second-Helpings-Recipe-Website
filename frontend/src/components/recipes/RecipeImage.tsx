"use client";

import { useState } from "react";
import { isValidImageUrl, normalizeImageUrl } from "@/lib/normalize-image-url";
import styles from "./RecipeImage.module.css";

type RecipeImageProps = {
  src: string;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  sizes?: string;
};

export function RecipeImage({
  src,
  alt,
  fill = false,
  width,
  height,
  className,
  priority = false,
}: RecipeImageProps) {
  const [failed, setFailed] = useState(false);
  const normalized = normalizeImageUrl(src);

  if (!isValidImageUrl(normalized) || failed) {
    if (fill) {
      return (
        <div className={`${styles.failedFill} ${className ?? ""}`.trim()}>
          Image unavailable
        </div>
      );
    }

    return (
      <div className={`${styles.failed} ${className ?? ""}`.trim()}>
        Image unavailable
      </div>
    );
  }

  return (
    // Native img handles arbitrary user-provided URLs reliably (hotlinking, etc.).
    <img
      src={normalized}
      alt={alt}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      className={fill ? `${styles.fill} ${className ?? ""}`.trim() : className}
      referrerPolicy="no-referrer"
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}
