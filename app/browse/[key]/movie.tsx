"use client";

import { FC, useEffect, useState } from "react";
import { ServerApi } from "@/api";
import _ from "lodash";
import { VideoCarousel } from "@/components/video-carousel";
import { Hero } from "@/components/hero";

export const Movie: FC<{ library: Plex.LibraryDetails }> = ({ library }) => {
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
      <Hero item={featured} />
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
