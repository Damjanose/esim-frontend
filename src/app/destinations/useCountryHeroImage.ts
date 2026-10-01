import { useEffect, useState } from "react";

export type CountryHeroImage = {
  imageUrl: string;
  alt: string;
  sourceUrl: string;
};

/**
 * The live plans view's banner photo, from /bff/country-image (f153). Moved
 * out of DestinationPlans unchanged.
 */
export function useCountryHeroImage(input: { country?: string; slug?: string }) {
  const [image, setImage] = useState<CountryHeroImage | null>(null);
  const [loading, setLoading] = useState(false);

  const country = input.country?.trim() ?? "";
  const slug = input.slug?.trim() ?? "";

  useEffect(() => {
    if (!country && !slug) {
      setImage(null);
      setLoading(false);
      return;
    }

    const countryName = country;
    const destinationSlug = slug;
    const controller = new AbortController();

    async function loadCountryImage() {
      try {
        setLoading(true);

        const params = new URLSearchParams();
        if (destinationSlug) params.set("slug", destinationSlug);
        if (countryName) params.set("country", countryName);

        const response = await fetch(`/bff/country-image?${params.toString()}`, {
          signal: controller.signal,
          cache: "force-cache",
        });

        if (!response.ok) {
          throw new Error(`Country image request failed: ${response.status}`);
        }

        const payload = (await response.json()) as CountryHeroImage;

        if (!payload.imageUrl) {
          throw new Error("Country image URL is missing");
        }

        setImage(payload);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        console.error("Failed to load country hero image:", error);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadCountryImage();

    return () => {
      controller.abort();
    };
  }, [country, slug]);

  return { image, loading };
}
