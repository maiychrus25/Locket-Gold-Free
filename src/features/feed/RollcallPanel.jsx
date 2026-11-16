import React, { useEffect, useState } from 'react';
import { request, records, safeUrl } from '../../lib/api.js';
import { unwrap, imageUrl, postId } from '../../lib/data.js';
import { friendName } from "./FriendSelect.jsx";
import { isoWeek, localDate, momentDate } from '../../lib/memories.js';

export function RollcallPanel({ authenticated = true }) {
  const [selectedDate, setSelectedDate] = useState(() => localDate());
  const [reload, setReload] = useState(0);
  const [result, setResult] = useState({ key: '', items: [], error: '' });
  const week = isoWeek(selectedDate);
  const year = week?.year;
  const weekOfYear = week?.weekOfYear;
  const valid = year >= 2020 && year <= 2100;
  const key = `${year}-${weekOfYear}-${reload}`;
  useEffect(() => {
    if (!authenticated || !valid) return;
    let active = true;
    request('/api/operations/moments/getRollcallPosts', { year, weekOfYear })
      .then(response => { if (active) setResult({key, items: records(unwrap(response)), error: ''}); })
      .catch(error => { if (active) setResult({key, items: [], error: error.message}); });
    return () => { active = false; };
  }, [authenticated, valid, year, weekOfYear, key]);
  if (!authenticated) return <p>Kết nối tài khoản để xem Rollcall.</p>;
  const pending = valid && result.key !== key;
  return <div className="rollcall-panel">
    <div className="memory-filters">
      <label>Ngày trong tuần Rollcall<input type="date" min="2020-01-01" max="2100-12-31" value={selectedDate} onChange={event => setSelectedDate(event.target.value)} /></label>
      <button className="button secondary" disabled={!valid || pending} onClick={() => setReload(value => value + 1)}>Tải lại Rollcall</button>
    </div>
    {valid ? <h3>Tuần {weekOfYear} · {year}</h3> : <p role="alert">Chọn ngày hợp lệ trong khoảng năm 2020–2100.</p>}
    <p className="muted">Chia sẻ bộ ảnh tuần trong ứng dụng Locket; tại đây bạn có thể xem lại.</p>
    {pending && <p role="status">Đang tải Rollcall…</p>}
    {valid && !pending && result.error && <p role="alert">Chưa tải được bộ ảnh tuần. Vui lòng thử lại.</p>}
    {valid && !pending && !result.error && !result.items.length && <p>Chưa có khoảnh khắc Rollcall trong tuần này.</p>}
    <div className="daily-grid memory-layout memory-grid">{valid && !pending && result.items.map((item, index) => {
      const image = imageUrl(item);
      const video = safeUrl(item.video_url || item.videoUrl || item.video?.url);
      const date = momentDate(item);
      const name = friendName(item.user || item.author || item.sender);
      return <article className="moment-card" key={postId(item) || index}>
        {video ? <video controls preload="metadata" src={video} poster={image} /> : image && <img src={image} alt={typeof item.caption === 'string' ? item.caption : 'Khoảnh khắc Rollcall'} loading="lazy" />}
        <div className="moment-body"><h3>{typeof name === 'string' ? name : 'Người dùng'}</h3>
          {date && <time className="muted" dateTime={date.toISOString()}>{date.toLocaleString('vi-VN')}</time>}
          {typeof item.caption === 'string' && <p>{item.caption}</p>}
        </div>
      </article>;
    })}</div>
  </div>;
}
