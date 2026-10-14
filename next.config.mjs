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
      {
        // Country flags (flagUri) from the backend catalog. Proxying them keeps
        // Airalo's __cf_bm cookie off our pages and sizes them to the display.
        protocol: "https",
        hostname: "cdn-revamp.airalo.com",
        pathname: "/**",
      },
    ],
  },
  async headers() {
    return [
      {
        // HSTS, X-Frame-Options and nosniff come from the proxy in front of
        // Next; these are the ones it doesn't send. The CSP only covers
        // directives that can't break scripts/styles (a script-src policy would
        // need per-request nonces, which turns off static rendering and ISR).
        // Pokpay checkout is a redirect, not an iframe, so payment=() is safe.
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value:
              "frame-ancestors 'none'; base-uri 'self'; object-src 'none'; upgrade-insecure-requests",
          },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()",
          },
        ],
      },
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
