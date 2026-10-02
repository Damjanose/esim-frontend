import { PHOTO_TILE_BOX } from "./PhotoTile";
import { TileCarousel } from "./TileCarousel";

const TRENDING_PLACEHOLDERS = 6;
const RAIL_PLACEHOLDERS = 8;

/**
 * DestinationBrowse's loading state. It's built from the real TileCarousel
 * and PHOTO_TILE_BOX, so header heights, track gutters and tile boxes match
 * what replaces them (homepage CLS 0, f192). `inert` + aria-hidden mean
 * nothing in it is focusable or announced.
 */
export function BrowseSkeleton() {
  return (
    <div aria-hidden="true" inert>
      <TileCarousel
        controls={<span className="block h-11 w-[184px] rounded-full bg-surfaceBright" />}
        heading={
          <span className="flex h-9 items-center gap-2.5">
            <span className="h-9 w-9 shrink-0 rounded-full bg-surfaceBright" />
            <span className="h-4 w-48 rounded-full bg-surfaceBright" />
          </span>
        }
        label="Trending now"
      >
        {Array.from({ length: TRENDING_PLACEHOLDERS }, (_, index) => (
          <li className="shrink-0" key={index}>
            <span
              className={`block rounded-[16px] bg-surfaceBright motion-safe:animate-pulse ${PHOTO_TILE_BOX.trending}`}
            />
          </li>
        ))}
      </TileCarousel>

      <TileCarousel
        heading={<span className="block h-[22px] w-44 rounded-full bg-surfaceBright" />}
        label="Popular destinations"
      >
        {Array.from({ length: RAIL_PLACEHOLDERS }, (_, index) => (
          <li className="shrink-0" key={index}>
            <span
              className={`block rounded-[16px] bg-surfaceBright motion-safe:animate-pulse ${PHOTO_TILE_BOX.rail}`}
            />
          </li>
        ))}
      </TileCarousel>
    </div>
  );
}
