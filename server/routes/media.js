import multer from "multer";
import sharp from "sharp";
import { operationMap, publicOperations, validateOperation } from "../../shared/operations.js";
import { hasUnsafeKeys } from "../middleware/security.js";
import { sendResult, fail } from "../session/context.js";

import { UPLOAD_LIMIT } from "../limits.js";

export function registerMediaRoutes(app, { authenticated, limited, run }, { mediaExecutor, ffmpeg }) {
  let activeMedia = 0;
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: UPLOAD_LIMIT,
      files: 2,
      fields: 1,
      fieldSize: 32 * 1024,
      parts: 3,
    },
    fileFilter: (_req, file, callback) => {
      const image = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
        "image/avif",
        "image/heic",
        "image/heif",
      ].includes(file.mimetype);
      const video = ["video/mp4", "video/quicktime", "video/webm"].includes(
        file.mimetype,
      );
      callback(
        image || video
          ? null
          : new Error("Chỉ chấp nhận tệp ảnh hoặc video được hỗ trợ."),
        image || video,
      );
    },
  }).fields([
    { name: "image", maxCount: 1 },
    { name: "video", maxCount: 1 },
  ]);
  app.post(
    "/api/media/:operation",
    authenticated,
    limited,
    (req, res, next) => {
      if (req.account.mediaBusy || activeMedia >= 2)
        return res.status(429).json({
          error: "Đang xử lý media. Vui lòng chờ thao tác hiện tại kết thúc.",
        });
      req.account.mediaBusy = true;
      activeMedia++;
      let released = false;
      const release = () => {
        if (!released) {
          released = true;
          activeMedia--;
          req.account.mediaBusy = false;
        }
      };
      req.releaseMedia = release;
      req.once("aborted", () => {
        if (!req.mediaProcessing) release();
      });
      res.once("close", () => {
        if (!req.mediaProcessing) release();
      });
      upload(req, res, (error) => {
        if (error) {
          release();
          return fail(res, error, error.code === "LIMIT_FILE_SIZE" ? 413 : 400);
        }
        req.mediaProcessing = true;
        next();
      });
    },
    async (req, res) => {
      try {
        const operation = publicOperations.find(
          (value) => value.media === req.params.operation,
        );
        if (!operation)
          return res
            .status(404)
            .json({ error: "Chức năng media không được hỗ trợ." });
        const image = req.files?.image?.[0];
        const video = req.files?.video?.[0];
        let values;
        try {
          const input = JSON.parse(req.body.options || "{}");
          if (hasUnsafeKeys(input)) throw new Error("Thuộc tính không hợp lệ.");
          values = validateOperation(
            operationMap.get(`${operation.group}/${operation.method}`),
            input,
          );
          if (image) {
            if (!image.mimetype.startsWith("image/"))
              throw new Error("Trường ảnh phải chứa ảnh.");
            const metadata = await sharp(image.buffer, {
              limitInputPixels: 40_000_000,
            }).metadata();
            if (
              !metadata.width ||
              !metadata.height ||
              !["jpeg", "png", "webp", "gif", "avif", "heif"].includes(
                metadata.format,
              )
            )
              throw new Error("Ảnh không có định dạng raster được hỗ trợ.");
          }
          if (video) {
            if (!video.mimetype.startsWith("video/"))
              throw new Error("Trường video phải chứa video.");
            const isMp4 =
              video.buffer.length > 12 &&
              video.buffer.toString("ascii", 4, 8) === "ftyp";
            const isWebm = video.buffer
              .subarray(0, 4)
              .equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
            if (!isMp4 && !isWebm)
              throw new Error("Video không có định dạng MP4/MOV/WebM hợp lệ.");
            video.detectedType = isWebm
              ? "video/webm"
              : video.buffer.toString("ascii", 8, 12) === "qt  "
                ? "video/quicktime"
                : "video/mp4";
          }
          if (["post"].includes(operation.media) && !image && !video)
            throw new Error("Chọn ảnh hoặc video để đăng.");
          if (
            ["updateAvatar", "uploadAvatar", "uploadImage"].includes(
              operation.media,
            ) &&
            (!image || video)
          )
            throw new Error("Chọn một tệp ảnh.");
          if (
            ["uploadVideo", "extractThumbnail", "optimizeVideo"].includes(
              operation.media,
            ) &&
            (!video || image)
          )
            throw new Error("Chọn một tệp video.");
          if (
            video &&
            !ffmpeg &&
            (operation.media !== "uploadVideo" || values.autoCompress)
          )
            throw new Error("Máy chủ cần cài ffmpeg để xử lý video.");
        } catch (error) {
          return fail(res, error, 400);
        }
        try {
          const data = await run(req.account, (client) =>
            mediaExecutor(
              client,
              operation.media,
              values,
              image?.buffer,
              video?.buffer,
              video?.detectedType,
            ),
          );
          if (operation.download) {
            if (!Buffer.isBuffer(data) || !data.length)
              throw new Error("Không thể xử lý media. Kiểm tra tệp và ffmpeg.");
            const isImage = operation.media === "extractThumbnail";
            res.set("Content-Type", isImage ? "image/webp" : "video/mp4");
            res.set(
              "Content-Disposition",
              `attachment; filename="${isImage ? "thumbnail.webp" : "optimized.mp4"}"`,
            );
            res.send(data);
          } else sendResult(res, req.account, data);
        } catch (error) {
          fail(res, error, 502, req.account);
        }
      } finally {
        req.releaseMedia();
      }
    },
  );

}
