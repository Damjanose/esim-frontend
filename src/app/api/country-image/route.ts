import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type WikimediaImageInfo = {
  url?: string;
  thumburl?: string;
  descriptionurl?: string;
  width?: number;
  height?: number;
  mime?: string;
};

type WikimediaPage = {
  pageid?: number;
  title?: string;
  index?: number;
  imageinfo?: WikimediaImageInfo[];
};

type WikimediaResponse = {
  query?: {
    pages?: Record<string, WikimediaPage>;
  };
};

type CountryImageResult = {
  imageUrl: string;
  alt: string;
  sourceUrl: string;
};

const CACHE_SECONDS = 60 * 60 * 24 * 7;

function cleanCountryName(value: string) {
  return value
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildSearchQueries(country: string) {
  return [
    `${country} skyline`,
    `${country} famous landmark`,
    `${country} travel destination`,
    `${country} landscape`,
    `${country} capital city`,
  ];
}

function isRejectedTitle(title: string) {
  const normalizedTitle = title.toLowerCase();

  const rejectedTerms = [
    "flag",
    "coat of arms",
    "locator map",
    "location map",
    "political map",
    "administrative map",
    "blank map",
    "road map",
    "district map",
    "province map",
    "municipality map",
    "railway map",
    "election map",
    "emblem",
    "seal of",
  ];

  return (
    rejectedTerms.some((term) =>
      normalizedTitle.includes(term),
    ) ||
    normalizedTitle.endsWith(".svg") ||
    normalizedTitle.endsWith(".gif") ||
    normalizedTitle.endsWith(".tif") ||
    normalizedTitle.endsWith(".tiff")
  );
}

function isSuitableImage(page: WikimediaPage) {
  const image = page.imageinfo?.[0];
  const title = page.title ?? "";

  if (!image) {
    return false;
  }

  if (!image.thumburl && !image.url) {
    return false;
  }

  if (isRejectedTitle(title)) {
    return false;
  }

  if (
    image.mime &&
    ![
      "image/jpeg",
      "image/png",
      "image/webp",
    ].includes(image.mime)
  ) {
    return false;
  }

  if (
    typeof image.width === "number" &&
    typeof image.height === "number"
  ) {
    if (image.width <= image.height) {
      return false;
    }

    if (image.width < 900) {
      return false;
    }
  }

  return true;
}

async function searchWikimedia(
  searchQuery: string,
): Promise<WikimediaPage[]> {
  const searchParams = new URLSearchParams({
    action: "query",
    generator: "search",
    gsrsearch: `filetype:bitmap ${searchQuery}`,
    gsrnamespace: "6",
    gsrlimit: "25",
    prop: "imageinfo",
    iiprop: "url|size|mime",
    iiurlwidth: "1400",
    format: "json",
    formatversion: "2",
    origin: "*",
  });

  const response = await fetch(
    `https://commons.wikimedia.org/w/api.php?${searchParams.toString()}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Api-User-Agent":
          "Velocity-eSIM/1.0 destination-image-lookup",
      },
      next: {
        revalidate: CACHE_SECONDS,
      },
    },
  );

  if (!response.ok) {
    const responseBody = await response
      .text()
      .catch(() => "");

    console.error("Wikimedia request failed", {
      query: searchQuery,
      status: response.status,
      statusText: response.statusText,
      body: responseBody.slice(0, 500),
    });

    return [];
  }

  const payload =
    (await response.json()) as WikimediaResponse;

  return Object.values(
    payload.query?.pages ?? {},
  ).sort(
    (first, second) =>
      (first.index ?? 9999) -
      (second.index ?? 9999),
  );
}

function createImageResult(
  country: string,
  page: WikimediaPage,
): CountryImageResult | null {
  const image = page.imageinfo?.[0];

  if (!image) {
    return null;
  }

  const imageUrl =
    image.thumburl ?? image.url;

  if (!imageUrl) {
    return null;
  }

  return {
    imageUrl,
    alt: `${country} travel destination`,
    sourceUrl:
      image.descriptionurl ?? "",
  };
}

async function findCountryImage(
  country: string,
): Promise<CountryImageResult | null> {
  const queries = buildSearchQueries(country);

  for (const query of queries) {
    try {
      const pages =
        await searchWikimedia(query);

      const suitablePage =
        pages.find(isSuitableImage);

      if (!suitablePage) {
        continue;
      }

      const result = createImageResult(
        country,
        suitablePage,
      );

      if (result) {
        return result;
      }
    } catch (error) {
      console.error(
        `Wikimedia search failed for "${query}":`,
        error,
      );
    }
  }

  return null;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);

  const country = cleanCountryName(
    requestUrl.searchParams.get("country") ?? "",
  );

  console.log("Using Wikimedia country image route", {
    requestUrl: request.url,
    country,
  });

  if (!country) {
    return NextResponse.json(
      {
        message:
          "The country query parameter is required.",
      },
      {
        status: 400,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }

  try {
    const image =
      await findCountryImage(country);

    if (!image) {
      return NextResponse.json(
        {
          message: `No suitable image was found for ${country}.`,
        },
        {
          status: 404,
          headers: {
            "Cache-Control": "no-store",
          },
        },
      );
    }

    return NextResponse.json(image, {
      status: 200,
      headers: {
        "Cache-Control": [
          "public",
          `s-maxage=${CACHE_SECONDS}`,
          `stale-while-revalidate=${CACHE_SECONDS}`,
        ].join(", "),
      },
    });
  } catch (error) {
    console.error(
      "Country image route failed:",
      error,
    );

    return NextResponse.json(
      {
        message:
          "The country image lookup failed.",
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }
}
