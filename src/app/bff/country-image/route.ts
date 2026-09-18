import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type DestinationMedia = {
  slug: string;
  capital: string;
  imageUrl: string;
  alt: string;
  sourceUrl: string;
};

const CACHE_SECONDS = 60 * 60 * 24;

function cleanParam(value: string) {
  return value.replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
}

function slugFromCountryName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Browser-facing proxy for destination hero media. Wikipedia resolution and
 * Postgres caching live in the Express API — this route only forwards.
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const slugParam = (requestUrl.searchParams.get("slug") ?? "").trim().toLowerCase();
  const countryParam = cleanParam(
    requestUrl.searchParams.get("country") ?? "",
  );
  const slug = slugParam || (countryParam ? slugFromCountryName(countryParam) : "");

  if (!slug) {
    return NextResponse.json(
      { message: "The country or slug query parameter is required." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const query = new URLSearchParams();
  if (countryParam) query.set("name", countryParam);
  const qs = query.toString();
  const path = `/packages/destinations/${encodeURIComponent(slug)}/media${
    qs ? `?${qs}` : ""
  }`;

  const result = await backendFetch<DestinationMedia>(path, {
    next: { revalidate: CACHE_SECONDS },
  });

  if (!result.ok) {
    return NextResponse.json(
      { message: result.message },
      {
        status: result.status,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }

  const media = result.data;
  if (!media?.imageUrl) {
    return NextResponse.json(
      { message: `Could not resolve media for ${slug}.` },
      { status: 404, headers: { "Cache-Control": "no-store" } },
    );
  }

  return NextResponse.json(
    {
      imageUrl: media.imageUrl,
      alt: media.alt,
      sourceUrl: media.sourceUrl,
      country: countryParam || media.slug,
      capital: media.capital,
      slug: media.slug,
    },
    {
      status: 200,
      headers: {
        "Cache-Control": [
          "public",
          `s-maxage=${CACHE_SECONDS}`,
          `stale-while-revalidate=${CACHE_SECONDS}`,
        ].join(", "),
      },
    },
  );
}
