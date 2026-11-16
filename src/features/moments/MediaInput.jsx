import React, { useRef, useState, useEffect } from "react";
import { CameraCapture } from "./CameraCapture.jsx";
import { CaptionPreview } from "./CaptionPreview.jsx";
import { Upload, Plus } from "lucide-react";

export function MediaInput({ operation, files, setFiles, limit, disabled, values = {}, presets = [] }) {
  const input = useRef(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const isPost = operation.media === "post";
  const uploadLimit = Math.min(limit || 32 * 1024 * 1024, 32 * 1024 * 1024);
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
    if (!file) { setPreview(""); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  useEffect(() => {
    if (disabled) setCameraOpen(false);
  }, [disabled]);
  function choose(list) {
    const next = list[0];
    if (!next || disabled) return;
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
    if (next.size > uploadLimit) {
      setError(`Tệp vượt giới hạn ${Math.round(uploadLimit / 1024 / 1024)} MB.`);
      return;
    }
    setError("");
    setCameraOpen(false);
    setFiles([next]);
  }
  return (
    <div className={`wide ${isPost ? "creator-media" : ""}`}>
      <div
        className={`dropzone ${file ? "has-file" : ""}`}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          if (!disabled) choose(event.dataTransfer.files);
        }}
      >
        {file && preview ? (
          <div className={isPost ? "preview creator-viewfinder" : "preview"}>
            {file.type.startsWith("video/") ? (
              <video src={preview} controls />
            ) : (
              <img src={preview} alt="Xem trước khoảnh khắc" />
            )}
            {isPost ? <><span className="creator-live">XEM TRƯỚC · LIVE</span><CaptionPreview values={values} presets={presets} /></> : <span>{file.name}</span>}
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
        {isPost && file && <p className="creator-file-info"><strong>{file.name}</strong><span>{file.type.startsWith("video/") ? "Video" : "Ảnh"} · {(file.size / 1024 / 1024).toFixed(2)} MB</span></p>}
        <div className={isPost ? "creator-actions" : undefined}>
        <button
          type="button"
          className="button secondary"
          disabled={disabled}
          onClick={() => input.current.click()}
        >
          <Plus size={16} />
          {file ? "Chọn tệp khác" : "Chọn từ thiết bị"}
        </button>
        {isPost && file && <button type="button" className="button secondary" disabled={disabled} onClick={() => {
          setCameraOpen(false);
          setFiles([]);
          setError("");
          input.current.value = "";
        }}>Xóa tệp</button>}
        {isPost && !cameraOpen && navigator.mediaDevices?.getUserMedia && <button type="button" className="button secondary" disabled={disabled} onClick={() => setCameraOpen(true)}>Mở camera</button>}
        </div>
        <input
          ref={input}
          type="file"
          accept={
            videoOnly ? "video/*" : imageOnly ? "image/*" : "image/*,video/*"
          }
          hidden
          disabled={disabled}
          onChange={(event) => { choose(event.target.files); event.target.value = ""; }}
        />
      </div>
      {isPost && cameraOpen && !disabled && <CameraCapture limit={uploadLimit} onCapture={(next) => choose([next])} close={() => setCameraOpen(false)} />}
      {operation.media === "post" && file?.type.startsWith("video/") && (
        <label className="field" key={preview}>
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
                (thumbnail.size > uploadLimit)
              ) {
                event.target.value = "";
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
