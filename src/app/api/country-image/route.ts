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

type WikimediaSearchResponse = {
  query?: {
    pages?: Record<string, WikimediaPage>;
  };
};

type WikidataSearchResult = {
  id?: string;
  label?: string;
  description?: string;
};

type WikidataSearchResponse = {
  search?: WikidataSearchResult[];
};

type WikidataEntity = {
  labels?: Record<
    string,
    {
      language?: string;
      value?: string;
    }
  >;
  claims?: {
    P36?: Array<{
      mainsnak?: {
        datavalue?: {
          value?: {
            id?: string;
          };
        };
      };
    }>;
  };
};

type WikidataEntitiesResponse = {
  entities?: Record<string, WikidataEntity>;
};

type CountryDetails = {
  country: string;
  capital: string;
};

type CountryImageResult = {
  imageUrl: string;
  alt: string;
  sourceUrl: string;
  country: string;
  capital: string;
};

const CACHE_SECONDS = 60 * 60 * 24 * 30;

function cleanCountryName(value: string) {
  return value
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchJson<T>(
  url: string,
  label: string,
): Promise<T | null> {
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Api-User-Agent":
        "eSim2you/1.0 contact@example.com",
    },
    next: {
      revalidate: CACHE_SECONDS,
    },
  });

  const responseText = await response.text();

  if (!response.ok) {
    console.error(`${label} request failed`, {
      url,
      status: response.status,
      statusText: response.statusText,
      body: responseText.slice(0, 500),
    });

    return null;
  }

  try {
    return JSON.parse(responseText) as T;
  } catch (error) {
    console.error(`${label} returned invalid JSON`, {
      url,
      body: responseText.slice(0, 500),
      error,
    });

    return null;
  }
}

async function searchCountryEntity(
  country: string,
): Promise<WikidataSearchResult | null> {
  const searchParams = new URLSearchParams({
    action: "wbsearchentities",
    search: country,
    language: "en",
    uselang: "en",
    type: "item",
    limit: "10",
    format: "json",
    origin: "*",
  });

  const payload =
    await fetchJson<WikidataSearchResponse>(
      `https://www.wikidata.org/w/api.php?${searchParams.toString()}`,
      "Wikidata country search",
    );

  if (!payload?.search?.length) {
    return null;
  }

  const normalizedCountry = normalizeText(country);

  const exactCountry = payload.search.find((item) => {
    const normalizedLabel = normalizeText(
      item.label ?? "",
    );

    const normalizedDescription = normalizeText(
      item.description ?? "",
    );

    return (
      normalizedLabel === normalizedCountry &&
      (
        normalizedDescription.includes("country") ||
        normalizedDescription.includes("sovereign state")
      )
    );
  });

  if (exactCountry) {
    return exactCountry;
  }

  const countryResult = payload.search.find((item) => {
    const description = normalizeText(
      item.description ?? "",
    );

    return (
      description.includes("country") ||
      description.includes("sovereign state")
    );
  });

  return countryResult ?? payload.search[0] ?? null;
}

async function getWikidataEntity(
  entityId: string,
): Promise<WikidataEntity | null> {
  const searchParams = new URLSearchParams({
    action: "wbgetentities",
    ids: entityId,
    props: "labels|claims",
    languages: "en",
    format: "json",
    origin: "*",
  });

  const payload =
    await fetchJson<WikidataEntitiesResponse>(
      `https://www.wikidata.org/w/api.php?${searchParams.toString()}`,
      `Wikidata entity ${entityId}`,
    );

  return payload?.entities?.[entityId] ?? null;
}

async function resolveCountryDetails(
  countryQuery: string,
): Promise<CountryDetails | null> {
  const countrySearchResult =
    await searchCountryEntity(countryQuery);

  const countryEntityId =
    countrySearchResult?.id;

  if (!countryEntityId) {
    console.error("Country Wikidata entity not found", {
      countryQuery,
    });

    return null;
  }

  const countryEntity =
    await getWikidataEntity(countryEntityId);

  if (!countryEntity) {
    return null;
  }

  // P36 is the Wikidata property for capital.
  const capitalEntityId =
    countryEntity.claims?.P36?.[0]?.mainsnak
      ?.datavalue?.value?.id;

  if (!capitalEntityId) {
    console.error("Capital claim was not found", {
      countryQuery,
      countryEntityId,
    });

    return null;
  }

  const capitalEntity =
    await getWikidataEntity(capitalEntityId);

  if (!capitalEntity) {
    return null;
  }

  const resolvedCountry =
    countryEntity.labels?.en?.value ??
    countrySearchResult.label ??
    countryQuery;

  const capital =
    capitalEntity.labels?.en?.value;

  if (!capital) {
    return null;
  }

  return {
    country: resolvedCountry,
    capital,
  };
}

function buildImageQueries(
  country: string,
  capital: string,
) {
  return [
    `${capital} ${country} skyline`,
    `${capital} ${country} cityscape`,
    `${capital} ${country} panorama`,
    `${capital} ${country} landmark`,
    `${capital} capital city`,
  ];
}

function isRejectedTitle(title: string) {
  const normalizedTitle = normalizeText(title);

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
    "metro map",
    "transit map",
    "emblem",
    "seal of",
    "airport",
    "station",
    "diagram",
    "logo",
  ];

  return (
    rejectedTerms.some((term) =>
      normalizedTitle.includes(term),
    ) ||
    normalizedTitle.endsWith(" svg") ||
    normalizedTitle.endsWith(" gif") ||
    normalizedTitle.endsWith(" tif") ||
    normalizedTitle.endsWith(" tiff")
  );
}

function isSuitableImage(
  page: WikimediaPage,
  capital: string,
) {
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
    const aspectRatio =
      image.width / image.height;

    if (image.width < 900) {
      return false;
    }

    if (aspectRatio < 1.25) {
      return false;
    }
  }

  const normalizedTitle =
    normalizeText(title);

  const normalizedCapital =
    normalizeText(capital);

  return normalizedTitle.includes(
    normalizedCapital,
  );
}

async function searchWikimedia(
  searchQuery: string,
): Promise<WikimediaPage[]> {
  const searchParams = new URLSearchParams({
    action: "query",
    generator: "search",
    gsrsearch: `filetype:bitmap ${searchQuery}`,
    gsrnamespace: "6",
    gsrlimit: "40",
    prop: "imageinfo",
    iiprop: "url|size|mime",
    iiurlwidth: "1600",
    format: "json",
    formatversion: "2",
    origin: "*",
  });

  const payload =
    await fetchJson<WikimediaSearchResponse>(
      `https://commons.wikimedia.org/w/api.php?${searchParams.toString()}`,
      `Wikimedia image search: ${searchQuery}`,
    );

  return Object.values(
    payload?.query?.pages ?? {},
  );
}

function scoreImage(
  page: WikimediaPage,
  capital: string,
) {
  const title = normalizeText(
    page.title ?? "",
  );

  const image = page.imageinfo?.[0];

  let score = 0;

  if (
    title.includes(
      `${normalizeText(capital)} skyline`,
    )
  ) {
    score += 100;
  }

  if (title.includes("skyline")) {
    score += 50;
  }

  if (title.includes("panorama")) {
    score += 40;
  }

  if (title.includes("cityscape")) {
    score += 35;
  }

  if (title.includes("night")) {
    score += 10;
  }

  if (
    typeof image?.width === "number" &&
    typeof image?.height === "number"
  ) {
    const aspectRatio =
      image.width / image.height;

    if (aspectRatio >= 1.7) {
      score += 20;
    }

    score += Math.min(
      Math.floor(image.width / 500),
      10,
    );
  }

  return score;
}

function sortImagesDeterministically(
  pages: WikimediaPage[],
  capital: string,
) {
  return [...pages].sort((first, second) => {
    const scoreDifference =
      scoreImage(second, capital) -
      scoreImage(first, capital);

    if (scoreDifference !== 0) {
      return scoreDifference;
    }

    const firstTitle =
      normalizeText(first.title ?? "");

    const secondTitle =
      normalizeText(second.title ?? "");

    const titleDifference =
      firstTitle.localeCompare(secondTitle);

    if (titleDifference !== 0) {
      return titleDifference;
    }

    return (
      (first.pageid ?? 0) -
      (second.pageid ?? 0)
    );
  });
}

function createImageResult(
  country: string,
  capital: string,
  page: WikimediaPage,
): CountryImageResult | null {
  const image = page.imageinfo?.[0];

  const imageUrl =
    image?.thumburl ?? image?.url;

  if (!imageUrl) {
    return null;
  }

  return {
    imageUrl,
    alt: `${capital}, capital city of ${country}`,
    sourceUrl:
      image?.descriptionurl ?? "",
    country,
    capital,
  };
}

async function findCapitalImage(
  country: string,
  capital: string,
): Promise<CountryImageResult | null> {
  const queries = buildImageQueries(
    country,
    capital,
  );

  /*
   * Collect all results before selecting one.
   * This prevents the chosen image from depending on
   * whichever search request happens to return first.
   */
  const searchResults = await Promise.all(
    queries.map(async (query) => {
      try {
        return await searchWikimedia(query);
      } catch (error) {
        console.error(
          `Wikimedia search failed for "${query}"`,
          error,
        );

        return [];
      }
    }),
  );

  const uniquePages = new Map<
    number | string,
    WikimediaPage
  >();

  for (const page of searchResults.flat()) {
    const key =
      page.pageid ?? page.title ?? "";

    if (key) {
      uniquePages.set(key, page);
    }
  }

  const suitablePages = Array.from(
    uniquePages.values(),
  ).filter((page) =>
    isSuitableImage(page, capital),
  );

  const selectedPage =
    sortImagesDeterministically(
      suitablePages,
      capital,
    )[0];

  if (!selectedPage) {
    return null;
  }

  return createImageResult(
    country,
    capital,
    selectedPage,
  );
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);

  const countryQuery = cleanCountryName(
    requestUrl.searchParams.get("country") ?? "",
  );

  if (!countryQuery) {
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
    const countryDetails =
      await resolveCountryDetails(countryQuery);

    if (!countryDetails) {
      return NextResponse.json(
        {
          message: `Could not resolve the capital city for ${countryQuery}.`,
        },
        {
          status: 404,
          headers: {
            "Cache-Control": "no-store",
          },
        },
      );
    }

    console.log("Resolved country capital", {
      requestedCountry: countryQuery,
      country: countryDetails.country,
      capital: countryDetails.capital,
    });

    const image =
      await findCapitalImage(
        countryDetails.country,
        countryDetails.capital,
      );

    if (!image) {
      return NextResponse.json(
        {
          message: `No suitable image was found for ${countryDetails.capital}, ${countryDetails.country}.`,
          country: countryDetails.country,
          capital: countryDetails.capital,
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
      "Country capital image route failed",
      {
        countryQuery,
        error:
          error instanceof Error
            ? {
                name: error.name,
                message: error.message,
                stack: error.stack,
              }
            : error,
      },
    );

    return NextResponse.json(
      {
        message:
          "The capital city image lookup failed.",
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
