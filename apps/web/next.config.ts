import type { NextConfig } from "next";
import TerserPlugin from "terser-webpack-plugin";
const config: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/spatial/:kind/:version/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
  webpack(config, { dev, isServer }) {
    if (!dev && !isServer) {
      // SWC currently emits invalid octal escapes for Cesium's embedded WASM.
      // Keep production minification and byte semantics; validate every emitted JS chunk.
      config.optimization.minimizer[0] = new TerserPlugin({
        parallel: 2,
        terserOptions: { format: { ascii_only: true } },
      });
    }
    return config;
  },
};
export default config;
