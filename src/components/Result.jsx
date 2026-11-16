import React from "react";
import { records, safeUrl } from "../lib/api.js";
import { Check } from "lucide-react";
import { Raw } from "./Raw.jsx";

export function Result({ value }) {
  const rows = records(value);
  return (
    <div className="result">
      <div className="result-heading">
        <Check size={16} /> Máy chủ đã phản hồi
      </div>
      {rows.length > 0 && (
        <div className="result-list">
          {rows.map((item, index) => {
            if (!item || typeof item !== "object")
              return <p key={index}>{String(item)}</p>;
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
              item.name ||
              item.uid ||
              item.id;
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
                  <Raw value={item} />
                </div>
              </article>
            );
          })}
        </div>
      )}
      <Raw value={value} />
    </div>
  );
}
