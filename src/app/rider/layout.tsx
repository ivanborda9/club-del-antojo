import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Repartidores · Club del Antojo",
  manifest: "/rider-manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Repartidores",
  },
};

export default function RiderLayout({ children }: { children: React.ReactNode }) {
  return children;
}
