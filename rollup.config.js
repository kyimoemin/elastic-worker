import path from "node:path";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import typescript from "@rollup/plugin-typescript";
import dts from "rollup-plugin-dts";
import alias from "@rollup/plugin-alias";

const input = "src/index.ts";

/**
 * Shared JS build settings.
 * `preserveModules` keeps your folder structure and ensures .js extensions
 * are written correctly in output imports.
 */
const mkJsBuild = ({ env }) => ({
  input,
  output: {
    dir: `dist/${env}`,
    format: "esm",
    sourcemap: false,
    preserveModules: true,
    entryFileNames: "[name].js", // ensures .js extension
    chunkFileNames: "[name]-[hash].js",
    exports: "named",
  },
  plugins: [
    alias({
      entries: [
        {
          find: "#env-adapter",
          replacement:
            env === "browser"
              ? path.resolve("src/browser/index.ts")
              : path.resolve("src/node/index.ts"),
        },
      ],
    }),
    resolve({
      browser: env === "browser", // tells Rollup to prefer browser field
      preferBuiltins: env === "node", // keep Node built-ins for node build
    }),
    commonjs(),
    json(),
    typescript({
      tsconfig: "./tsconfig.json",
      declaration: true,
      declarationMap: false,
      outDir: `dist/${env}/types`, // temp; we’ll merge types below
      rootDir: "src",
    }),
  ],
  external: [
    // add externals that consumers should provide (e.g. react)
    // "react"
  ],
});

export default [
  // 1) Node ESM build
  mkJsBuild({ env: "node" }),

  // 2) Browser ESM build
  mkJsBuild({ env: "browser" }),

  // 3) Bundle and flatten .d.ts (from either output)
  {
    input: "dist/node/types/index.d.ts",
    output: { file: "dist/index.d.ts", format: "es" },
    plugins: [dts()],
  },
];
