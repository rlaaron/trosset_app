/**
 * @file: src/app/layout.tsx
 * @purpose: Layout raíz de la aplicación con configuración global de metadata y fuentes
 * @goal: Proporcionar estructura HTML base y estilos globales para toda la aplicación
 * @context: Base de la aplicación Next.js 14 con App Router
 */

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PanaderíaApp - Sistema ERP B2B",
  description: "Sistema de gestión para panadería B2B - Mobiliario y Producción",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
