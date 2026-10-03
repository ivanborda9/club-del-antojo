import { ImageResponse } from "next/og";

export const dynamic = "force-static";

// Ícono grande para el manifest (pantalla de inicio / splash en Android).
// No usa la convención especial "icon" de Next porque esa solo genera un
// tamaño por archivo; este queda en una URL propia y estable para
// referenciarlo desde rider-manifest.webmanifest.
export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#ea580c",
          color: "#fff",
          fontSize: 230,
          fontWeight: 700,
          fontFamily: "sans-serif",
        }}
      >
        CdA
      </div>
    ),
    { width: 512, height: 512 }
  );
}
