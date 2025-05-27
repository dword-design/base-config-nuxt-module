import nodeConfig from '@dword-design/base-config-node';
import dedent from 'dedent';
import packageName from 'depcheck-package-name';
import loadPkg from 'load-pkg';

export default config => {
  const packageConfig = loadPkg.sync();
  const virtualImports = ['#imports', ...(config.virtualImports ?? [])];
  return {
    ...nodeConfig(config),
    eslintConfig: dedent`
      import { createConfigForNuxt } from '${packageName`@nuxt/eslint-config`}/flat';
      import config from '@dword-design/eslint-config';
      import { globalIgnores } from "eslint/config";

      export default createConfigForNuxt({ features: { standalone: false } })
        .prepend(
          config,
          {
            rules: {
              'import/no-unresolved': ["error", { ignore: [${virtualImports.map(_import => `'${_import}'`).join(', ')}] }],
            },
          },
          globalIgnores(['eslint.config.js']),
        );\n
    `,
    readmeInstallString: dedent`
      ## Install

      \`\`\`bash
      # npm
      $ npx nuxi module add ${packageConfig.name}

      # Yarn
      $ yarn nuxi module add ${packageConfig.name}
      \`\`\`
    `,
  };
};
