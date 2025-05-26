import nodeConfig from '@dword-design/base-config-node';
import dedent from 'dedent';
import packageName from 'depcheck-package-name';
import loadPkg from 'load-pkg';

export default config => {
  const packageConfig = loadPkg.sync();
  return {
    ...nodeConfig(config),
    eslintConfig: dedent`
      import { createConfigForNuxt } from '${packageName`@nuxt/eslint-config`}/flat';
      import config from '@dword-design/eslint-config';

      export default createConfigForNuxt({ features: { standalone: false } })
        .prepend(
          config,
          {
            files: ['eslint.config.js'],
            rules: { 'import/no-extraneous-dependencies': 'off' },
          },
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
