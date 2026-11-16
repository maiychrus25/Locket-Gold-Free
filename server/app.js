import express from "express";
import helmet from "helmet";
import multer from "multer";
import { randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";
import sharp from "sharp";
import sdk from "locket.js";
import captionPresets from "locket.js/caption_presets.json" with { type: "json" };
import { z } from "zod";
import {
  operationMap,
  publicOperations,
  validateOperation,
} from "../shared/operations.js";
import { createSdkSession, deviceSummary } from "./client.js";
import { isolatedMedia } from "./media.js";

const SESSION_AGE = 2 * 60 * 60 * 1000;
const UPLOAD_LIMIT = 32 * 1024 * 1024;
const COOKIE = "lock_session";
const tokenKey =
  /^(?:id_?token|refresh_?token|access_?token|password|appcheck_?token|instance_?id_?token|authorization|fcm_?token|notification_?token)$/i;

function redact(value, secrets = []) {
  if (typeof value === "string")
    return secrets
      .filter((secret) => typeof secret === "string" && secret.length >= 6)
      .reduce((text, secret) => text.replaceAll(secret, "[redacted]"), value);
  if (Array.isArray(value)) return value.map((item) => redact(item, secrets));
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => !tokenKey.test(key))
        .map(([key, item]) => [key, redact(item, secrets)]),
    );
  return value;
}

function hasUnsafeKeys(value) {
  if (!value || typeof value !== "object") return false;
  return Object.entries(value).some(
    ([key, item]) =>
      ["__proto__", "constructor", "prototype"].includes(key) ||
      hasUnsafeKeys(item),
  );
}

function sessionId(req) {
  const value = req.headers.cookie
    ?.split(";")
    .map((value) => value.trim())
    .find((value) => value.startsWith(`${COOKIE}=`))
    ?.slice(COOKIE.length + 1);
  return value && /^[a-f0-9]{64}$/.test(value) ? value : null;
}

function publicSession(session) {
  if (!session) return { authenticated: false };
  return {
    authenticated: true,
    generation: session.generation,
    user: {
      uid: session.resource.client.session.uid,
      email: session.resource.client.session.email,
    },
    device: deviceSummary(session.resource.client),
    expiresAt: session.expiresAt,
  };
}

export function createApp({
  createClient = createSdkSession,
  mediaExecutor = isolatedMedia,
  clock = Date.now,
  allowedOrigin = process.env.APP_ORIGIN,
  secureCookies = process.env.NODE_ENV === "production",
} = {}) {
  const app = express();
  const sessions = new Map();
  const loginAttempts = new Map();
  const pendingLogins = new Set();
  const pendingWork = new Set();
  let activeMedia = 0;
  app.disable("x-powered-by");
  app.use(
    helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }),
  );
  app.use("/api", (_req, res, next) => {
    res.set("Cache-Control", "no-store");
    res.set("X-Accel-Buffering", "no");
    next();
  });
  app.use("/api", (req, res, next) => {
    if (allowedOrigin) {
      if (req.get("host") !== new URL(allowedOrigin).host)
        return res.status(403).json({ error: "Host không hợp lệ." });
    } else if (!["localhost", "127.0.0.1", "[::1]"].includes(req.hostname))
      return res
        .status(403)
        .json({ error: "Bản dev chỉ chấp nhận truy cập local." });
    if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
      const origin = req.get("origin");
      if (
        req.get("X-Lock-Client") !== "web" ||
        (origin &&
          origin !==
            (allowedOrigin || `${req.protocol}://${req.get("host")}`)) ||
        req.get("sec-fetch-site") === "cross-site"
      )
        return res
          .status(403)
          .json({ error: "Yêu cầu phải xuất phát từ website này." });
    }
    next();
  });
  app.use(express.json({ limit: "64kb" }));
  app.use("/api", (req, res, next) => {
    if (hasUnsafeKeys(req.body))
      return res.status(400).json({ error: "Thuộc tính không hợp lệ." });
    next();
  });

  const cookieOptions = {
    httpOnly: true,
    sameSite: "strict",
    secure: secureCookies,
    path: "/",
  };
  const closeSession = async (id) => {
    const session = sessions.get(id);
    if (!session) return;
    sessions.delete(id);
    session.closing = true;
    session.streams.forEach((close) => close());
    if (session.active === 0) await session.resource.close();
  };
  const cleanup = setInterval(() => {
    for (const [id, session] of sessions)
      if (session.expiresAt <= clock()) void closeSession(id);
    for (const [ip, item] of loginAttempts)
      if (clock() - item.start >= 15 * 60 * 1000) loginAttempts.delete(ip);
  }, 30_000);
  cleanup.unref();
  app.locals.shutdown = async () => {
    clearInterval(cleanup);
    await Promise.all([...sessions.keys()].map(closeSession));
    await Promise.allSettled([...pendingWork]);
  };
  const authenticated = async (req, res, next) => {
    const id = sessionId(req);
    const session = sessions.get(id);
    if (session && session.expiresAt <= clock()) await closeSession(id);
    if (!sessions.has(id))
      return res.status(401).json({
        error: "Phiên chưa kết nối hoặc đã hết hạn. Anh đăng nhập lại nhé.",
      });
    const generation = req.get("X-Lock-Session") ?? req.query.generation;
    if (generation !== undefined && generation !== session.generation)
      return res.status(409).json({
        error: "Phiên tài khoản đã thay đổi. Tải lại trang trước khi tiếp tục.",
        code: "SESSION_CHANGED",
      });
    req.account = session;
    next();
  };
  const limited = (req, res, next) => {
    const session = req.account;
    if (clock() - session.rateStart > 60_000) {
      session.rateCount = 0;
      session.rateStart = clock();
    }
    if (++session.rateCount > 120)
      return res
        .status(429)
        .json({ error: "Quá nhiều thao tác. Vui lòng thử lại sau một phút." });
    next();
  };
  const collectSecrets = (session) => {
    const client = session.resource.client;
    for (const value of [
      client.session.idToken,
      client.session.refreshToken,
      client.device.appcheckToken,
      client.device.instanceIdToken,
      ...(client.session.redactionSecrets || []),
    ])
      if (value) session.secrets.add(value);
    return [...session.secrets];
  };
  const run = async (session, action) => {
    session.active++;
    collectSecrets(session);
    const work = (async () => {
      try {
        return await action(session.resource.client);
      } finally {
        collectSecrets(session);
        session.active--;
        if (session.closing && session.active === 0)
          await session.resource.close();
      }
    })();
    pendingWork.add(work);
    try {
      return await work;
    } finally {
      pendingWork.delete(work);
    }
  };
  const sendResult = (res, session, data) =>
    res.json({ data: redact(data ?? true, collectSecrets(session)) });
  const fail = (res, error, status = 502, session) => {
    const secrets = session ? collectSecrets(session) : [];
    const message =
      error instanceof z.ZodError
        ? error.issues
            .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
            .join("; ")
        : error.message || "Yêu cầu không thành công.";
    const text = redact(String(message), secrets)
      .replace(/Bearer\s+\S+/gi, "Bearer [redacted]")
      .replace(/(?:refresh_token|id_token|password)=[^&\s]+/gi, "[redacted]");
    res.status(status).json({ error: text.slice(0, 700) });
  };

  const ffmpeg =
    spawnSync("ffmpeg", ["-version"], { stdio: "ignore", timeout: 3000 })
      .status === 0;
  const presets = [
    ...new Map(
      Object.entries(sdk.NoteType).map(([name, value]) => {
        const preset = captionPresets[value] || {};
        return [
          value,
          {
            value,
            label:
              preset.text ||
              (value === "standard"
                ? "Chú thích tự do"
                : name.toLowerCase().replaceAll("_", " ")),
            icon: preset.icon,
            colors: preset.colors || [],
            textColor: preset.text_color || "#FFFFFF",
          },
        ];
      }),
    ).values(),
  ];
  app.get("/api/health", (_req, res) =>
    res.json({ status: "ok", sdk: "0.0.3" }),
  );
  app.get("/api/catalog", (_req, res) =>
    res.json({
      operations: publicOperations,
      presets,
      reactions: sdk.ChatModule.getSupportedReactions(),
      limits: { uploadBytes: UPLOAD_LIMIT },
      runtime: { ffmpeg },
    }),
  );
  app.get("/api/auth/session", async (req, res) => {
    const id = sessionId(req);
    if (sessions.get(id)?.expiresAt <= clock()) await closeSession(id);
    res.json(publicSession(sessions.get(id)));
  });
  app.post("/api/auth/login", async (req, res) => {
    const parsed = z
      .object({
        email: z.email().max(254),
        password: z.string().min(1).max(256),
      })
      .strict()
      .safeParse(req.body);
    if (!parsed.success) return fail(res, parsed.error, 400);
    const ip = req.ip;
    let attempts = loginAttempts.get(ip);
    if (!attempts || clock() - attempts.start >= 15 * 60 * 1000) {
      attempts = { start: clock(), count: 0 };
      loginAttempts.set(ip, attempts);
    }
    if (attempts.count >= 5 || pendingLogins.has(ip) || sessions.size >= 100)
      return res
        .status(429)
        .json({ error: "Tạm giới hạn đăng nhập. Vui lòng thử lại sau." });
    pendingLogins.add(ip);
    let resource;
    try {
      resource = await createClient();
      await resource.client.login(parsed.data.email, parsed.data.password);
      if (!resource.client.session.uid || !resource.client.session.idToken)
        throw new Error("Missing authenticated session");
      await closeSession(sessionId(req));
      const id = randomBytes(32).toString("hex");
      const session = {
        generation: randomBytes(16).toString("hex"),
        resource,
        expiresAt: clock() + SESSION_AGE,
        active: 0,
        streams: new Set(),
        rateStart: clock(),
        rateCount: 0,
        mediaBusy: false,
        closing: false,
        secrets: new Set(),
      };
      collectSecrets(session);
      sessions.set(id, session);
      res.cookie(COOKIE, id, { ...cookieOptions, maxAge: SESSION_AGE });
      res.json(publicSession(session));
    } catch {
      attempts.count++;
      if (resource) await resource.close();
      res.status(401).json({
        error:
          "Đăng nhập Locket không thành công. Kiểm tra email, mật khẩu hoặc thử lại khi dịch vụ khả dụng.",
      });
    } finally {
      pendingLogins.delete(ip);
    }
  });
  app.post("/api/auth/logout", async (req, res) => {
    const current = sessions.get(sessionId(req));
    if (
      current &&
      req.get("X-Lock-Session") !== undefined &&
      req.get("X-Lock-Session") !== current.generation
    )
      return res.status(409).json({
        error:
          "Phiên tài khoản đã thay đổi. Tải lại trang trước khi đăng xuất.",
        code: "SESSION_CHANGED",
      });
    await closeSession(sessionId(req));
    res.clearCookie(COOKIE, cookieOptions);
    res.json({ data: true });
  });

  app.post(
    "/api/operations/:group/:method",
    authenticated,
    limited,
    async (req, res) => {
      const operation = operationMap.get(
        `${req.params.group}/${req.params.method}`,
      );
      if (!operation)
        return res.status(404).json({ error: "Chức năng không được hỗ trợ." });
      if (operation.media || operation.stream)
        return res.status(400).json({
          error:
            "Dùng màn hình tải tệp hoặc kết nối trực tiếp cho chức năng này.",
        });
      let values;
      try {
        values = validateOperation(operation, req.body);
      } catch (error) {
        return fail(res, error, 400);
      }
      try {
        const data = await run(req.account, async (client) => {
          if (operation.group === "client" && operation.method === "getDevice")
            return deviceSummary(client);
          if (
            operation.group === "client" &&
            operation.method === "setDevice"
          ) {
            client.setDevice(values);
            return deviceSummary(client);
          }
          if (
            operation.group === "chat" &&
            operation.method === "getSupportedReactions"
          )
            return sdk.ChatModule.getSupportedReactions();
          if (operation.method === "updateProfile")
            return client.user.updateProfile(values.profile);
          const target =
            operation.group === "client" ? client : client[operation.group];
          const args = operation.object
            ? [values]
            : operation.fields.map((field) => values[field.name]);
          const result = await target[operation.method](...args);
          if (
            operation.group === "moments" &&
            operation.method === "getMoments" &&
            result?.moments
          ) {
            result.moments = result.moments.map((moment) => ({
              ...moment,
              user_uid: values.filteredByUserId || null,
              authorVerified: Boolean(values.filteredByUserId),
            }));
          }
          return result;
        });
        sendResult(res, req.account, data);
      } catch (error) {
        fail(res, error, 502, req.account);
      }
    },
  );

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

  app.get("/api/chat/events", authenticated, limited, async (req, res) => {
    const parsed = z
      .string()
      .trim()
      .min(1)
      .max(150)
      .regex(/^[\w@.:-]+$/)
      .safeParse(req.query.otherUserId);
    if (!parsed.success) return fail(res, parsed.error, 400);
    const session = req.account;
    session.streams.forEach((close) => close());
    res
      .status(200)
      .set({ "Content-Type": "text/event-stream", Connection: "keep-alive" });
    res.flushHeaders();
    let controller;
    let ended = false;
    const send = (event, value) => {
      if (!ended && !res.destroyed)
        res.write(
          `event: ${event}\ndata: ${JSON.stringify(redact(value, collectSecrets(session)))}\n\n`,
        );
    };
    const heartbeat = setInterval(() => {
      if (!ended) res.write(": heartbeat\n\n");
    }, 15_000);
    const close = () => {
      if (ended) return;
      ended = true;
      clearInterval(heartbeat);
      controller?.close();
      session.streams.delete(close);
      res.end();
    };
    session.streams.add(close);
    res.once("close", close);
    send("status", { state: "connecting" });
    try {
      controller = await session.resource.client.chat.listenRealtime(
        parsed.data,
        (data) => send("message", data),
      );
      if (ended) {
        controller.close();
        return;
      }
      controller.on("open", () => send("status", { state: "connected" }));
      controller.on("close", () => send("status", { state: "reconnecting" }));
      controller.on("error", () =>
        send("error", { error: "Kết nối Locket bị gián đoạn." }),
      );
    } catch {
      send("error", { error: "Không thể kết nối chat Locket." });
      close();
    }
  });
  app.use("/api", (_req, res) =>
    res.status(404).json({ error: "Không tìm thấy API." }),
  );
  app.use((error, req, res, _next) => {
    if (res.headersSent) return res.end();
    fail(
      res,
      new Error(
        error.type === "entity.too.large"
          ? "Dữ liệu yêu cầu quá lớn."
          : "Yêu cầu không hợp lệ.",
      ),
      error.type === "entity.too.large" ? 413 : 400,
      req.account,
    );
  });
  return app;
}
