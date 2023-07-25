import { z } from "zod";

import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import { animeSchema } from "@/lib/validators/anime";
import { INFINITE_SCROLLING_PAGINATION_BROWSE } from "@/config";

export async function POST(req: Request) {
  try {
    const session = await getAuthSession();

    if (!session) {
      return new Response("Unauthorized", { status: 401 });
    }

    const isAdmin = await db.user.findFirst({
      where: {
        id: session.user.id,
      },
    });

    if (!isAdmin) {
      return new Response("User not found", { status: 404 });
    }

    if (isAdmin.role !== "ADMIN") {
      return new Response("Forbidden", { status: 403 });
    }

    const body = await req.json();

    const {
      description,
      director,
      genre,
      name,
      releaseYear,
      coverImage,
      trailerLink,
    } = animeSchema.parse(body);

    const existingAnime = await db.anime.findFirst({
      where: {
        name,
      },
    });

    if (existingAnime) {
      return new Response("Anime already exists", { status: 409 });
    }

    if (genre.length === 0) {
      return new Response("Please enter a genre", { status: 422 });
    }

    //all checks complete ✅
    await db.anime.create({
      data: {
        description,
        director,
        genre,
        name,
        releaseYear,
        coverImage: coverImage!,
        trailerLink,
        creatorId: session.user.id,
      },
    });

    return new Response("OK");
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(error.message, { status: 422 });
    }

    return new Response("Something went wrong", { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getAuthSession();

    if (!session) {
      return new Response("Unauthorized", { status: 401 });
    }

    const isAdmin = await db.user.findFirst({
      where: {
        id: session.user.id,
      },
    });

    if (!isAdmin) {
      return new Response("User not found", { status: 404 });
    }

    if (isAdmin.role !== "ADMIN") {
      return new Response("Forbidden", { status: 403 });
    }

    const body = await req.json();

    const {
      id,
      description,
      director,
      genre,
      name,
      releaseYear,
      coverImage,
      trailerLink,
    } = animeSchema.parse(body);

    const existingAnime = await db.anime.findFirst({
      where: {
        name,
      },
    });

    if (existingAnime && existingAnime.id !== id) {
      return new Response("Anime already exists", { status: 409 });
    }

    if (genre.length === 0) {
      return new Response("Please enter a genre", { status: 422 });
    }

    //all checks complete ✅
    await db.anime.update({
      where: {
        id,
      },
      data: {
        description,
        director,
        genre,
        name,
        releaseYear,
        coverImage: coverImage!,
        trailerLink,
        creatorId: session.user.id,
      },
    });

    return new Response("OK");
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(error.message, { status: 422 });
    }

    return new Response("Something went wrong", { status: 500 });
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);

  try {
    const session = await getAuthSession();

    if (!session) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { limit, page, query, orderBy, genre, year } = z
      .object({
        limit: z.string().nullish().optional(),
        page: z.string().nullish().optional(),
        query: z.string().nullish().optional(),
        genre: z.string().nullish().optional(),
        year: z.string().nullish().optional(),
        orderBy: z.string().nullish().optional(),
      })
      .parse({
        limit: url.searchParams.get("limit"),
        page: url.searchParams.get("page"),
        query: url.searchParams.get("q"),
        genre: url.searchParams.get("genre"),
        year: url.searchParams.get("year"),
        orderBy: url.searchParams.get("orderBy"),
      });

    let whereClause = {};
    let orderByClause = {};
    let takeClause = undefined;
    let skipClause = undefined;

    if (limit && page) {
      takeClause = parseInt(limit);
      skipClause = (parseInt(page) - 1) * parseInt(limit);
    } else if (query && query.length > 0) {
      whereClause = {
        name: {
          startsWith: query,
        },
      };
    } else if (genre && year) {
      whereClause = {
        genre,
        releaseYear: year,
      };

      takeClause = INFINITE_SCROLLING_PAGINATION_BROWSE + 10;
    } else if (genre) {
      whereClause = {
        genre,
      };
      takeClause = INFINITE_SCROLLING_PAGINATION_BROWSE + 10;
    } else if (year) {
      whereClause = {
        releaseYear: year,
      };
      takeClause = INFINITE_SCROLLING_PAGINATION_BROWSE + 10;
    }

    if (orderBy) {
      orderByClause = {
        [orderBy]: "desc",
      };
    } else {
      orderByClause = {
        createdAt: "desc",
      };
    }

    // console.log("whereClause", whereClause);
    // console.log("orderByClause", orderByClause);
    // console.log("takeClause", takeClause);
    // console.log("skipClause", skipClause);

    const animes = await db.anime.findMany({
      take: takeClause,
      skip: skipClause,
      where: whereClause,
      orderBy: orderByClause,
    });

    return new Response(JSON.stringify(animes));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(error.message, { status: 422 });
    }

    return new Response("Something went wrong", { status: 500 });
  }
}
