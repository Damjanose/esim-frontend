/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        // Wikimedia serves images from more than one subdomain
        // (upload.wikimedia.org for originals, thumb.wikimedia.org for
        // thumbnails, ...) — the country-image route (src/app/bff/country-image)
        // can return either depending on what Wikimedia's imageinfo API hands
        // back for a given image, so this allows the whole family rather than
        // allowlisting hosts one at a time as new ones show up.
        protocol: "https",
        hostname: "*.wikimedia.org",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "flagcdn.com",
        pathname: "/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/:path(logo-icon.png|app-logo.png)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=3600, must-revalidate",
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/destinations/:slug",
        destination: "/esim/:slug",
        permanent: true,
      },
      {
        source: "/guides/:slug",
        destination: "/travel/:slug",
        permanent: true,
      },
      {
        source: "/guides",
        destination: "/travel",
        permanent: true,
      },
      // Guessable brand URLs (from the brand SEO plan) point at the pages that
      // already cover them, instead of duplicate pages that would compete.
      { source: "/esim", destination: "/destinations", permanent: true },
      { source: "/blog", destination: "/travel", permanent: true },
      { source: "/blog/:slug", destination: "/travel/:slug", permanent: true },
      { source: "/how-esim-works", destination: "/travel/what-is-an-esim", permanent: true },
      {
        source: "/esim-compatible-devices",
        destination: "/travel/esim-compatible-phones",
        permanent: true,
      },
    ];
  },
};
  
export default nextConfig;
