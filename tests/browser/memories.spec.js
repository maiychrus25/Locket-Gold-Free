import { test, expect } from '@playwright/test';
async function login(page) {
  await page.request.post('/api/auth/login', {headers: {'X-Lock-Client':'web'}, data: {email:'test@example.com', password:'test-password'}});
  await page.goto('/');
}
test.afterEach(async ({page}, info) => {
  await page.screenshot({path:info.outputPath('memories.png'), fullPage:true});
  await page.setViewportSize({width:320, height:780});
  const widths = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
  expect(widths[0]).toBeLessThanOrEqual(widths[1] + 1);
  await page.screenshot({path:info.outputPath('memories-320.png'), fullPage:true});
  await page.request.post('/api/auth/logout', {headers:{'X-Lock-Client':'web'}, data:{}});
});

test('memory filters stay page-local, preserve cursor and unknown author boundaries', async ({page}) => {
  const calls = [];
  await page.route('**/api/operations/moments/getMoments', route => {
    calls.push(route.request().postDataJSON());
    return route.fulfill({json:{data:{moments:[{canonical_uid:'unknown',caption:'January memory',created_at:'1704110400',user_uid:'test-account-uid',authorVerified:false}],nextPageToken:'cursor-one'}}});
  });
  await login(page);
  await page.getByRole('tab',{name:'Lịch sử của tôi',exact:true}).click();
  await expect(page.locator('.moment-card')).toContainText('January memory');
  await expect(page.locator('.moment-card').getByLabel('Bình luận khoảnh khắc')).toHaveCount(0);
  await expect(page.getByRole('button',{name:'Xoá',exact:true})).toHaveCount(0);
  await page.getByLabel('Tháng kỷ niệm').fill('2024-02');
  await expect(page.locator('.moment-card')).toHaveCount(0);
  await page.getByRole('button',{name:'Xoá bộ lọc ngày'}).click();
  await page.getByRole('button',{name:'Dạng danh sách'}).click();
  await expect(page.locator('.moment-card')).toHaveCount(1);
  await page.getByRole('button',{name:'Trang tiếp theo',exact:true}).click();
  await expect.poll(() => calls.length).toBe(2);
  expect(calls[1].pageToken).toBe('cursor-one');
  await page.route('**/api/operations/friends/getAllFriends', route => route.fulfill({json:{data:[{uid:'other-user',first_name:'Mai'}]}}));
  await page.getByRole('button',{name:'Chọn từ bạn bè',exact:true}).click();
  await page.getByLabel('Khoảnh khắc của',{exact:true}).selectOption({label:'Mai'});
  await expect(page.getByRole('button',{name:'Trang tiếp theo',exact:true})).toHaveCount(0);
});
test('emoji payload and viewers dialog use returned safe records with loading and errors', async ({page}) => {
  await page.route('**/api/operations/moments/getLatest', route => route.fulfill({json:{data:[{canonical_uid:'moment-one',caption:'Hello',user:'friend'}]}}));
  await page.route('**/api/operations/moments/react', route => route.fulfill({json:{data:{success:true}}}));
  let resolveViews;
  await page.route('**/api/operations/moments/getViews', async route => {
    await new Promise(resolve => { resolveViews = resolve; });
    await route.fulfill({json:{data:{moment_views:[{user:{uid:'viewer-uid',displayName:'Linh',avatar_url:'javascript:alert(1)'}}]}}});
  });
  await login(page);
  await page.getByLabel('Chọn cảm xúc').selectOption('😂');
  const reaction = page.waitForRequest('**/api/operations/moments/react');
  await page.getByRole('button',{name:'Gửi cảm xúc',exact:true}).click();
  expect((await reaction).postDataJSON()).toEqual({momentUid:'moment-one',reaction:'😂',fromMemory:false});
  await page.getByRole('button',{name:'Xem lượt xem',exact:true}).click();
  await expect(page.getByRole('dialog')).toContainText('Đang tải lượt xem');
  await expect.poll(() => typeof resolveViews).toBe('function');
  resolveViews();
  await expect(page.getByRole('dialog')).toContainText('Linh');
  await expect(page.getByRole('dialog').locator('img')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await page.route('**/api/operations/moments/getViews', route => route.fulfill({status:502,json:{error:'Views unavailable'}}));
  const rejectedViews = page.waitForResponse('**/api/operations/moments/getViews');
  await page.getByRole('button',{name:'Xem lượt xem',exact:true}).click();
  expect((await rejectedViews).status()).toBe(502);
  await expect(page.getByRole('dialog')).toContainText('Chưa tải được lượt xem');
  await page.keyboard.press('Escape');
  await page.route('**/api/operations/moments/getViews', route => route.fulfill({json:{data:{moment_views:[]}}}));
  await page.getByRole('button',{name:'Xem lượt xem',exact:true}).click();
  await expect(page.getByRole('dialog')).toContainText('Chưa có ai xem khoảnh khắc này');
});

test('Rollcall uses ISO week-year, ignores old weeks and shows empty and error states', async ({page}) => {
  const calls = [];
  let finishOld;
  await page.route('**/api/operations/moments/getRollcallPosts', async route => {
    const payload = route.request().postDataJSON();
    calls.push(payload);
    if (payload.year === 2020) {
      await new Promise(resolve => { finishOld = resolve; });
      return route.fulfill({json:{data:{posts:[{uid:'old',caption:'Old week'}]}}});
    }
    if (payload.year === 2025) return route.fulfill({json:{data:{posts:[{uid:'new',caption:'New week',user:'friend'}]}}});
    if (payload.year === 2023) return route.fulfill({status:502,json:{error:'Rollcall unavailable'}});
    return route.fulfill({json:{data:{posts:[]}}});
  });
  await login(page);
  await page.getByRole('tab', {name:'Rollcall', exact:true}).click();
  const panel = page.locator('.rollcall-panel');
  await expect(panel).toContainText('Chưa có khoảnh khắc Rollcall');
  await panel.getByLabel('Ngày trong tuần Rollcall').fill('2021-01-01');
  await expect.poll(() => typeof finishOld).toBe('function');
  expect(calls.at(-1)).toEqual({year:2020,weekOfYear:53});
  await panel.getByLabel('Ngày trong tuần Rollcall').fill('2024-12-30');
  await expect(panel.locator('.moment-card')).toContainText('New week');
  expect(calls.at(-1)).toEqual({year:2025,weekOfYear:1});
  finishOld();
  await expect(panel.locator('.moment-card')).not.toContainText('Old week');
  const rejectedRollcall = page.waitForResponse('**/api/operations/moments/getRollcallPosts');
  await panel.getByLabel('Ngày trong tuần Rollcall').fill('2023-06-01');
  expect((await rejectedRollcall).status()).toBe(502);
  await expect(panel.getByRole('alert')).toContainText('Chưa tải được bộ ảnh tuần');
  await panel.getByLabel('Ngày trong tuần Rollcall').fill('');
  await expect(panel.getByRole('alert')).toContainText('Chọn ngày hợp lệ');
});

test('closing viewers prevents a late response entering the next moment dialog', async ({page}) => {
  await page.route('**/api/operations/moments/getLatest', route => route.fulfill({json:{data:[
    {canonical_uid:'first',caption:'First moment'}, {canonical_uid:'second',caption:'Second moment'},
  ]}}));
  let finishFirst;
  await page.route('**/api/operations/moments/getViews', async route => {
    if (route.request().postDataJSON().momentUid === 'first') {
      await new Promise(resolve => { finishFirst = resolve; });
      return route.fulfill({json:{data:{moment_views:[{uid:'first-viewer',first_name:'An'}]}}});
    }
    return route.fulfill({json:{data:{moment_views:[{uid:'second-viewer',first_name:'Bình'}]}}});
  });
  await login(page);
  await page.locator('.moment-card').filter({hasText:'First moment'}).getByRole('button',{name:'Xem lượt xem',exact:true}).click();
  await expect.poll(() => typeof finishFirst).toBe('function');
  await page.keyboard.press('Escape');
  await page.locator('.moment-card').filter({hasText:'Second moment'}).getByRole('button',{name:'Xem lượt xem',exact:true}).click();
  await expect(page.getByRole('dialog')).toContainText('Bình');
  const lateResponse = page.waitForResponse(response => response.url().endsWith('/getViews') && response.request().postDataJSON().momentUid === 'first');
  finishFirst();
  await lateResponse;
  await expect(page.getByRole('dialog')).not.toContainText('An');
  await expect(page.getByRole('dialog')).toContainText('Bình');
});

test('unrecognized views show honest availability and real count without technical data', async ({page}) => {
  await page.route('**/api/operations/moments/getLatest', route => route.fulfill({json:{data:[{canonical_uid:'shape-check',caption:'View response'}]}}));
  // Unknown fixtures must not be normalized into invented people or false empty states.
  const responses = [{count:3}, {moment_views:{'viewer-one':{seen_at:'2024-01-01'}}}, {'viewer-two':true, reactions:[{sender:'reaction-user',emoji:'❤️'}]}];
  await page.route('**/api/operations/moments/getViews', route => route.fulfill({json:{data:responses.shift()}}));
  await login(page);
  for (let index = 0; index < 3; index++) {
    await page.getByRole('button',{name:'Xem lượt xem',exact:true}).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('Đang tải lượt xem…')).toHaveCount(0);
    await expect(dialog).not.toContainText('Chưa có lượt xem được trả về');
    await expect(dialog).toContainText('Chưa thể hiển thị danh sách người xem');
    if (index === 0) await expect(dialog).toContainText('3 lượt xem');
    await expect(dialog.locator('pre')).toHaveCount(0);
    await expect(dialog).not.toContainText('viewer-');
    await expect(dialog.locator('.memory-viewers li')).toHaveCount(0);
    await page.keyboard.press('Escape');
  }
});

test('daily chat selects actual friends and keeps identities out of visible content', async ({page}) => {
  await page.route('**/api/operations/friends/getAllFriends', route => route.fulfill({json:{data:[{uid:'private-friend-id',first_name:'Linh'}]}}));
  await page.route('**/api/operations/chat/getConversations', route => route.fulfill({json:{data:[{peer_uid:'private-conversation-peer',conversation_id:'private-conversation-id'}]}}));
  await page.route('**/api/operations/chat/getMessages', route => route.fulfill({json:{data:[]}}));
  await page.route('**/api/operations/chat/sendMessage', route => route.fulfill({json:{data:{ok:true}}}));
  await login(page);
  await page.getByRole('navigation').getByRole('button',{name:'Tin nhắn',exact:true}).click();
  const chat = page.locator('.chat-layout');
  const history = page.waitForRequest('**/api/operations/chat/getMessages');
  await chat.locator('.conversation').click();
  expect((await history).postDataJSON()).toEqual({otherUserId:'private-conversation-peer',conversationId:'private-conversation-id',fetchServer:true});
  await expect(chat).not.toContainText('private-conversation');
  await chat.getByRole('button',{name:'Chọn từ bạn bè',exact:true}).click();
  await chat.getByLabel('Người nhận tin nhắn', {exact:true}).selectOption({label:'Linh'});
  await chat.getByRole('textbox',{name:'Tin nhắn',exact:true}).fill('Chào Linh');
  await page.route('**/api/operations/chat/sendMessage', route => route.fulfill({status:503,json:{error:'Internal API failure'}}));
  const rejected = page.waitForResponse('**/api/operations/chat/sendMessage');
  await chat.getByRole('button',{name:'Gửi tin nhắn',exact:true}).click();
  expect((await rejected).status()).toBe(503);
  await expect(chat.getByRole('textbox',{name:'Tin nhắn',exact:true})).toHaveValue('Chào Linh');
  await expect(page.getByRole('alert').first()).toContainText('Kết nối đang gián đoạn. Nếu vừa gửi nội dung, hãy kiểm tra lại trước khi gửi lần nữa.');
  await page.route('**/api/operations/chat/sendMessage', route => route.fulfill({json:{data:{ok:true}}}));
  const sent = page.waitForRequest('**/api/operations/chat/sendMessage');
  await chat.getByRole('button',{name:'Gửi tin nhắn',exact:true}).click();
  expect((await sent).postDataJSON()).toEqual({receiverUid:'private-friend-id',text:'Chào Linh'});
  await expect(chat).not.toContainText('private-friend-id');
  await expect(chat.locator('pre')).toHaveCount(0);
});

test('friend requests retain direction while identifiers and raw data stay hidden', async ({page}) => {
  await page.route('**/api/operations/friends/getFriendRequests', route => route.fulfill({json:{data:{incoming_requests:[{uid:'hidden-incoming',first_name:'Lan'}],outgoing_requests:[{uid:'hidden-outgoing',first_name:'Nam'}]}}}));
  await page.route('**/api/operations/friends/acceptRequest', route => route.fulfill({json:{data:{ok:true}}}));
  await login(page);
  await page.getByRole('navigation').getByRole('button',{name:'Bạn bè',exact:true}).click();
  await page.getByRole('button',{name:'Lời mời',exact:true}).click();
  const incoming = page.locator('.person-card').filter({hasText:'Lan'});
  const outgoing = page.locator('.person-card').filter({hasText:'Nam'});
  await expect(incoming).toContainText('Lời mời đến');
  await expect(outgoing).toContainText('Lời mời đã gửi');
  await expect(outgoing.getByRole('button',{name:'Chấp nhận',exact:true})).toBeDisabled();
  const accepted = page.waitForRequest('**/api/operations/friends/acceptRequest');
  await incoming.getByRole('button',{name:'Chấp nhận',exact:true}).click();
  expect((await accepted).postDataJSON()).toEqual({userUid:'hidden-incoming'});
  await expect(page.locator('.people-list')).not.toContainText('hidden-');
  await expect(page.locator('.people-list pre')).toHaveCount(0);
});

test('live chat shows message text and hides protocol status and identifiers', async ({page}) => {
  await page.addInitScript(() => {
    window.EventSource = class {
      constructor(url) { this.url = url; this.listeners = {}; window.testStream = this; }
      addEventListener(name, callback) { this.listeners[name] = callback; }
      close() { this.closed = true; }
    };
  });
  await page.route('**/api/operations/friends/getAllFriends', route => route.fulfill({json:{data:[{uid:'hidden-live-person',first_name:'Linh'}]}}));
  await login(page);
  await page.getByRole('navigation').getByRole('button',{name:'Tin nhắn',exact:true}).click();
  const live = page.locator('.live-chat');
  await live.getByRole('button',{name:'Chọn từ bạn bè',exact:true}).click();
  await live.getByLabel('Người bạn trò chuyện trực tiếp',{exact:true}).selectOption({label:'Linh'});
  await live.getByRole('button',{name:'Kết nối',exact:true}).click();
  await expect.poll(() => page.evaluate(() => window.testStream?.url)).toContain('otherUserId=hidden-live-person');
  await page.evaluate(() => {
    window.testStream.listeners.status({data:JSON.stringify({status:'SSE internal UUID hidden-live-person'})});
    window.testStream.listeners.message({data:JSON.stringify({text:'Chào bạn hôm nay',sender_uid:'hidden-live-person'})});
  });
  await expect(live).toContainText('Chào bạn hôm nay');
  await expect(live).not.toContainText('hidden-live-person');
  await expect(live).not.toContainText('SSE');
  await expect(live.locator('pre')).toHaveCount(0);
  await live.getByRole('button',{name:'Dừng',exact:true}).click();
  await page.evaluate(() => window.testStream.listeners.message({data:JSON.stringify({text:'Late message'})}));
  await expect(live).not.toContainText('Late message');
});

test('peer-only conversations resolve names and Alice to Bob keeps the matching cached identity after reload', async ({page}) => {
  let omitBob = false;
  await page.route('**/api/operations/friends/getAllFriends', route => route.fulfill({json:{data:omitBob ? [{uid:'alice-id',first_name:'Alice'}] : [{uid:'alice-id',first_name:'Alice'},{uid:'bob-id',first_name:'Bob'}]}}));
  await page.route('**/api/operations/chat/getConversations', route => route.fulfill({json:{data:[{conversation_id:'alice-chat',peer_uid:'alice-id'},{conversation_id:'bob-chat',peer_uid:'bob-id'},{conversation_id:'unknown-chat',peer_uid:'unknown-id'}]}}));
  await page.route('**/api/operations/chat/getMessages', route => route.fulfill({json:{data:[]}}));
  await page.route('**/api/operations/chat/sendMessage', route => route.fulfill({json:{data:{ok:true}}}));
  await login(page);
  await page.getByRole('navigation').getByRole('button',{name:'Tin nhắn',exact:true}).click();
  const chat = page.locator('.chat-layout');
  await expect(chat.locator('.conversation').nth(0)).toContainText('Alice');
  await expect(chat.locator('.conversation').nth(1)).toContainText('Bob');
  await chat.getByRole('button',{name:'Chọn từ bạn bè',exact:true}).click();
  await chat.locator('.conversation').nth(0).click();
  const draft = chat.getByRole('textbox',{name:'Tin nhắn',exact:true});
  await draft.fill('Keep this draft');
  const recipient = chat.getByLabel('Người nhận tin nhắn',{exact:true});
  await recipient.selectOption({label:'Bob'});
  omitBob = true;
  await chat.getByRole('button',{name:'Chọn từ bạn bè',exact:true}).click();
  await expect(recipient.locator('option:checked')).toHaveText('Bob');
  await expect(recipient).toHaveValue('bob-id');
  await expect(draft).toHaveValue('Keep this draft');
  const sent = page.waitForRequest('**/api/operations/chat/sendMessage');
  await chat.getByRole('button',{name:'Gửi tin nhắn',exact:true}).click();
  expect((await sent).postDataJSON()).toEqual({receiverUid:'bob-id',text:'Keep this draft'});
  await chat.locator('.conversation').nth(2).click();
  await draft.fill('Unresolved recipient draft');
  await expect(chat.getByRole('button',{name:'Gửi tin nhắn',exact:true})).toBeDisabled();
  await expect(draft).toHaveValue('Unresolved recipient draft');
});
