/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // Allow any HTTPS image source (Supabase storage, CDNs, etc.)
      },
    ],
  },
};

export default nextConfig;
