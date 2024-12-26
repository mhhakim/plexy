"use client";

import { FC } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

export const Hero: FC<{ item: Plex.Metadata }> = ({ item }) => {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="w-full flex flex-col items-start justify-start h-auto">
      <div
        className="w-full flex flex-col items-start justify-center z-0 pt-[40vh] pb-60"
        style={{
          background: `linear-gradient(0, hsl(var(--background)), rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.1)), url(${localStorage.getItem("server")}${item.art}?X-Plex-Token=${localStorage.getItem("token")}) center center / cover no-repeat`,
        }}
      >
        <div className="ml-20 mr-20 flex flex-col gap-4">
          <div className="flex flex-row items-center justify-start gap-2">
            <img src="/plexicon.png" alt="plex icon" width={35} height={35} />
            <p className="text-plex text-2xl font-bold drop-shadow-md uppercase tracking-wider">
              {item.type}
            </p>
          </div>
          <p className="font-bold text-5xl">{item.title}</p>
          <p className="font-bold text-muted-foreground max-w-4xl line-clamp-3">
            {item.summary}
          </p>
          <Button
            type="button"
            className="w-fit font-bold"
            onClick={() => {
              router.push(`${pathname}?mid=${item.ratingKey.toString()}`, {
                scroll: false,
              });
            }}
          >
            <Info /> More Info
          </Button>
        </div>
      </div>
    </div>
  );
};
