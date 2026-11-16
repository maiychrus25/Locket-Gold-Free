import React, { useRef, useState, useEffect } from "react";
import { Upload, Plus } from "lucide-react";

export function MediaInput({ operation, files, setFiles, limit, disabled }) {
  const input = useRef(null);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState("");
  const file = files[0];
  const videoOnly = [
    "extractThumbnail",
    "optimizeVideo",
    "uploadVideo",
  ].includes(operation.media);
  const imageOnly = ["updateAvatar", "uploadAvatar", "uploadImage"].includes(
    operation.media,
  );
  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  function choose(list) {
    const next = list[0];
    if (!next) return;
    if (
      !(videoOnly
        ? next.type.startsWith("video/")
        : imageOnly
          ? next.type.startsWith("image/")
          : /^(image|video)\//.test(next.type))
    ) {
      setError("Vui lòng chọn đúng định dạng ảnh hoặc video.");
      return;
    }
    if (limit && next.size > limit) {
      setError(`Tệp vượt giới hạn ${Math.round(limit / 1024 / 1024)} MB.`);
      return;
    }
    setError("");
    setFiles([next]);
  }
  return (
    <div className="wide">
      <div
        className={`dropzone ${file ? "has-file" : ""}`}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          if (!disabled) choose(event.dataTransfer.files);
        }}
      >
        {file && preview ? (
          <div className="preview">
            {file.type.startsWith("video/") ? (
              <video src={preview} controls />
            ) : (
              <img src={preview} alt="Xem trước khoảnh khắc" />
            )}
            <span>{file.name}</span>
          </div>
        ) : (
          <>
            <div className="upload-icon">
              <Upload size={28} />
            </div>
            <h3>Thả khoảnh khắc vào đây</h3>
            <p>
              {videoOnly
                ? "Video"
                : imageOnly
                  ? "Hình ảnh"
                  : "Hình ảnh hoặc video"}{" "}
              từ thiết bị của bạn
              {limit ? ` · tối đa ${Math.round(limit / 1024 / 1024)} MB` : ""}
            </p>
          </>
        )}
        <button
          type="button"
          className="button secondary"
          disabled={disabled}
          onClick={() => input.current.click()}
        >
          <Plus size={16} />
          {file ? "Chọn tệp khác" : "Chọn từ thiết bị"}
        </button>
        <input
          ref={input}
          type="file"
          accept={
            videoOnly ? "video/*" : imageOnly ? "image/*" : "image/*,video/*"
          }
          hidden
          onChange={(event) => choose(event.target.files)}
        />
      </div>
      {operation.media === "post" && file?.type.startsWith("video/") && (
        <label className="field">
          <span>Ảnh bìa video riêng (tuỳ chọn)</span>
          <input
            type="file"
            accept="image/*"
            disabled={disabled}
            onChange={(event) => {
              const thumbnail = event.target.files[0];
              if (!thumbnail) {
                setFiles([file]);
                return;
              }
              if (
                !thumbnail.type.startsWith("image/") ||
                (limit && thumbnail.size > limit)
              ) {
                setError("Ảnh bìa không hợp lệ hoặc vượt giới hạn dung lượng.");
                return;
              }
              setError("");
              setFiles([file, thumbnail]);
            }}
          />
          {files[1] && <small>{files[1].name}</small>}
        </label>
      )}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
    </div>
  );
}
