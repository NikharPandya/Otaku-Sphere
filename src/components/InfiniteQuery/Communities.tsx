"use client";
import { FC, useEffect, useRef, useState } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useIntersection } from "@mantine/hooks";

import { INFINITE_SCROLLING_PAGINATION_RESULTS } from "@/config";
import CommunityCard from "@/components/Cards/CommunityCard";
import { ExtendedCommunity } from "@/types/db";
import { Icons } from "@/components/Icons";
import { Input } from "@/ui/Input";
import { Button } from "@/ui/Button";

interface CommunitiesProps {
  initialCommunites: ExtendedCommunity[];
  category?: string;
}

const Communities: FC<CommunitiesProps> = ({ initialCommunites, category }) => {
  const lastPostRef = useRef<HTMLElement>(null);
  const [communities, setCommunities] = useState(initialCommunites);

  const [query, setQuery] = useState("");

  const { ref, entry } = useIntersection({
    root: lastPostRef.current,
    threshold: 1,
  });

  const infiniteQueryKey = category
    ? [`community-infinite-${category}`]
    : [`community-infinite`];

  const { data, fetchNextPage, isFetchingNextPage } = useInfiniteQuery(
    infiniteQueryKey,
    async ({ pageParam = 1 }) => {
      const queryUrl =
        `/api/community?limit=${INFINITE_SCROLLING_PAGINATION_RESULTS}&page=${pageParam}` +
        (!!category ? `&category=${category}` : "");

      const { data } = await axios(queryUrl);

      return data as ExtendedCommunity[];
    },
    {
      getNextPageParam: (_, pages) => {
        return pages.length + 1;
      },
      initialData: { pages: [initialCommunites], pageParams: [1] },
    }
  );

  const {
    data: queryResults,
    refetch,
    isFetching,
  } = useQuery({
    queryFn: async () => {
      const queryUrl =
        `/api/community?q=${query}` +
        (!!category ? `&category=${category}` : "");

      const { data } = await axios(queryUrl);

      return data as ExtendedCommunity[];
    },
    queryKey: ["community-search-query"],
    enabled: false, //by default it will not fetch
  });

  useEffect(() => {
    if (queryResults) {
      setCommunities(queryResults);
      return;
    }
    setCommunities(data?.pages.flatMap((page) => page) ?? initialCommunites);
  }, [data, queryResults, initialCommunites]);

  useEffect(() => {
    if (entry?.isIntersecting) {
      fetchNextPage();
    }
  }, [entry, fetchNextPage]);

  if (communities.length === 0) {
    return (
      <p className="text-muted-foreground text-sm text-center">
        No communities created yet.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-y-4">
      <div className="flex gap-x-2 items-center px-2">
        <Input
          placeholder="Type a community name here."
          onChange={(e) => setQuery(e.target.value)}
          disabled={isFetching}
          onKeyDown={(e) => {
            if (e.key === "Enter" && query.length > 0) {
              refetch();
            }
          }}
        />
        <Button
          onClick={() => refetch()}
          disabled={query.length === 0 || isFetching}
        >
          {isFetching ? (
            <Icons.spinner
              className="h-4 w-4 animate-spin"
              aria-hidden="true"
            />
          ) : (
            "Search"
          )}
        </Button>
      </div>

      {communities.map((community, index) => {
        if (index === communities.length - 1) {
          return (
            <div key={community.id} ref={ref}>
              <CommunityCard community={community} />
            </div>
          );
        } else {
          return (
            <div key={community.id}>
              <CommunityCard community={community} />
            </div>
          );
        }
      })}
      {isFetchingNextPage && (
        <div className="w-full flex justify-center">
          <Icons.spinner
            className="mr-2 h-4 w-4 animate-spin"
            aria-hidden="true"
          />
        </div>
      )}
      {query.length > 0 && communities.length === 0 && (
        <p className="text-center text-sm text-muted-foreground">
          No results found.
        </p>
      )}
    </div>
  );
};

export default Communities;