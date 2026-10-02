import { useEffect, useState, type RefObject } from "react";
import { loadCountryImage, peekCountryImage, type CountryImage } from "./countryImageCache";

/** Start a tile's photo request this far before it reaches the viewport. */
export const TILE_IMAGE_ROOT_MARGIN = "200px";

/**
 * The tile's country photo, requested only once the tile comes within
 * TILE_IMAGE_ROOT_MARGIN of the viewport. Null means "show the gradient":
 * not requested yet, still loading, or there's no photo for this country.
 *
 * The root is the viewport, and a carousel's overflow clips its tiles, so
 * tiles scrolled out of a rail don't count as visible: they load as they're
 * swiped or arrowed in, not all at once.
 */
export function useLazyCountryImage(
  ref: RefObject<HTMLElement | null>,
  slug: string,
  country: string,
): CountryImage | null {
  const [image, setImage] = useState<CountryImage | null>(
    () => peekCountryImage({ slug, country }) ?? null,
  );

  useEffect(() => {
    const query = { slug, country };
    const cached = peekCountryImage(query);
    if (cached !== undefined) {
      setImage(cached);
      return;
    }
    setImage(null);

    const node = ref.current;
    if (!node) return;

    let active = true;
    const start = () => {
      void loadCountryImage(query).then((result) => {
        if (active) setImage(result);
      });
    };

    if (typeof IntersectionObserver === "undefined") {
      start();
      return () => {
        active = false;
      };
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        start();
      },
      { rootMargin: TILE_IMAGE_ROOT_MARGIN },
    );
    observer.observe(node);

    return () => {
      active = false;
      observer.disconnect();
    };
  }, [ref, slug, country]);

  return image;
}
