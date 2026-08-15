import type { Metadata } from "next";
import { MyRecipesContent } from "./MyRecipesContent";

export const metadata: Metadata = {
  title: "My recipes",
};

export default function MyRecipesPage() {
  return <MyRecipesContent />;
}