import type { NextConfig } from "next";
import TerserPlugin from "terser-webpack-plugin";
import { resolve } from "node:path";
const config: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
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
    config.module.rules.push({
      test: /[\\/]@cesium[\\/]engine[\\/]Source[\\/]Core[\\/]Ion\.js$/,
      enforce: "pre",
      use: [
        {
          loader: resolve(
            process.cwd(),
            "../../infra/strip-cesium-demo-token.cjs",
          ),
        },
      ],
    });
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
