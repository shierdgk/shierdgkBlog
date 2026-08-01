/* TomorrowBBS 静态体验版 —— 内存 mock 数据层
 * 字段命名尽量对齐原 Vue 项目（forumArticleVO / comment 等），便于 1:1 复刻。
 * 全部挂在 window.TB 上，file:// 直接 <script> 加载即可，无需后端。
 */
(function () {
  // ===== 板块树（对齐 forum_board 表）=====
  var boards = [
    {
      boardId: '10000', boardName: '前端',
      children: [
        { boardId: '10003', pBoardId: '10000', boardName: 'Vue' },
        { boardId: '10004', pBoardId: '10000', boardName: 'React' }
      ]
    },
    {
      boardId: '10001', boardName: '后端',
      children: [
        { boardId: '10005', pBoardId: '10001', boardName: 'React' }
      ]
    },
    { boardId: '10002', boardName: '摸鱼', children: [] },
    {
      boardId: '10006', boardName: '社区管理',
      children: [
        { boardId: '10007', pBoardId: '10006', boardName: '规章制度' }
      ]
    }
  ];

  // 便捷：boardId -> {pBoardId,pboardName,boardName}
  function boardMeta(pBoardId, boardId) {
    var pm = null, cm = null;
    boards.forEach(function (b) {
      if (b.boardId === pBoardId) pm = b;
      (b.children || []).forEach(function (c) {
        if (c.boardId === boardId) cm = c;
      });
    });
    return {
      pboardName: pm ? pm.boardName : '',
      boardName: cm ? cm.boardName : ''
    };
  }

  // ===== 用户 =====
  var users = {
    '1001': {
      userId: '1001', nickName: '十二当归客', color: '#409eff',
      avatar: 'file/avatar/0781209396.jpg',
      personDescription: '全栈 → 自动化测试 → 测试开发。喜欢折腾效率工具与论坛类项目。',
      currentIntegral: 1280, totalIntegral: 2560,
      joinTime: '2023-01-15 17:45:46', lastLoginTime: '2026-08-01 09:20:11',
      lastLoginIpAddress: '北京'
    },
    '1890524956': {
      userId: '1890524956', nickName: '测试账号', color: '#67c23a',
      avatar: 'file/avatar/1890524956.jpg',
      personDescription: '我只是一个测试账号而已',
      currentIntegral: 13, totalIntegral: 13,
      joinTime: '2023-01-15 17:45:46', lastLoginTime: '2023-01-16 14:43:55',
      lastLoginIpAddress: '未知'
    },
    '7437465925': {
      userId: '7437465925', nickName: '测试账号02', color: '#e6a23c',
      avatar: 'file/avatar/7437465925.jpg',
      personDescription: '我是测试账号02',
      currentIntegral: 18, totalIntegral: 18,
      joinTime: '2023-01-16 09:52:31', lastLoginTime: '2023-01-16 14:36:13',
      lastLoginIpAddress: '未知'
    }
  };

  // 默认登录态：体验版开箱即登，方便直接发帖/评论/点赞
  var loginUser = users['1001'];

  // 一张内联 SVG 作为内容配图，演示「点击图片预览」(ImageViewer)
  var svgDemo = 'data:image/svg+xml;utf8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="320">' +
    '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
    '<stop offset="0" stop-color="#409eff"/><stop offset="1" stop-color="#7c5cff"/></linearGradient></defs>' +
    '<rect width="640" height="320" fill="url(#g)"/>' +
    '<text x="50%" y="50%" fill="#fff" font-size="28" font-family="sans-serif" text-anchor="middle" dominant-baseline="middle">TomorrowBBS 架构示意图</text>' +
    '</svg>'
  );

  // ===== 文章 =====
  var articles = [
    {
      articleId: 'a1', pBoardId: '10000', boardId: '10003', pboardName: '前端', boardName: 'Vue',
      userId: '1890524956', nickName: '测试账号', userIpAddress: '未知',
      postTime: '2023-01-16 09:35:14',
      title: 'Class 与 Style 绑定',
      summary: '数据绑定的一个常见需求场景是操纵元素的 CSS class 列表和内联样式。因为 class 和 style 都是 attribute，我们可以和其他 attribute 一样使用 v-bind 将它们和动态的字符串绑定。',
      content: '<p>数据绑定的一个常见需求场景是操纵元素的 CSS class 列表和内联样式。因为 class 和 style 都是 attribute，我们可以和其他 attribute 一样使用 v-bind 将它们和动态的字符串绑定。但是，在处理比较复杂的绑定时，通过拼接生成字符串是麻烦且易出错的。因此，Vue 专门为 class 和 style 的 v-bind 用法提供了特殊的功能增强。除了字符串外，表达式的值也可以是对象或数组。</p>',
      cover: 'file/images/202505/OqxCURBJIkQhsm8.png',
      topType: 1, readCount: 128, goodCount: 23, commentCount: 2, haveLike: false
    },
    {
      articleId: 'a2', pBoardId: '10000', boardId: '10003', pboardName: '前端', boardName: 'Vue',
      userId: '7437465925', nickName: '测试账号02', userIpAddress: '未知',
      postTime: '2023-01-16 09:55:37',
      title: '条件渲染',
      summary: 'v-if 指令用于条件性地渲染一块内容。这块内容只会在指令的表达式返回真值时才被渲染。',
      content: '<h1>v-if</h1><p>指令用于条件性地渲染一块内容。这块内容只会在指令的表达式返回真值时才被渲染。</p>' +
        '<pre><code class="language-js">&lt;h1 v-if="awesome"&gt;Vue is awesome!&lt;/h1&gt;</code></pre>' +
        '<h1>v-else</h1><p>你也可以使用 v-else 为 v-if 添加一个“else 区块”。</p>' +
        '<pre><code class="language-js">&lt;button @click="awesome = !awesome"&gt;Toggle&lt;/button&gt;\n\n&lt;h1 v-if="awesome"&gt;Vue is awesome!&lt;/h1&gt;\n&lt;h1 v-else&gt;Oh no ?&lt;/h1&gt;</code></pre>',
      cover: 'file/images/202301/MI545z3GH9q5E0lwP3SM2rqqhMJkVL.png',
      topType: 0, readCount: 56, goodCount: 9, commentCount: 1, haveLike: false
    },
    {
      articleId: 'a3', pBoardId: '10002', boardId: '0', pboardName: '摸鱼', boardName: '',
      userId: '7437465925', nickName: '测试账号02', userIpAddress: '未知',
      postTime: '2023-01-16 10:01:14',
      title: '同样是光头造型，把刘学义茅子俊边程放一起，差别就出来了',
      summary: '《少年歌行》剧版上线，豆瓣开分7.3，相信有数不清的书粉、漫粉慕名而来。',
      content: '<p>《少年歌行》剧版上线，豆瓣开分7.3，相信有数不清的书粉、漫粉慕名而来。圈里有这么一句大家都认同的老话，是说一部优秀的作品，原著是天，漫改是地，剧版则是毁天又灭地。那到底这部剧拍出来精髓还剩了多少？</p>',
      cover: 'file/images/202301/e3FkzpUaSbjPkI0xX47Y4LbYmd8t4B.png',
      topType: 0, readCount: 301, goodCount: 45, commentCount: 3, haveLike: false
    },
    {
      articleId: 'a4', pBoardId: '10001', boardId: '10005', pboardName: '后端', boardName: 'React',
      userId: '1001', nickName: '十二当归客', userIpAddress: '北京',
      postTime: '2026-07-28 21:10:02',
      title: '用 Node + Express 搭一个论坛 API 网关',
      summary: '把鉴权、限流、统一错误体和请求日志收敛到一个网关层，业务服务只管吐数据。附一张架构示意图。',
      content: '<p>把鉴权、限流、统一错误体和请求日志收敛到一个网关层，业务服务只管吐数据。下面的图是整体结构：</p>' +
        '<p><img src="file/images/202505/OqxCURBJIkQhsm8.png" alt="架构示意图" /></p>' +
        '<p>网关核心逻辑就是一个中间件栈：</p>' +
        '<pre><code class="language-js">app.use("/api", authMiddleware);\napp.use("/api", rateLimit({ windowMs: 60_000, max: 120 }));\napp.use("/api", proxy({ target: "http://forum-service", changeOrigin: true }));</code></pre>' +
        '<blockquote>经验：错误体一定要统一，前端才好做全局拦截。</blockquote>',
      cover: 'file/images/202505/2oaVtlzGWRp0t9J.jpg',
      topType: 0, readCount: 88, goodCount: 17, commentCount: 1, haveLike: false,
      attachment: { fileName: 'api-gateway-design.md', fileSize: 8421, integral: 0, downloadCount: 3 }
    },
    {
      articleId: 'a5', pBoardId: '10000', boardId: '10004', pboardName: '前端', boardName: 'React',
      userId: '1001', nickName: '十二当归客', userIpAddress: '北京',
      postTime: '2026-07-30 19:42:08',
      title: '从零实现一个虚拟列表组件',
      summary: '只渲染可视区域的节点，万级数据也不卡。核心就是算 startIndex / endIndex 加缓冲。',
      content: '<p>只渲染可视区域的节点，万级数据也不卡。核心就是算 <code>startIndex</code> / <code>endIndex</code> 加缓冲。</p>' +
        '<pre><code class="language-js">const startIndex = Math.floor(scrollTop / itemHeight);\nconst endIndex = startIndex + Math.ceil(viewportHeight / itemHeight);\nconst offsetY = startIndex * itemHeight;</code></pre>',
      cover: 'file/images/202301/1RyNjXxTr2F5Kb7KnwPdWCbxiLQvu2.png',
      topType: 0, readCount: 64, goodCount: 12, commentCount: 0, haveLike: false
    },
    {
      articleId: 'a6', pBoardId: '10006', boardId: '10007', pboardName: '社区管理', boardName: '规章制度',
      userId: '1890524956', nickName: '测试账号', userIpAddress: '未知',
      postTime: '2023-01-16 11:20:00',
      title: '【公告】社区发帖规范与积分规则',
      summary: '为营造友好交流氛围，请遵守以下发帖规范；优质内容可获得积分奖励。',
      content: '<h1>发帖规范</h1><ul><li>禁止发布违法、侵权、广告内容；</li><li>标题请准确概括主题；</li><li>代码请使用代码块，便于阅读。</li></ul>' +
        '<h1>积分规则</h1><p>每日签到 +2，帖子被点赞 +5，评论被点赞 +2。积分可用于下载附件。</p>',
      cover: 'file/images/202505/2oaVtlzGWRp0t9J.jpg',
      topType: 1, readCount: 530, goodCount: 60, commentCount: 0, haveLike: false
    },
    {
      articleId: 'a7', pBoardId: '10002', boardId: '0', pboardName: '摸鱼', boardName: '',
      userId: '1001', nickName: '十二当归客', userIpAddress: '北京',
      postTime: '2026-08-01 08:30:15',
      title: '打卡我的第一个开源项目 TomorrowBBS',
      summary: '一个用 Vue3 + Element Plus 写的论坛，今天把它做成可离线体验的静态版啦。',
      content: '<p>一个用 Vue3 + Element Plus 写的论坛，今天把它做成可离线体验的静态版啦。</p>' +
        '<p><img src="file/images/202505/2oaVtlzGWRp0t9J.jpg" alt="TomorrowBBS" /></p>' +
        '<p>开源的意义不只是代码，更是把折腾的过程记录下来 ?</p>',
      cover: 'file/images/202301/MI545z3GH9q5E0lwP3SM2rqqhMJkVL.png',
      topType: 0, readCount: 12, goodCount: 3, commentCount: 0, haveLike: false
    }
  ];

  // ===== 评论（按 articleId 归组，结构对齐 comment + children 楼中楼）=====
  var comments = {
    a1: [
      {
        commentId: 'c1', articleId: 'a1', pCommentId: '0', userId: '1001', nickName: '十二当归客', userIpAddress: '北京',
        postTime: '2023-01-16 12:00:00', content: '讲得很清楚，对象语法那块正是我平时最容易写错的地方。',
        goodCount: 5, likeType: 0, topType: 0, status: 1, children: [
          {
            commentId: 'c1-1', articleId: 'a1', pCommentId: 'c1', userId: '1890524956', nickName: '测试账号', userIpAddress: '未知',
            replyUserId: '1001', replyNickName: '十二当归客',
            postTime: '2023-01-16 12:30:00', content: '同感，数组写法在做动态 class 时尤其方便。',
            goodCount: 2, likeType: 0, topType: 0, status: 1, children: []
          }
        ]
      },
      {
        commentId: 'c2', articleId: 'a1', pCommentId: '0', userId: '7437465925', nickName: '测试账号02', userIpAddress: '未知',
        postTime: '2023-01-16 13:10:00', content: 'mark，回头照着敲一遍。',
        goodCount: 1, likeType: 0, topType: 0, status: 1, children: []
      }
    ],
    a2: [
      {
        commentId: 'c3', articleId: 'a2', pCommentId: '0', userId: '1001', nickName: '十二当归客', userIpAddress: '北京',
        postTime: '2023-01-16 14:00:00', content: 'v-if 和 v-show 的区别这篇没提，建议补一下。',
        goodCount: 3, likeType: 0, topType: 0, status: 1, children: []
      }
    ],
    a3: [
      {
        commentId: 'c4', articleId: 'a3', pCommentId: '0', userId: '1001', nickName: '十二当归客', userIpAddress: '北京',
        postTime: '2023-01-16 15:00:00', content: '剧版确实还行，就是删了好多名场面。',
        goodCount: 8, likeType: 0, topType: 0, status: 1, children: []
      },
      {
        commentId: 'c5', articleId: 'a3', pCommentId: '0', userId: '1890524956', nickName: '测试账号', userIpAddress: '未知',
        postTime: '2023-01-16 15:20:00', content: '萧瑟的选角我挺满意的。',
        goodCount: 4, likeType: 0, topType: 0, status: 1, children: [
          {
            commentId: 'c5-1', articleId: 'a3', pCommentId: 'c5', userId: '7437465925', nickName: '测试账号02', userIpAddress: '未知',
            replyUserId: '1890524956', replyNickName: '测试账号',
            postTime: '2023-01-16 15:40:00', content: '雷无桀更贴，阳光感拉满。',
            goodCount: 1, likeType: 0, topType: 0, status: 1, children: []
          }
        ]
      },
      {
        commentId: 'c6', articleId: 'a3', pCommentId: '0', userId: '1001', nickName: '十二当归客', userIpAddress: '北京',
        postTime: '2023-01-16 16:00:00', content: '蹲一个漫画党 vs 剧粉的争论帖。',
        goodCount: 2, likeType: 0, topType: 0, status: 1, children: []
      }
    ],
    a4: [
      {
        commentId: 'c7', articleId: 'a4', pCommentId: '0', userId: '1890524956', nickName: '测试账号', userIpAddress: '未知',
        postTime: '2026-07-29 09:00:00', content: '限流那块能展开讲讲令牌桶吗？',
        goodCount: 1, likeType: 0, topType: 0, status: 1, children: []
      }
    ]
  };

  window.TB = {
    boards: boards,
    boardMeta: boardMeta,
    users: users,
    loginUser: loginUser,
    articles: articles,
    comments: comments,
    svgDemo: svgDemo
  };
})();
