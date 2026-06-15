// next.config.mjs
const nextConfig = {
  reactStrictMode: false,

  // Evita el error de Turbopack al detectar config vieja
  turbopack: {},

  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default nextConfig;