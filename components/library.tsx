import { FC, useEffect, useRef, useState } from "react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { usePathname, useRouter } from "next/navigation";
import axios from "axios";
import { VideoView } from "@/components/meta-screen/video-view";
import qs from "qs";
import { xprops } from "@/api/index";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export const Library: FC<{
  keypath: string | undefined;
  title: string | undefined;
  contentDirectoryID: string | undefined;
}> = ({ keypath: key, title, contentDirectoryID }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [metadata, setMetadata] = useState<Plex.Metadata[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!key) {
      setMetadata([]);
      return;
    }

    setLoading(true);
    axios
      .get<{ MediaContainer: { Metadata: Plex.Metadata[] } }>(
        `${localStorage.getItem("server")}${decodeURIComponent(key)}${decodeURIComponent(key).includes("?") ? "&" : "?"}${qs.stringify(
          {
            ...xprops(),
            ...(contentDirectoryID ? { contentDirectoryID } : {}),
            includeCollections: 1,
            includeExternalMedia: 1,
            includeAdvanced: 1,
            includeMeta: 1,
          },
        )}`,
        {
          headers: {
            "X-Plex-Token": localStorage.getItem("token") as string,
            accept: "application/json",
          },
        },
      )
      .then((res) => {
        if (!res.data?.MediaContainer?.Metadata) {
          setMetadata([]);
          return;
        }
        setMetadata(res.data.MediaContainer.Metadata.slice(0, 50));
      })
      .catch((err) => {
        console.error(err);
        setMetadata([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [key]);

  const token = localStorage.getItem("token");

  return (
    <Dialog
      open={!!key}
      onOpenChange={(open) => {
        if (!open) router.replace(pathname, { scroll: false });
      }}
    >
      <DialogContent className="w-full p-0 max-w-[min(1500px,calc(100%-2rem))] h-full max-h-[calc(100%-2rem)] overflow-hidden">
        <VisuallyHidden>
          <DialogTitle>Item metadata dialog</DialogTitle>
        </VisuallyHidden>
        <ScrollArea>
          <div className="max-w-full rounded-lg h-full overflow-auto relative">
            <div className="absolute top-0 right-0 m-4 flex flex-col gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => router.replace(pathname, { scroll: false })}
                type="button"
              >
                <X />
              </Button>
            </div>
            <div className="px-10 py-8 flex flex-col gap-6">
              {title && <p className="font-bold text-3xl">{title}</p>}
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {loading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="aspect-video" />
                    ))
                  : metadata.map((item, i) => (
                      <VideoView
                        key={i}
                        item={{
                          ...item,
                          contentRating: item.contentRating ?? "",
                          image: `${localStorage.getItem("server")}/photo/:/transcode?${qs.stringify(
                            {
                              width: 300 * 2,
                              height: 170 * 2,
                              url: `${item.art}?X-Plex-Token=${token}`,
                              minSize: 1,
                              upscale: 1,
                              "X-Plex-Token": token,
                            },
                          )}`,
                        }}
                      />
                    ))}
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
