import path from "node:path";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import typescript from "@rollup/plugin-typescript";
import dts from "rollup-plugin-dts";
import alias from "@rollup/plugin-alias";

const input = "src/index.ts";

/**
 *
 * @param {object} param0 config
 * @param {"browser"|"node"} param0.env env target
 * @param {"esm"|"cjs"} param0.format module format
 * @returns
 */
const mkJsBuild = ({ env, format }) => ({
  input,
  output: {
    dir: `dist/${format}/${env}`,
    format, // "esm" | "cjs"
    sourcemap: false,
    preserveModules: true,
    entryFileNames: format === "esm" ? "[name].js" : "[name].cjs",
    chunkFileNames: format === "esm" ? "[name]-[hash].js" : "[name]-[hash].cjs",
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
      browser: env === "browser",
      preferBuiltins: env === "node",
    }),
    commonjs(),
    json(),
    typescript({
      tsconfig: "./tsconfig.json",
      declaration: true,
      declarationMap: false,
      outDir: `dist/${format}/${env}/types`, // emit once; we’ll point "types" to a flat index below
      rootDir: "src",
    }),
  ],
  external: [
    // e.g. "react"
  ],
});

export default [
  // ESM (node + browser)
  mkJsBuild({ env: "node", format: "esm" }),
  mkJsBuild({ env: "browser", format: "esm" }),

  // CJS (node + browser)
  mkJsBuild({ env: "node", format: "cjs" }),
  mkJsBuild({ env: "browser", format: "cjs" }),

  // Flatten .d.ts
  {
    input: "dist/esm/node/types/index.d.ts",
    output: { file: "dist/index.d.ts", format: "es" },
    plugins: [dts()],
  },
];
