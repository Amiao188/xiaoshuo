const TAGS = ['悬疑', '姐弟恋', '白月光', '大女主', '病娇', '豪门霸总', '双男主', '双女主', '先婚后爱', '追妻火葬场', '娱乐圈', '甜宠', '虐恋', '先虐后甜'];
const dateInput = document.getElementById('publish-date');
const tagSelect = document.getElementById('default-tag');
const tagMapInput = document.getElementById('tag-map-input');
let tagMap = new Map();

dateInput.value = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' });
tagSelect.innerHTML = TAGS.map(tag => `<option value="${tag}">${tag}</option>`).join('');

const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const localDate = value => new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(`${value.replace(' ', 'T')}Z`));
const chinaDate = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' });
const normalizeFileName = value => String(value || '').trim().replace(/^.*[\\/]/, '').toLowerCase();

async function request(url, options) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || '请求失败');
  return data;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === '"') {
      if (quoted && text[index + 1] === '"') { cell += '"'; index += 1; } else quoted = !quoted;
    } else if (char === ',' && !quoted) {
      row.push(cell); cell = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && text[index + 1] === '\n') index += 1;
      row.push(cell);
      if (row.some(value => value.trim())) rows.push(row);
      row = []; cell = '';
    } else {
      cell += char;
    }
  }
  row.push(cell);
  if (row.some(value => value.trim())) rows.push(row);
  return rows;
}

async function loadTagMap() {
  const status = document.getElementById('tag-map-status');
  const file = tagMapInput.files[0];
  tagMap = new Map();
  if (!file) { status.textContent = '上传下载器生成的标签清单.csv，可自动逐篇匹配标签。'; return; }
  try {
    const rows = parseCsv((await file.text()).replace(/^\uFEFF/, ''));
    const headers = (rows.shift() || []).map(value => value.trim());
    const fileNameIndex = headers.indexOf('文件名');
    const tagIndex = headers.indexOf('标签');
    if (fileNameIndex < 0 || tagIndex < 0) throw new Error('未找到“文件名”和“标签”两列。');
    let matched = 0;
    for (const row of rows) {
      const name = normalizeFileName(row[fileNameIndex]);
      const tag = String(row[tagIndex] || '').trim();
      if (name && TAGS.includes(tag)) { tagMap.set(name, tag); matched += 1; }
    }
    status.textContent = `已读取 ${matched} 条有效标签；其余 TXT 将使用本批默认标签。`;
  } catch (error) {
    status.textContent = `标签清单无法读取：${error.message}`;
  }
}

async function verifyAdmin() {
  try {
    const { user } = await request('api/auth/me');
    if (!user || user.role !== 'admin') throw new Error();
    document.getElementById('admin-email').textContent = user.email;
  } catch {
    window.location.replace('index.html');
  }
}

function showFiles() {
  const files = [...document.getElementById('file-input').files];
  document.getElementById('file-count').textContent = files.length ? `已选择 ${files.length} 个文件` : '尚未选择文件';
  document.getElementById('file-list').innerHTML = files.slice(0, 12).map(file => `<span>${escapeHtml(file.name)} · ${escapeHtml(tagMap.get(normalizeFileName(file.name)) || tagSelect.value)}</span>`).join('') + (files.length > 12 ? `<span>还有 ${files.length - 12} 篇</span>` : '');
}

async function loadStories() {
  const target = document.getElementById('story-list');
  target.textContent = '正在读取…';
  try {
    const { stories } = await request('api/admin/stories');
    target.innerHTML = stories.length ? stories.map(story => `<article class="story"><time>${story.publish_date}</time><div><strong>${escapeHtml(story.title)}</strong><span> · ${escapeHtml(story.author)} · ${escapeHtml(story.tag)}</span></div><button data-delete="${story.id}">下架</button></article>`).join('') : '<p>还没有通过后台发布的小说。</p>';
  } catch (error) {
    target.textContent = error.message;
  }
}

async function loadAnalytics() {
  try {
    const { days } = await request('api/admin/analytics');
    const today = days.find(day => day.visit_date === chinaDate());
    document.getElementById('today-visits').textContent = today?.visitors || 0;
    document.getElementById('month-visits').textContent = days.reduce((sum, day) => sum + Number(day.visitors), 0);
    const chartDays = days.slice(0, 7).reverse();
    const max = Math.max(1, ...chartDays.map(day => Number(day.visitors)));
    document.getElementById('analytics-days').innerHTML = chartDays.map(day => `<div class="visit-bar" style="height:${Math.max(4, Math.round(Number(day.visitors) / max * 72))}px"><span>${day.visitors}</span></div>`).join('') || '<small>暂无独立访客数据</small>';
  } catch {
    document.getElementById('analytics-days').textContent = '访问数据暂不可用';
  }
}

async function loadMessages() {
  const target = document.getElementById('admin-message-list');
  target.textContent = '正在读取…';
  try {
    const { messages } = await request('api/messages');
    target.innerHTML = messages.length ? messages.map(message => `<article class="admin-message"><div><strong>${escapeHtml(message.author)}</strong><time>${localDate(message.created_at)}</time></div><p>${escapeHtml(message.body).replaceAll('\n', '<br>')}</p><button data-message-delete="${message.id}">删除</button></article>`).join('') : '<p>还没有读者留言。</p>';
  } catch (error) {
    target.textContent = error.message;
  }
}

document.getElementById('file-input').addEventListener('change', showFiles);
tagSelect.addEventListener('change', showFiles);
tagMapInput.addEventListener('change', async () => { await loadTagMap(); showFiles(); });
document.getElementById('publish-form').addEventListener('submit', async event => {
  event.preventDefault();
  const message = document.getElementById('publish-message');
  const files = [...document.getElementById('file-input').files];
  if (!files.length) return;
  message.textContent = '正在读取并发布…';
  try {
    const payload = {
      date: dateInput.value,
      files: await Promise.all(files.map(async file => ({
        name: file.name,
        text: await file.text(),
        tag: tagMap.get(normalizeFileName(file.name)) || tagSelect.value
      })))
    };
    const result = await request('api/admin/stories', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
    message.textContent = `已发布 ${result.count} 篇小说。`;
    event.target.reset();
    tagSelect.innerHTML = TAGS.map(tag => `<option value="${tag}">${tag}</option>`).join('');
    tagMap = new Map();
    document.getElementById('tag-map-status').textContent = '上传下载器生成的标签清单.csv，可自动逐篇匹配标签。';
    showFiles();
    await loadStories();
  } catch (error) {
    message.textContent = error.message;
  }
});
document.getElementById('story-list').addEventListener('click', async event => {
  const button = event.target.closest('[data-delete]');
  if (!button || !confirm('确认下架这篇小说？')) return;
  try { await request(`api/admin/stories/${button.dataset.delete}`, { method: 'DELETE' }); await loadStories(); } catch (error) { alert(error.message); }
});
document.getElementById('admin-message-list').addEventListener('click', async event => {
  const button = event.target.closest('[data-message-delete]');
  if (!button || !confirm('确认删除这条留言？')) return;
  try { await request(`api/messages/${button.dataset.messageDelete}`, { method: 'DELETE' }); await loadMessages(); } catch (error) { alert(error.message); }
});
document.getElementById('refresh-button').addEventListener('click', loadStories);
document.getElementById('refresh-messages').addEventListener('click', loadMessages);
document.getElementById('logout-button').addEventListener('click', async () => { await request('api/auth/logout', { method: 'POST' }).catch(() => null); window.location.replace('index.html'); });

verifyAdmin();
loadStories();
loadAnalytics();
loadMessages();
