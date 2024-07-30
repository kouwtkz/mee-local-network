import { UserConfig, defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import devServer from '@hono/vite-dev-server'
import { VitePluginNode } from 'vite-plugin-node';
import tsconfigPaths from 'vite-tsconfig-paths';
import ssgBuild from '@hono/vite-ssg';
import { setBuildEnv, writeEnv } from './BuildEnv';
import { configDotenv } from 'dotenv';
import path from 'path';

const outDir = "dist";

export default defineConfig(({ mode }) => {
  let env: { [k: string]: string } = {
    ...configDotenv().parsed,
    ...configDotenv({ path: ".env.local" }).parsed
  };
  if (mode !== "development") setBuildEnv(mode);
  let config: UserConfig = {
    plugins: [tsconfigPaths()]
  };
  switch (mode) {
    case "client":
      config.plugins!.push(react())
      config.build = {
        outDir,
        rollupOptions: {
          input: [
            // './src/client.tsx',
            './src/styles.scss',
            './src/client/bbs.tsx',
            './src/client/twitter.tsx',
            './src/client/uploader.ts',
          ],
          output: {
            entryFileNames: `assets/[name].js`,
            chunkFileNames: `assets/[name].js`,
            assetFileNames: (assetInfo) => {
              const name = assetInfo?.name ?? "";
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
      break;
    case "production":
      env = Object.fromEntries(
        Object.entries(env).filter(([k]) => !k.startsWith("VITE_"))
      )
      writeEnv(path.resolve(outDir, ".env"), env);
      config.plugins!.push([...VitePluginNode({
        adapter({ app, server, req, res, next }) {
          app(res, res);
        },
        appPath: './src/index.tsx',
      }),
      ssgBuild({ entry: "./src/ssg.tsx" }),
      ])
      config = {
        ...config,
        build: {
          outDir,
          emptyOutDir: false,
        },
        ssr: { external: ['axios', 'react', 'react-dom'] },
      } as UserConfig
      break;
    case "development":
      config.plugins!.push(
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
      )
      break;
  }
  return config;
});
