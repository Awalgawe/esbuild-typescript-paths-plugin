import type {
  OnLoadArgs,
  OnLoadResult,
  OnResolveArgs,
  OnResolveResult,
  PartialMessage,
  Plugin,
  PluginBuild,
} from 'esbuild';
import { dirname, relative } from 'node:path';
import ts from 'typescript';
import {
  computeSearchRegExp,
  extractImportPaths,
  getTsConfig,
  replacePath,
} from './tools';

export type OnloadCallBack = Parameters<PluginBuild['onLoad']>['1'];

export type OnResolveCallBack = Parameters<PluginBuild['onResolve']>['1'];

interface ClassPlugin extends Plugin {
  onResolve: OnResolveCallBack;
  onLoad: OnloadCallBack;
}

export default class TsPathsPlugin implements ClassPlugin {
  readonly name = 'ts-paths';

  tsConfig?: ts.ParsedCommandLine;
  program?: ts.Program;
  searchRegExp?: RegExp;

  constructor() {
    this.setup = this.setup.bind(this);
    this.onResolve = this.onResolve.bind(this);
    this.onLoad = this.onLoad.bind(this);
  }

  async setup(build: PluginBuild) {
    this.tsConfig = await getTsConfig(
      build.initialOptions.absWorkingDir ?? process.cwd(),
      build.initialOptions.tsconfig ?? './tsconfig.json'
    );

    if (!this.tsConfig?.options.paths) {
      throw new Error('tsconfig.json does not contain any path mappings');
    }

    this.program = ts.createProgram({
      rootNames: this.tsConfig.fileNames,
      options: this.tsConfig.options,
      projectReferences: this.tsConfig.projectReferences,
      configFileParsingDiagnostics: this.tsConfig.errors,
    });

    this.searchRegExp = computeSearchRegExp(this.tsConfig.options.paths);

    if (build.initialOptions.bundle) {
      build.onResolve({ filter: this.searchRegExp }, this.onResolve);
    } else {
      build.onLoad({ filter: /.*\.(m|c)?(j|t)sx?$/ }, this.onLoad);
    }
  }

  onResolve(args: OnResolveArgs): OnResolveResult | null {
    const sourceFile = this.program?.getSourceFile(args.importer);

    if (!sourceFile) {
      throw new Error(`Unable to find source file "${args.importer}"`);
    }

    const resolvedPath = this.resolveAlias(sourceFile, args.path, true);

    if (!resolvedPath) {
      return null;
    }

    return {
      path: resolvedPath,
    };
  }

  async onLoad({ path }: OnLoadArgs): Promise<OnLoadResult | null | undefined> {
    if (!this.tsConfig) {
      throw new Error('Config should be defined at this point');
    }

    if (!this.tsConfig.options.paths) {
      throw new Error('paths mapping should be defined at this point');
    }

    if (!this.program) {
      throw new Error('Program should be defined at this point');
    }

    const sourceFile = this.program.getSourceFile(path);

    if (!sourceFile) {
      throw new Error(`Unable to find source file "${path}"`);
    }

    const contents = sourceFile.getFullText();

    if (!this.searchRegExp?.test(contents)) {
      return {
        contents,
        loader: 'ts',
      };
    }

    const paths = extractImportPaths(sourceFile);
    const mapping: Record<string, string> = {};
    const errors: PartialMessage[] = [];

    for (const importPath of paths) {
      if (!this.searchRegExp.test(importPath)) {
        continue;
      }

      const resolvedPath = this.resolveAlias(sourceFile, importPath);

      if (resolvedPath) {
        mapping[importPath] = resolvedPath;
      } else {
        errors.push({
          text: `Unable to resolve "${importPath}" in "${path}"`,
          location: {
            file: path,
            namespace: 'file',
            line: 0,
            column: 0,
          },
        });
      }
    }

    return {
      contents: replacePath(contents, mapping),
      loader: 'ts',
      errors,
    };
  }

  resolveAlias(sourceFile: ts.SourceFile, imported: string, absolute = false) {
    if (!this.tsConfig?.options.paths) {
      throw new Error('tsconfig.json does not contain any path mappings');
    }

    if (!this.program) {
      throw new Error('Program should be defined at this point');
    }

    const { resolvedModule } = ts.resolveModuleName(
      imported,
      sourceFile.fileName,
      this.tsConfig.options,
      ts.sys
    );

    if (!resolvedModule) {
      throw new Error(
        `Unable to resolve "${imported}" from "${sourceFile.fileName}" with ${this.tsConfig.options.configFilePath}`
      );
    }

    const { resolvedFileName } = resolvedModule;

    if (absolute) {
      return resolvedFileName;
    }

    const relativePath = relative(
      dirname(sourceFile.fileName),
      resolvedFileName
    ).replace(/\.(j|t)sx?$/, '');

    return relativePath.startsWith('.') ? relativePath : `./${relativePath}`;
  }
}
