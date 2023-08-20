/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-var-requires */
// @ts-nocheck

// ES6 Import
import module from '#app/1/module';

// ES6 Named Import
import { namedExport } from '#app/2/named-module';

// ES6 Import with Alias
import * as alias from '#app/3/alias-module';

// ES6 Import Default and Named
import defaultExport, {
  namedExport as renamedExport,
} from '#app/4/multi-module';

// ES6 Import Default and Alias
import defaultExport, * as alias from '#app/5/alias-multi-module';

// CommonJS Require
const commonjsModule = require('#app/6/commonjs-module');

// CommonJS Named Require
const { commonjsNamedExport } = require('#app/7/commonjs-named-module');

// Dynamic Import (ES6)
const dynamicModule = await import('#app/8/dynamic-module');

// Side Effect Import (ES6)
import '#app/9/side-effect-module';

// Side Effect Require (CommonJS)
require('#app/10/side-effect-commonjs-module');

// ES6 Default Export
export default {
  key: 'value',
};

// ES6 Named Export
export const namedValue1 = 'Hello';

// ES6 Renamed Export
export { namedValue1 as renamedValue };

// ES6 Export List
export { value1, value2 } from '#app/11/export-list-module';

// ES6 Re-export from Another Module
export { namedValue2 } from '#app/12/reexport-module';

// ES6 All Named Exports
export * from '#app/13/all-exports-module';

// External Module
import { namedValue3 } from '@packages/14/external-module';
