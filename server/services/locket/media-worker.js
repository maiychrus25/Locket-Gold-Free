import sdk from "locket.js";
import { join } from "node:path";

export async function executeMedia(
  client,
  operation,
  values,
  image,
  video,
  videoType = "video/mp4",
) {
  if (
    video &&
    videoType !== "video/mp4" &&
    ["post", "uploadVideo"].includes(operation)
  )
    video = await client.moments.optimizeVideo(video, {
      priority: values.priority || "balanced",
      preserveResolution: true,
    });
  if (operation === "post")
    return client.moments.post({
      ...values,
      ...(image ? { image } : {}),
      ...(video ? { video } : {}),
    });
  if (operation === "extractThumbnail")
    return client.moments.extractThumbnail(video, values.timestampSec);
  if (operation === "optimizeVideo")
    return client.moments.optimizeVideo(video, values);
  if (operation === "uploadVideo")
    return client.moments.uploadVideo(video, values);
  if (operation === "uploadImage") return client.moments.uploadImage(image);
  if (operation === "uploadAvatar") return client.user.uploadAvatar(image);
  if (operation === "updateAvatar") return client.user.updateAvatar(image);
  throw new Error("Unsupported media operation");
}

if (process.send) {
  process.once(
    "message",
    async ({ session, device, operation, values, image, video, videoType }) => {
      const client = new sdk.LocketClient({
        sessionPath: join(process.env.TMPDIR, "session.json"),
        device: sdk.DeviceProfile.fromDict(device),
      });
      client.session.save = () => {};
      Object.assign(client.session, session);
      try {
        const data = await executeMedia(
          client,
          operation,
          values,
          image,
          video,
          videoType,
        );
        const postedMoment =
          operation === "post"
            ? client.moments
                ._loadHistory()
                .find(
                  (moment) =>
                    moment.canonical_uid === (data?.canonical_uid || data?.id),
                )
            : undefined;
        process.send({
          data,
          postedMoment,
          session: {
            idToken: client.session.idToken,
            refreshToken: client.session.refreshToken,
            expiresAt: client.session.expiresAt,
          },
        });
      } catch (error) {
        process.send({
          error: String(error.message).slice(0, 1000),
          statusCode: Number.isInteger(error.statusCode)
            ? error.statusCode
            : undefined,
          session: {
            idToken: client.session.idToken,
            refreshToken: client.session.refreshToken,
            expiresAt: client.session.expiresAt,
          },
        });
      }
    },
  );
}
