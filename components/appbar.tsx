"use client";

import Image from "next/image";
import Link from "next/link";
import { useSession } from "@/hooks/use-session";
import { Button } from "@/components/ui/button";
import { FC, ReactNode } from "react";
import { usePathname } from "next/navigation";
import { LogOut, Server } from "lucide-react";
import { Search } from "@/components/search";
import { useIsAtTop } from "@/hooks/use-is-at-top";
import { cn } from "@/lib/utils";
import { useServer } from "@/components/server-provider";
import { ChangeServerDialog } from "@/components/change-server-dialog";

const HeadLink: FC<{
  children: ReactNode;
  href: string;
  active: boolean;
}> = ({ active, href, children }) => {
  return (
    <Link
      href={href}
      className={`font-bold ${active ? "text-primary" : "hover:text-primary transition text-muted-foreground"}`}
    >
      {children}
    </Link>
  );
};

export const APPBAR_HEIGHT = "4rem";

export const Appbar = () => {
  const path = usePathname();
  const { user } = useSession();
  const { libraries } = useServer();
  const isAtTop = useIsAtTop();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("auth-token");
    localStorage.removeItem("uuid");
    localStorage.removeItem("pin");
    window.location.href = "/";
  };

  return (
    <>
      <div
        className={cn(
          `flex flex-row gap-8 px-8 py-4 items-center fixed top-0 h-[${APPBAR_HEIGHT}] w-full z-[45] transition duration-500`,
          isAtTop
            ? ""
            : "backdrop-blur bg-background/95 supports-[backdrop-filter]:bg-background/60",
        )}
      >
        <Image src="/plex.png" alt="Plex logo" height={25} width={54} />
        <div className="flex flex-row gap-4 items-center">
          <HeadLink href="/" active={path === "/"}>
            Home
          </HeadLink>
          {libraries.map((section) => (
            <HeadLink
              key={section.key}
              href={`/browse/${section.key}`}
              active={path.includes(`/browse/${section.key}`)}
            >
              {section.title}
            </HeadLink>
          ))}
        </div>
        <div className="flex-1" />
        <div className="flex flex-row gap-4 items-center">
          <Search />
          {user && (
            <>
              <ChangeServerDialog
                trigger={
                  <Button
                    className="justify-start px-2 font-bold"
                    size="sm"
                    type="button"
                  >
                    <Server /> <span>Change Server</span>
                  </Button>
                }
              />
              <Button
                className="justify-start px-2 font-bold"
                size="sm"
                type="button"
                onClick={handleLogout}
              >
                <LogOut /> <span>Logout</span>
              </Button>
            </>
          )}
        </div>
      </div>
    </>
  );
};
