import { contextBridge } from 'electron';

/**
 * Read the API token main passed via webPreferences.additionalArguments.
 *
 * The renderer runs with sandbox: true, so this preload has no `fs`. Main reads
 * the token file (it runs unsandboxed as the same user as the backend) and hands
 * the value over as a process argument, which a sandboxed preload can still see.
 */
function readTokenArg(): string {
  const prefix = '--friday-api-token=';
  const arg = process.argv.find((a) => a.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : '';
}

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  version: '1.0.0',
  // A packaged renderer loads over file:// and so has no allowlisted Origin;
  // this token is how it authenticates to the local API instead.
  apiToken: readTokenArg()
});

