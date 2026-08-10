import { Fraunces, Nunito } from "next/font/google";

export const displayFont = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

export const bodyFont = Nunito({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

export const fontVariables = `${displayFont.variable} ${bodyFont.variable}`;
