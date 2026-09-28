import { JetBrains_Mono, Schibsted_Grotesk } from "next/font/google";

// Schibsted Grotesk carries titles, labels and reading text; JetBrains Mono the
// small technical labels (steps, phase numbers, syscalls in the breadcrumb).
export const grotesk = Schibsted_Grotesk({ variable: "--font-grotesk", subsets: ["latin"] });
export const mono = JetBrains_Mono({ variable: "--font-jb-mono", subsets: ["latin"] });

export const fonts = `${grotesk.variable} ${mono.variable}`;
