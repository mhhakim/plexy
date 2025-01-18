import { FC, useMemo } from "react";
import { getPosterImage } from "@/hooks/use-hub-item";
import { cn } from "@/lib/utils";
import * as React from "react";
import { ElementImagePreviewItem } from "@/components/cards/element-image-preview-item";

export const OtherImagePreviewItem: FC<
  Omit<React.ComponentPropsWithoutRef<typeof ElementImagePreviewItem>, "image">
> = ({ item, className, ...rest }) => {
  const image = useMemo(() => {
    if (item.type === "episode")
      return getPosterImage(
        item.parentThumb ?? item.grandparentThumb ?? item.thumb,
      );
    if (item.type === "season")
      return getPosterImage(item.thumb ?? item.parentThumb);
    return getPosterImage(item.thumb);
  }, [item]);

  return (
    <ElementImagePreviewItem
      item={item}
      image={image}
      className={cn("aspect-[9/14]", className)}
      {...rest}
    />
  );
};
