import { BuildOptions, PluginOption, UserConfig, defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import devServer from '@hono/vite-dev-server'
import { VitePluginNode } from 'vite-plugin-node';
import tsconfigPaths from 'vite-tsconfig-paths';
import ssgBuild from '@hono/vite-ssg';
import { setBuildEnv, writeEnv } from './BuildEnv';
import { configDotenv } from 'dotenv';
import path from 'path';

const defaultBuild: BuildOptions = {
  outDir: "dist",
  emptyOutDir: false,
  copyPublicDir: false,
};
const publicDirBuild: BuildOptions = {
  outDir: "public",
  emptyOutDir: false,
  copyPublicDir: false,
}

export default defineConfig(({ mode }) => {
  let env: { [k: string]: string } = {
    ...configDotenv().parsed,
    ...configDotenv({ path: ".env.local" }).parsed
  };
  if (mode !== "development") setBuildEnv(mode);
  const plugins: PluginOption[] = [tsconfigPaths()];
  const config: UserConfig = {
    optimizeDeps: { include: [] },
    css: {
      preprocessorOptions: {
        scss: {
          api: "modern-compiler",
        }
      }
    }
  };
  switch (mode) {
    case "client":
      return {
        ...config,
        plugins: [...plugins, react()],
        build: {
          ...defaultBuild,
          emptyOutDir: true,
          copyPublicDir: true,
          rollupOptions: {
            input: [
              // './src/client.tsx',
              './src/styles.scss',
              './src/client/MeeLogue.tsx',
              './src/client/twitter.tsx',
              './src/client/uploader.ts',
            ],
            output: {
              entryFileNames: `assets/[name].js`,
              chunkFileNames: `assets/[name].js`,
              assetFileNames: (info) => {
                const name = info.name || "";
                if (/\.(gif|jpeg|jpg|png|svg|webp)$/.test(name)) {
                  return 'assets/images/[name].[ext]';
                }
                if (/\.css$/.test(name)) {
                  return 'assets/[name].[ext]';
                }
                return 'assets/[name].[ext]';
              }
            }
          },
          // manifest: true,
          chunkSizeWarningLimit: 3000
        }
      }
    case "sw":
      return {
        ...config,
        plugins,
        build: {
          ...publicDirBuild,
          rollupOptions: {
            input: [
              './src/client/logue/sw.ts',
              './src/client/logue/setSw.ts',
            ],
            output: {
              entryFileNames(info) {
                const m = info.facadeModuleId?.match(/client\/(.+\/|)([^\/]+)$/);
                if (m) {
                  switch (m[2]) {
                    case "sw.ts":
                    case "setSw.ts":
                      return m[1] + info.name + ".js";
                  }
                }
                return info.name + `.js`;
              },
            }
          },
          // manifest: true,
          chunkSizeWarningLimit: 3000
        }
      }
    case "production":
      env = Object.fromEntries(
        Object.entries(env).filter(([k]) => !k.startsWith("VITE_"))
      )
      writeEnv(path.resolve(defaultBuild.outDir || "dist", ".env"), env);
      return {
        ...config,
        plugins: [
          ...plugins,
          ...VitePluginNode({
            adapter({ app, server, req, res, next }) {
              app(res, res);
            },
            appPath: './src/index.tsx',
          }),
          ssgBuild({ entry: "./src/ssg.tsx" }),
        ],
        build: defaultBuild,
        ssr: { external: ['axios', 'react', 'react-dom'] },
      };
    case "development":
      return {
        ...config,
        plugins: [
          ...plugins,
          devServer({
            entry: 'src/dev.tsx',
            exclude: [
              /src\/.*\.css$/,
              /.*\.ts$/,
              /.*\.tsx$/,
              /^\/@.+$/,
              /\?t\=\d+$/,
              /^\/favicon\.ico$/,
              /^\/static\/.+/,
              /^\/node_modules\/.*/,
            ],
          })
        ],
      };
  }
  return config;
});
