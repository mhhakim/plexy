"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ServerApi } from "@/api";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useCallback, useEffect, useRef, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { Canceler } from "axios";
import { MetadataPreviewItem } from "@/components/cards/metadata-preview-item";

type SelectedType = "recommended" | "collections" | "library";

export default function Page() {
  const params = useParams<{ key: string }>();
  const router = useRouter();
  const library = useQuery({
    queryKey: ["details", params.key],
    queryFn: async () => {
      return await ServerApi.details({ key: params.key, include: true });
    },
  });

  const [results, setResults] = useState<Plex.Metadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [page, setPage] = useState(0);

  const observer = useRef<IntersectionObserver>();
  const lastRef = useCallback(
    (node: HTMLDivElement) => {
      if (loading || !hasMore) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          setPage((p) => p + 1);
        }
      });
      if (node) observer.current.observe(node);
    },
    [loading, hasMore],
  );

  useEffect(() => {
    // Reset state when `params.key` changes
    setResults([]);
    setHasMore(true);
    setPage(0);
  }, [params.key]);

  useEffect(() => {
    if (!hasMore) {
      return;
    }
    setLoading(true);

    let cancel: Canceler;
    ServerApi.all({
      id: params.key,
      start: results.length,
      size: 100,
      canceler: (c) => {
        cancel = c;
      },
    }).then((res) => {
      if (res) {
        if (res.results.length + results.length >= res.total) {
          setHasMore(false);
        }
        setResults((prev) => [...prev, ...res.results]);
      }
      setLoading(false);
    });

    return () => {
      if (cancel) {
        cancel();
        setLoading(false);
      }
    };
  }, [page, params.key]);

  if (!library.data) {
    return null;
  }

  const type = library.data.Type[0].type;

  if (type === "show" || type === "movie") {
    const token = localStorage.getItem("token");
    return (
      <>
        <div className="w-full absolute top-16">
          <div className="max-w-screen-2xl p-20 mx-auto flex flex-col gap-10">
            <p className="font-bold text-5xl">Library</p>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {results.map((item, i) => (
                <MetadataPreviewItem
                  key={i}
                  ref={i === results.length - 1 ? lastRef : undefined}
                  item={item}
                />
              ))}
            </div>
            {loading && (
              <LoaderCircle className="w-20 h-20 animate-spin text-plex mx-auto" />
            )}
          </div>
        </div>
        <div className="absolute right-0 top-16 p-4">
          <ToggleGroup
            type="single"
            value="library"
            onValueChange={(value: SelectedType) => {
              if (value === "recommended") {
                router.push(`/browse/${params.key}`);
              } else if (value === "collections") {
                router.push(`/browse/${params.key}/collections`);
              }
            }}
          >
            <ToggleGroupItem
              value="recommended"
              aria-label="Recommended"
              variant="outline"
              size="sm"
            >
              Recommended
            </ToggleGroupItem>
            {/*<ToggleGroupItem*/}
            {/*  value="collections"*/}
            {/*  aria-label="Collections"*/}
            {/*  variant="outline"*/}
            {/*>*/}
            {/*  Collections*/}
            {/*</ToggleGroupItem>*/}
            <ToggleGroupItem
              value="library"
              aria-label="Library"
              variant="outline"
              size="sm"
            >
              Library
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </>
    );
  }

  return null;
}
