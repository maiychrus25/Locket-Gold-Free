import sdk from "locket.js";
import captionPresets from "locket.js/caption_presets.json" with { type: "json" };
import { publicOperations } from "../../shared/operations.js";
import { UPLOAD_LIMIT } from "../limits.js";

export function registerCatalogRoutes(app, { ffmpeg }) {
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
}
