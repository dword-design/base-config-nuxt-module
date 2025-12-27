import {
  type Base,
  type Config,
  defineBaseConfig,
  type PartialCommandOptions,
} from '@dword-design/base';
import getNodeConfig, {
  getPackageConfig,
} from '@dword-design/base-config-node';
import dotenv from '@dword-design/dotenv-json-extended';
import packageName from 'depcheck-package-name';
import endent from 'endent';
import { execaCommand } from 'execa';
import { readPackageSync } from 'read-pkg';

type ConfigNuxtModule = Config & { virtualImports?: string[] };

export default defineBaseConfig(function (
  this: Base,
  config: ConfigNuxtModule,
) {
  const packageConfig = readPackageSync({ cwd: this.cwd });
  const virtualImports = ['#imports', ...(config.virtualImports ?? [])];
  const nodeConfig = getNodeConfig.call(this);
  return {
    ...nodeConfig,
    editorIgnore: [...nodeConfig.editorIgnore, '.nuxt'],
    eslintConfig: endent`
      import { createConfigForNuxt } from '${packageName`@nuxt/eslint-config`}/flat';
      import config from '@dword-design/eslint-config';
      import { globalIgnores } from 'eslint/config';
      import type { Linter } from 'eslint';

      /**
       * TODO: Otherwise getting this error in the project using this package:
       * error TS2742: The inferred type of 'default' cannot be named without a reference to '~/node_modules/@eslint/core/dist/cjs/types.cjs'. This is likely not portable. A type annotation is necessary.
       **/
      const result: Linter.Config[] = await createConfigForNuxt({ features: { standalone: false } })
        .prepend(
          config,
          {
            rules: {
              'import-x/no-unresolved': ["error", { ignore: [${virtualImports.map(_import => `'${_import}'`).join(', ')}] }],
            },
          },
          globalIgnores(['eslint.config.ts', 'eslint.lint-staged.config.ts']),
        )
        .toConfigs();

      export default result;\n
    `,
    gitignore: [...nodeConfig.gitignore, '/.nuxt'],
    hasTypescriptConfigRootAlias: false,
    lint: async (options: PartialCommandOptions = {}) => {
      options = {
        log: process.env.NODE_ENV !== 'test',
        stderr: 'inherit',
        ...options,
      };

      await execaCommand('nuxt-build-module prepare', {
        ...(options.log && { stdout: 'inherit' }),
        cwd: this.cwd,
        env: dotenv.parse({ cwd: this.cwd }),
        stderr: options.stderr,
      });
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
    typecheck: async (options: PartialCommandOptions = {}) => {
      options = {
        log: process.env.NODE_ENV !== 'test',
        stderr: 'inherit',
        ...options,
      };

      await execaCommand('nuxt-build-module prepare', {
        ...(options.log && { stdout: 'inherit' }),
        cwd: this.cwd,
        env: dotenv.parse({ cwd: this.cwd }),
        stderr: options.stderr,
      });
    },
    typescriptConfig: { extends: './.nuxt/tsconfig.json' },
  };
});
