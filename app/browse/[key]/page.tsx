"use client";

import { ServerApi } from "@/api";
import { Movie } from "@/app/browse/[key]/movie";
import { Show } from "@/app/browse/[key]/show";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

export default function Page() {
  const params = useParams<{ key: string }>();
  const library = useQuery({
    queryKey: ["details", params.key],
    queryFn: async () => {
      return await ServerApi.details({ key: params.key, include: true });
    },
  });

  if (!library.data) {
    return null;
  }

  if (library.data.Type[0].type === "movie") {
    return <Movie library={library.data} />;
  }

  if (library.data.Type[0].type === "show") {
    return <Show library={library.data} />;
  }

  return null;
}
