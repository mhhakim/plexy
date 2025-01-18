import { FC, useMemo } from "react";
import { getCoverImage } from "@/hooks/use-hub-item";
import { ElementImagePreviewItem } from "@/components/cards/element-image-preview-item";
import * as React from "react";
import { cn } from "@/lib/utils";

export const OnDeckImagePreviewItem: FC<
  Omit<React.ComponentPropsWithoutRef<typeof ElementImagePreviewItem>, "image">
> = ({ item, className, ...rest }) => {
  const image = useMemo(() => {
    if (item.type === "movie") return getCoverImage(item.art);
    if (item.type === "episode") return getCoverImage(item.thumb ?? item.art);
    return getCoverImage(item.grandparentArt ?? item.art);
  }, [item]);

  return (
    <ElementImagePreviewItem
      item={item}
      image={image}
      className={cn("aspect-video", className)}
      {...rest}
    />
  );
};
