const TAGS = ['悬疑', '姐弟恋', '白月光', '大女主', '病娇', '豪门霸总', '双男主', '双女主', '先婚后爱', '追妻火葬场', '娱乐圈', '甜宠', '虐恋', '先虐后甜'];
const state = { dates: [], currentDate: null, currentStories: [], remoteStories: {}, fontSize: 19, isRegister: false, user: null, selectedTag: '全部' };
const filler = ['他没有立刻回答。街边的树影在风里慢慢移动，像有人正在翻一页很旧的书。', '后来他们都记得那个下午，却谁也说不清从哪一句话开始，事情有了不同的方向。'];
const dateLabel = iso => new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(`${iso}T12:00:00`));
const shortDate = iso => iso.slice(5).replace('-', '.');
const dayEnglish = iso => new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date(`${iso}T12:00:00`)).toUpperCase();
const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

function showView(name) {
  document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
  document.getElementById(`${name}-view`).classList.add('active');
  document.querySelectorAll('.nav-link').forEach(button => button.classList.toggle('active', button.dataset.view === name || (name === 'day' && button.dataset.view === 'archive')));
  if (name === 'messages') loadMessages();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function visibleStories() {
  return state.selectedTag === '全部' ? state.currentStories : state.currentStories.filter(story => story.tag === state.selectedTag);
}

function storyCard(story, index) {
  return `<button class="story-card" data-story="${story.id}"><span class="story-number">${String(index + 1).padStart(2, '0')}</span><h3>${escapeHtml(story.title)}</h3><p>${escapeHtml(story.author)}</p><span class="story-tag">${escapeHtml(story.tag)}</span></button>`;
}

function renderDates() {
  document.getElementById('date-list').innerHTML = state.dates.length
    ? state.dates.map(day => `<button class="date-row" data-date="${day.date}"><span class="date">${shortDate(day.date)}</span><strong>${dateLabel(day.date)}</strong><small>${day.count} 篇 · ${day.note || '已归档'}</small><span class="arrow">→</span></button>`).join('')
    : '<p class="text-muted">暂时还没有已发布的小说。</p>';
}

function renderFeatured() {
  const date = state.currentDate;
  const target = document.getElementById('featured-stories');
  document.getElementById('today-count').textContent = date?.count || 0;
  document.getElementById('featured-count').textContent = date?.count || 0;
  if (!date) {
    target.innerHTML = '<p class="text-muted">今天还没有上架小说。</p>';
    ['stamp-year', 'stamp-month', 'stamp-day'].forEach(id => { document.getElementById(id).textContent = '--'; });
    document.getElementById('today-eyebrow').textContent = 'DAILY ARCHIVE';
    return;
  }
  target.innerHTML = state.currentStories.slice(0, 3).map(storyCard).join('');
  const [year, month, day] = date.date.split('-');
  document.getElementById('stamp-year').textContent = year;
  document.getElementById('stamp-month').textContent = month;
  document.getElementById('stamp-day').textContent = day;
  document.getElementById('today-eyebrow').textContent = dayEnglish(date.date);
}

function renderFilters() {
  const total = state.currentStories.length;
  document.getElementById('filter-row').innerHTML = ['全部', ...TAGS].map(tag => `<button class="filter-chip ${state.selectedTag === tag ? 'selected' : ''}" data-filter="${tag}">${tag}${tag === '全部' ? ` <span>${total}</span>` : ''}</button>`).join('');
}

function renderDay() {
  const date = state.currentDate;
  if (!date) {
    document.getElementById('day-eyebrow').textContent = 'DAILY ARCHIVE';
    document.getElementById('day-title').textContent = '还没有小说';
    document.getElementById('day-description').textContent = '管理员发布后，会显示在这里。';
    renderFilters();
    document.getElementById('day-stories').innerHTML = '<p class="text-muted">暂时没有可阅读的小说。</p>';
    return;
  }
  document.getElementById('day-eyebrow').textContent = dayEnglish(date.date);
  document.getElementById('day-title').textContent = dateLabel(date.date);
  document.getElementById('day-description').textContent = `这一天收录了 ${date.count} 篇故事。`;
  renderFilters();
  const stories = visibleStories();
  document.getElementById('day-stories').innerHTML = stories.length
    ? stories.map((story, index) => `<button class="list-story" data-story="${story.id}"><span class="index">${String(index + 1).padStart(3, '0')}</span><strong>${escapeHtml(story.title)}</strong><span class="author">${escapeHtml(story.author)}</span><span class="tag">${escapeHtml(story.tag)}</span><span>→</span></button>`).join('')
    : '<p class="text-muted">这个标签下还没有小说。</p>';
}

async function selectDate(date) {
  const entry = state.dates.find(day => day.date === date) || state.dates[0];
  if (!entry) return;
  state.currentDate = entry;
  state.currentStories = state.remoteStories[entry.date] || [];
  state.selectedTag = '全部';
  renderFeatured();
  renderDay();
}

async function openStory(id, rememberHistory = true) {
  const story = state.currentStories.find(item => item.id === id);
  if (!story) return;
  const content = story.content?.length ? story.content : [...filler, ...filler, ...filler];
  document.getElementById('reader-title').textContent = story.title;
  document.getElementById('reader-author').textContent = story.author;
  document.getElementById('reader-category').textContent = story.tag;
  document.getElementById('reader-date').textContent = state.currentDate.date.replaceAll('-', '.');
  const target = document.getElementById('reader-content');
  target.replaceChildren(...content.map(paragraph => {
    const node = document.createElement('p');
    node.textContent = paragraph;
    return node;
  }));
  if (rememberHistory) {
    const readerUrl = new URL(window.location.href);
    readerUrl.hash = 'reading';
    history.pushState({ view: 'reader', date: state.currentDate.date, storyId: story.id }, '', readerUrl);
  }
  showView('reader');
}

async function loadLibrary() {
  try {
    const response = await fetch('api/library', { cache: 'no-store' });
    if (!response.ok) throw new Error('内容库暂不可用');
    const remote = await response.json();
    state.dates = remote.dates || [];
    state.remoteStories = remote.stories || {};
    await selectDate(state.dates[0]?.date);
  } catch {
    state.dates = [];
    state.currentDate = null;
    state.currentStories = [];
  }
  renderDates();
  renderFeatured();
  renderDay();
}

function renderAccount(user) {
  state.user = user;
  const button = document.getElementById('account-button');
  button.textContent = user ? (user.role === 'admin' ? '内容管理' : user.email) : '登录 / 注册';
  document.getElementById('admin-link').hidden = user?.role !== 'admin';
  document.getElementById('message-login-hint').textContent = user ? `当前登录：${user.email}` : '登录后即可留言';
}

async function refreshAccount() {
  try {
    const response = await fetch('api/auth/me', { cache: 'no-store' });
    if (!response.ok) return renderAccount(null);
    renderAccount((await response.json()).user);
  } catch {
    renderAccount(null);
  }
}

function setAccountMode(register) {
  state.isRegister = register;
  document.getElementById('account-title').textContent = register ? '注册' : '登录';
  document.getElementById('account-submit').textContent = register ? '创建账号' : '登录';
  document.getElementById('switch-account').textContent = register ? '已有账号？登录' : '还没有账号？注册';
  document.getElementById('account-password').autocomplete = register ? 'new-password' : 'current-password';
  document.getElementById('account-username-label').textContent = register ? '用户名' : '用户名或邮箱';
  document.getElementById('account-username').placeholder = register ? '设置一个用户名' : '输入用户名或原邮箱';
  document.getElementById('username-hint').textContent = register ? '只能使用中文、字母、数字、下划线或横线，2 到 14 位。注册后不可修改。' : '已有账号可使用原邮箱登录';
  document.getElementById('password-hint').textContent = register ? '至少 8 位，并同时包含字母和数字。' : '请输入登录密码';
  document.getElementById('account-message').textContent = '';
}

const messageDate = value => new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(`${value.replace(' ', 'T')}Z`));
async function loadMessages() {
  const target = document.getElementById('message-list');
  target.textContent = '正在加载留言…';
  try {
    const response = await fetch('api/messages', { cache: 'no-store' });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || '加载失败');
    target.innerHTML = result.messages.length ? result.messages.map(message => `<article class="message-item"><div><strong>${escapeHtml(message.author)}</strong><time>${messageDate(message.created_at)}</time></div><p>${escapeHtml(message.body).replaceAll('\n', '<br>')}</p></article>`).join('') : '<p class="text-muted">还没有留言，来留下第一句话吧。</p>';
  } catch (error) {
    target.textContent = error.message;
  }
}

document.addEventListener('click', async event => {
  const viewButton = event.target.closest('[data-view]');
  if (viewButton) return showView(viewButton.dataset.view);
  const storyButton = event.target.closest('[data-story]');
  if (storyButton) return openStory(storyButton.dataset.story);
  const dateButton = event.target.closest('[data-date]');
  if (dateButton) { await selectDate(dateButton.dataset.date); return showView('day'); }
  const filter = event.target.closest('[data-filter]');
  if (filter) { state.selectedTag = filter.dataset.filter; renderDay(); }
});

document.getElementById('random-button').addEventListener('click', () => {
  const story = state.currentStories[Math.floor(Math.random() * state.currentStories.length)];
  if (story) openStory(story.id);
});
document.getElementById('search-button').addEventListener('click', () => { document.getElementById('search-dialog').showModal(); document.getElementById('search-input').focus(); });
document.getElementById('search-input').addEventListener('input', event => {
  const query = event.target.value.trim();
  const results = query ? state.currentStories.filter(story => `${story.title}${story.author}${story.tag}`.includes(query)) : [];
  document.getElementById('search-results').innerHTML = results.map(story => `<button class="search-result" data-story="${story.id}"><strong>${escapeHtml(story.title)}</strong><span>${escapeHtml(story.author)} · ${escapeHtml(story.tag)}</span></button>`).join('') || (query ? '<p class="text-muted">没有找到相关故事</p>' : '');
});
document.getElementById('search-results').addEventListener('click', event => {
  const item = event.target.closest('[data-story]');
  if (item) { document.getElementById('search-dialog').close(); openStory(item.dataset.story); }
});
document.getElementById('font-up').addEventListener('click', () => { state.fontSize = Math.min(state.fontSize + 1, 25); document.getElementById('reader-content').style.fontSize = `${state.fontSize}px`; });
document.getElementById('font-down').addEventListener('click', () => { state.fontSize = Math.max(state.fontSize - 1, 15); document.getElementById('reader-content').style.fontSize = `${state.fontSize}px`; });
document.getElementById('theme-toggle').addEventListener('click', () => document.getElementById('reader-view').classList.toggle('night'));
document.getElementById('bookmark-button').addEventListener('click', event => { event.currentTarget.classList.toggle('saved'); event.currentTarget.innerHTML = event.currentTarget.classList.contains('saved') ? '已收藏 ♥' : '收藏 ♡'; });
document.getElementById('account-button').addEventListener('click', () => { if (state.user?.role === 'admin') window.location.href = 'admin.html'; else document.getElementById('account-dialog').showModal(); });
document.getElementById('close-account').addEventListener('click', () => document.getElementById('account-dialog').close());
document.getElementById('switch-account').addEventListener('click', () => setAccountMode(!state.isRegister));
document.getElementById('account-form').addEventListener('submit', async event => {
  event.preventDefault();
  const message = document.getElementById('account-message');
  message.textContent = '处理中…';
  try {
    const response = await fetch(`api/auth/${state.isRegister ? 'register' : 'login'}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username: document.getElementById('account-username').value, password: document.getElementById('account-password').value }) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || '操作失败');
    renderAccount(result.user);
    message.textContent = state.isRegister ? '注册成功。' : '登录成功。';
    if (state.isRegister) { document.getElementById('account-dialog').close(); showView('home'); }
    if (result.user.role === 'admin') document.getElementById('admin-link').hidden = false;
  } catch (error) {
    message.textContent = error.message;
  }
});
document.getElementById('message-form').addEventListener('submit', async event => {
  event.preventDefault();
  const status = document.getElementById('message-status');
  if (!state.user) { status.textContent = '请先登录后再留言。'; document.getElementById('account-dialog').showModal(); return; }
  status.textContent = '正在发布…';
  try {
    const response = await fetch('api/messages', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ body: document.getElementById('message-body').value }) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || '发布失败');
    document.getElementById('message-body').value = '';
    status.textContent = '留言已发布。';
    await loadMessages();
  } catch (error) {
    status.textContent = error.message;
  }
});
window.addEventListener('scroll', () => {
  const article = document.getElementById('reader-page');
  if (!document.getElementById('reader-view').classList.contains('active')) return;
  const max = article.offsetTop + article.offsetHeight - window.innerHeight;
  document.getElementById('progress-fill').style.width = `${Math.min(100, Math.max(0, window.scrollY / Math.max(1, max) * 100))}%`;
});
window.addEventListener('popstate', async event => {
  const page = event.state;
  if (page?.view === 'reader' && page.date && page.storyId) {
    await selectDate(page.date);
    await openStory(page.storyId, false);
    return;
  }
  showView('home');
});

async function init() {
  const homeUrl = new URL(window.location.href);
  homeUrl.hash = '';
  history.replaceState({ view: 'home' }, '', homeUrl);
  setAccountMode(false);
  await refreshAccount();
  await loadLibrary();
  if (state.user?.role !== 'admin') fetch('api/analytics/visit', { method: 'POST' }).catch(() => null);
}
init();
