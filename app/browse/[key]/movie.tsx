"use client";

import { FC, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ServerApi } from "@/api";
import _ from "lodash";
import { PLEX } from "@/constants";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";
import { VideoCarousel } from "@/components/video-carousel";

export const Movie: FC<{ library: Plex.LibraryDetails }> = ({ library }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [featured, setFeatured] = useState<Plex.Metadata | null>(null);
  const [genres, setGenres] = useState<Plex.Directory[]>([]);

  useEffect(() => {
    setFeatured(null);
    setGenres([]);

    ServerApi.library({
      key: library.librarySectionID.toString(),
      directory: "unwatched",
    }).then((res) => {
      if (!res?.data.MediaContainer.Metadata) return;
      if (res.data.MediaContainer.Metadata.length === 0) return;
      const metadata = res.data.MediaContainer.Metadata;
      setFeatured(metadata[Math.floor(Math.random() * metadata.length)]);
    });

    ServerApi.library({
      key: library.librarySectionID.toString(),
      directory: "genre",
    }).then((res) => {
      if (!res?.data.MediaContainer.Directory) return;
      if (res.data.MediaContainer.Directory.length === 0) return;
      const genres = res.data.MediaContainer.Directory;
      const selection: Plex.Directory[] = [];
      while (selection.length < Math.min(5, genres.length)) {
        const genre = genres[Math.floor(Math.random() * genres.length)];
        if (selection.includes(genre)) continue;
        selection.push(genre);
      }
      setGenres([..._.shuffle(selection)]);
    });
  }, [library]);

  if (!featured) return;

  return (
    <div className="w-full flex flex-col items-start justify-start">
      <div className="w-full flex flex-col items-start justify-start h-auto">
        <div
          className="w-full flex flex-col items-start justify-center z-0 pt-[40vh] pb-60"
          style={{
            background: `linear-gradient(0, hsl(var(--background)), rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.4)), url(${PLEX.server}${featured.art}?X-Plex-Token=${localStorage.getItem("token")}) center center / cover no-repeat`,
          }}
        >
          <div className="ml-20 mr-20 flex flex-col gap-4">
            <div className="flex flex-row items-center justify-start gap-2">
              <Image
                src="/plexicon.png"
                alt="plex icon"
                width={35}
                height={35}
              />
              <p className="text-plex text-2xl font-bold drop-shadow-md uppercase tracking-wider">
                {featured.type}
              </p>
            </div>
            <p className="font-bold text-5xl">{featured.title}</p>
            <p className="font-bold text-muted-foreground max-w-4xl line-clamp-3">
              {featured.summary}
            </p>
            <Button
              type="button"
              className="w-fit font-bold"
              onClick={() => {
                router.push(`${pathname}?mid=${featured.ratingKey.toString()}`);
              }}
            >
              <Info /> More Info
            </Button>
          </div>
        </div>
      </div>
      <div
        className={`flex flex-col items-start justify-start w-full z-10 ${featured ? "-mt-20" : ""}`}
      >
        <VideoCarousel
          key="continue-watching"
          dir="onDeck"
          title="Continue Watching"
          link={`/library/${library.librarySectionID}/dir/onDeck`}
          library={library.librarySectionID.toString()}
        />
        <VideoCarousel
          key="new-releases"
          dir="newest"
          title="New Releases"
          link={`/library/${library.librarySectionID}/dir/newest`}
          library={library.librarySectionID.toString()}
        />
        <VideoCarousel
          key="recently-added"
          dir="recentlyAdded"
          title="Recently Added"
          link={`/library/${library.librarySectionID}/dir/recentlyAdded`}
          library={library.librarySectionID.toString()}
        />
        {genres.map((genre, i) => (
          <VideoCarousel
            key={`${genre.key}-${i}`}
            dir={`all?genre=${genre.key}`}
            title={genre.title}
            link={`/library/${library.librarySectionID}/dir/genre/${genre.key}`}
            library={library.librarySectionID.toString()}
          />
        ))}
      </div>
    </div>
  );
};
