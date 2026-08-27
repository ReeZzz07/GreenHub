/** @type {import('next').NextConfig} */

// Хост картинок из S3-совместимого хранилища: локально — MinIO (localhost:9000, задаётся
// docker-compose), в проде — Yandex Object Storage. Реальный прод-домен передаётся через
// NEXT_PUBLIC_IMAGE_HOSTNAME (см. .env.local.example), чтобы не хардкодить его в конфиге.
const imageHostname = process.env.NEXT_PUBLIC_IMAGE_HOSTNAME;

const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '9000',
      },
      {
        protocol: 'https',
        hostname: '*.yandexcloud.net',
      },
      ...(imageHostname
        ? [
            {
              protocol: 'https',
              hostname: imageHostname,
            },
          ]
        : []),
    ],
  },
};

module.exports = nextConfig;
