/* ============================================================
 * md.js — 极简 Markdown 渲染器（零依赖，可离线运行）
 * 暴露：
 *   window.renderMarkdown(md) -> HTML 字符串
 *   window.isGradient(str)   -> 判断字符串是否为 CSS 渐变（用于区分封面/缩略图是图片还是渐变）
 *
 * 支持的语法：
 *   #~###### 标题        **粗体**  *斜体*  `行内代码`
 *   ``` 或 ~~~ 围栏代码块（支持语言标记）
 *   > 引用块
 *   - / * 无序列表        1. 有序列表
 *   [文字](链接)   ![alt](图片)
 *   | a | b | 表格（需下一行 --- 分隔）
 *   --- 分割线
 * ============================================================ */
(function () {
  'use strict';

  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // 行内格式（代码块已在块级处理，这里只处理正文内的行内元素）
  function inline(text) {
    var codes = [];
    var out = esc(text);
    // 1. 先把行内代码抽出来占位，避免其中的 * _ 被误解析
    out = out.replace(/`([^`]+)`/g, function (_, c) {
      codes.push(c);
      return '\u0000' + (codes.length - 1) + '\u0000';
    });
    // 2. 图片 ![alt](url)
    out = out.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, function (_, alt, url) {
      return '<img src="' + url + '" alt="' + alt + '" />';
    });
    // 3. 链接 [text](url)
    out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (_, t, url) {
      return '<a href="' + url + '" target="_blank" rel="noopener">' + t + '</a>';
    });
    // 4. 粗体 / 斜体
    out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    out = out.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    // 5. 还原行内代码
    out = out.replace(/\u0000(\d+)\u0000/g, function (_, i) {
      return '<code>' + codes[+i] + '</code>';
    });
    return out;
  }

  window.isGradient = function (s) {
    return /^(linear|radial|conic)-gradient/i.test(String(s || '').trim());
  };

  window.renderMarkdown = function (src) {
    if (!src) return '';
    var lines = String(src).replace(/\r\n/g, '\n').split('\n');
    var out = [];
    var i = 0;
    var n = lines.length;

    function isBlank(l) { return /^\s*$/.test(l); }

    // 防止段落收集器把块级语法吞掉
    function isBlockStart(l) {
      return /^(```|~~~)/.test(l) ||
        /^(#{1,6})\s/.test(l) ||
        /^>\s?/.test(l) ||
        /^\s*[-*]\s+/.test(l) ||
        /^\s*\d+\.\s+/.test(l) ||
        /^(-{3,}|\*{3,})\s*$/.test(l) ||
        (l.indexOf('|') !== -1);
    }

    while (i < n) {
      var line = lines[i];

      if (isBlank(line)) { i++; continue; }

      // ---- 围栏代码块（``` 或 ~~~）----
      var fence = line.match(/^(```|~~~)(.*)$/);
      if (fence) {
        var ch = fence[1];
        var lang = fence[2].trim();
        var buf = [];
        i++;
        var closeRe = new RegExp('^' + ch);
        while (i < n && !closeRe.test(lines[i])) { buf.push(lines[i]); i++; }
        i++; // 跳过结束围栏
        var cls = lang ? ' class="language-' + lang + '"' : '';
        out.push('<pre><code' + cls + '>' + esc(buf.join('\n')) + '</code></pre>');
        continue;
      }

      // ---- 标题 ----
      var h = line.match(/^(#{1,6})\s+(.*)$/);
      if (h) {
        var tag = h[1].length <= 2 ? 'h2' : 'h3';
        out.push('<' + tag + '>' + inline(h[2].trim()) + '</' + tag + '>');
        i++; continue;
      }

      // ---- 分割线 ----
      if (/^(-{3,}|\*{3,})\s*$/.test(line)) {
        out.push('<hr class="post-hr" />');
        i++; continue;
      }

      // ---- 引用块 ----
      if (/^>\s?/.test(line)) {
        var q = [];
        while (i < n && /^>\s?/.test(lines[i])) {
          q.push(lines[i].replace(/^>\s?/, ''));
          i++;
        }
        out.push('<blockquote>' + inline(q.join(' ')) + '</blockquote>');
        continue;
      }

      // ---- 表格 ----
      if (line.indexOf('|') !== -1 && i + 1 < n &&
          /^\s*\|?[\s:|-]+\|?\s*$/.test(lines[i + 1]) &&
          lines[i + 1].indexOf('-') !== -1) {
        function splitRow(r) {
          return r.replace(/^\s*\|/, '').replace(/\|\s*$/, '')
                  .split('|').map(function (c) { return c.trim(); });
        }
        var header = splitRow(line);
        i += 2; // 跳过表头与分隔行
        var rows = [];
        while (i < n && lines[i].indexOf('|') !== -1 && !isBlank(lines[i])) {
          rows.push(splitRow(lines[i])); i++;
        }
        var t = '<table><thead><tr>' +
          header.map(function (c) { return '<th>' + inline(c) + '</th>'; }).join('') +
          '</tr></thead><tbody>';
        rows.forEach(function (r) {
          t += '<tr>' + r.map(function (c) { return '<td>' + inline(c) + '</td>'; }).join('') + '</tr>';
        });
        t += '</tbody></table>';
        out.push(t);
        continue;
      }

      // ---- 无序列表 ----
      if (/^\s*[-*]\s+/.test(line)) {
        var ul = [];
        while (i < n && /^\s*[-*]\s+/.test(lines[i])) {
          ul.push('<li>' + inline(lines[i].replace(/^\s*[-*]\s+/, '')) + '</li>');
          i++;
        }
        out.push('<ul>' + ul.join('') + '</ul>');
        continue;
      }

      // ---- 有序列表 ----
      if (/^\s*\d+\.\s+/.test(line)) {
        var ol = [];
        while (i < n && /^\s*\d+\.\s+/.test(lines[i])) {
          ol.push('<li>' + inline(lines[i].replace(/^\s*\d+\.\s+/, '')) + '</li>');
          i++;
        }
        out.push('<ol>' + ol.join('') + '</ol>');
        continue;
      }

      // ---- 段落 ----
      var p = [];
      while (i < n && !isBlank(lines[i]) && !isBlockStart(lines[i])) {
        p.push(lines[i]); i++;
      }
      out.push('<p>' + inline(p.join(' ')) + '</p>');
    }

    return out.join('\n');
  };
})();
