import { validatePackageName } from '../src/utils/validators.js';
import { PackageReadmeMcpError } from '../src/types/index.js';

describe('NPM Package Validation Tests', () => {
  describe('validatePackageName', () => {
    test('valid package names should pass', () => {
      const validNames = [
        'lodash',
        'express',
        'react',
        'my-package',
        '@babel/core',
        '@types/react'
      ];

      validNames.forEach(name => {
        expect(() => validatePackageName(name)).not.toThrow();
      });
    });

    test('should reject invalid package names', () => {
      const invalidNames = [
        '',           // empty
        '   ',        // whitespace only
        'a'.repeat(300), // too long
        'my package', // spaces
        '@scope',     // incomplete scoped
      ];

      invalidNames.forEach(name => {
        expect(() => validatePackageName(name)).toThrow(PackageReadmeMcpError);
      });
    });
  });
});