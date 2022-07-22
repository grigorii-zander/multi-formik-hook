import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['./src/useMultiFormik.ts'],
  format: ['cjs', 'esm'],
  target: 'esnext',
  dts: true,
  treeshake: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ['react', 'formik'],
})
