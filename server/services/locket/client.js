import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sdk from "locket.js";

export function deviceSummary(client) {
  const device = client.device;
  return {
    autoEmulate: device.autoEmulate,
    installationId: device.installationId,
    modelName: device.modelInfo.name,
    hardwareModel: device.modelInfo.model,
    iosVersion: device.modelInfo.ios,
    appVersion: device.appVersion,
    buildNumber: device.buildNumber,
  };
}

export async function createSdkSession() {
  const directory = await mkdtemp(join(tmpdir(), "lock-gold-session-"));
  const client = new sdk.LocketClient({
    sessionPath: join(directory, "session.json"),
  });
  // The SDK needs a directory for history, but account tokens must remain in memory.
  client.session.save = () => {};
  const getValidToken = client.session.getValidToken.bind(client.session);
  let refreshing;
  client.session.getValidToken = () => {
    refreshing ??= Promise.resolve()
      .then(getValidToken)
      .finally(() => {
        refreshing = undefined;
      });
    return refreshing;
  };
  return {
    client,
    close: async () => {
      client.session.idToken = null;
      client.session.refreshToken = null;
      await rm(directory, { recursive: true, force: true });
    },
  };
}
