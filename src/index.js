import nodeConfig from '@dword-design/base-config-node';
import dedent from 'dedent';
import loadPkg from 'load-pkg';

export default config => {
  const packageConfig = loadPkg.sync();
  return {
    ...nodeConfig(config),
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
