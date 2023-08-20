import { PluginBuild, build } from 'esbuild';
import { resolve } from 'node:path';
import TsPathsPlugin from './Plugin';
import { describe, it, expect } from '@jest/globals';

describe('Plugin', () => {
  it('should work', async () => {
    const plugin = new TsPathsPlugin();

    // @ts-expect-error Mocking esbuild
    const esbuild: PluginBuild = {
      onLoad: () => {},
      onResolve: () => {},
      initialOptions: {
        absWorkingDir: resolve(process.cwd(), 'assets'),
        tsconfig: './tsconfig.json',
      },
    };

    await plugin.setup(esbuild);

    const result = await plugin.onLoad({
      namespace: 'file',
      suffix: 'js',
      path: resolve(process.cwd(), 'assets/src/test-imports.ts'),
      pluginData: {},
    });

    expect(result?.contents).toMatchSnapshot('yolo');
  });

  it('build bundle', async () => {
    const { name, setup } = new TsPathsPlugin();

    const result = await build({
      absWorkingDir: resolve(process.cwd(), 'assets'),
      tsconfig: './tsconfig.json',
      entryPoints: [resolve(process.cwd(), 'assets/src/a')],
      plugins: [{ name, setup }],
      target: 'es2022',
      format: 'esm',
      logLevel: 'info',
      outdir: 'toto',
      bundle: true,
      write: false,
    });

    expect(result.errors).toStrictEqual([]);
  });

  it('build without bundling', async () => {
    const { name, setup } = new TsPathsPlugin();

    const result = await build({
      absWorkingDir: resolve(process.cwd(), 'assets'),
      tsconfig: './tsconfig.json',
      entryPoints: [resolve(process.cwd(), 'assets/src/a/**/*')],
      plugins: [{ name, setup }],
      target: 'es2022',
      format: 'esm',
      logLevel: 'info',
      outdir: 'toto',
      bundle: false,
      write: false,
    });

    expect(result.errors).toStrictEqual([]);
  });
});
