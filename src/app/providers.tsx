"use client";

import { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";

// Este componente es un Client Component
export function Providers({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
