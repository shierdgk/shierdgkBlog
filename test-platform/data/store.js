/* ============================================================
   TestFlow — 离线静态版 Mock 数据层
   挂载到 window.TF，供 js/app.js 使用。
   所有数据均为演示用途，无后端交互。
   ============================================================ */
(function () {
  'use strict';

  var TF = {};

  /* ── 用户（默认已登录，便于直接体验） ── */
  TF.user = { username: 'admin', role: 'admin' };

  /* ── 项目 ── */
  TF.projects = [
    { id: 1, name: '电商平台', desc: '核心交易链路 · 订单/支付/库存' },
    { id: 2, name: '用户中心', desc: '账号/登录/权限/消息' },
    { id: 3, name: '数据中台', desc: '采集/ETL/指标计算' }
  ];

  /* ── 执行环境 ── */
  TF.environments = [
    { id: 1, name: '本地开发', base_url: 'http://localhost:8080' },
    { id: 2, name: '测试环境', base_url: 'https://test.api.example.com' },
    { id: 3, name: '预发环境', base_url: 'https://staging.api.example.com' }
  ];

  /* ── 全局变量（Global） ── */
  TF.globals = [
    { id: 1, key: 'BASE_URL', value: 'https://test.api.example.com', desc: '当前环境基地址' },
    { id: 2, key: 'TOKEN', value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.demo', desc: '登录后返回的鉴权令牌' },
    { id: 3, key: 'USER_ID', value: '100267', desc: '测试用户 ID' },
    { id: 4, key: 'PAGE_SIZE', value: '20', desc: '默认分页大小' }
  ];

  /* ── 测试用例 ──
     steps: 每个步骤 = 一次 HTTP 请求（Postman 风格）
     asserts: 富断言数组
  */
  TF.cases = [
    {
      id: 1, project_id: 1, project_name: '电商平台', name: '登录成功后返回用户信息',
      type: 'api', priority: 'P0', status: 'released',
      created_at: '2026-07-20 14:22', updated_at: '2026-07-28 09:10',
      steps: [
        {
          name: '登录获取 Token', method: 'POST', url: '{{BASE_URL}}/api/v1/login',
          headers: [{ k: 'Content-Type', v: 'application/json' }],
          bodyType: 'json',
          body: { username: 'admin', password: 'admin123' },
          auth: { type: 'none' },
          asserts: [
            { type: 'status', op: 'eq', value: '200' },
            { type: 'body', op: 'contains', value: '"token"' },
            { type: 'time', op: 'lt', value: '500' }
          ],
          extract: [{ var: 'TOKEN', expr: '$.token' }]
        },
        {
          name: '携带 Token 获取用户信息', method: 'GET', url: '{{BASE_URL}}/api/v1/me',
          headers: [{ k: 'Authorization', v: 'Bearer {{TOKEN}}' }],
          bodyType: 'none', body: null, auth: { type: 'bearer' },
          asserts: [
            { type: 'status', op: 'eq', value: '200' },
            { type: 'body', op: 'json', value: '$.code == 0' }
          ],
          extract: []
        }
      ]
    },
    {
      id: 2, project_id: 1, project_name: '电商平台', name: '下单接口幂等性校验',
      type: 'api', priority: 'P0', status: 'debugging',
      created_at: '2026-07-21 10:05', updated_at: '2026-07-29 16:40',
      steps: [
        {
          name: '创建订单', method: 'POST', url: '{{BASE_URL}}/api/v1/orders',
          headers: [{ k: 'Content-Type', v: 'application/json' }, { k: 'Authorization', v: 'Bearer {{TOKEN}}' }],
          bodyType: 'json',
          body: { sku: 'SKU-99213', qty: 1, coupon: '' },
          auth: { type: 'bearer' },
          asserts: [
            { type: 'status', op: 'eq', value: '201' },
            { type: 'body', op: 'contains', value: '"order_no"' }
          ],
          extract: [{ var: 'ORDER_NO', expr: '$.data.order_no' }]
        },
        {
          name: '重复提交同一幂等键', method: 'POST', url: '{{BASE_URL}}/api/v1/orders',
          headers: [{ k: 'Idempotency-Key', v: 'idem-001' }],
          bodyType: 'json', body: { sku: 'SKU-99213', qty: 1 },
          auth: { type: 'bearer' },
          asserts: [{ type: 'status', op: 'eq', value: '200' }],
          extract: []
        }
      ]
    },
    {
      id: 3, project_id: 2, project_name: '用户中心', name: '短信验证码限流（1分钟5次）',
      type: 'api', priority: 'P1', status: 'released',
      created_at: '2026-07-18 09:30', updated_at: '2026-07-25 11:00',
      steps: [
        {
          name: '连续发送验证码', method: 'POST', url: '{{BASE_URL}}/api/v1/sms/send',
          headers: [{ k: 'Content-Type', v: 'application/json' }],
          bodyType: 'json', body: { phone: '13800000000' }, auth: { type: 'none' },
          asserts: [{ type: 'body', op: 'json', value: '$.rate_limited == true' }],
          extract: []
        }
      ]
    },
    {
      id: 4, project_id: 2, project_name: '用户中心', name: '管理后台用户列表翻页 UI 检查',
      type: 'ui', priority: 'P2', status: 'draft',
      created_at: '2026-07-22 18:11', updated_at: '2026-07-22 18:11',
      steps: []
    },
    {
      id: 5, project_id: 3, project_name: '数据中台', name: 'ETL 任务成功并产出指标',
      type: 'api', priority: 'P1', status: 'debugging',
      created_at: '2026-07-15 20:48', updated_at: '2026-07-27 08:22',
      steps: [
        {
          name: '触发日终 ETL', method: 'POST', url: '{{BASE_URL}}/api/v1/etl/run',
          headers: [{ k: 'Authorization', v: 'Bearer {{TOKEN}}' }],
          bodyType: 'json', body: { date: '2026-07-27' }, auth: { type: 'bearer' },
          asserts: [{ type: 'status', op: 'eq', value: '200' }],
          extract: []
        }
      ]
    },
    {
      id: 6, project_id: 1, project_name: '电商平台', name: '购物车合并（登录态）',
      type: 'api', priority: 'P2', status: 'released',
      created_at: '2026-07-10 13:02', updated_at: '2026-07-19 14:30',
      steps: [
        {
          name: '加入商品到购物车', method: 'POST', url: '{{BASE_URL}}/api/v1/cart',
          headers: [{ k: 'Authorization', v: 'Bearer {{TOKEN}}' }],
          bodyType: 'json', body: { sku: 'SKU-10021', qty: 2 }, auth: { type: 'bearer' },
          asserts: [{ type: 'status', op: 'eq', value: '200' }],
          extract: []
        }
      ]
    },
    {
      id: 7, project_id: 3, project_name: '数据中台', name: '指标接口响应时间基线',
      type: 'api', priority: 'P3', status: 'disabled',
      created_at: '2026-06-30 10:00', updated_at: '2026-07-05 10:00',
      steps: [
        {
          name: '查询核心指标', method: 'GET', url: '{{BASE_URL}}/api/v1/metrics?name=gmv',
          headers: [], bodyType: 'none', body: null, auth: { type: 'bearer' },
          asserts: [{ type: 'time', op: 'lt', value: '300' }],
          extract: []
        }
      ]
    }
  ];

  /* ── 执行记录 ── */
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function randTime(daysAgo) {
    var d = new Date(Date.now() - daysAgo * 86400000);
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) +
      ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }
  var statusPool = ['success', 'success', 'success', 'failed', 'running', 'pending'];
  TF.executions = [];
  (function genExec() {
    var caseRefs = [];
    TF.cases.forEach(function (c) {
      caseRefs.push({ id: c.id, name: c.name, project_id: c.project_id });
    });
    for (var i = 1; i <= 14; i++) {
      var st = statusPool[i % statusPool.length];
      var total = 2 + (i % 5);
      var passed = st === 'failed' ? Math.max(0, total - 1 - (i % 2)) : total;
      var failed = st === 'failed' ? 1 + (i % 2) : 0;
      TF.executions.push({
        id: 9000 + i,
        case_id: caseRefs[(i - 1) % caseRefs.length].id,
        case_name: caseRefs[(i - 1) % caseRefs.length].name,
        project_id: caseRefs[(i - 1) % caseRefs.length].project_id,
        status: st,
        total_cases: total,
        passed: passed,
        failed: failed,
        trigger_type: i % 3 === 0 ? 'ci' : 'manual',
        env: (i % 3) + 1,
        created_at: randTime(i % 30)
      });
    }
  })();

  /* ── 仪表盘汇总（基于用例 + 执行派生） ── */
  TF.getDashboard = function (projectId) {
    var cases = TF.cases;
    var execs = TF.executions;
    if (projectId) {
      cases = cases.filter(function (c) { return c.project_id == projectId; });
      execs = execs.filter(function (e) { return e.project_id == projectId; });
    }
    var totalExec = execs.length;
    var passed = 0, failed = 0, running = 0, pending = 0;
    var byStatus = { success: 0, failed: 0, error: 0, running: 0, pending: 0 };
    execs.forEach(function (e) {
      if (e.status === 'success') { passed += e.passed; byStatus.success++; }
      else if (e.status === 'failed') { failed += e.failed; byStatus.failed++; }
      else if (e.status === 'running') { running++; byStatus.running++; }
      else if (e.status === 'pending') { pending++; byStatus.pending++; }
    });
    var computedPass = totalExec ? Math.round((passed / Math.max(1, passed + failed)) * 100) : 0;
    return {
      total_executions: totalExec,
      total_cases: cases.length,
      passed: passed,
      failed: failed,
      pass_rate: computedPass / 100,
      by_status: byStatus,
      recent: execs.slice(0, 6)
    };
  };

  /* ── 试跑单步返回（模拟） ── */
  TF.tryStep = function (step) {
    var ok = true;
    var fails = [];
    (step.asserts || []).forEach(function (a) {
      // 演示：时间断言与 200 状态码默认通过，contains 随机
      if (a.type === 'status' && a.value === '200') { /* pass */ }
      else if (a.type === 'time') { /* pass */ }
      else if (a.type === 'body' && /token|order_no|code/.test(a.value || '')) { /* pass */ }
      else { ok = false; fails.push(a); }
    });
    return {
      status: ok ? 200 : 500,
      time_ms: 120 + Math.floor(Math.random() * 180),
      headers: { 'content-type': 'application/json', 'x-request-id': 'req-' + Math.floor(Math.random() * 1e6) },
      body: ok
        ? { code: 0, data: { token: 'eyJ...demo', order_no: 'NO' + Math.floor(Math.random() * 1e9) }, msg: 'ok' }
        : { code: 500, msg: 'assertion failed', failed: fails.length },
      asserts: (step.asserts || []).map(function (a, idx) {
        return { index: idx, pass: ok || fails.indexOf(a) === -1, type: a.type, expr: a.value };
      }),
      extracted: (step.extract || []).map(function (x) { return { var: x.var, value: 'val_' + Math.floor(Math.random() * 1000) }; })
    };
  };

  /* ── 简单 ID 生成 ── */
  var _seq = 100;
  TF.nextId = function () { _seq++; return _seq; };

  window.TF = TF;
})();
