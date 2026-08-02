/* ============================================================
   TomorrowBBS 静态体验版 —— 应用逻辑（原生 JS，hash 路由，内存 mock）
   复刻原 Vue 版的页面结构与交互，无后端、可离线 file:// 打开。
   ============================================================ */
(function () {
  'use strict';
  var TB = window.TB;

  /* ---------- 基础工具 ---------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function nowStr() {
    var d = new Date();
    function p(n) { return n < 10 ? '0' + n : '' + n; }
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' +
      p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds());
  }
  function nav(hash) { location.hash = hash; }

  /* ---------- 头像 / 封面 ---------- */
  function avatarHtml(user, sizeCls) {
    if (!user) return '<div class="avatar ' + sizeCls + '" style="background:#e7e7e7">未</div>';
    var initial = (user.nickName || '?').charAt(0);
    var color = user.color || '#c0c4cc';
    if (user.avatar) {
      return '<div class="avatar ' + sizeCls + '" data-uid="' + esc(user.userId) + '" title="' + esc(user.nickName) + '">' +
        '<img src="' + esc(user.avatar) + '" alt="' + esc(user.nickName) + '" onerror="this.style.display=\'none\';this.parentNode.style.background=\'' + color + '\';this.parentNode.textContent=\'' + esc(initial) + '\';">' +
        '</div>';
    }
    return '<div class="avatar ' + sizeCls + '" data-uid="' + esc(user.userId) + '" style="background:' + color + '">' + esc(initial) + '</div>';
  }
  function coverStyle(cover) {
    if (!cover) return '';
    if (/^(linear|radial)-gradient/.test(cover)) return 'background:' + cover + ';';
    return 'background:url(' + cover + ') center/cover no-repeat;';
  }

  /* ---------- 极简 Markdown -> HTML（用于发帖预览/保存）---------- */
  function mdToHtml(md) {
    var lines = String(md || '').replace(/\r\n/g, '\n').split('\n');
    var html = '', i = 0, inCode = false, codeBuf = [], codeLang = '';
    function inline(t) {
      t = t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      t = t.replace(/`([^`]+)`/g, '<code>$1</code>');
      t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
      t = t.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
      t = t.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, '<img src="$2" alt="$1" />');
      t = t.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>');
      return t;
    }
    while (i < lines.length) {
      var line = lines[i];
      var fence = line.match(/^```(\w*)\s*$/);
      if (fence) {
        if (!inCode) { inCode = true; codeLang = fence[1] || ''; codeBuf = []; i++; continue; }
        var code = codeBuf.join('\n').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        html += '<pre><code class="language-' + codeLang + '">' + code + '</code></pre>';
        inCode = false; i++; continue;
      }
      if (inCode) { codeBuf.push(line); i++; continue; }
      if (/^---+\s*$/.test(line)) { html += '<hr/>'; i++; continue; }
      var h = line.match(/^(#{1,6})\s+(.*)$/);
      if (h) { var l = h[1].length; html += '<h' + l + '>' + inline(h[2]) + '</h' + l + '>'; i++; continue; }
      if (/^>\s?/.test(line)) {
        var q = []; while (i < lines.length && /^>\s?/.test(lines[i])) { q.push(lines[i].replace(/^>\s?/, '')); i++; }
        html += '<blockquote>' + inline(q.join(' ')) + '</blockquote>'; continue;
      }
      if (/^[-*]\s+/.test(line)) {
        var ul = []; while (i < lines.length && /^[-*]\s+/.test(lines[i])) { ul.push('<li>' + inline(lines[i].replace(/^[-*]\s+/, '')) + '</li>'); i++; }
        html += '<ul>' + ul.join('') + '</ul>'; continue;
      }
      if (/^\d+\.\s+/.test(line)) {
        var ol = []; while (i < lines.length && /^\d+\.\s+/.test(lines[i])) { ol.push('<li>' + inline(lines[i].replace(/^\d+\.\s+/, '')) + '</li>'); i++; }
        html += '<ol>' + ol.join('') + '</ol>'; continue;
      }
      if (line.trim() === '') { i++; continue; }
      var p = [];
      while (i < lines.length && lines[i].trim() !== '' &&
        !/^(#{1,6}\s|```|>\s?|[-*]\s+|\d+\.\s+|---+\s*$)/.test(lines[i])) { p.push(inline(lines[i])); i++; }
      html += '<p>' + p.join('<br/>') + '</p>';
    }
    return html;
  }

  /* ---------- 全局提示 ---------- */
  var toastTimer = null;
  function toast(msg, type) {
    var t = $('#toast');
    t.className = 'tb-toast show ' + (type || '');
    t.innerHTML = (type === 'success' ? '<span class="iconfont icon-good"></span>' :
      type === 'error' ? '<span class="iconfont icon-del"></span>' :
        type === 'warning' ? '<span class="iconfont icon-empty"></span>' : '') + '<span>' + esc(msg) + '</span>';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.className = 'tb-toast ' + (type || ''); }, 2200);
  }

  /* ---------- 图片灯箱 ---------- */
  var lbList = [], lbIndex = 0;
  function openLightbox(list, idx) {
    lbList = list || []; lbIndex = idx || 0;
    var box = $('#lightbox');
    function show() {
      $('#lbImg').src = lbList[lbIndex];
      $('#lbCount').textContent = (lbIndex + 1) + ' / ' + lbList.length;
    }
    box._show = show; show();
    box.classList.add('open');
  }
  function closeLightbox() { $('#lightbox').classList.remove('open'); }

  /* ---------- 应用状态 ---------- */
  var state = {
    loginUser: TB.loginUser ? Object.assign({}, TB.loginUser) : null,
    currentPBoardId: '-1',
    currentBoardId: '0',
    search: '',
    likedArticles: {},     // articleId -> true（当前用户点赞）
    viewed: {}             // articleId -> true（避免重复 +1 阅读）
  };

  /* ============================================================
     头部：菜单 / 搜索 / 发帖 / 登录注册
     ============================================================ */
  function renderMenu() {
    var html = '<a class="back-blog-drawer" href="../index.html">← 返回博客</a>' +
      '<span class="menu-item ' + (state.currentPBoardId === '-1' ? 'active' : '') + '" data-home="1">首页</span>';
    TB.boards.forEach(function (b) {
      var hasChild = b.children && b.children.length > 0;
      var cls = 'menu-item' + (hasChild ? ' has-child' : '') +
        (b.boardId === state.currentPBoardId ? ' active' : '');
      var pop = '';
      if (hasChild) {
        pop = '<div class="sub-board-pop"><div class="sub-board-list">' +
          b.children.map(function (c) {
            return '<span class="sub-board ' + (c.boardId === state.currentBoardId ? 'active' : '') +
              '" data-pbid="' + b.boardId + '" data-bid="' + c.boardId + '">' + esc(c.boardName) + '</span>';
          }).join('') + '</div></div>';
      }
      html += '<span class="' + cls + '" data-pbid="' + b.boardId + '">' + esc(b.boardName) + pop + '</span>';
    });
    $('#menu').innerHTML = html;
  }

  function renderAuth() {
    var el = $('#authArea');
    if (state.loginUser) {
      el.innerHTML =
        '<div class="search-container" style="margin:0;">' +
        '<div class="user-info"><div class="ep-dropdown" id="userDropdown">' +
        avatarHtml(state.loginUser, 'md') +
        '<div class="ep-dropdown-menu">' +
        '<div class="ep-dropdown-item" data-act="ucenter">个人中心</div>' +
        '<div class="ep-dropdown-item" data-act="logout">退出登录</div>' +
        '</div></div></div>' +
        '<div class="message-info"><div class="ep-dropdown" id="msgDropdown">' +
        '<span class="ep-badge"><span class="iconfont icon-message"></span><span class="dot">99</span></span>' +
        '<div class="ep-dropdown-menu">' +
        '<div class="ep-dropdown-item">回复我的</div>' +
        '<div class="ep-dropdown-item">点赞评论</div>' +
        '<div class="ep-dropdown-item">点赞文章</div>' +
        '<div class="ep-dropdown-item">下载附件</div>' +
        '<div class="ep-dropdown-item">系统消息</div>' +
        '</div></div></div>' +
        '</div>';
    } else {
      el.innerHTML =
        '<div class="joined-buttons">' +
        '<button class="joined-button" data-act="login">登录</button>' +
        '<button class="joined-button" data-act="register">注册</button>' +
        '</div>';
    }
  }

  function updateHeaderActive() { renderMenu(); }

  /* ============================================================
     路由
     ============================================================ */
  function parseHash() {
    var h = location.hash.replace(/^#/, '') || '/';
    var m;
    if (h === '/' || h === '') return { name: 'list', pBoardId: '0', boardId: '0' };
    if ((m = h.match(/^\/forum\/([^/]+)\/?([^/]*)$/))) return { name: 'list', pBoardId: m[1], boardId: m[2] || '0' };
    if ((m = h.match(/^\/post\/([^/]+)$/))) return { name: 'detail', articleId: m[1] };
    if (h === '/newPost') return { name: 'post' };
    if ((m = h.match(/^\/user\/([^/]+)$/))) return { name: 'user', userId: m[1] };
    return { name: 'list', pBoardId: '0', boardId: '0' };
  }

  function render() {
    var r = parseHash();
    // 同步菜单高亮
    if (r.name === 'list') {
      state.currentPBoardId = r.pBoardId === '0' ? '-1' : r.pBoardId;
      state.currentBoardId = r.boardId || '0';
    }
    renderMenu();

    var main = $('#app-main');
    if (r.name === 'list') main.innerHTML = renderList(r.pBoardId, r.boardId);
    else if (r.name === 'detail') main.innerHTML = renderDetail(r.articleId);
    else if (r.name === 'post') main.innerHTML = renderPost();
    else if (r.name === 'user') main.innerHTML = renderUserCenter(r.userId);
    else main.innerHTML = renderList('0', '0');

    // 绑定各视图事件
    if (r.name === 'list') bindList();
    else if (r.name === 'detail') bindDetail(r.articleId);
    else if (r.name === 'post') bindPost();
    else if (r.name === 'user') bindUserCenter(r.userId);

    window.scrollTo(0, 0);
  }

  /* ============================================================
     列表视图
     ============================================================ */
  var listCtx = { pBoardId: '0', boardId: '0', orderType: 0, filtered: [], page: 1, pageSize: 5 };

  function filterAndSort(pBoardId, boardId, orderType) {
    var arr = TB.articles.filter(function (a) {
      if (pBoardId !== '0' && a.pBoardId !== pBoardId) return false;
      if (boardId !== '0' && a.boardId !== boardId) return false;
      if (state.search) {
        var q = state.search.toLowerCase();
        if ((a.title + a.summary).toLowerCase().indexOf(q) === -1) return false;
      }
      return true;
    });
    arr.sort(function (x, y) {
      // 置顶帖始终排在最前
      if (x.topType !== y.topType) return y.topType - x.topType;
      if (orderType === 1) return x.postTime < y.postTime ? -1 : 1;       // 发布时间
      if (orderType === 2) return x.postTime > y.postTime ? -1 : 1;       // 最新
      var sx = x.goodCount + x.commentCount * 3 + x.readCount * 0.1;      // 热榜
      var sy = y.goodCount + y.commentCount * 3 + y.readCount * 0.1;
      return sy - sx;
    });
    return arr;
  }

  function renderList(pBoardId, boardId) {
    listCtx.pBoardId = pBoardId; listCtx.boardId = boardId;
    listCtx.orderType = 0; listCtx.page = 1;
    // 二级板块 tab
    var subHtml = '';
    if (pBoardId !== '0') {
      var board = TB.boards.filter(function (b) { return b.boardId === pBoardId; })[0];
      if (board && board.children && board.children.length) {
        subHtml = '<div class="sub-board">' +
          '<span class="board-item ' + (boardId === '0' ? 'active' : '') + '" data-bid="0"><a>全部</a></span>' +
          board.children.map(function (c) {
            return '<span class="board-item ' + (c.boardId === boardId ? 'active' : '') + '" data-bid="' + c.boardId + '"><a>' + esc(c.boardName) + '</a></span>';
          }).join('') + '</div>';
      }
    }
    var tabs = '<div class="top-tab">' +
      '<div class="tab ' + (listCtx.orderType === 0 ? 'active' : '') + '" data-order="0">热榜</div>' +
      '<span class="ep-divider-v"></span>' +
      '<div class="tab ' + (listCtx.orderType === 1 ? 'active' : '') + '" data-order="1">发布时间</div>' +
      '<span class="ep-divider-v"></span>' +
      '<div class="tab ' + (listCtx.orderType === 2 ? 'active' : '') + '" data-order="2">最新</div>' +
      '</div>';

    return '<div class="main-wrap"><div class="article-panel">' + subHtml + tabs +
      '<div class="article-list" id="articleList"></div>' +
      '<div class="tb-pagination" id="listPager"></div>' +
      '</div></div>';
  }

  function renderListItems() {
    listCtx.filtered = filterAndSort(listCtx.pBoardId, listCtx.boardId, listCtx.orderType);
    var total = listCtx.filtered.length;
    var pages = Math.max(1, Math.ceil(total / listCtx.pageSize));
    if (listCtx.page > pages) listCtx.page = pages;
    var start = (listCtx.page - 1) * listCtx.pageSize;
    var slice = listCtx.filtered.slice(start, start + listCtx.pageSize);

    var box = $('#articleList');
    if (!slice.length) {
      box.innerHTML = '<div class="no-data"><div class="iconfont icon-empty"></div><div class="msg">暂无文章</div></div>';
    } else {
      box.innerHTML = slice.map(function (a) {
        return '<div class="article-item" data-id="' + a.articleId + '">' +
          '<div class="details">' +
          '<div class="user-info">' + avatarHtml(TB.users[a.userId] || { userId: a.userId, nickName: a.nickName, color: '#c0c4cc' }, 'sm') +
          '<a class="link-info" data-uid="' + esc(a.userId) + '">' + esc(a.nickName) + '</a>' +
          '<span class="ep-divider-v"></span><span>' + esc(a.userIpAddress) + '</span>' +
          '<span class="ep-divider-v"></span><span>' + esc(a.postTime) + '</span>' +
          '<span class="ep-divider-v"></span><a class="link-info" data-board="' + a.pBoardId + '">' + esc(a.pboardName) + '</a>' +
          (a.boardName ? '<span class="ep-divider-v"></span><a class="link-info" data-board="' + a.pBoardId + '" data-sub="' + a.boardId + '">' + esc(a.boardName) + '</a>' : '') +
          '</div>' +
          '<div class="article-content"><a class="title" data-id="' + a.articleId + '">' +
          (a.topType === 1 ? '<span class="top">置顶</span>' : '') + esc(a.title) + '</a>' +
          '<div class="summary">' + esc(a.summary) + '</div></div>' +
          '<div class="stats">' +
          '<span class="iconfont icon-eye-solid">' + (a.readCount == 0 ? '阅读' : a.readCount) + '</span>' +
          '<span class="iconfont icon-good">' + (a.goodCount == 0 ? '点赞' : a.goodCount) + '</span>' +
          '<span class="iconfont icon-comment">' + (a.commentCount == 0 ? '评论' : a.commentCount) + '</span>' +
          '</div>' +
          '</div>' +
          (a.cover ? '<div class="cover-box" data-id="' + a.articleId + '" style="' + coverStyle(a.cover) + '"></div>' : '') +
          '</div>';
      }).join('');
    }
    // 分页
    var pg = $('#listPager');
    if (pages <= 1) { pg.innerHTML = ''; }
    else {
      var html = '<button class="pg" data-pg="prev" ' + (listCtx.page === 1 ? 'disabled' : '') + '>上一页</button>';
      for (var p = 1; p <= pages; p++) html += '<button class="pg ' + (p === listCtx.page ? 'active' : '') + '" data-pg="' + p + '">' + p + '</button>';
      html += '<button class="pg" data-pg="next" ' + (listCtx.page === pages ? 'disabled' : '') + '>下一页</button>';
      pg.innerHTML = html;
    }
  }

  function bindList() {
    renderListItems();
    var main = $('#app-main');
    // 排序
    $all('.top-tab .tab', main).forEach(function (t) {
      t.addEventListener('click', function () {
        listCtx.orderType = +t.dataset.order;
        $all('.top-tab .tab', main).forEach(function (x) { x.classList.toggle('active', x === t); });
        renderListItems();
      });
    });
    // 二级板块
    $all('.sub-board .board-item', main).forEach(function (b) {
      b.addEventListener('click', function (e) {
        e.stopPropagation();
        var bid = b.dataset.bid || '0';
        nav('/forum/' + listCtx.pBoardId + (bid !== '0' ? '/' + bid : ''));
      });
    });
    // 分页
    $('#listPager').addEventListener('click', function (e) {
      var btn = e.target.closest('.pg'); if (!btn || btn.disabled) return;
      var v = btn.dataset.pg;
      var pages = Math.max(1, Math.ceil(listCtx.filtered.length / listCtx.pageSize));
      if (v === 'prev') listCtx.page = Math.max(1, listCtx.page - 1);
      else if (v === 'next') listCtx.page = Math.min(pages, listCtx.page + 1);
      else listCtx.page = +v;
      renderListItems();
    });
    // 文章点击
    $('#articleList').addEventListener('click', function (e) {
      var item = e.target.closest('[data-id]'); if (!item) return;
      nav('/post/' + item.dataset.id);
    });
  }

  /* ============================================================
     详情视图
     ============================================================ */
  function findArticle(id) {
    return TB.articles.filter(function (a) { return a.articleId === id; })[0];
  }

  function renderDetail(id) {
    var a = findArticle(id);
    if (!a) return '<div class="main-wrap"><div class="no-data"><div class="iconfont icon-empty"></div><div class="msg">文章不存在</div></div></div>';
    // 阅读 +1（每个会话仅一次）
    if (!state.viewed[id]) { a.readCount++; state.viewed[id] = true; }

    var meta = TB.boardMeta(a.pBoardId, a.boardId);
    var crumb = '<a class="a-link" data-board="' + a.pBoardId + '">' + esc(a.pboardName) + '</a>' +
      '<span class="iconfont icon-right"></span>' +
      (a.boardName ? '<a class="a-link" data-board="' + a.pBoardId + '" data-sub="' + a.boardId + '">' + esc(a.boardName) + '</a><span class="iconfont icon-right"></span>' : '') +
      '<span>' + esc(a.title) + '</span>';

    var attach = '';
    if (a.attachment) {
      var at = a.attachment;
      attach = '<div class="attachment-panel" id="view-attachment">' +
        '<div class="attachment-title">附件</div>' +
        '<div class="attachment-info">' +
        '<span class="iconfont icon-zip item"></span>' +
        '<span class="file-name item">' + esc(at.fileName) + '</span>' +
        '<span class="size item">' + sizeToStr(at.fileSize) + '</span>' +
        '<span class="item">需要<span class="integral">' + at.integral + '</span>积分</span>' +
        '<span class="download-count item">已下载' + at.downloadCount + '</span>' +
        '<span class="item"><button class="ep-btn primary" id="dlBtn" style="padding:4px 12px;">下载</button></span>' +
        '</div></div>';
    }

    var html =
      '<div class="main-wrap article-detail-body">' +
      '<div class="board-info">' + crumb + '</div>' +
      '<div class="detail-container">' +
      '<div class="article-detail">' +
      '<div class="article-title">' + esc(a.title) + '</div>' +
      '<div class="user-info">' + avatarHtml(TB.users[a.userId] || { userId: a.userId, nickName: a.nickName, color: '#c0c4cc' }, 'md') +
      '<div class="user-info-detail"><a class="nick-name" data-uid="' + esc(a.userId) + '">' + esc(a.nickName) + '</a>' +
      '<div class="time-info"><span class="span-info">' + esc(a.postTime) + '</span>' +
      '<span class="span-info">' + esc(a.userIpAddress) + '</span>' +
      '<span class="iconfont icon-eye-solid span-info">' + (a.readCount == 0 ? '阅读' : a.readCount) + '</span></div></div></div>' +
      '<div class="detail" id="detail">' + a.content + '</div>' +
      '</div>' + attach +
      '<div class="comment-panel" id="view-comment">' + renderCommentPanel(a) + '</div>' +
      '</div></div>' +
      // 左侧快捷操作
      '<div class="quick-panel" id="quickPanel">' +
      '<div class="quick-item" id="likeBtn" title="点赞"><span class="iconfont icon-good ' + (state.likedArticles[id] ? 'have-like' : '') + '"></span></div>' +
      '<div class="quick-item" id="commentBtn" title="评论"><span class="iconfont icon-comment"></span></div>' +
      '</div>';
    return html;
  }

  function sizeToStr(size) {
    var data = '';
    if (size < 0.1 * 1024) data = size.toFixed(2) + 'B';
    else if (size < 0.1 * 1024 * 1024) data = (size / 1024).toFixed(2) + 'KB';
    else if (size < 0.1 * 1024 * 1024 * 1024) data = (size / (1024 * 1024)).toFixed(2) + 'MB';
    else data = (size / (1024 * 1024 * 1024)).toFixed(2) + 'GB';
    var s = data + '', len = s.indexOf('.'), dec = s.substr(len + 1, 2);
    if (dec === '00') return s.substring(0, len) + s.substr(len + 3, 2);
    return s;
  }

  /* ---------- 评论区 ---------- */
  function renderCommentPanel(a) {
    var list = TB.comments[a.articleId] || [];
    var total = countComments(list);
    var head = '<div class="comment-title"><div class="title">评论<span class="count">' + total + '</span></div>' +
      '<div class="tab ' + (a._cOrder === 1 ? 'active' : '') + '" data-corder="1">热榜</div>' +
      '<span class="ep-divider-v"></span>' +
      '<div class="tab ' + (!a._cOrder ? 'active' : '') + '" data-corder="0">最新</div></div>';
    var form = state.loginUser
      ? '<div class="comment-form-panel">' + avatarHtml(state.loginUser, 'md') +
      '<div class="cf-input"><textarea class="ep-textarea" id="topComment" rows="3" maxlength="1000" placeholder="请输入评论内容..."></textarea>' +
      '<div class="cf-tools"><span class="iconfont icon-image" id="topImgBtn" title="插入图片"></span>' +
      '<span id="topImgPreview"></span>' +
      '<div class="send-btn" id="topSend">发表</div></div></div></div>'
      : '<div class="comment-form-panel"><div class="cf-input"><div class="ep-btn" id="needLogin">登录后参与评论</div></div></div>';

    var items = list.length ? list.map(function (c) { return commentItemHtml(c, a); }).join('')
      : '<div class="no-data"><div class="iconfont icon-empty"></div><div class="msg">暂无评论，发表你的评论吧！</div></div>';
    return head + form + '<div class="comment-list" id="commentList">' + items + '</div>';
  }

  function countComments(list) {
    var n = 0; (list || []).forEach(function (c) { n += 1 + (c.children ? c.children.length : 0); }); return n;
  }

  function commentItemHtml(c, a) {
    var isAuthor = (state.loginUser && c.userId === a.userId);
    var children = (c.children && c.children.length)
      ? '<div class="comment-sub-list">' + c.children.map(function (s) {
        return '<div class="comment-sub-item">' + avatarHtml(TB.users[s.userId] || { userId: s.userId, nickName: s.nickName, color: '#c0c4cc' }, 'sm') +
          '<div class="comment-sub-info"><div class="nick-name"><span class="name" data-uid="' + esc(s.userId) + '">' + esc(s.nickName) + '</span>' +
          (s.userId === a.userId ? '<span class="tag-author">作者</span>' : '') +
          (s.replyUserId ? '<span class="reply-name">回复</span><span class="a-link" data-uid="' + esc(s.replyUserId) + '">@' + esc(s.replyNickName) + '</span>' : '') +
          '<span>：</span><span class="sub-content">' + esc(s.content) + '</span></div>' +
          '<div class="op-panel"><span class="op ' + (s.likeType === 1 ? 'active' : '') + '" data-like="' + s.commentId + '"><span class="iconfont icon-good"></span>' + (s.goodCount > 0 ? s.goodCount : '点赞') + '</span>' +
          '<span class="op" data-reply="' + c.commentId + '" data-ruid="' + esc(s.userId) + '" data-rname="' + esc(s.nickName) + '"><span class="iconfont icon-comment"></span>回复</span></div>' +
          '</div></div>';
      }).join('') + '</div>'
      : '';
    return '<div class="comment-item" data-cid="' + c.commentId + '">' +
      avatarHtml(TB.users[c.userId] || { userId: c.userId, nickName: c.nickName, color: '#c0c4cc' }, 'md') +
      '<div class="comment-info">' +
      '<div class="nick-name"><span class="name" data-uid="' + esc(c.userId) + '">' + esc(c.nickName) + '</span>' +
      (isAuthor ? '<span class="tag-author">作者</span>' : '') + '</div>' +
      '<div class="comment-content">' +
      (c.topType === 1 ? '<span class="tag tag-topping">置顶</span>' : '') +
      (c.status === 0 ? '<span class="tag no-audit">待审核</span>' : '') +
      '<span>' + esc(c.content) + '</span></div>' +
      '<div class="op-panel">' +
      '<span class="op ' + (c.likeType === 1 ? 'active' : '') + '" data-like="' + c.commentId + '"><span class="iconfont icon-good"></span>' + (c.goodCount > 0 ? c.goodCount : '点赞') + '</span>' +
      '<span class="op" data-reply="' + c.commentId + '" data-ruid="' + esc(c.userId) + '" data-rname="' + esc(c.nickName) + '"><span class="iconfont icon-comment"></span>回复</span>' +
      (isAuthor ? '<span class="op" data-top="' + c.commentId + '"><span class="iconfont icon-more"></span>更多</span>' : '') +
      '<span class="op" style="margin-left:auto;color:#909399;">' + esc(c.postTime) + '&nbsp;&nbsp;' + esc(c.userIpAddress) + '</span>' +
      '</div>' + children +
      '<div class="reply-info" id="reply-' + c.commentId + '" style="display:none;"></div>' +
      '</div></div>';
  }

  function bindDetail(id) {
    var a = findArticle(id);
    var main = $('#app-main');

    // 面包屑 / 板块跳转
    $all('[data-board]', main).forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.stopPropagation();
        nav('/forum/' + el.dataset.board + (el.dataset.sub ? '/' + el.dataset.sub : ''));
      });
    });
    // 用户跳转
    $all('[data-uid]', main).forEach(function (el) {
      el.addEventListener('click', function (e) { e.stopPropagation(); nav('/user/' + el.dataset.uid); });
    });

    // 图片预览
    var imgs = $all('#detail img', main);
    var srcs = imgs.map(function (im) { return im.src; });
    imgs.forEach(function (im, i) {
      im.addEventListener('click', function () { openLightbox(srcs, i); });
    });

    // 点赞（快捷面板）
    $('#likeBtn').addEventListener('click', function () {
      toggleArticleLike(a);
      $('#likeBtn').querySelector('.iconfont').classList.toggle('have-like', !!state.likedArticles[id]);
    });
    $('#commentBtn').addEventListener('click', function () { $('#view-comment').scrollIntoView({ behavior: 'smooth' }); });
    var attachBtn = $('#attachBtn');
    if (attachBtn) attachBtn.addEventListener('click', function () { $('#view-attachment').scrollIntoView({ behavior: 'smooth' }); });
    var dlBtn = $('#dlBtn');
    if (dlBtn) dlBtn.addEventListener('click', function () {
      if (!state.loginUser) { openLogin(1); return; }
      a.attachment.downloadCount++; toast('下载成功（演示）', 'success');
    });

    bindComments(a);
  }

  function toggleArticleLike(a) {
    if (!state.loginUser) { openLogin(1); return; }
    if (state.likedArticles[a.articleId]) { delete state.likedArticles[a.articleId]; a.goodCount = Math.max(0, a.goodCount - 1); a.haveLike = false; }
    else { state.likedArticles[a.articleId] = true; a.goodCount++; a.haveLike = true; }
  }

  function bindComments(a) {
    var main = $('#app-main');
    var panel = $('#view-comment');

    function refresh() { panel.innerHTML = renderCommentPanel(a); bindComments(a); }

    // 排序 tab
    $all('.comment-title .tab', panel).forEach(function (t) {
      t.addEventListener('click', function () {
        a._cOrder = +t.dataset.corder;
        var list = TB.comments[a.articleId] || [];
        list.sort(function (x, y) { return a._cOrder ? (y.goodCount - x.goodCount) : (x.postTime < y.postTime ? 1 : -1); });
        refresh();
      });
    });

    // 顶层发表
    var topSend = $('#topSend');
    if (topSend) topSend.addEventListener('click', function () {
      var ta = $('#topComment'); var val = ta.value.trim();
      if (!val) { toast('请输入评论内容', 'warning'); return; }
      addComment(a, { pCommentId: '0', replyUserId: null, replyNickName: null, content: val });
      toast('评论成功', 'success');
      refresh();
    });
    var needLogin = $('#needLogin');
    if (needLogin) needLogin.addEventListener('click', function () { openLogin(1); });

    // 点赞 / 回复 / 置顶（事件委托，仅绑定一次，避免 refresh 后重复绑定）
    if (!panel._commentBound) {
      panel._commentBound = true;
      panel.addEventListener('click', function (e) {
      var like = e.target.closest('[data-like]');
      if (like) {
        var cid = like.dataset.like;
        var c = findComment(a, cid);
        if (c) { c.likeType = c.likeType === 1 ? 0 : 1; c.goodCount += c.likeType === 1 ? 1 : -1; }
        refresh(); return;
      }
      var reply = e.target.closest('[data-reply]');
      if (reply) {
        var cid2 = reply.dataset.reply;
        var box = $('#reply-' + cid2);
        if (box.style.display === 'none') {
          $all('.reply-info', panel).forEach(function (b) { b.style.display = 'none'; b.innerHTML = ''; });
          box.style.display = 'flex';
          box.innerHTML = avatarHtml(state.loginUser || {}, 'sm') +
            '<div class="cf-input"><textarea class="ep-textarea" id="replyTa-' + cid2 + '" rows="2" maxlength="1000" placeholder="回复 @' + esc(reply.dataset.rname) + '"></textarea>' +
            '<div class="cf-tools"><div class="send-btn" id="replySend-' + cid2 + '" style="height:40px;line-height:40px;width:50px;font-size:13px;">回复</div></div></div>';
          $('#replySend-' + cid2).addEventListener('click', function () {
            var v = $('#replyTa-' + cid2).value.trim();
            if (!v) { toast('请输入回复内容', 'warning'); return; }
            addComment(a, { pCommentId: cid2, replyUserId: reply.dataset.ruid, replyNickName: reply.dataset.rname, content: v });
            toast('回复成功', 'success'); refresh();
          });
        } else { box.style.display = 'none'; box.innerHTML = ''; }
        return;
      }
      var top = e.target.closest('[data-top]');
      if (top) {
        var cc = findComment(a, top.dataset.top);
        if (cc) { cc.topType = cc.topType === 1 ? 0 : 1; toast(cc.topType ? '已置顶' : '已取消置顶', 'success'); refresh(); }
        return;
      }
      });
    }
  }

  function findComment(a, cid) {
    var list = TB.comments[a.articleId] || [];
    for (var i = 0; i < list.length; i++) {
      if (list[i].commentId === cid) return list[i];
      if (list[i].children) for (var j = 0; j < list[i].children.length; j++) if (list[i].children[j].commentId === cid) return list[i].children[j];
    }
    return null;
  }

  function addComment(a, opt) {
    if (!TB.comments[a.articleId]) TB.comments[a.articleId] = [];
    var u = state.loginUser || { userId: '0', nickName: '游客', color: '#c0c4cc' };
    var newC = {
      commentId: 'c' + Date.now(), articleId: a.articleId, pCommentId: opt.pCommentId,
      userId: u.userId, nickName: u.nickName, userIpAddress: u.lastLoginIpAddress || '未知',
      replyUserId: opt.replyUserId, replyNickName: opt.replyNickName,
      postTime: nowStr(), content: opt.content, goodCount: 0, likeType: 0, topType: 0, status: 1, children: []
    };
    if (opt.pCommentId === '0') {
      TB.comments[a.articleId].unshift(newC);
    } else {
      var parent = findComment(a, opt.pCommentId);
      if (parent) parent.children.unshift(newC);
    }
    a.commentCount = countComments(TB.comments[a.articleId]);
  }

  /* ============================================================
     发帖视图
     ============================================================ */
  function renderPost() {
    if (!state.loginUser) { openLogin(1); return '<div class="main-wrap"><div class="no-data"><div class="iconfont icon-empty"></div><div class="msg">请先登录后发帖</div></div></div>'; }
    var pOpts = TB.boards.map(function (b) {
      return '<div class="ep-option" data-p="' + b.boardId + '">' + esc(b.boardName) + '</div>';
    }).join('');
    var swatches = [
      'linear-gradient(135deg,#4f8cff 0%,#7c5cff 100%)',
      'linear-gradient(135deg,#42b983 0%,#2f9e6f 100%)',
      'linear-gradient(135deg,#11998e 0%,#38ef7d 100%)',
      'linear-gradient(135deg,#ff6b9e 0%,#ffa6bf 100%)',
      'linear-gradient(135deg,#ffbd8a 0%,#ffd9ad 100%)',
      'linear-gradient(135deg,#909399 0%,#c0c4cc 100%)'
    ];
    var swHtml = swatches.map(function (s, i) {
      return '<div class="cover-swatch ' + (i === 0 ? 'active' : '') + '" data-cover="' + s + '" style="background:' + s + ';"></div>';
    }).join('');

    return '<div class="main-wrap edit-post"><div class="post-panel">' +
      '<div class="post-editor">' +
      '<div class="post-editor-title"><span>正文</span>' +
      '<div class="change-editor-type"><span class="iconfont icon-change" id="switchEditor"> 切换为富文本编辑器</span></div></div>' +
      '<div class="editor-area">' +
      '<textarea class="ep-textarea" id="mdInput" rows="16" placeholder="支持 Markdown：# 标题、**加粗**、\`代码\`、- 列表、> 引用、```代码块```"></textarea>' +
      '<div class="md-preview" id="mdPreview"><div class="ph">预览</div><div id="mdPreviewBody"></div></div>' +
      '</div></div>' +
      '<div class="post-setting"><div class="setting-inner">' +
      '<div class="form-field"><span class="label">标题</span><input class="ep-input" id="fTitle" style="width:100%;" placeholder="请输入标题" /></div>' +
      '<div class="form-field"><span class="label">板块</span>' +
      '<div class="ep-select" id="pSelect"><div class="ep-input"><input readonly id="pLabel" placeholder="请选择一级板块" /><span class="caret iconfont icon-right"></span></div>' +
      '<div class="ep-select-panel">' + pOpts + '</div></div>' +
      '<div class="ep-select" id="subSelect" style="margin-top:8px;display:none;"><div class="ep-input"><input readonly id="subLabel" placeholder="请选择二级板块（可选）" /><span class="caret iconfont icon-right"></span></div>' +
      '<div class="ep-select-panel" id="subPanel"></div></div></div>' +
      '<div class="form-field"><span class="label">封面</span>' +
      '<div class="cover-swatches">' + swHtml + '</div>' +
      '<div class="cover-url-row"><input class="ep-input" id="coverUrl" style="flex:1;" placeholder="或粘贴图片 URL" /><button class="ep-btn" id="useUrl">使用</button></div></div>' +
      '<div class="form-field"><span class="label">摘要</span><textarea class="ep-textarea" id="fSummary" rows="3" maxlength="150" placeholder="请输入摘要"></textarea></div>' +
      '<div class="form-field"><span class="label">附件（可选）</span><input class="ep-input" id="fAttach" style="width:100%;" placeholder="附件文件名，如 api.md" />' +
      '<input class="ep-input" id="fIntegral" style="width:100%;margin-top:8px;" placeholder="下载所需积分（0 表示免费）" /></div>' +
      '<button class="ep-btn primary block" id="savePost">保存</button>' +
      '</div></div></div></div>';
  }

  function bindPost() {
    var main = $('#app-main');
    var editorType = 0; // 0 markdown, 1 rich
    var md = $('#mdInput'), prev = $('#mdPreviewBody');
    function updatePreview() { prev.innerHTML = mdToHtml(md.value); }
    md.addEventListener('input', updatePreview); updatePreview();

    // 切换编辑器
    $('#switchEditor').addEventListener('click', function () {
      if (md.value.trim() && !confirm('切换编辑器会清空正在编辑的内容，确定？')) return;
      editorType = editorType === 0 ? 1 : 0;
      if (editorType === 1) {
        md.style.display = 'none'; prev.parentElement.style.display = 'none';
        var re = document.createElement('div'); re.className = 'rich-editor'; re.contentEditable = 'true'; re.id = 'richInput';
        md.parentElement.appendChild(re);
        $('#switchEditor').textContent = ' 切换为 Markdown 编辑器';
      } else {
        var re2 = $('#richInput'); if (re2) re2.remove();
        md.style.display = ''; prev.parentElement.style.display = '';
        $('#switchEditor').textContent = ' 切换为富文本编辑器';
      }
    });

    // 封面选择
    var coverVal = 'linear-gradient(135deg,#4f8cff 0%,#7c5cff 100%)';
    $all('.cover-swatch', main).forEach(function (s) {
      s.addEventListener('click', function () {
        $all('.cover-swatch', main).forEach(function (x) { x.classList.remove('active'); });
        s.classList.add('active'); coverVal = s.dataset.cover; $('#coverUrl').value = '';
      });
    });
    $('#useUrl').addEventListener('click', function () {
      var u = $('#coverUrl').value.trim();
      if (u) { coverVal = u; $all('.cover-swatch', main).forEach(function (x) { x.classList.remove('active'); }); }
    });

    // 板块级联
    var pBoardId = '', boardId = '';
    function openPanel(sel) { var p = $(sel + ' .ep-select-panel'); p.classList.toggle('open'); }
    $('#pSelect').addEventListener('click', function (e) { e.stopPropagation(); openPanel('#pSelect'); $('#subSelect .ep-select-panel').classList.remove('open'); });
    $all('#pSelect .ep-option', main).forEach(function (o) {
      o.addEventListener('click', function () {
        pBoardId = o.dataset.p; $('#pLabel').value = o.textContent;
        $('#pSelect .ep-select-panel').classList.remove('open');
        // 二级
        var b = TB.boards.filter(function (x) { return x.boardId === pBoardId; })[0];
        boardId = '';
        if (b && b.children && b.children.length) {
          $('#subPanel').innerHTML = b.children.map(function (c) {
            return '<div class="ep-option" data-b="' + c.boardId + '">' + esc(c.boardName) + '</div>';
          }).join('');
          $('#subSelect').style.display = '';
          $all('#subPanel .ep-option', main).forEach(function (so) {
            so.addEventListener('click', function () {
              boardId = so.dataset.b; $('#subLabel').value = so.textContent;
              $('#subPanel').classList.remove('open');
            });
          });
        } else { $('#subSelect').style.display = 'none'; $('#subLabel').value = ''; }
      });
    });
    $('#subSelect').addEventListener('click', function (e) { e.stopPropagation(); if ($('#subSelect').style.display !== 'none') openPanel('#subSelect'); });
    main.addEventListener('click', function () {
      $all('.ep-select-panel', main).forEach(function (p) { p.classList.remove('open'); });
    });

    // 保存
    $('#savePost').addEventListener('click', function () {
      var title = $('#fTitle').value.trim();
      var summary = $('#fSummary').value.trim();
      var content = editorType === 0 ? mdToHtml(md.value) : ($('#richInput') ? $('#richInput').innerHTML : '');
      var plain = (editorType === 0 ? md.value : ($('#richInput') ? $('#richInput').innerText : '')).replace(/<[^>]+>/g, '').trim();
      if (!title) { toast('请输入标题', 'warning'); return; }
      if (!pBoardId) { toast('请选择板块', 'warning'); return; }
      if (!plain) { toast('请输入正文', 'warning'); return; }
      var u = state.loginUser;
      var meta = TB.boardMeta(pBoardId, boardId);
      var attachName = $('#fAttach').value.trim();
      var newA = {
        articleId: 'u' + Date.now(), pBoardId: pBoardId, boardId: boardId || '0',
        pboardName: meta.pboardName, boardName: meta.boardName,
        userId: u.userId, nickName: u.nickName, userIpAddress: u.lastLoginIpAddress || '未知',
        postTime: nowStr(), title: title, summary: summary || (plain.slice(0, 60)),
        content: content, cover: coverVal, topType: 0, readCount: 0, goodCount: 0, commentCount: 0, haveLike: false
      };
      if (attachName) {
        newA.attachment = { fileName: attachName, fileSize: 4096, integral: parseInt($('#fIntegral').value, 10) || 0, downloadCount: 0 };
      }
      TB.articles.unshift(newA);
      toast('保存成功', 'success');
      nav('/post/' + newA.articleId);
    });
  }

  /* ============================================================
     用户中心
     ============================================================ */
  function renderUserCenter(userId) {
    var u = TB.users[userId];
    var wrap = '<div class="personal-center">';
    wrap += '<div class="pc-breadcrumb"><a href="#/">首页</a> / <span>个人中心</span></div>';
    if (!u) {
      return wrap + '<div class="empty-state"><p>用户不存在</p></div></div>';
    }
    wrap += '<div class="user-info-card">' +
      '<div class="user-header">' + avatarHtml(u, 'lg') +
      '<div class="user-details"><div class="user-name">' + esc(u.nickName) + '</div>' +
      '<div class="user-intro">' + esc(u.personDescription || '这个人很懒，什么都没写~') + '</div></div></div>' +
      '<div class="user-metrics">' +
      '<div class="metric-item"><span>积分</span><span class="metric-value">' + (u.currentIntegral || 0) + '</span></div>' +
      '<div class="metric-item"><span>总积分</span><span class="metric-value">' + (u.totalIntegral || 0) + '</span></div>' +
      '<div class="metric-item"><span>加入时间</span><span class="metric-value">' + esc(u.joinTime || '-') + '</span></div>' +
      '<div class="metric-item"><span>最后登录</span><span class="metric-value">' + esc(u.lastLoginTime || '-') + '</span></div>' +
      (u.lastLoginIpAddress ? '<div class="metric-item"><span>属地</span><span class="metric-value">' + esc(u.lastLoginIpAddress) + '</span></div>' : '') +
      '</div></div>';
    wrap += '<div class="tab-content"><div class="ep-tabs" id="ucTabs">' +
      '<div class="ep-tab active" data-tab="post">发帖</div>' +
      '<div class="ep-tab" data-tab="comment">评论</div>' +
      '<div class="ep-tab" data-tab="like">点赞</div>' +
      '</div><div id="ucBody"></div></div></div>';
    return wrap;
  }

  function renderUcBody(userId, tab) {
    var u = TB.users[userId]; var html = '';
    if (tab === 'post') {
      var posts = TB.articles.filter(function (a) { return a.userId === userId; })
        .sort(function (x, y) { return x.postTime < y.postTime ? 1 : -1; });
      html = posts.length ? posts.map(function (a) {
        return '<div class="pc-post-item"><div class="pc-post-meta"><span>' + esc(a.postTime) + '</span><span class="divider">·</span>' +
          '<span>' + esc(a.userIpAddress) + '</span><span class="divider">·</span>' +
          '<span class="category">' + esc(a.pboardName) + (a.boardName ? ' / ' + esc(a.boardName) : '') + '</span></div>' +
          '<a class="pc-post-title" data-id="' + a.articleId + '">' + esc(a.title) + '</a>' +
          '<div class="pc-post-desc">' + esc(a.summary) + '</div>' +
          '<div class="pc-post-stats"><span>阅读 ' + a.readCount + '</span><span>点赞 ' + a.goodCount + '</span><span>评论 ' + a.commentCount + '</span></div></div>';
      }).join('') : '<div class="empty-state"><p>暂无发帖内容</p></div>';
    } else if (tab === 'comment') {
      var clist = [];
      Object.keys(TB.comments).forEach(function (aid) {
        TB.comments[aid].forEach(function (c) {
          if (c.userId === userId) clist.push({ c: c, aid: aid });
          (c.children || []).forEach(function (s) { if (s.userId === userId) clist.push({ c: s, aid: aid }); });
        });
      });
      html = clist.length ? clist.map(function (o) {
        var art = findArticle(o.aid);
        return '<div class="pc-post-item"><div class="pc-post-meta"><span>' + esc(o.c.postTime) + '</span><span class="divider">·</span><span>' + esc(o.c.userIpAddress) + '</span></div>' +
          '<div class="comment-content-line">' + esc(o.c.content) + '</div>' +
          '<a class="link-to-article" data-id="' + o.aid + '">查看原文 &gt;</a></div>';
      }).join('') : '<div class="empty-state"><p>暂无评论内容</p></div>';
    } else {
      var liked = TB.articles.filter(function (a) { return state.likedArticles[a.articleId]; });
      html = liked.length ? liked.map(function (a) {
        return '<div class="pc-post-item"><div class="pc-post-meta"><span>' + esc(a.postTime) + '</span><span class="divider">·</span><span>' + esc(a.nickName) + '</span><span class="divider">·</span>' +
          '<span class="category">' + esc(a.pboardName) + (a.boardName ? ' / ' + esc(a.boardName) : '') + '</span></div>' +
          '<a class="pc-post-title" data-id="' + a.articleId + '">' + esc(a.title) + '</a>' +
          '<div class="pc-post-desc">' + esc(a.summary) + '</div></div>';
      }).join('') : '<div class="empty-state"><p>暂无点赞内容</p></div>';
    }
    $('#ucBody').innerHTML = html;
    $all('#ucBody [data-id]').forEach(function (el) {
      el.addEventListener('click', function () { nav('/post/' + el.dataset.id); });
    });
  }

  function bindUserCenter(userId) {
    var main = $('#app-main');
    $all('#ucTabs .ep-tab', main).forEach(function (t) {
      t.addEventListener('click', function () {
        $all('#ucTabs .ep-tab', main).forEach(function (x) { x.classList.remove('active'); });
        t.classList.add('active');
        renderUcBody(userId, t.dataset.tab);
      });
    });
    renderUcBody(userId, 'post');
  }

  /* ============================================================
     登录 / 注册 弹窗
     ============================================================ */
  function fakeCaptcha() {
    var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    var s = ''; for (var i = 0; i < 4; i++) s += chars[Math.floor(Math.random() * chars.length)];
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="34">' +
      '<rect width="100" height="34" fill="#f0f2f5"/>' +
      '<text x="50%" y="55%" fill="#409eff" font-size="20" font-family="monospace" font-weight="bold" text-anchor="middle" dominant-baseline="middle" font-style="italic">' + s + '</text></svg>';
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  }

  function openLogin(opType) {
    var mount = $('#loginDialogMount');
    function render(op) {
      opType = op;
      var title = op === 0 ? '注册' : op === 2 ? '重置密码' : '登录';
      var showReg = (op === 0);
      var showPwd = (op === 1);
      var captcha = fakeCaptcha();
      var html =
        '<div class="ep-overlay" id="loginOverlay">' +
        '<div class="ep-dialog">' +
        '<div class="ep-dialog-header"><span>' + title + '</span><span class="close iconfont icon-close" id="loginClose"></span></div>' +
        '<div class="ep-dialog-body">' +
        '<div class="form-field"><div class="ep-input" style="width:100%;"><span class="prefix iconfont icon-account"></span><input id="lfEmail" placeholder="请输入邮箱" value="demo@tomorrow.com" /></div></div>' +
        (showPwd ? '<div class="form-field"><div class="ep-input" style="width:100%;"><span class="prefix iconfont icon-password"></span><input id="lfPwd" type="password" placeholder="请输入密码" value="12345678" /><span class="suffix" id="lfEye"><span class="iconfont icon-close-eye"></span></span></div></div>' : '') +
        ((showReg || op === 2) ? '<div class="form-field"><div class="send-email-panel"><div class="ep-input" style="flex:1;"><span class="prefix iconfont icon-checkcode"></span><input id="lfCode" placeholder="请输入邮箱验证码" /></div><button class="ep-btn primary" id="lfSend">获取验证码</button></div></div>' : '') +
        (showReg ? '<div class="form-field"><div class="ep-input" style="width:100%;"><span class="prefix iconfont icon-account"></span><input id="lfNick" placeholder="请输入昵称" value="新朋友" /></div></div>' : '') +
        ((showReg || op === 2) ? '<div class="form-field"><div class="ep-input" style="width:100%;"><span class="prefix iconfont icon-password"></span><input id="lfReg" type="password" placeholder="请输入密码" value="12345678" /></div></div>' +
        '<div class="form-field"><div class="ep-input" style="width:100%;"><span class="prefix iconfont icon-password"></span><input id="lfRe" type="password" placeholder="请再次输入密码" value="12345678" /></div></div>' : '') +
        '<div class="form-field"><div class="check-code-panel"><div class="ep-input" style="flex:1;"><span class="prefix iconfont icon-checkcode"></span><input id="lfCheck" placeholder="请输入验证码" /></div><img class="check-code" id="lfCaptcha" src="' + captcha + '" /></div></div>' +
        (showPwd ? '<div class="form-field"><label class="ep-checkbox" id="lfRemember"><span class="box">✓</span><span>记住我</span></label>' +
        '<div class="no-account-panel" style="margin-top:8px;"><a class="a-link" data-go="2">忘记密码？</a><a class="a-link" data-go="0">没有账号？</a></div></div>' : '') +
        (showReg ? '<div class="no-account-panel" style="margin-top:8px;"><a class="a-link" data-go="1">已有账号？</a></div>' : '') +
        (op === 2 ? '<div class="no-account-panel" style="margin-top:8px;"><a class="a-link" data-go="1">去登录</a></div>' : '') +
        '</div>' +
        '<div class="ep-dialog-footer"><button class="ep-btn primary block" id="lfSubmit">' + title + '</button></div>' +
        '</div></div>';
      mount.innerHTML = html;

      $('#loginClose').addEventListener('click', closeLogin);
      $('#loginOverlay').addEventListener('click', function (e) { if (e.target.id === 'loginOverlay') closeLogin(); });
      var cap = $('#lfCaptcha'); if (cap) cap.addEventListener('click', function () { cap.src = fakeCaptcha(); });
      var eye = $('#lfEye'); if (eye) eye.addEventListener('click', function () {
        var inp = $('#lfPwd'); inp.type = inp.type === 'password' ? 'text' : 'password';
        eye.querySelector('.iconfont').className = 'iconfont ' + (inp.type === 'password' ? 'icon-close-eye' : 'icon-eye');
      });
      var rem = $('#lfRemember'); if (rem) rem.addEventListener('click', function () { rem.classList.toggle('checked'); });
      var send = $('#lfSend'); if (send) send.addEventListener('click', function () { toast('验证码已发送（演示）', 'success'); });
      $all('.a-link[data-go]', mount).forEach(function (a) {
        a.addEventListener('click', function () { render(+a.dataset.go); });
      });
      $('#lfSubmit').addEventListener('click', function () { submitLogin(op); });
    }
    render(opType || 1);
  }

  function closeLogin() { $('#loginDialogMount').innerHTML = ''; }

  function submitLogin(op) {
    // 演示：仅做轻量校验，任意内容均可“成功”
    if (op === 0) {
      if ($('#lfNick').value.trim() === '') { toast('请输入昵称', 'warning'); return; }
    }
    // 使用演示用户登录，便于直接体验发帖/评论/点赞
    state.loginUser = Object.assign({}, TB.users['1001']);
    renderAuth();
    closeLogin();
    toast(op === 0 ? '注册成功，请登录' : op === 2 ? '重置密码成功，请登录' : '登录成功', 'success');
  }

  /* ============================================================
     全局头部事件
     ============================================================ */
  function bindHeader() {
    $('#logo').addEventListener('click', function () { nav('/'); });
    // 菜单（含悬浮二级板块）
    function closeMenu() {
      var m = $('#menu'); if (m) m.classList.remove('open');
      var s = $('#navScrim'); if (s) s.classList.remove('open');
    }
    $('#menu').addEventListener('click', function (e) {
      var home = e.target.closest('[data-home]');
      if (home) { nav('/'); closeMenu(); return; }
      var sub = e.target.closest('.sub-board');
      if (sub) { e.stopPropagation(); nav('/forum/' + sub.dataset.pbid + '/' + sub.dataset.bid); closeMenu(); return; }
      var item = e.target.closest('.menu-item');
      if (item && item.dataset.pbid) { nav('/forum/' + item.dataset.pbid); closeMenu(); }
    });
    // 移动端抽屉
    var navToggle = $('#navToggle');
    if (navToggle) navToggle.addEventListener('click', function (e) {
      e.stopPropagation();
      $('#menu').classList.toggle('open');
      $('#navScrim').classList.toggle('open');
    });
    var navScrim = $('#navScrim');
    if (navScrim) navScrim.addEventListener('click', closeMenu);
    window.addEventListener('hashchange', closeMenu);
    // 搜索
    function doSearch() {
      state.search = $('#searchText').value.trim();
      nav('/');
      // 列表视图渲染后应用搜索
      setTimeout(function () { if (parseHash().name === 'list') { listCtx.page = 1; renderListItems(); } }, 0);
    }
    $('#searchBtn').addEventListener('click', doSearch);
    $('#searchText').addEventListener('keydown', function (e) { if (e.key === 'Enter') doSearch(); });
    // 发帖
    $('#postBtn').addEventListener('click', function () {
      if (!state.loginUser) { openLogin(1); return; }
      nav('/newPost');
    });
    // 登录/注册区
    $('#authArea').addEventListener('click', function (e) {
      var act = e.target.closest('[data-act]'); if (!act) return;
      var a = act.dataset.act;
      if (a === 'login') openLogin(1);
      else if (a === 'register') openLogin(0);
      else if (a === 'ucenter') nav('/user/' + state.loginUser.userId);
      else if (a === 'logout') { state.loginUser = null; renderAuth(); toast('已退出登录', 'success'); }
    });
    // 用户/消息下拉
    document.addEventListener('click', function (e) {
      var dd = e.target.closest('.ep-dropdown');
      $all('.ep-dropdown').forEach(function (x) { if (x !== dd) x.classList.remove('open'); });
      if (dd) dd.classList.toggle('open');
    });
  }

  /* ============================================================
     初始化
     ============================================================ */
  function init() {
    bindHeader();
    renderAuth();
    $('#lbClose').addEventListener('click', closeLightbox);
    $('#lightbox').addEventListener('click', function (e) { if (e.target.id === 'lightbox') closeLightbox(); });
    window.addEventListener('hashchange', render);
    render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
