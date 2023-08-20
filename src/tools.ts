import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

export function getTsConfig(cwd: string, path: string) {
  const resolvedTsConfigPath = resolve(cwd, path);

  const { config: json, error } = ts.readConfigFile(
    resolvedTsConfigPath,
    (path) => readFileSync(path).toString('utf-8')
  );

  if (error) {
    throw Object.assign(
      new Error(
        ts.formatDiagnostic(error, {
          getCanonicalFileName: (path) => path,
          getCurrentDirectory: () => cwd,
          getNewLine: () => '\n',
        })
      ),
      { json }
    );
  }

  return ts.parseJsonConfigFileContent(json, ts.sys, cwd);
}

export function computeSearchRegExp(paths: ts.MapLike<string[]>) {
  return new RegExp(
    `(${Object.keys(paths)
      .map((p) => p.replace('*', '(.*)'))
      .join('|')})`
  );
}

export const unknownImportPaths = new Set<number>();

/**
 * This is a hack to get around the fact that ts.isImportCall is not exported from
 * the typescript package.
 */
declare module 'typescript' {
  function isImportCall(node: ts.Node): node is ts.CallExpression;
}

export function extractImportPaths(node: ts.Node, paths = new Set<string>()) {
  if (
    ts.isImportDeclaration(node) &&
    ts.isStringLiteral(node.moduleSpecifier)
  ) {
    paths.add(node.moduleSpecifier.text);
  } else if (
    ts.isExportDeclaration(node) &&
    node.moduleSpecifier &&
    ts.isStringLiteral(node.moduleSpecifier)
  ) {
    paths.add(node.moduleSpecifier.text);
  } else if (
    ts.isCallExpression(node) &&
    ts.isIdentifier(node.expression) &&
    node.expression.text === 'require' &&
    node.arguments.length >= 1 &&
    ts.isStringLiteral(node.arguments[0])
  ) {
    paths.add(node.arguments[0].text);
  } else if (
    ts.isAwaitExpression(node) &&
    ts.isImportCall(node.expression) &&
    node.expression.arguments.length >= 1 &&
    ts.isStringLiteral(node.expression.arguments[0])
  ) {
    paths.add(node.expression.arguments[0].text);
  }

  ts.forEachChild(node, (childNode) => {
    extractImportPaths(childNode, paths);
  });

  return paths;
}

export function replacePath(content: string, mapping: Record<string, string>) {
  const regBase = Object.keys(mapping).join('|');
  const regEx = new RegExp(`(["'])(${regBase})\\1`, `g`);

  return content.replace(regEx, (match, quote, path) => {
    const resolvedPath = mapping[path];

    if (!resolvedPath) {
      throw new Error(`Unable to resolve "${path}"`);
    }

    return `${quote}${resolvedPath}${quote}`;
  });
}
