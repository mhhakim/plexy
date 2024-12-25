"use client";

import { ReactNode, Suspense, useEffect } from "react";
import ThemeProvider from "@/components/theme-provier";
import { AuthProvider } from "@/components/auth-provider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "@/hooks/use-session";
import { uuid, uuidv4 } from "@/lib/utils";
import { MetaScreen } from "@/components/meta-screen/meta-screen";
import { useSearchParams } from "next/navigation";
import { WatchScreen } from "@/components/watch-screen/watch-screen";

const client = new QueryClient();

export default function Providers({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const watch = searchParams.get("watch");

  useEffect(() => {
    if (!localStorage.getItem("clientId")) {
      localStorage.setItem("clientId", uuidv4());
    }

    if (!sessionStorage.getItem("sessionId")) {
      sessionStorage.setItem("sessionId", uuid());
    }
  }, []);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <QueryClientProvider client={client}>
        <AuthProvider>
          <SessionProvider>
            <Suspense>
              <MetaScreen />
              <WatchScreen watch={watch ?? undefined} />
            </Suspense>
            {children}
          </SessionProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
