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
    ];
  },
};
  
export default nextConfig;
