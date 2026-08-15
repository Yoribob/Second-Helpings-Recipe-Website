import type { Metadata } from "next";
import { BookmarksContent } from "./BookmarksContent";

export const metadata: Metadata = {
  title: "My bookmarks",
};

export default function BookmarksPage() {
  return <BookmarksContent />;
}