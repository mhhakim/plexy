"use client";

import Link from "next/link";
import { useSession } from "@/hooks/use-session";
import { Button } from "@/components/ui/button";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronsLeftRightEllipsis,
  Film,
  House,
  LogOut,
  Menu,
  Server,
  SettingsIcon,
  TvMinimal,
  X,
} from "lucide-react";
import { Search } from "@/components/search";
import { useIsAtTop } from "@/hooks/use-is-at-top";
import { cn } from "@/lib/utils";
import { useServer } from "@/components/server-provider";
import { ChangeServerDialog } from "@/components/change-server-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import qs from "qs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import he from "he";

export const APPBAR_HEIGHT = "4.5rem";

export const Appbar = () => {
  const path = usePathname();
  const router = useRouter();
  const { user } = useSession();
  const { libraries, disabledLibraries } = useServer();

  const isAtTop = useIsAtTop();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("auth-token");
    localStorage.removeItem("uuid");
    localStorage.removeItem("pin");
    localStorage.removeItem("user-uuid");
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
        <div className="md:flex flex-row gap-4 items-center hidden">
          <NavigationMenu delayDuration={1000}>
            <NavigationMenuList>
              <NavigationMenuItem>
                <Link href="/" legacyBehavior passHref>
                  <NavigationMenuLink
                    className={cn(
                      navigationMenuTriggerStyle(),
                      "data-[state=active]:text-primary",
                    )}
                    data-state={path === "/" ? "active" : "inactive"}
                  >
                    Home
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              {libraries.map((section) =>
                !disabledLibraries[section.title] ? (
                  <NavigationMenuItem key={section.key}>
                    <NavigationMenuTrigger>
                      <Link
                        href={`/browse/${section.key}`}
                        data-state={
                          path.includes(`/browse/${section.key}`)
                            ? "active"
                            : "inactive"
                        }
                        className="data-[state=active]:text-primary"
                      >
                        {section.title}
                      </Link>
                    </NavigationMenuTrigger>
                    <NavigationMenuContent className="px-12 py-6 flex flex-col gap-2">
                      <Button
                        onClick={() => {
                          router.push(
                            `${path}?${qs.stringify({ key: `/library/sections/${section.key}/all?sort=titleSort`, libtitle: `${section.title} Library` })}`,
                            {
                              scroll: false,
                            },
                          );
                        }}
                        variant="link"
                        className="justify-start"
                      >
                        Library
                      </Button>
                      <Button disabled variant="link" className="justify-start">
                        Collections
                      </Button>
                      <Button disabled variant="link" className="justify-start">
                        Categories
                      </Button>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                ) : null,
              )}
            </NavigationMenuList>
          </NavigationMenu>
        </div>
        <Sheet>
          <SheetTrigger className="block md:hidden">
            <Menu />
          </SheetTrigger>
          <SheetContent side="left" className="max-w-[300px]">
            <SheetHeader className="pb-4 flex flex-row justify-between items-center space-y-0">
              <SheetTitle>Plexy</SheetTitle>
              <SheetClose asChild>
                <Button variant="search" size="icon">
                  <X />
                </Button>
              </SheetClose>
            </SheetHeader>
            <div className="flex flex-col gap-4">
              <Button
                variant="search"
                asChild
                className="justify-start data-[state=active]:border-primary data-[state=active]:text-primary"
              >
                <Link
                  href="/"
                  data-state={path === "/" ? "active" : "inactive"}
                >
                  <House />
                  Home
                </Link>
              </Button>
              {libraries.map((section) =>
                !disabledLibraries[section.title] ? (
                  <Button
                    key={section.key}
                    variant="search"
                    asChild
                    className="justify-start data-[state=active]:border-primary data-[state=active]:text-primary"
                  >
                    <Link
                      href={`/browse/${section.key}`}
                      data-state={
                        path.includes(`/browse/${section.key}`)
                          ? "active"
                          : "inactive"
                      }
                    >
                      {section.type === "movie" && <Film size={20} />}
                      {section.type === "show" && <TvMinimal size={20} />}
                      {section.title}
                    </Link>
                  </Button>
                ) : null,
              )}
            </div>
          </SheetContent>
        </Sheet>
        <div className="flex-1" />
        {user && (
          <Popover>
            <PopoverTrigger>
              <Avatar>
                <AvatarImage src={user.thumb} />
                <AvatarFallback>
                  {user.username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </PopoverTrigger>
            <PopoverContent side="bottom" className="m-4">
              <div className="flex flex-col gap-4">
                <div className="hover:text-primary hover:border-primary/80 flex gap-2 items-center bg-muted/40 p-2 rounded-lg border overflow-hidden">
                  <div>
                    <Avatar>
                      <AvatarImage src={user.thumb} />
                      <AvatarFallback>
                        {user.title.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div>
                    <p className="font-semibold line-clamp-1">
                      {he.decode(user.title)}
                    </p>
                    {user.email && (
                      <p className="font-medium truncate leading-tight text-xs text-muted-foreground">
                        {user.email}
                      </p>
                    )}
                  </div>
                </div>
                <Search />
                <Button
                  className="justify-start px-2 font-bold"
                  size="sm"
                  type="button"
                  asChild
                >
                  <Link href="/settings">
                    <SettingsIcon /> <span>Settings</span>
                  </Link>
                </Button>
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
                      onClick={() => {
                        localStorage.removeItem("user-uuid");
                        window.location.reload();
                      }}
                    >
                      <ChevronsLeftRightEllipsis /> <span>Change User</span>
                    </Button>
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
            </PopoverContent>
          </Popover>
        )}
      </div>
    </>
  );
};
