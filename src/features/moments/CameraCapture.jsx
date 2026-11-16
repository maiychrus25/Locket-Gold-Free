import React, { useEffect, useRef, useState } from "react";

export function CameraCapture({ onCapture, close, limit }) {
  const video = useRef(null);
  const stream = useRef(null);
  const recorder = useRef(null);
  const active = useRef(false);
  const capture = useRef(onCapture);
  const [ready, setReady] = useState(false);
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { capture.current = onCapture; }, [onCapture]);
  useEffect(() => {
    let cancelled = false;
    active.current = true;
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false }).then((next) => {
      if (cancelled) {
        next.getTracks().forEach((track) => track.stop());
        return;
      }
      stream.current = next;
      video.current.srcObject = next;
    }).catch(() => {
      if (!cancelled) setError("Không mở được camera. Anh có thể cấp quyền trong trình duyệt hoặc chọn tệp từ thiết bị.");
    });
    return () => {
      cancelled = true;
      active.current = false;
      if (recorder.current?.state !== "inactive" && recorder.current) recorder.current.stop();
      stream.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);
  function photo() {
    if (!ready || processing) return;
    setProcessing(true);
    const canvas = document.createElement("canvas");
    canvas.width = video.current.videoWidth;
    canvas.height = video.current.videoHeight;
    canvas.getContext("2d").drawImage(video.current, 0, 0);
    canvas.toBlob((blob) => {
      if (!active.current) return;
      setProcessing(false);
      if (blob) capture.current(new File([blob], "camera-photo.jpg", { type: "image/jpeg" }));
      else setError("Không chụp được ảnh. Vui lòng thử lại.");
    }, "image/jpeg", 0.92);
  }
  function record() {
    if (recording) {
      setProcessing(true);
      recorder.current.stop();
      return;
    }
    try {
      const mimeType = ["video/webm;codecs=vp8", "video/webm", "video/mp4"].find(type => MediaRecorder.isTypeSupported(type));
      if (!mimeType) throw new Error("unsupported");
      const next = new MediaRecorder(stream.current, { mimeType });
      recorder.current = next;
      const chunks = [];
      let size = 0;
      let exceeded = false;
      next.ondataavailable = ({ data }) => {
        if (!active.current || exceeded) return;
        size += data.size;
        if (size > limit) {
          exceeded = true;
          chunks.length = 0;
          if (next.state !== "inactive") next.stop();
          setError("Video vượt giới hạn 32 MB. Hãy quay đoạn ngắn hơn.");
        } else if (data.size) chunks.push(data);
      };
      next.onerror = () => {
        exceeded = true;
        if (next.state !== "inactive") next.stop();
        if (active.current) {
          setRecording(false);
          setProcessing(false);
          setError("Không ghi được video. Vui lòng chọn video từ thiết bị.");
        }
      };
      next.onstop = () => {
        if (!active.current) return;
        setRecording(false);
        setProcessing(false);
        if (exceeded || !size) return;
        const type = mimeType.split(";")[0];
        capture.current(new File(chunks, type === "video/mp4" ? "camera-video.mp4" : "camera-video.webm", { type }));
      };
      next.start(250);
      setError("");
      setRecording(true);
    } catch {
      setError("Trình duyệt không hỗ trợ quay video này. Hãy chọn video từ thiết bị.");
    }
  }
  return <section className="creator-camera" aria-label="Camera trực tiếp">
    <div className="creator-viewfinder">
      <video ref={video} autoPlay muted playsInline onLoadedData={() => setReady(true)} aria-label="Xem trước camera" />
      <span className="creator-live">{recording ? "● ĐANG QUAY" : "CAMERA"}</span>
    </div>
    <p className="muted">{recording ? "Bấm dừng để dùng video." : "Chụp ảnh hoặc quay video không âm thanh. Tệp chỉ được gửi khi anh bấm đăng."}</p>
    <div className="creator-actions">
      <button type="button" className="button primary" disabled={!ready || recording || processing} onClick={photo}>Chụp ảnh</button>
      {typeof MediaRecorder !== "undefined" && <button type="button" className="button secondary" disabled={!ready || processing} onClick={record}>{recording ? "Dừng và dùng video" : "Quay video"}</button>}
      <button type="button" className="button secondary" onClick={close}>Đóng camera</button>
    </div>
    {error && <p role="alert" className="error">{error}</p>}
  </section>;
}
