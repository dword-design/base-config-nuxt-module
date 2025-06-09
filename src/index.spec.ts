import { Base } from '@dword-design/base';
import { test } from '@playwright/test';
import endent from 'endent';
import { execaCommand } from 'execa';
import outputFiles from 'output-files';

test('#imports', async ({}, testInfo) => {
  const cwd = testInfo.outputPath();

  await outputFiles(cwd, {
    'package.json': JSON.stringify({ dependencies: { '@nuxt/kit': '*' } }),
    src: {
      'module.ts': endent`
        import { addPlugin, createResolver, defineNuxtModule } from '@nuxt/kit';

        const resolver = createResolver(import.meta.url);

        export default defineNuxtModule({
          setup: () => {
            addPlugin(resolver.resolve('./runtime/plugins/plugin.ts'))
          },
        });
      `,
      'runtime/plugins/plugin.ts': endent`
        import { defineNuxtPlugin } from '#imports';

        export default defineNuxtPlugin(() => {});
      `,
    },
  });

  const base = new Base({ name: '../../src' }, { cwd });
  await base.prepare();
  await base.lint();
  await base.run('prepublishOnly');
  console.log('build done');
  await execaCommand('tsc --noEmit', { cwd });
});
