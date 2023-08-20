import { describe, expect, it } from '@jest/globals';
import { replacePath } from './tools';

describe('Tools', () => {
  describe(replacePath.name, () => {
    it('should replace paths', () => {
      const input = `
        import a from "@app/a";
        import b from "@app/a/b";
        import c from "@app/c";

        export * from "@app/a";
        `;

      const mapping = {
        '@app/a': 'src/a',
        '@app/a/b': 'src/a/b',
        '@app/c': 'src/c',
      };

      const expectedResult = `
        import a from "src/a";
        import b from "src/a/b";
        import c from "src/c";

        export * from "src/a";
        `;

      const result = replacePath(input, mapping);

      expect(result).toStrictEqual(expectedResult);
    });
  });
});
