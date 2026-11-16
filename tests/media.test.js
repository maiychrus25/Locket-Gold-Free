import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createSdkSession } from "../server/services/locket/client.js";
import { isolatedMedia, applyWorkerResult } from "../server/services/locket/media.js";
import { executeMedia } from "../server/services/locket/media-worker.js";

test("isolated worker extracts and compresses real video, cleaning success and encoder failure", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "lock-gold-test-"));
  const resource = await createSdkSession();
  const originalTemp = process.env.TMPDIR;
  process.env.TMPDIR = directory;
  Object.assign(resource.client.session, {
    uid: "fixture-user",
    idToken: "fixture-token",
    refreshToken: "fixture-refresh",
    expiresAt: Date.now() + 3600000,
  });
  t.after(async () => {
    if (originalTemp === undefined) delete process.env.TMPDIR;
    else process.env.TMPDIR = originalTemp;
    await resource.close();
    await rm(directory, { recursive: true, force: true });
  });
  const file = join(directory, "clip.mp4");
  const created = spawnSync(
    "ffmpeg",
    [
      "-y",
      "-f",
      "lavfi",
      "-i",
      "color=c=gold:s=128x128:d=2",
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      file,
    ],
    { stdio: "ignore", timeout: 10000 },
  );
  assert.equal(created.status, 0, "ffmpeg fixture must encode successfully");
  const video = await readFile(file);
  const before = (await readdir(directory))
    .filter((value) => value.startsWith("lock-gold-media-"))
    .sort();
  const image = await isolatedMedia(
    resource.client,
    "extractThumbnail",
    { timestampSec: 1 },
    undefined,
    video,
  );
  assert.ok(image.length > 12);
  assert.equal(image.toString("ascii", 8, 12), "WEBP");
  const optimized = await isolatedMedia(
    resource.client,
    "optimizeVideo",
    {
      targetSizeBytes: 100000,
      preserveResolution: false,
      maxDimension: 240,
      priority: "balanced",
    },
    undefined,
    video,
  );
  assert.equal(optimized.toString("ascii", 4, 8), "ftyp");
  const webmPath = join(directory, "clip.webm");
  const webmCreated = spawnSync(
    "ffmpeg",
    ["-y", "-i", file, "-c:v", "libvpx-vp9", webmPath],
    { stdio: "ignore", timeout: 10000 },
  );
  assert.equal(webmCreated.status, 0);
  const conversionClient = {
    moments: {
      optimizeVideo: resource.client.moments.optimizeVideo.bind(
        resource.client.moments,
      ),
      uploadVideo: async (bytes) => {
        assert.equal(bytes.toString("ascii", 4, 8), "ftyp");
        return "converted-upload";
      },
    },
  };
  assert.equal(
    await executeMedia(
      conversionClient,
      "uploadVideo",
      { priority: "video" },
      undefined,
      await readFile(webmPath),
      "video/webm",
    ),
    "converted-upload",
  );
  await assert.rejects(
    isolatedMedia(
      resource.client,
      "optimizeVideo",
      {},
      undefined,
      Buffer.from("invalid-video"),
    ),
    /compression failed/i,
  );
  const after = (await readdir(directory))
    .filter((value) => value.startsWith("lock-gold-media-"))
    .sort();
  assert.deepEqual(
    after,
    before,
    "No owned media directory may survive success or encoder failure",
  );
});

test("worker preserves parent history and cannot overwrite a newer token", async (t) => {
  const resource = await createSdkSession();
  t.after(() => resource.close());
  const client = resource.client;
  Object.assign(client.session, {
    uid: "fixture-user",
    idToken: "new-parent-token",
    refreshToken: "new-parent-refresh",
  });
  applyWorkerResult(client, "old-token", "old-refresh", {
    session: {
      idToken: "old-worker-token",
      refreshToken: "old-worker-refresh",
    },
    postedMoment: {
      canonical_uid: "posted-by-worker",
      caption: "Keep my history",
    },
  });
  assert.equal(client.session.idToken, "new-parent-token");
  assert.equal(client.moments._loadHistory()[0].caption, "Keep my history");
  assert.ok(client.session.redactionSecrets.has("old-worker-token"));
});
