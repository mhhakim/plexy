"use client";

import Image from "next/image";
import Link from "next/link";
import { useSession } from "@/hooks/use-session";
import { ServerApi } from "@/api";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { FC, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePathname } from "next/navigation";

const HeadLink: FC<{
  children: ReactNode;
  href: string;
  active: boolean;
}> = ({ active, href, children }) => {
  return (
    <Link
      href={href}
      className={`font-bold head-link ${active ? " head-link-active" : ""}`}
    >
      {children}
    </Link>
  );
};

export const Appbar = () => {
  const path = usePathname();
  const { user } = useSession();

  const libraries = useQuery({
    queryKey: ["libraries"],
    queryFn: ServerApi.libraries,
  });

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("auth-token");
    localStorage.removeItem("uuid");
    localStorage.removeItem("pin");
    window.location.href = "/";
  };

  return (
    <div className="flex flex-row gap-8 px-8 py-4 items-center fixed top-0 h-16 w-full z-50 bg-[hsl(var(--background))]/70">
      <Image src="/plex.png" alt="Plex logo" height={25} width={54} />
      <HeadLink href="/" active={path === "/"}>
        Home
      </HeadLink>
      {libraries.data
        ? libraries.data.map((section) => (
            <HeadLink
              key={section.key}
              href={`/browse/${section.key}`}
              active={path.includes(`/browse/${section.key}`)}
            >
              {section.title}
            </HeadLink>
          ))
        : null}
      <div className="flex-1" />
      {user && (
        <Popover>
          <PopoverTrigger className="glow transition-all ease-in-out">
            <Avatar className="rounded-lg">
              <AvatarImage src={user.thumb} alt={user.username} />
              <AvatarFallback className="rounded-lg">
                {user.username.charAt(0).toUpperCase()}
                {user.username.charAt(1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </PopoverTrigger>
          <PopoverContent className="m-4 p-2">
            <Button
              className="w-full"
              variant="secondary"
              size="sm"
              type="button"
              onClick={handleLogout}
            >
              Logout
            </Button>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
};
