"use client";
import { FC, useEffect, useRef, useState } from "react";
import { Anime } from "@prisma/client";
import { useIntersection } from "@mantine/hooks";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import axios from "axios";

import { AnimeCard } from "@/components/Cards/AnimeCard";
import { INFINITE_SCROLLING_PAGINATION_BROWSE } from "@/config";
import AnimeCardSkeleton from "@/components/SkeletonLoaders/AnimeCardSkeleton";
import { Combobox } from "@/ui/ComboBox";
import { genres } from "@/data/anime";
import { getYearData } from "@/lib/utils";

interface BrowseAnimeProps {
  initialAnimes: Anime[];
}

const BrowseAnime: FC<BrowseAnimeProps> = ({ initialAnimes }) => {
  const yearData = getYearData();
  const lastPostRef = useRef<HTMLElement>(null);
  const [animes, setAnimes] = useState<Anime[]>(initialAnimes);

  const [genre, setGenre] = useState("");
  const [year, setYear] = useState("");
  const [noNewData, setNoNewData] = useState(false);

  const { ref, entry } = useIntersection({
    root: lastPostRef.current,
    threshold: 1,
  });

  const { data, fetchNextPage, isFetchingNextPage } = useInfiniteQuery(
    ["browse-anime-infinite-query"],
    async ({ pageParam = 1 }) => {
      const queryUrl = `/api/anime?limit=${INFINITE_SCROLLING_PAGINATION_BROWSE}&page=${pageParam}&orderBy=totalRatings`;

      const { data } = await axios(queryUrl);

      return data as Anime[];
    },
    {
      getNextPageParam: (_, pages) => {
        return pages.length + 1;
      },
      initialData: { pages: [initialAnimes], pageParams: [1] },
    }
  );

  const {
    data: queryResults,
    refetch,
    isFetching,
  } = useQuery({
    queryFn: async () => {
      const queryUrl = `/api/anime?genre=${genre}&year=${year}&orderBy=totalRatings`;

      const { data } = await axios(queryUrl);

      return data as Anime[];
    },
    queryKey: ["browsing-anime-filter-query"],
    enabled: false, //by default it will not fetch
  });

  useEffect(() => {
    if (queryResults) {
      setAnimes(queryResults);
      return;
    }

    if (data?.pages[data?.pages.length - 1].length === 0) {
      setNoNewData(true);
    }

    setAnimes(data?.pages.flatMap((page) => page) ?? initialAnimes);
  }, [data, initialAnimes, queryResults]);

  useEffect(() => {
    if (entry?.isIntersecting && !noNewData) {
      fetchNextPage();
    }
  }, [entry, fetchNextPage, noNewData]);

  useEffect(() => {
    if (genre || year) {
      refetch();
      setNoNewData(true);
    }
  }, [genre, year, refetch]);

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
        <Combobox
          data={genres}
          selectedOption={genre}
          setState={setGenre}
          placeholder="Select genre..."
          large
        />
        <Combobox
          data={yearData}
          selectedOption={year}
          placeholder="Select year..."
          setState={setYear}
          large
        />
      </div>
      {isFetching ? (
        <AnimeCardSkeleton length={5} />
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-5">
          {animes.map((anime, index) => {
            if (index === animes.length - 1) {
              return (
                <div key={anime.id} ref={ref}>
                  <AnimeCard anime={anime} />
                </div>
              );
            } else {
              return (
                <div key={anime.id}>
                  <AnimeCard anime={anime} />
                </div>
              );
            }
          })}
        </div>
      )}
      {animes.length === 0 && (
        <p className="text-center text-sm text-muted-foreground">
          No results found.
        </p>
      )}
      {isFetchingNextPage && <AnimeCardSkeleton length={5} />}
    </>
  );
};

export default BrowseAnime;
