/* ============================================================
   TestFlow 离线静态版 · SPA 逻辑
   hash 路由：/login /dashboard /projects /test-cases
   /test-cases/:id/edit /environments /globals /executions /ci
   ============================================================ */
(function () {
  'use strict';

  var TF = window.TF;
  var view = document.getElementById('view');

  /* ── 运行时状态（替代 pinia store） ── */
  var state = {
    loggedIn: true,
    theme: 'dark',
    currentProjectId: null,   // null = 全部项目
    currentEnvironmentId: null,
    activeStepIndex: 0
  };

  /* ── 工具 ── */
  function $(id) { return document.getElementById(id); }
  function h(html) { var d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstChild; }
  function esc(s) {
    if (s == null) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function fmtTime(ts) {
    if (!ts) return '—';
    try {
      var d = new Date(ts.replace(/-/g, '/'));
      return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) +
        ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
    } catch (e) { return ts; }
  }
  function currentProject() { return TF.projects.filter(function (p) { return p.id == state.currentProjectId; })[0] || null; }
  function currentEnv() { return TF.environments.filter(function (e) { return e.id == state.currentEnvironmentId; })[0] || null; }
  function hasProjects() { return TF.projects.length > 0; }

  var PRIORITY_TYPE = { P0: 'danger', P1: 'danger', P2: 'warning', P3: 'info' };
  var PRIORITY_LABEL = { P0: '致命', P1: '严重', P2: '一般', P3: '低优' };
  var STATUS_OPTS = [
    { value: 'draft', label: '调试中' },
    { value: 'debugging', label: '调试完成' },
    { value: 'released', label: '已发布' },
    { value: 'disabled', label: '已废弃' }
  ];
  var STATUS_LABEL = { draft: '调试中', debugging: '调试完成', released: '已发布', disabled: '已废弃' };
  var EXEC_STATUS_LABEL = { success: '成功', failed: '失败', error: '异常', running: '运行中', pending: '等待中' };

  function toast(msg, type) {
    var wrap = $('toastWrap');
    var t = h('<div class="toast ' + (type || 'info') + '">' + esc(msg) + '</div>');
    wrap.appendChild(t);
    setTimeout(function () { t.style.opacity = '0'; t.style.transition = 'opacity .3s'; }, 2200);
    setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 2600);
  }

  /* ── 主题 ── */
  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    state.theme = t;
    $('themeBtn').textContent = t === 'dark' ? '☀' : '☾';
    try { localStorage.setItem('at-theme', t); } catch (e) {}
  }
  function initTheme() {
    var saved = 'dark';
    try { saved = localStorage.getItem('at-theme') || 'dark'; } catch (e) {}
    applyTheme(saved);
  }

  /* ── 路由 ── */
  function parseHash() {
    var hash = location.hash.replace(/^#/, '') || '/dashboard';
    if (hash.charAt(0) !== '/') hash = '/' + hash;
    var parts = hash.split('/').filter(Boolean); // e.g. ['test-cases','3','edit']
    return { path: hash, parts: parts };
  }

  function render() {
    closePopovers();
    var r = parseHash();
    var p = r.parts;
    var route = '/' + (p[0] || 'dashboard');
    if (p[0] === 'login') { renderLogin(); return; }
    if (!state.loggedIn) { location.hash = '#/login'; return; }
    switch (route) {
      case '/dashboard': renderDashboard(); break;
      case '/projects': renderProjects(); break;
      case '/test-cases':
        if (p[1] && p[2] === 'edit') renderEditor(p[1]);
        else renderTestCases();
        break;
      case '/environments': renderEnvironments(); break;
      case '/globals': renderGlobals(); break;
      case '/executions': renderExecutions(); break;
      case '/ci': renderCI(); break;
      default: renderDashboard();
    }
    renderMenu(route);
    renderHeader();
    window.scrollTo(0, 0);
  }

  /* ── 侧栏菜单 ── */
  var MENU = [
    { path: '/dashboard', label: '概览', icon: '📊' },
    { path: '/projects', label: '项目', icon: '📁' },
    { path: '/test-cases', label: '测试用例', icon: '📄' },
    { path: '/test-cases', label: '测试套件', icon: '🗂', disabled: true },
    { path: '/environments', label: '环境', icon: '⚙' },
    { path: '/globals', label: '全局变量', icon: '🪙' },
    { path: '/executions', label: '执行', icon: '▶' },
    { path: '/ci', label: 'CI / CD', icon: '🔗' }
  ];
  function renderMenu(active) {
    var menu = $('menu');
    menu.innerHTML = MENU.map(function (m) {
      var cls = 'menu-item' + (m.path === active && !m.disabled ? ' active' : '');
      var style = m.disabled ? 'opacity:.4;pointer-events:none;' : '';
      return '<div class="' + cls + '" data-nav="' + m.path + '" style="' + style + '">' +
        '<span class="mi-icon">' + m.icon + '</span><span class="menu-label">' + m.label + '</span></div>';
    }).join('');
  }

  /* ── 页头（面包屑 + 项目/环境） ── */
  var ROUTE_NAMES = {
    '/dashboard': '概览', '/projects': '项目', '/test-cases': '测试用例',
    '/environments': '环境管理', '/globals': '全局变量', '/executions': '执行记录', '/ci': 'CI / CD 集成'
  };
  function renderHeader() {
    var hash = location.hash.replace(/^#/, '') || '/dashboard';
    var base = '/' + (hash.split('/').filter(Boolean)[0] || 'dashboard');
    $('breadcrumb').innerHTML = '<span>首页</span><span class="sep">/</span><span class="cur">' + (ROUTE_NAMES[base] || '') + '</span>';
    var cp = currentProject();
    $('projText').textContent = cp ? cp.name : (hasProjects() ? '全部' : '未选');
    $('projBtn').className = 'ctx-btn' + (!cp && hasProjects() ? ' all-mode' : '') + (cp ? '' : ' empty');
    var ce = currentEnv();
    $('envText').textContent = ce ? ce.name : '未选';
    $('envBtn').className = 'ctx-btn' + (ce ? '' : ' empty');
    var u = TF.user;
    $('userAvatar').textContent = (u.username || 'A').charAt(0).toUpperCase();
    $('userName').textContent = u.username || 'Admin';
    $('userRole').textContent = u.username + '（管理员）';
  }

  /* ╔════════════════════════════════════╗
     ║  LOGIN                              ║
     ╚════════════════════════════════════╝ */
  function renderLogin() {
    view.innerHTML =
      '<div class="login-page">' +
      '  <div class="bg-grid"></div>' +
      '  <div class="login-card">' +
      '    <div class="card-brand">' +
      '      <div class="brand-logo"><svg width="40" height="40" viewBox="0 0 40 40" fill="none"><rect width="40" height="40" rx="10" fill="url(#lg)"/><path d="M11 20l6.5 6.5L29 12" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><defs><linearGradient id="lg" x1="0" y1="0" x2="40" y2="40"><stop stop-color="#6366f1"/><stop offset="1" stop-color="#22d3ee"/></linearGradient></defs></svg></div>' +
      '      <h1 class="brand-title">TestFlow</h1>' +
      '      <p class="brand-subtitle">企业级自动化测试平台</p>' +
      '    </div>' +
      '    <div class="login-form">' +
      '      <div class="field"><label>用户名</label><input class="input" id="lgUser" value="admin" placeholder="请输入用户名"/></div>' +
      '      <div class="field"><label>密码</label><input class="input" id="lgPass" type="password" value="admin123" placeholder="请输入密码"/></div>' +
      '      <button class="btn btn--primary submit-btn" id="lgSubmit">登 录</button>' +
      '    </div>' +
      '    <div class="card-footer"><div class="default-hint">默认账号：<code>admin</code> / <code>admin123</code></div></div>' +
      '  </div>' +
      '  <div class="copyright">TestFlow © 2026 · Powered with care for QA teams</div>' +
      '</div>';
    function doLogin() {
      state.loggedIn = true;
      toast('登录成功', 'success');
      location.hash = '#/dashboard';
    }
    $('lgSubmit').addEventListener('click', doLogin);
  }

  /* ╔════════════════════════════════════╗
     ║  DASHBOARD                         ║
     ╚════════════════════════════════════╝ */
  function renderDashboard() {
    var d = TF.getDashboard(state.currentProjectId);
    var cp = currentProject();
    var scope = cp ? cp.name : '全部项目';
    var statusList = Object.keys(d.by_status).map(function (k) { return { status: k, count: d.by_status[k] }; })
      .filter(function (x) { return x.count > 0; });
    var maxCount = Math.max.apply(null, statusList.map(function (x) { return x.count; }).concat([1]));

    var recentRows = (d.recent || []).map(function (e) {
      return '<tr>' +
        '<td class="cell-id">#' + e.id + '</td>' +
        '<td><span class="tag tag--' + (e.status === 'success' ? 'success' : (e.status === 'failed' ? 'danger' : 'warning')) + '">' + EXEC_STATUS_LABEL[e.status] + '</span></td>' +
        '<td><span class="cs-total" style="font-size:13px">共 ' + e.total_cases + '</span><span style="color:var(--color-gray-200);margin:0 8px">|</span><span class="text-success" style="font-weight:600">✓ ' + e.passed + '</span><span style="color:var(--color-gray-200);margin:0 8px">|</span><span class="text-danger" style="font-weight:600">✗ ' + e.failed + '</span></td>' +
        '<td>' + fmtTime(e.created_at) + '</td>' +
        '</tr>';
    }).join('') || '<tr><td colspan="4" class="empty-state">暂无执行记录</td></tr>';

    view.innerHTML =
      '<div class="page-container fade-enter-active">' +
      '  <div class="page-header"><div class="page-header-left"><h2>工作台</h2>' +
      '    <span class="subtitle">实时掌握测试全貌</span>' +
      '    <span class="scope-badge' + (cp ? '' : ' all') + '">▣ ' + esc(scope) + '</span></div>' +
      '    <div class="page-header-right"><button class="btn btn--sm" id="refreshStat">↻ 刷新</button></div></div>' +
      '  <div class="stat-grid">' +
      '    ' + statCard('var(--color-primary-500)', '累计执行', d.total_executions, '+12% 较上周', 'up', '▶') +
      '    ' + statCard('var(--color-accent-500)', '累计用例', d.total_cases, '本月新增 ' + Math.round(d.total_cases * 0.15), 'up', '📄') +
      '    ' + statCard('var(--color-success-500)', '通过 / 失败', '<span class="text-success">' + d.passed + '</span><span class="stat-sep">/</span><span class="text-danger">' + d.failed + '</span>', '通过率 ' + Math.round(d.pass_rate * 100) + '%', d.passed >= d.failed ? 'up' : 'down', '✓') +
      '    ' + statCard('var(--color-warning-500)', '通过率', '<span class="gradient-text">' + Math.round(d.pass_rate * 100) + '%</span>', '', 'up', '📈', d.pass_rate * 100) +
      '  </div>' +
      '  <div class="row-2">' +
      '    <div class="card status-card"><div class="card-header"><div class="card-title-row"><span>执行状态分布</span><span class="tag tag--info">' + statusList.length + ' 种状态</span></div></div>' +
      '      <div class="card-body">' + (statusList.length ? '<div class="status-list">' + statusList.map(function (s) {
            return '<div class="status-item"><div class="status-item-left"><span class="status-dot ' + dotClass(s.status) + '"></span><span class="status-name">' + EXEC_STATUS_LABEL[s.status] + '</span></div>' +
              '<div class="status-bar-wrap"><div class="status-bar-fill fill-' + s.status + '" style="width:' + Math.max((s.count / maxCount) * 100, 8) + '%"></div></div>' +
              '<span class="status-count">' + s.count + '</span></div>';
          }).join('') + '</div>' : '<div class="empty-state">暂无执行记录</div>') + '</div></div>' +
      '    <div class="card recent-card"><div class="card-header"><div class="card-title-row"><span>最近执行</span><a href="#/executions">查看全部</a></div></div>' +
      '      <div class="card-body" style="padding:0"><table class="table"><thead><tr><th>#</th><th>状态</th><th>用例统计</th><th>时间</th></tr></thead><tbody>' + recentRows + '</tbody></table></div></div>' +
      '  </div>' +
      '</div>';
    $('refreshStat').addEventListener('click', function () { renderDashboard(); toast('已刷新', 'info'); });
  }
  function statCard(accent, label, num, trend, trendCls, icon, barPct) {
    var bar = '';
    if (barPct != null) {
      bar = '<div class="progress-bar"><div class="progress-fill" style="width:' + Math.round(barPct) + '%"></div></div>';
    }
    return '<div class="stat-card" style="--accent:' + accent + '">' +
      '<div class="stat-body"><div class="stat-label">' + label + '</div>' +
      '<div class="stat-number">' + num + '</div>' +
      (trend ? '<div class="stat-trend ' + trendCls + '">▲ ' + trend + '</div>' : '') + bar + '</div>' +
      '<div class="stat-icon" style="background:color-mix(in srgb,' + accent + ' 14%,transparent);color:' + accent + '">' + icon + '</div></div>';
  }
  function dotClass(s) {
    if (s === 'success') return 'dot-released';
    if (s === 'failed' || s === 'error') return 'dot-draft';
    if (s === 'running') return 'fill-running';
    return 'fill-pending';
  }

  /* ╔════════════════════════════════════╗
     ║  PROJECTS                         ║
     ╚════════════════════════════════════╝ */
  function renderProjects() {
    view.innerHTML =
      '<div class="page-container"><div class="page-header"><div class="page-header-left"><h2>项目</h2>' +
      '<span class="subtitle">管理你的测试项目</span></div>' +
      '<div class="page-header-right"><button class="btn btn--primary" id="newProj">＋ 新建项目</button></div></div>' +
      '<div class="proj-grid">' + TF.projects.map(function (p) {
        var cnt = TF.cases.filter(function (c) { return c.project_id == p.id; }).length;
        return '<div class="proj-card" data-projid="' + p.id + '"><div class="pc-name">📁 ' + esc(p.name) + '</div>' +
          '<div class="pc-desc">' + esc(p.desc || '') + '</div>' +
          '<div style="margin-top:12px;font-size:12px;color:var(--text-muted)">用例 ' + cnt + ' 条</div></div>';
      }).join('') + '</div></div>';
    view.querySelectorAll('.proj-card').forEach(function (el) {
      el.addEventListener('click', function () {
        var id = el.getAttribute('data-projid');
        state.currentProjectId = id;
        toast('已切换到「' + currentProject().name + '」', 'info');
        location.hash = '#/test-cases';
      });
    });
    $('newProj').addEventListener('click', openProjDialog);
  }

  /* ╔════════════════════════════════════╗
     ║  TEST CASES                       ║
     ╚════════════════════════════════════╝ */
  var caseSearch = '', caseType = '', casePriority = '';
  function renderTestCases() {
    if (!hasProjects()) {
      view.innerHTML = '<div class="page-container"><div class="empty-state" style="padding:80px">请先创建一个项目后开始编写用例。<br><br><button class="btn btn--primary" id="ep">新建项目</button></div></div>';
      $('ep').addEventListener('click', openProjDialog);
      return;
    }
    var cp = currentProject();
    var isAll = !state.currentProjectId;
    view.innerHTML =
      '<div class="page-container"><div class="page-header"><div class="page-header-left"><h2>测试用例</h2>' +
      (cp ? '<span class="project-badge">▣ ' + esc(cp.name) + '</span>' : (isAll ? '<span class="scope-badge all">▣ 全部项目</span>' : '')) +
      '</div><div class="page-header-right">' +
      '<button class="btn' + (isAll ? '' : ' btn--primary') + '" id="newCase" ' + (isAll ? 'disabled title="请先选择具体项目"' : '') + '>＋ 新建用例</button></div></div>' +
      '<div class="filter-bar">' +
      '<input class="input" id="csSearch" placeholder="搜索用例名称..." style="width:240px" value="' + esc(caseSearch) + '">' +
      '<select class="select" id="csType" style="width:120px"><option value="">类型</option><option value="api">接口(API)</option><option value="ui">界面(UI)</option></select>' +
      '<select class="select" id="csPri" style="width:110px"><option value="">优先级</option>' +
      ['P0', 'P1', 'P2', 'P3'].map(function (p) { return '<option value="' + p + '">' + p + '</option>'; }).join('') +
      '</select>' +
      '<div class="filter-stats"><span class="stat-chip total" id="csFiltered">0 条</span><span class="stat-divider">/</span><span class="stat-chip muted">共 ' + TF.cases.length + ' 条</span></div>' +
      '</div>' +
      '<div class="card table-card"><table class="table stripe"><thead><tr>' +
      '<th>#</th>' + (isAll ? '<th>项目</th>' : '') + '<th>名称</th><th>优先级</th><th>状态</th><th>创建时间</th><th>操作</th>' +
      '</tr></thead><tbody id="csBody"></tbody></table></div></div>';
    $('csSearch').addEventListener('input', function (e) { caseSearch = e.target.value; paintCases(); });
    $('csType').addEventListener('change', function (e) { caseType = e.target.value; paintCases(); });
    $('csPri').addEventListener('change', function (e) { casePriority = e.target.value; paintCases(); });
    $('csType').value = caseType; $('csPri').value = casePriority;
    var nc = $('newCase');
    if (nc && !isAll) nc.addEventListener('click', openCaseDialog);
    paintCases();
  }
  function filteredCases() {
    return TF.cases.filter(function (c) {
      if (state.currentProjectId && c.project_id != state.currentProjectId) return false;
      if (caseSearch && c.name.toLowerCase().indexOf(caseSearch.toLowerCase()) === -1) return false;
      if (caseType && c.type !== caseType) return false;
      if (casePriority && c.priority !== casePriority) return false;
      return true;
    });
  }
  function paintCases() {
    var isAll = !state.currentProjectId;
    var list = filteredCases();
    $('csFiltered').textContent = list.length + ' 条';
    $('csBody').innerHTML = list.length ? list.map(function (c) {
      return '<tr class="' + (c.type === 'ui' ? 'ui-case-row' : '') + '">' +
        '<td class="cell-id">#' + c.id + '</td>' +
        (isAll ? '<td><span class="cell-project">▣ ' + esc(c.project_name) + '</span></td>' : '') +
        '<td><div class="case-name-cell"><span class="case-name">' + esc(c.name) + '</span>' +
        '<span class="tag tag--' + (c.type === 'api' ? 'primary' : 'warning') + '">' + (c.type === 'api' ? 'API' : 'UI') + '</span></div></td>' +
        '<td><span class="clickable-cell" data-cycle-pri="' + c.id + '"><span class="tag tag--' + PRIORITY_TYPE[c.priority] + '">' + c.priority + '</span><span class="cell-arrow">▾</span></span></td>' +
        '<td><span class="clickable-cell" data-cycle-st="' + c.id + '"><span class="status-dot ' + dotClass2(c.status) + '"></span>' + STATUS_LABEL[c.status] + '<span class="cell-arrow">▾</span></span></td>' +
        '<td>' + fmtTime(c.created_at) + '</td>' +
        '<td><div class="action-group">' +
        (c.type === 'api' ? '<span class="action-link action-edit" data-edit="' + c.id + '"><span class="al-icon">✎</span>编辑</span>' : '') +
        '<span class="action-link action-run" data-run="' + c.id + '"><span class="al-icon">▶</span>运行</span>' +
        '<span class="action-link action-del" data-del="' + c.id + '"><span class="al-icon">🗑</span></span>' +
        '</div></td></tr>';
    }).join('') : '<tr><td colspan="' + (isAll ? 7 : 6) + '" class="empty-state">还没有用例，点击右上角「新建用例」开始吧</td></tr>';

    view.querySelectorAll('[data-edit]').forEach(function (b) { b.addEventListener('click', function () { location.hash = '#/test-cases/' + b.getAttribute('data-edit') + '/edit'; }); });
    view.querySelectorAll('[data-run]').forEach(function (b) { b.addEventListener('click', function () { runCase(b.getAttribute('data-run')); }); });
    view.querySelectorAll('[data-del]').forEach(function (b) { b.addEventListener('click', function () { delCase(b.getAttribute('data-del')); }); });
    view.querySelectorAll('[data-cycle-pri]').forEach(function (b) { b.addEventListener('click', function () { cyclePriority(b.getAttribute('data-cycle-pri')); }); });
    view.querySelectorAll('[data-cycle-st]').forEach(function (b) { b.addEventListener('click', function () { cycleStatus(b.getAttribute('data-cycle-st')); }); });
  }
  function dotClass2(s) {
    return { draft: 'dot-draft', debugging: 'dot-debugging', released: 'dot-released', disabled: 'dot-disabled' }[s] || 'dot-draft';
  }
  function cyclePriority(id) {
    var c = TF.cases.filter(function (x) { return x.id == id; })[0]; if (!c) return;
    var idx = ['P0', 'P1', 'P2', 'P3'].indexOf(c.priority);
    c.priority = ['P0', 'P1', 'P2', 'P3'][(idx + 1) % 4];
    paintCases(); toast('优先级已更新为 ' + c.priority, 'success');
  }
  function cycleStatus(id) {
    var c = TF.cases.filter(function (x) { return x.id == id; })[0]; if (!c) return;
    var idx = STATUS_OPTS.map(function (o) { return o.value; }).indexOf(c.status);
    c.status = STATUS_OPTS[(idx + 1) % STATUS_OPTS.length].value;
    paintCases(); toast('状态已更新为「' + STATUS_LABEL[c.status] + '」', 'success');
  }
  function delCase(id) {
    TF.cases = TF.cases.filter(function (x) { return x.id != id; });
    paintCases(); toast('用例已删除', 'info');
  }
  function runCase(id) {
    var c = TF.cases.filter(function (x) { return x.id == id; })[0]; if (!c) return;
    showRunResult('success', '执行完成', '用例「' + c.name + '」执行完毕，通过 ' + (c.steps.length || 1) + '/' + (c.steps.length || 1));
    toast('已触发执行：' + c.name, 'success');
  }

  /* ── 新建用例弹窗 ── */
  function openCaseDialog() {
    openDialog('<div class="card-header"><div class="dialog-title">新建测试用例</div><button class="dialog-close" data-close>×</button></div>' +
      '<div class="dialog-body">' +
      (currentProject() ? '<div class="create-project-badge" style="display:inline-flex;gap:8px;margin-bottom:18px"><span>▣ 所属项目</span><b style="color:var(--color-primary-700)">' + esc(currentProject().name) + '</b></div>' : '') +
      '<div class="field"><label><span class="req">*</span>用例名称</label><input class="input" id="cfName" placeholder="例如：登录成功后返回用户信息" maxlength="60"/></div>' +
      '<div class="field-row"><div class="field"><label>用例类型</label>' +
      '<select class="select" id="cfType"><option value="api">接口 (API)</option><option value="ui">界面 (UI)</option></select></div>' +
      '<div class="field"><label>优先级</label><select class="select" id="cfPri">' +
      ['P0', 'P1', 'P2', 'P3'].map(function (p) { return '<option value="' + p + '">' + p + ' — ' + PRIORITY_LABEL[p] + '</option>'; }).join('') + '</select></div></div>' +
      '</div>' +
      '<div class="dialog-foot"><button class="btn" data-close>取消</button><button class="btn btn--primary" id="cfSave">创建用例</button></div>',
      'wide');
    $('cfSave').addEventListener('click', function () {
      var name = $('cfName').value.trim(); if (!name) { toast('请填写用例名称', 'error'); return; }
      TF.cases.unshift({
        id: TF.nextId(), project_id: state.currentProjectId, project_name: currentProject().name,
        name: name, type: $('cfType').value, priority: $('cfPri').value, status: 'draft',
        created_at: new Date().toISOString().slice(0, 16).replace('T', ' '), updated_at: '', steps: []
      });
      closeDialog(); renderTestCases(); toast('用例已创建', 'success');
    });
  }

  /* ╔════════════════════════════════════╗
     ║  EDITOR（参考真实布局重构）         ║
     ╚════════════════════════════════════╝ */
  function renderEditor(id) {
    var c = TF.cases.filter(function (x) { return x.id == id; })[0];
    if (!c) { location.hash = '#/test-cases'; return; }
    if (c.type !== 'api') {
      view.innerHTML = '<div class="page-container"><div class="crumbs">测试用例 / ' + esc(c.name) + '</div>' +
        '<div class="empty-state" style="padding:80px">这是一个 UI 用例，步骤编排功能即将上线。</div></div>';
      return;
    }
    c.variables = c.variables || [];
    state.activeStepIndex = 0;
    view.innerHTML =
      '<div class="page-container fade-enter-active">' +
      '  <div class="editor-top-bar">' +
      '    <div class="editor-title-group">' +
      '      <span class="editor-back" data-nav="/test-cases">← 返回列表</span>' +
      '      <span class="editor-title">' + esc(c.name) + '</span>' +
      '      <span class="editor-title-tag">' + (c.type === 'api' ? 'API' : 'UI') + '</span>' +
      '    </div>' +
      '    <div class="editor-actions">' +
      '      <button class="btn" id="caseHistory">◷ 历史记录</button>' +
      '      <button class="btn" id="runCase">▶ 执行用例</button>' +
      '      <button class="btn btn--primary" id="saveCase">💾 保存用例</button>' +
      '    </div>' +
      '  </div>' +
      '  <div class="public-vars-banner" id="publicVars"></div>' +
      '  <div class="editor-grid">' +
      '    <div class="step-tree">' +
      '      <div class="step-tree-head"><span class="sth-title">步骤列表</span>' +
      '        <div class="sth-tools">' +
      '          <button class="sth-tool" title="添加文件夹" id="addFolder">📁</button>' +
      '          <button class="sth-tool" title="添加步骤" id="addStepNode">＋</button>' +
      '          <button class="sth-tool" title="删除选中步骤" id="delStepNode">🗑</button>' +
      '        </div></div>' +
      '      <div id="stepNodes"></div>' +
      '    </div>' +
      '    <div id="requestArea"></div>' +
      '  </div>' +
      '</div>';
    if (c.steps.length === 0) c.steps.push(blankStep());
    renderPublicVars(c);
    paintStepTree(c);
    paintRequest(c);

    $('addStepNode').addEventListener('click', function () {
      c.steps.push(blankStep());
      state.activeStepIndex = c.steps.length - 1;
      paintStepTree(c); paintRequest(c);
    });
    $('addFolder').addEventListener('click', function () { toast('文件夹分组功能演示：当前用例默认归入「默认文件夹」', 'info'); });
    $('delStepNode').addEventListener('click', function () {
      if (c.steps.length <= 1) { toast('至少保留一个步骤', 'error'); return; }
      c.steps.splice(state.activeStepIndex, 1);
      state.activeStepIndex = Math.max(0, state.activeStepIndex - 1);
      paintStepTree(c); paintRequest(c);
    });
    $('saveCase').addEventListener('click', function () { toast('用例已保存', 'success'); });
    $('runCase').addEventListener('click', function () { runCase(c.id); });
    $('caseHistory').addEventListener('click', function () { location.hash = '#/executions'; });
  }
  function blankStep() {
    return { name: '新步骤', method: 'GET', url: '', headers: [], bodyType: 'none', body: '', auth: { type: 'none' }, asserts: [], extract: [] };
  }
  function renderPublicVars(c) {
    var rows = c.variables.map(function (v, i) {
      return '<div class="pv-var-row"><input class="input" data-vk="' + i + '" value="' + esc(v.key) + '" placeholder="变量名"/>' +
        '<input class="input" data-vv="' + i + '" value="' + esc(v.value) + '" placeholder="变量值"/>' +
        '<input class="input" data-vd="' + i + '" value="' + esc(v.desc || '') + '" placeholder="描述（可选）"/>' +
        '<span class="kv-del" data-vdel="' + i + '">✕</span></div>';
    }).join('');
    $('publicVars').innerHTML =
      '<div class="pv-left"><div class="pv-icon">🪙</div><div class="pv-body">' +
      '<div class="pv-title">公共变量区</div>' +
      '<div class="pv-desc">定义的变量可在步骤请求参数中通过 ${变量名} 引用，执行时会自动替换</div>' +
      (rows ? '<div class="pv-vars">' + rows + '</div>' : '<div class="pv-empty">暂无公共变量，点击「添加变量」开始定义</div>') +
      '</div></div>' +
      '<span class="pv-add" id="addVar">＋ 添加变量</span>';
    $('addVar').addEventListener('click', function () { c.variables.push({ key: '', value: '', desc: '' }); renderPublicVars(c); });
    $('publicVars').querySelectorAll('[data-vdel]').forEach(function (b) {
      b.addEventListener('click', function () { c.variables.splice(+b.getAttribute('data-vdel'), 1); renderPublicVars(c); });
    });
    $('publicVars').querySelectorAll('[data-vk]').forEach(function (inp) {
      inp.addEventListener('input', function (e) { c.variables[+inp.getAttribute('data-vk')].key = e.target.value; });
    });
    $('publicVars').querySelectorAll('[data-vv]').forEach(function (inp) {
      inp.addEventListener('input', function (e) { c.variables[+inp.getAttribute('data-vv')].value = e.target.value; });
    });
    $('publicVars').querySelectorAll('[data-vd]').forEach(function (inp) {
      inp.addEventListener('input', function (e) { c.variables[+inp.getAttribute('data-vd')].desc = e.target.value; });
    });
  }
  function paintStepTree(c) {
    var folderOpen = c._folderOpen !== false;
    $('stepNodes').innerHTML =
      '<div class="step-folder">' +
      '  <div class="folder-header" id="folderHeader">' +
      '    <span class="folder-toggle ' + (folderOpen ? '' : 'collapsed') + '">▾</span>' +
      '    <span class="folder-name">默认文件夹</span>' +
      '    <span class="folder-count">' + c.steps.length + '</span>' +
      '  </div>' +
      '  <div class="folder-content ' + (folderOpen ? '' : 'collapsed') + '">' +
      c.steps.map(function (s, i) {
        return '<div class="step-node ' + (i === state.activeStepIndex ? 'active' : '') + '" data-step="' + i + '">' +
          '<span class="step-num">' + (i + 1) + '</span>' +
          '<span class="method-pill method-' + s.method + '">' + s.method + '</span>' +
          '<span class="step-name">' + esc(s.name) + '</span></div>';
      }).join('') +
      '  </div>' +
      '</div>';
    $('folderHeader').addEventListener('click', function () { c._folderOpen = !folderOpen; paintStepTree(c); });
    $('stepNodes').querySelectorAll('[data-step]').forEach(function (n) {
      n.addEventListener('click', function () { state.activeStepIndex = +n.getAttribute('data-step'); paintStepTree(c); paintRequest(c); });
    });
  }
  function paintRequest(c) {
    var s = c.steps[state.activeStepIndex] || blankStep();
    s._editorTab = s._editorTab || 'step';

    function headersSection() {
      var rows = (s.headers || []).map(function (hdr, i) {
        return '<div class="kv-row" data-hdr="' + i + '"><input class="input" data-hk="' + i + '" value="' + esc(hdr.k) + '" placeholder="Key"/><input class="input" data-hv="' + i + '" value="' + esc(hdr.v) + '" placeholder="Value"/><span class="kv-del" data-hdrdel="' + i + '">✕</span></div>';
      }).join('');
      return '<div class="req-section">' +
        '<div class="section-head"><span class="section-label">请求头 Headers</span><span class="section-add" data-hdradd>＋ 添加</span></div>' +
        (rows ? rows : '<div class="empty-state" style="padding:12px 0;font-size:13px">无请求头</div>') +
        '</div>';
    }

    function bodySection() {
      var bodyVal = typeof s.body === 'object' ? JSON.stringify(s.body, null, 2) : (s.body || '');
      var activeType = s.bodyType || 'none';
      return '<div class="req-section">' +
        '<div class="section-head"><span class="section-label">请求体 Body</span></div>' +
        '<div class="body-type-tabs">' +
        ['none', 'json', 'xml', 'form'].map(function (t) {
          var label = { none: '无', json: 'JSON', xml: 'XML', form: '表单' }[t];
          return '<button class="body-type-tab ' + (activeType === t ? 'active' : '') + '" data-bt="' + t + '">' + label + '</button>';
        }).join('') +
        '</div>' +
        (activeType === 'none' ? '<div class="empty-state" style="padding:12px 0;font-size:13px">该步骤无请求体</div>' : '<textarea class="input" id="reqBody" rows="8">' + esc(bodyVal) + '</textarea>') +
        '</div>';
    }

    function stepPane() {
      return '<div class="step-meta-row">' +
        '<input class="input step-name-input" id="stepName" value="' + esc(s.name) + '" placeholder="步骤名称"/>' +
        '<select class="select step-type-select" id="stepType"><option value="api">接口请求步骤</option><option value="ui">UI 操作步骤</option></select>' +
        '<button class="btn btn--primary" id="tryStep">▶ 试跑此步</button>' +
        '</div>' +
        '<div class="req-url-row">' +
        '<select class="select req-method" id="reqMethod">' + ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].map(function (m) { return '<option' + (s.method === m ? ' selected' : '') + '>' + m + '</option>'; }).join('') + '</select>' +
        '<input class="input req-url" id="reqUrl" value="' + esc(s.url) + '" placeholder="{{BASE_URL}}/api/v1/login"/>' +
        '</div>' +
        headersSection() + bodySection();
    }

    function assertsPane() {
      var rows = (s.asserts || []).map(function (a, i) {
        return '<div class="assert-row" data-assert="' + i + '">' +
          '<select class="select" data-at="' + i + '">' +
          ['status', 'time', 'header', 'body', 'json'].map(function (t) { return '<option value="' + t + '"' + (a.type === t ? ' selected' : '') + '>' + assertLabel(t) + '</option>'; }).join('') +
          '</select>' +
          '<select class="select" data-ao="' + i + '">' +
          ['eq', 'ne', 'gt', 'lt', 'contains', 'json'].map(function (op) { return '<option value="' + op + '"' + (a.op === op ? ' selected' : '') + '>' + op + '</option>'; }).join('') +
          '</select>' +
          '<input class="input" data-av="' + i + '" value="' + esc(a.value) + '" placeholder="期望值"/>' +
          '<span class="kv-del" data-adel="' + i + '">✕</span></div>';
      }).join('');
      return '<div class="req-section">' +
        '<div class="section-head"><span class="section-label">断言列表</span><span class="section-add" data-aadd>＋ 添加断言</span></div>' +
        (rows ? rows : '<div class="empty-state" style="padding:12px 0;font-size:13px">暂无断言</div>') +
        '</div>';
    }

    $('requestArea').innerHTML =
      '<div class="request-panel">' +
      '  <div class="rp-tabs">' +
      '    <div class="rp-tab ' + (s._editorTab === 'step' ? 'active' : '') + '" data-etab="step">步骤</div>' +
      '    <div class="rp-tab ' + (s._editorTab === 'assert' ? 'active' : '') + '" data-etab="assert">断言 ' + ((s.asserts || []).length) + '</div>' +
      '  </div>' +
      '  <div class="rp-body" id="rpBody"></div>' +
      '</div>' +
      '<div id="respArea"></div>';

    $('rpBody').innerHTML = s._editorTab === 'step' ? stepPane() : assertsPane();

    $('requestArea').querySelectorAll('[data-etab]').forEach(function (t) {
      t.addEventListener('click', function () { s._editorTab = t.getAttribute('data-etab'); paintRequest(c); });
    });

    var sn = $('stepName'); if (sn) sn.addEventListener('input', function (e) { s.name = e.target.value; paintStepTree(c); });
    var rm = $('reqMethod'); if (rm) rm.addEventListener('change', function (e) { s.method = e.target.value; paintStepTree(c); });
    var ru = $('reqUrl'); if (ru) ru.addEventListener('input', function (e) { s.url = e.target.value; });
    var ts = $('tryStep'); if (ts) ts.addEventListener('click', function () { doTryStep(c, s); });
    bindPane(c, s);
  }
  function bindPane(c, s) {
    var area = $('requestArea');
    var ha = area.querySelector('[data-hdradd]');
    if (ha) ha.addEventListener('click', function () { s.headers = s.headers || []; s.headers.push({ k: '', v: '' }); paintRequest(c); });
    area.querySelectorAll('[data-hdrdel]').forEach(function (b) { b.addEventListener('click', function () { s.headers.splice(+b.getAttribute('data-hdrdel'), 1); paintRequest(c); }); });
    area.querySelectorAll('[data-hk]').forEach(function (inp) { inp.addEventListener('input', function (e) { s.headers[+inp.getAttribute('data-hk')].k = e.target.value; }); });
    area.querySelectorAll('[data-hv]').forEach(function (inp) { inp.addEventListener('input', function (e) { s.headers[+inp.getAttribute('data-hv')].v = e.target.value; }); });

    area.querySelectorAll('[data-bt]').forEach(function (b) {
      b.addEventListener('click', function () { s.bodyType = b.getAttribute('data-bt'); paintRequest(c); });
    });
    var rb = $('reqBody'); if (rb) rb.addEventListener('input', function (e) { try { s.body = JSON.parse(e.target.value); } catch (err) { s.body = e.target.value; } });

    var aa = area.querySelector('[data-aadd]');
    if (aa) aa.addEventListener('click', function () { s.asserts = s.asserts || []; s.asserts.push({ type: 'status', op: 'eq', value: '200' }); paintRequest(c); });
    area.querySelectorAll('[data-adel]').forEach(function (b) { b.addEventListener('click', function () { s.asserts.splice(+b.getAttribute('data-adel'), 1); paintRequest(c); }); });
    area.querySelectorAll('[data-at]').forEach(function (sel) { sel.addEventListener('change', function (e) { s.asserts[+sel.getAttribute('data-at')].type = e.target.value; }); });
    area.querySelectorAll('[data-ao]').forEach(function (sel) { sel.addEventListener('change', function (e) { s.asserts[+sel.getAttribute('data-ao')].op = e.target.value; }); });
    area.querySelectorAll('[data-av]').forEach(function (inp) { inp.addEventListener('input', function (e) { s.asserts[+inp.getAttribute('data-av')].value = e.target.value; }); });
  }
  function assertLabel(t) { return { status: '状态码', time: '响应时间', header: '响应头', body: '响应体包含', json: 'JSON 字段' }[t] || t; }
  function doTryStep(c, s) {
    var r = TF.tryStep(s);
    var ok = r.status === 200;
    var assertsHtml = (r.asserts || []).map(function (a) {
      return '<div class="assert-item"><span class="' + (a.pass ? 'ai-ok' : 'ai-fail') + '">' + (a.pass ? '✓' : '✗') + '</span> ' + assertLabel(a.type) + ' ' + esc(a.expr || '') + '</div>';
    }).join('');
    $('respArea').innerHTML =
      '<div class="response-panel"><div class="resp-head"><span>响应</span>' +
      '<span class="resp-status ' + (ok ? 'ok' : 'fail') + '">HTTP ' + r.status + ' · ' + r.time_ms + 'ms</span></div>' +
      '<div class="assert-result">' + assertsHtml + '</div>' +
      '<div class="resp-body">' + esc(JSON.stringify(r.body, null, 2)) + '</div></div>';
    toast(ok ? '试跑通过' : '试跑存在失败断言', ok ? 'success' : 'error');
  }

  /* ╔════════════════════════════════════╗
     ║  ENVIRONMENTS                     ║
     ╚════════════════════════════════════╝ */
  function renderEnvironments() {
    view.innerHTML =
      '<div class="page-container"><div class="page-header"><div class="page-header-left"><h2>环境</h2><span class="subtitle">管理接口执行环境</span></div>' +
      '<div class="page-header-right"><button class="btn btn--primary" id="newEnv">＋ 新建环境</button></div></div>' +
      '<div class="env-list">' + TF.environments.map(function (e) {
        var active = e.id == state.currentEnvironmentId;
        return '<div class="env-card"><div><div class="ec-name">' + (active ? '◉ ' : '○ ') + esc(e.name) + '</div><div class="ec-url">' + esc(e.base_url) + '</div></div>' +
          '<div><button class="btn btn--sm" data-useenv="' + e.id + '"' + (active ? ' disabled' : '') + '>' + (active ? '使用中' : '使用') + '</button></div></div>';
      }).join('') + '</div></div>';
    view.querySelectorAll('[data-useenv]').forEach(function (b) {
      b.addEventListener('click', function () { state.currentEnvironmentId = +b.getAttribute('data-useenv'); toast('已切换环境：' + currentEnv().name, 'info'); renderEnvironments(); renderHeader(); });
    });
    $('newEnv').addEventListener('click', openEnvDialog);
  }
  function openEnvDialog() {
    openDialog('<div class="card-header"><div class="dialog-title">新建环境</div><button class="dialog-close" data-close>×</button></div>' +
      '<div class="dialog-body"><div class="field"><label>名称</label><input class="input" id="envNameI" placeholder="例如：压测环境"/></div>' +
      '<div class="field"><label>基地址</label><input class="input" id="envUrlI" placeholder="https://..."/></div></div>' +
      '<div class="dialog-foot"><button class="btn" data-close>取消</button><button class="btn btn--primary" id="envSave">创建</button></div>', 'wide');
    $('envSave').addEventListener('click', function () {
      var name = $('envNameI').value.trim(); if (!name) { toast('请填写名称', 'error'); return; }
      TF.environments.push({ id: TF.nextId(), name: name, base_url: $('envUrlI').value.trim() || '—' });
      closeDialog(); renderEnvironments(); toast('环境已创建', 'success');
    });
  }

  /* ╔════════════════════════════════════╗
     ║  GLOBALS (全局变量)               ║
     ╚════════════════════════════════════╝ */
  function renderGlobals() {
    view.innerHTML =
      '<div class="page-container"><div class="page-header"><div class="page-header-left"><h2>全局变量</h2><span class="subtitle">跨用例共享的 Key / Value</span></div>' +
      '<div class="page-header-right"><button class="btn btn--primary" id="newGlob">＋ 新建变量</button></div></div>' +
      '<div class="card table-card"><table class="table"><thead><tr><th>Key</th><th>Value</th><th>说明</th><th>操作</th></tr></thead><tbody>' +
      TF.globals.map(function (g) {
        return '<tr><td class="key-cell">' + esc(g.key) + '</td><td style="font-family:var(--font-mono);font-size:12px">' + esc(g.value) + '</td><td style="color:var(--text-muted)">' + esc(g.desc) + '</td>' +
          '<td><button class="btn btn--link btn--sm" style="color:var(--color-danger-500)" data-gdel="' + g.id + '">🗑</button></td></tr>';
      }).join('') + '</tbody></table></div></div>';
    view.querySelectorAll('[data-gdel]').forEach(function (b) { b.addEventListener('click', function () { TF.globals = TF.globals.filter(function (g) { return g.id != b.getAttribute('data-gdel'); }); renderGlobals(); toast('变量已删除', 'info'); }); });
    $('newGlob').addEventListener('click', openGlobDialog);
  }
  function openGlobDialog() {
    openDialog('<div class="card-header"><div class="dialog-title">新建全局变量</div><button class="dialog-close" data-close>×</button></div>' +
      '<div class="dialog-body"><div class="field"><label>Key</label><input class="input" id="gKey" placeholder="例如：AUTH_TOKEN"/></div>' +
      '<div class="field"><label>Value</label><input class="input" id="gVal" placeholder="值"/></div>' +
      '<div class="field"><label>说明</label><input class="input" id="gDesc" placeholder="可选"/></div></div>' +
      '<div class="dialog-foot"><button class="btn" data-close>取消</button><button class="btn btn--primary" id="gSave">创建</button></div>', 'wide');
    $('gSave').addEventListener('click', function () {
      var k = $('gKey').value.trim(); if (!k) { toast('请填写 Key', 'error'); return; }
      TF.globals.push({ id: TF.nextId(), key: k, value: $('gVal').value, desc: $('gDesc').value });
      closeDialog(); renderGlobals(); toast('变量已创建', 'success');
    });
  }

  /* ╔════════════════════════════════════╗
     ║  EXECUTIONS                       ║
     ╚════════════════════════════════════╝ */
  function renderExecutions() {
    var list = TF.executions.slice().sort(function (a, b) { return b.id - a.id; });
    var success = TF.executions.filter(function (e) { return e.status === 'success'; }).length;
    view.innerHTML =
      '<div class="page-container"><div class="page-header"><div class="page-header-left"><h2>执行记录</h2><span class="subtitle">全部触发过的执行任务</span></div></div>' +
      '<div class="exec-stat"><span class="exec-badge success">✓ 成功 ' + success + '</span>' +
      '<span class="exec-badge failed">✗ 失败 ' + (TF.executions.length - success) + '</span>' +
      '<span class="exec-badge pending">共 ' + TF.executions.length + ' 条</span></div>' +
      '<div class="card table-card"><table class="table stripe"><thead><tr><th>#</th><th>用例</th><th>状态</th><th>统计</th><th>触发</th><th>时间</th></tr></thead><tbody>' +
      list.map(function (e) {
        return '<tr><td class="cell-id">#' + e.id + '</td><td>' + esc(e.case_name) + '</td>' +
          '<td><span class="exec-badge ' + e.status + '">' + EXEC_STATUS_LABEL[e.status] + '</span></td>' +
          '<td><span style="font-size:13px">共 ' + e.total_cases + '</span> <span class="text-success">✓' + e.passed + '</span> <span class="text-danger">✗' + e.failed + '</span></td>' +
          '<td>' + (e.trigger_type === 'ci' ? 'CI' : '手动') + '</td><td>' + fmtTime(e.created_at) + '</td></tr>';
      }).join('') + '</tbody></table></div></div>';
  }

  /* ╔════════════════════════════════════╗
     ║  CI / CD                          ║
     ╚════════════════════════════════════╝ */
  function renderCI() {
    var stream = [
      '$ testflow ci run --project 电商平台',
      '→ 拉取用例 6 条 ........................ <span class="ok">ok</span>',
      '→ 准备环境 test.api.example.com ...... <span class="ok">ok</span>',
      '→ 执行用例「登录成功后返回用户信息」.... <span class="ok">passed (312ms)</span>',
      '→ 执行用例「下单接口幂等性校验」....... <span class="ok">passed (489ms)</span>',
      '→ 执行用例「购物车合并（登录态）」...... <span class="warn">skipped (无环境)</span>',
      '→ 生成报告 ............................ <span class="ok">ok</span>',
      '',
      '✓ 构建成功 · 通过率 100% · 耗时 8.4s'
    ].join('\n');
    view.innerHTML =
      '<div class="page-container"><div class="page-header"><div class="page-header-left"><h2>CI / CD 集成</h2><span class="subtitle">把测试接入流水线</span></div>' +
      '<div class="page-header-right"><button class="btn btn--primary" id="runCI">▶ 触发流水线</button></div></div>' +
      '<div class="card"><div class="card-header"><div class="card-title-row"><span>最近一次运行日志</span><span class="tag tag--success">main · #128</span></div></div>' +
      '<div class="card-body"><pre class="ci-stream">' + stream + '</pre></div></div></div>';
    $('runCI').addEventListener('click', function () { toast('已触发 CI 流水线（演示）', 'success'); });
  }

  /* ── 弹窗 / 下拉 ── */
  function openDialog(innerHtml, wide) {
    var d = $('dialog');
    d.className = 'dialog' + (wide ? ' wide' : '');
    d.innerHTML = innerHtml;
    $('overlay').classList.add('open');
    d.querySelectorAll('[data-close]').forEach(function (b) { b.addEventListener('click', closeDialog); });
  }
  function closeDialog() { $('overlay').classList.remove('open'); $('dialog').innerHTML = ''; }
  function openProjDialog() {
    openDialog('<div class="card-header"><div class="dialog-title">新建项目</div><button class="dialog-close" data-close>×</button></div>' +
      '<div class="dialog-body"><div class="field"><label>名称</label><input class="input" id="pjName" placeholder="例如：电商平台"/></div>' +
      '<div class="field"><label>描述</label><input class="input" id="pjDesc" placeholder="可选"/></div></div>' +
      '<div class="dialog-foot"><button class="btn" data-close>取消</button><button class="btn btn--primary" id="pjSave">创建并进入</button></div>', 'wide');
    $('pjSave').addEventListener('click', function () {
      var name = $('pjName').value.trim(); if (!name) { toast('请填写名称', 'error'); return; }
      var p = { id: TF.nextId(), name: name, desc: $('pjDesc').value };
      TF.projects.push(p); state.currentProjectId = p.id;
      closeDialog(); renderProjects(); renderHeader(); toast('已创建并进入「' + name + '」', 'success');
    });
  }
  function openPop(popId) {
    closePopovers();
    var pop = $(popId);
    pop.classList.add('open');
    positionPop(pop, popId === 'projPop' ? $('projBtn') : $('envBtn'));
  }
  function positionPop(pop, anchor) {
    var r = anchor.getBoundingClientRect();
    pop.style.top = (r.bottom + 6) + 'px';
    pop.style.left = r.left + 'px';
  }
  function closePopovers() {
    ['projPop', 'envPop', 'userPop'].forEach(function (id) { var el = $(id); if (el) el.classList.remove('open'); });
  }
  function paintProjList() {
    var q = ($('projSearch') ? $('projSearch').value : '').trim().toLowerCase();
    var list = TF.projects.filter(function (p) { return !q || p.name.toLowerCase().indexOf(q) >= 0; });
    var allActive = !state.currentProjectId ? ' style="color:var(--accent)"' : '';
    $('projList').innerHTML =
      '<div class="pop-item' + (state.currentProjectId ? '' : ' active') + '" data-proj="all">▣ 全部项目<span style="margin-left:6px;color:var(--text-muted);font-size:11px">查看聚合数据</span></div>' +
      list.map(function (p) {
        return '<div class="pop-item ' + (p.id == state.currentProjectId ? 'active' : '') + '" data-proj="' + p.id + '"><span class="pm-dot ' + (p.id == state.currentProjectId ? 'active' : '') + '"></span>' +
          '<span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(p.name) + '</span>' +
          (p.desc ? '<span style="font-size:11px;color:var(--text-muted)">' + esc(p.desc) + '</span>' : '') + '</div>';
      }).join('');
    $('projList').querySelectorAll('[data-proj]').forEach(function (it) {
      it.addEventListener('click', function () {
        var v = it.getAttribute('data-proj');
        state.currentProjectId = (v === 'all') ? null : +v;
        closePopovers(); renderHeader(); toast(v === 'all' ? '已切换到全部项目' : '已切换到「' + currentProject().name + '」', 'info');
        if (location.hash.indexOf('test-cases') >= 0 || location.hash.indexOf('dashboard') >= 0) render();
      });
    });
  }
  function paintEnvList() {
    var q = ($('envSearch') ? $('envSearch').value : '').trim().toLowerCase();
    var list = TF.environments.filter(function (e) { return !q || e.name.toLowerCase().indexOf(q) >= 0 || (e.base_url && e.base_url.toLowerCase().indexOf(q) >= 0); });
    $('envList').innerHTML = list.length ? list.map(function (e) {
      return '<div class="pop-item ' + (e.id == state.currentEnvironmentId ? 'active' : '') + '" data-env="' + e.id + '"><span class="env-dot ' + (e.id == state.currentEnvironmentId ? 'active' : '') + '"></span>' +
        '<span style="flex:1">' + esc(e.name) + '</span><span style="font-size:11px;color:var(--text-muted);font-family:var(--font-mono)">' + esc(e.base_url) + '</span></div>';
    }).join('') : '<div class="pop-item" style="cursor:default;color:var(--text-muted)">无匹配环境</div>';
    $('envList').querySelectorAll('[data-env]').forEach(function (it) {
      it.addEventListener('click', function () {
        state.currentEnvironmentId = +it.getAttribute('data-env');
        closePopovers(); renderHeader(); toast('已切换环境：' + currentEnv().name, 'info');
      });
    });
  }

  /* ── 运行结果弹窗 ── */
  function showRunResult(status, title, desc) {
    openDialog('<div class="dialog-body"><div class="run-result">' +
      '<div class="run-result-icon ' + status + '">' + (status === 'success' ? '✓' : '✕') + '</div>' +
      '<div class="run-result-body"><div class="run-result-title">' + esc(title) + '</div><div class="run-result-desc">' + esc(desc) + '</div></div>' +
      '</div></div><div class="dialog-foot"><button class="btn" data-close>关闭</button></div>');
  }

  /* ╔════════════════════════════════════╗
     ║  BIND 全局事件                      ║
     ╚════════════════════════════════════╝ */
  function bindGlobal() {
    initTheme();

    // 侧栏 / 导航
    $('aside').addEventListener('click', function (e) {
      var item = e.target.closest('[data-nav]');
      if (item) { location.hash = '#' + item.getAttribute('data-nav'); }
    });
    document.body.addEventListener('click', function (e) {
      var navEl = e.target.closest('[data-nav]');
      if (navEl && navEl !== $('aside')) { location.hash = '#' + navEl.getAttribute('data-nav'); }
    });

    // 折叠
    $('collapseBtn').addEventListener('click', function () {
      var a = $('aside'); a.classList.toggle('collapsed');
      $('collapseBtn').textContent = a.classList.contains('collapsed') ? '»' : '«';
    });

    // 主题
    $('themeBtn').addEventListener('click', function () { applyTheme(state.theme === 'dark' ? 'light' : 'dark'); });

    // 项目 / 环境下拉
    $('projBtn').addEventListener('click', function (e) { e.stopPropagation(); paintProjList(); openPop('projPop'); });
    $('envBtn').addEventListener('click', function (e) { e.stopPropagation(); paintEnvList(); openPop('envPop'); });
    $('projSearch').addEventListener('input', paintProjList);
    $('envSearch').addEventListener('input', paintEnvList);
    $('projNew').addEventListener('click', function () { closePopovers(); openProjDialog(); });
    $('projPop').querySelector('[data-nav="/projects"]').addEventListener('click', function () { closePopovers(); location.hash = '#/projects'; });
    $('envPop').querySelector('[data-nav="/environments"]').addEventListener('click', function () { closePopovers(); location.hash = '#/environments'; });

    // 用户下拉
    $('userBtn').addEventListener('click', function (e) { e.stopPropagation(); var p = $('userPop'); p.classList.toggle('open'); });
    $('userPop').addEventListener('click', function (e) {
      if (e.target.getAttribute('data-act') === 'logout') {
        closePopovers(); state.loggedIn = false; toast('已退出登录', 'info'); location.hash = '#/login';
      }
    });

    // 关闭弹窗（点击遮罩）
    $('overlay').addEventListener('click', function (e) { if (e.target === $('overlay')) closeDialog(); });

    // 点击空白关闭 popover
    document.addEventListener('click', function (e) {
      if (!e.target.closest('#projPop') && !e.target.closest('#projBtn') &&
          !e.target.closest('#envPop') && !e.target.closest('#envBtn') &&
          !e.target.closest('#userPop') && !e.target.closest('#userBtn')) {
        closePopovers();
      }
    });

    window.addEventListener('hashchange', render);
  }

  /* ── 启动 ── */
  bindGlobal();
  render();
})();
