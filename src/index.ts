import pathLib from 'node:path';

import getNodeConfig, {
  getPackageConfig,
} from '@dword-design/base-config-node';
import packageName from 'depcheck-package-name';
import endent from 'endent';
import { execaCommand } from 'execa';
import fs from 'fs-extra';
import loadPkg from 'load-pkg';
import { omit } from 'lodash-es';

export default function (config) {
  const packageConfig = loadPkg.sync(this.cwd);
  const virtualImports = ['#imports', ...(config.virtualImports ?? [])];
  const nodeConfig = getNodeConfig.call(this, config);
  return {
    ...nodeConfig,
    editorIgnore: [...nodeConfig.editorIgnore, '.nuxt'],
    eslintConfig: endent`
      import { createConfigForNuxt } from '${packageName`@nuxt/eslint-config`}/flat';
      import config from '@dword-design/eslint-config';
      import { globalIgnores } from "eslint/config";

      export default createConfigForNuxt({ features: { standalone: false } })
        .prepend(
          config,
          {
            rules: {
              'import-x/no-unresolved': ["error", { ignore: [${virtualImports.map(_import => `'${_import}'`).join(', ')}] }],
            },
          },
          globalIgnores(['eslint.config.ts']),
        );\n
    `,
    gitignore: [...nodeConfig.gitignore, '/.nuxt'],
    hasTypescriptConfigRootAlias: false,
    lint: async options => {
      options = {
        log: process.env.NODE_ENV !== 'test',
        stderr: 'inherit',
        ...options,
      };

      await execaCommand('nuxt-build-module prepare', {
        ...(options.log && { stdout: 'inherit' }),
        cwd: this.cwd,
        stderr: options.stderr,
      });

      const tsconfig = await fs.readJson(
        pathLib.join(this.cwd, 'tsconfig.json'),
      );

      let nuxtTsconfig = await fs.readJson(
        pathLib.join(this.cwd, '.nuxt', 'tsconfig.json'),
      );

      nuxtTsconfig = omit(nuxtTsconfig, ['compilerOptions.noEmit']);
      nuxtTsconfig.compilerOptions.strict = !!tsconfig.compilerOptions.strict;

      await fs.outputFile(
        pathLib.join(this.cwd, '.nuxt', 'tsconfig.json'),
        JSON.stringify(nuxtTsconfig, undefined, 2),
      );
    },
    packageConfig: getPackageConfig({
      cwd: this.cwd,
      mainFilename: 'module.ts',
    }),
    readmeInstallString: endent`
      ## Install

      \`\`\`bash
      # npm
      $ npx nuxi module add ${packageConfig.name}

      # Yarn
      $ yarn nuxi module add ${packageConfig.name}
      \`\`\`
    `,
    typescriptConfig: { extends: './.nuxt/tsconfig.json' },
  };
}
