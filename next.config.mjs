/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
 allowedDevOrigins: [
    "runtimebug.online",
    "www.runtimebug.online"
  ],

  images: {
    unoptimized: true,
  },

}

export default nextConfig
