import React, { useEffect, useState } from "react";
import { RefreshCw, Save, UserRound } from "lucide-react";
import { request } from "../../lib/api.js";
import { imageUrl, personName, unwrap } from "../../lib/data.js";
import { useOperation } from "../../lib/useOperation.js";
import { Feedback } from "../../components/Feedback.jsx";
import { OperationForm } from "../tools/OperationForm.jsx";

export function ProfilePanel({ session, workspaceProps }) {
  const state = useOperation();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const draftKey = "profile.editor";
  const edits = workspaceProps.drafts[draftKey]?.values || {};
  const fields = {
    first_name: profile?.first_name || profile?.firstName || "",
    last_name: profile?.last_name || profile?.lastName || "",
    birthdate: typeof profile?.birthdate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(profile.birthdate) ? profile.birthdate : "",
    ...edits,
  };
  const reportError = state.setError;
  useEffect(() => {
    let cancelled = false;
    request("/api/operations/user/getProfile", {})
      .then(response => {
        if (cancelled) return;
        const value = unwrap(response);
        setProfile(value);
      })
      .catch(error => { if (!cancelled) reportError(error.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [reportError]);
  const avatarOperation = workspaceProps.catalog.operations.find(operation => operation.group === "user" && operation.method === "updateAvatar");
  const avatarKey = "user.updateAvatar";
  const avatar = imageUrl(profile);
  async function save(event) {
    event.preventDefault();
    const submittedDraft = workspaceProps.drafts[draftKey];
    const changes = Object.fromEntries(Object.entries(edits).map(([key, value]) => [key, value.trim()]).filter(([, value]) => value));
    if (!Object.keys(changes).length) {
      state.setError("Nhập ít nhất một thông tin để cập nhật.");
      return;
    }
    const result = await state.run("user", "updateProfile", { profile: changes });
    if (result) {
      setProfile(previous => ({ ...previous, ...changes }));
      workspaceProps.setDrafts(previous => previous[draftKey] === submittedDraft ? { ...previous, [draftKey]: undefined } : previous);
      state.setNotice("Đã cập nhật hồ sơ.");
    }
  }
  return (
    <div className="profile-editor">
      <div className="profile-identity">
        <span className="profile-portrait">{avatar ? <img src={avatar} alt="Ảnh đại diện của bạn" /> : <UserRound size={34} />}</span>
        <div><span className="section-kicker">GÓC NHỎ CỦA BẠN</span><h3>{profile ? personName(profile) : "Hồ sơ Locket"}</h3><p>{profile?.username ? `@${profile.username}` : session.user?.email}</p></div>
        <span className="free-label">Miễn phí</span>
      </div>
      <Feedback state={state} />
      {loading && <p role="status"><RefreshCw className="spin" size={16} /> Đang tải hồ sơ…</p>}
      <form onSubmit={save} className="profile-fields">
        {[["first_name", "Tên của bạn", "given-name"], ["last_name", "Họ của bạn", "family-name"], ["birthdate", "Sinh nhật", "bday"]].map(([key, label, autoComplete]) => (
          <label className="field" key={key}><span>{label}</span><input type={key === "birthdate" ? "date" : "text"} maxLength={key === "birthdate" ? undefined : 100} value={fields[key]} autoComplete={autoComplete} disabled={loading || state.pending} onChange={event => {
            const value = event.target.value;
            workspaceProps.setDrafts(previous => ({ ...previous, [draftKey]: { values: { ...previous[draftKey]?.values, [key]: value } } }));
          }} /></label>
        ))}
        <div className="profile-save"><button className="button primary" disabled={loading || state.pending}><Save size={17} />{state.pending ? "Đang lưu…" : "Lưu hồ sơ"}</button><span className="muted">Thông tin trống được giữ nguyên.</span></div>
      </form>
      {avatarOperation && <details className="advanced-disclosure"><summary>Đổi ảnh đại diện</summary><OperationForm {...workspaceProps} operation={avatarOperation} draft={workspaceProps.drafts[avatarKey]} updateDraft={draft => workspaceProps.setDrafts(previous => ({ ...previous, [avatarKey]: draft }))} /></details>}
    </div>
  );
}
