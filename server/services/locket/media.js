import { fork } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

async function stopWorker(worker) {
  if (!worker?.pid) return;
  // ffmpeg is a child of the SDK worker; terminate the whole owned process group.
  try {
    process.kill(-worker.pid, "SIGKILL");
  } catch (error) {
    if (error.code !== "ESRCH") throw error;
  }
  if (worker.exitCode === null && worker.signalCode === null)
    await new Promise((resolve) => worker.once("exit", resolve));
}

export function applyWorkerResult(
  client,
  originalToken,
  originalRefresh,
  result,
) {
  if (result.session) {
    client.session.redactionSecrets ??= new Set();
    for (const value of [result.session.idToken, result.session.refreshToken])
      if (value) client.session.redactionSecrets.add(value);
    if (
      client.session.idToken === originalToken &&
      client.session.refreshToken === originalRefresh
    )
      Object.assign(client.session, result.session);
  }
  if (result.postedMoment)
    client.moments.recordPostedMoment(result.postedMoment);
}

export async function isolatedMedia(
  client,
  operation,
  values,
  image,
  video,
  videoType,
) {
  await client.session.getValidToken();
  const originalToken = client.session.idToken;
  const originalRefresh = client.session.refreshToken;
  const directory = await mkdtemp(join(tmpdir(), "lock-gold-media-"));
  let worker;
  let timer;
  try {
    return await new Promise((resolve, reject) => {
      worker = fork(
        fileURLToPath(new URL("./media-worker.js", import.meta.url)),
        [],
        {
          env: {
            ...process.env,
            TMPDIR: directory,
            TMP: directory,
            TEMP: directory,
          },
          serialization: "advanced",
          stdio: ["ignore", "ignore", "ignore", "ipc"],
          detached: true,
        },
      );
      timer = setTimeout(
        () =>
          reject(new Error("Xử lý media quá 180 giây. Thử video ngắn hơn.")),
        180_000,
      );
      worker.once("error", reject);
      worker.once("exit", () =>
        reject(new Error("Tiến trình xử lý media đã dừng.")),
      );
      worker.once("message", (result) => {
        applyWorkerResult(client, originalToken, originalRefresh, result);
        if (result.error) {
          const error = new Error(result.error);
          if (Number.isInteger(result.statusCode))
            error.statusCode = result.statusCode;
          reject(error);
        } else resolve(result.data);
      });
      const { uid, email, idToken, refreshToken, expiresAt } = client.session;
      worker.send(
        {
          session: { uid, email, idToken, refreshToken, expiresAt },
          device: client.device.toDict(),
          operation,
          values,
          image,
          video,
          videoType,
        },
        (error) => {
          if (error) reject(error);
        },
      );
    });
  } finally {
    clearTimeout(timer);
    try {
      await stopWorker(worker);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  }
}
