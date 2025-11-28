/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  api: {
    bodyParser: false, // We'll handle body parsing manually for audio files
  },
}

module.exports = nextConfig


