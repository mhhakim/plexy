import { FC, useEffect, useState } from "react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { usePathname, useRouter } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useItemKeyMetadata } from "@/hooks/use-item-key-metadata";
import { MetadataPreviewItem } from "@/components/cards/metadata-preview-item";

export const LibraryScreen: FC<{
  keypath: string | undefined;
  title: string | undefined;
  contentDirectoryID: string | undefined;
  full: boolean;
}> = ({ keypath: key, title, contentDirectoryID, full }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { loading, metadata } = useItemKeyMetadata(key, contentDirectoryID, {
    full,
  });

  return (
    <Dialog
      open={!!key}
      onOpenChange={(open) => {
        if (!open) router.back();
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
                {loading &&
                  Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="aspect-video" />
                  ))}
                {metadata.map((item, i) => (
                  <MetadataPreviewItem key={i} item={item} />
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
