import { defineConfig } from "tsup"

export default defineConfig(options => {
  return {
    splitting: true,
    sourcemap: true,
    minify: true,
    entry: ["src/index.ts"],
    target: "es2020",
    format: ["cjs", "esm"],
    clean: true,
    dts: true,
    external: ["openai", "zod"],
    ...options
  }
})
