import { fail } from "../session/context.js";

export function installErrorHandlers(app) {
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
}
