import React from "react";
import { records, safeUrl } from "../lib/api.js";
import { Check } from "lucide-react";

export function Result({ value }) {
  const rows = records(value);
  return (
    <div className="result">
      <div className="result-heading">
        <Check size={16} /> Đã hoàn tất.
      </div>
      {rows.length > 0 && (
        <div className="result-list">
          {rows.map((item, index) => {
            if (!item || typeof item !== "object")
              return null;
            const picture = safeUrl(
              item.thumbnailUrl ||
                item.thumbnail_url ||
                item.imageUrl ||
                item.image_url ||
                item.photoURL ||
                item.avatar,
            );
            const name =
              item.displayName ||
              item.display_name ||
              item.username ||
              item.name;
            return (
              <article className="record" key={item.id || index}>
                {picture && <img src={picture} alt="" loading="lazy" />}
                <div>
                  <strong>
                    {typeof name === "string" ? name : `Mục ${index + 1}`}
                  </strong>
                  {typeof (item.caption || item.text || item.message) ===
                    "string" && (
                    <p>{item.caption || item.text || item.message}</p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
