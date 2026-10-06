import { useEffect, useRef } from 'react';

// Simple syntax highlighting without Prism dependency issues
const KEYWORDS = {
  python: ['def', 'return', 'for', 'in', 'range', 'if', 'else', 'elif', 'while', 'class', 'import', 'from', 'True', 'False', 'None', 'and', 'or', 'not', 'print', 'len', 'with', 'as', 'try', 'except', 'finally', 'lambda', 'yield', 'pass', 'break', 'continue'],
  javascript: ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'class', 'new', 'this', 'import', 'export', 'default', 'true', 'false', 'null', 'undefined', 'console', 'typeof', 'instanceof', '=>', 'async', 'await', 'try', 'catch', 'finally'],
  java: ['public', 'private', 'protected', 'static', 'void', 'int', 'String', 'boolean', 'class', 'new', 'return', 'if', 'else', 'for', 'while', 'import', 'package', 'System', 'out', 'println', 'true', 'false', 'null', 'this', 'extends', 'implements'],
  c: ['int', 'char', 'float', 'double', 'void', 'return', 'if', 'else', 'for', 'while', 'printf', 'scanf', 'include', 'define', 'struct', 'typedef', 'sizeof'],
  cpp: ['int', 'char', 'float', 'double', 'void', 'return', 'if', 'else', 'for', 'while', 'cout', 'cin', 'endl', 'include', 'namespace', 'std', 'class', 'public', 'private', 'new', 'delete', 'using'],
};

function tokenize(code, lang) {
  const keywords = KEYWORDS[lang] || KEYWORDS.python;
  const lines = code.split('\n');
  return lines.map((line, lineIdx) => {
    // Escape HTML
    let result = '';
    let i = 0;
    while (i < line.length) {
      // String detection
      if (line[i] === '"' || line[i] === "'") {
        const quote = line[i];
        let str = quote;
        i++;
        while (i < line.length && line[i] !== quote) { str += line[i]; i++; }
        str += (line[i] || '');
        i++;
        result += `<span class="tok-string">${escHtml(str)}</span>`;
        continue;
      }
      // Comment detection
      if ((lang === 'python' && line[i] === '#') || 
          (lang !== 'python' && line[i] === '/' && line[i+1] === '/')) {
        result += `<span class="tok-comment">${escHtml(line.slice(i))}</span>`;
        break;
      }
      // Number
      if (/\d/.test(line[i]) && (i === 0 || /\W/.test(line[i-1]))) {
        let num = '';
        while (i < line.length && /[\d.]/.test(line[i])) { num += line[i]; i++; }
        result += `<span class="tok-number">${num}</span>`;
        continue;
      }
      // Word/keyword
      if (/[a-zA-Z_]/.test(line[i])) {
        let word = '';
        while (i < line.length && /[a-zA-Z0-9_]/.test(line[i])) { word += line[i]; i++; }
        if (keywords.includes(word)) {
          result += `<span class="tok-keyword">${word}</span>`;
        } else if (i < line.length && line[i] === '(') {
          result += `<span class="tok-func">${word}</span>`;
        } else {
          result += `<span class="tok-var">${escHtml(word)}</span>`;
        }
        continue;
      }
      // Operator
      if (/[+\-*/%=<>!&|^~]/.test(line[i])) {
        result += `<span class="tok-op">${escHtml(line[i])}</span>`;
      } else {
        result += escHtml(line[i]);
      }
      i++;
    }
    return `<span class="code-line">${result || ' '}</span>`;
  }).join('\n');
}

function escHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function CodeBlock({ code, language = 'python', showLineNumbers = true }) {
  const lang = language.toLowerCase();
  const highlighted = tokenize(code, lang);

  return (
    <div
      className="code-container"
      style={{
        fontSize: '14px',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
      }}
      onCopy={e => e.preventDefault()}
      onCut={e => e.preventDefault()}
      onContextMenu={e => e.preventDefault()}
    >
      <div className="code-header">
        <div className="code-dots">
          <div className="code-dot code-dot-red" />
          <div className="code-dot code-dot-yellow" />
          <div className="code-dot code-dot-green" />
        </div>
        <span className="code-lang-badge">{language.toUpperCase()}</span>
      </div>
      <div className="code-body">
        <div style={{ display: 'flex', gap: 0 }}>
          {showLineNumbers && (
            <div style={{ color: '#4a4a6a', userSelect: 'none', paddingRight: '16px', minWidth: '36px', textAlign: 'right', lineHeight: '1.7', fontSize: '13px' }}>
              {code.split('\n').map((_, i) => <div key={i}>{i + 1}</div>)}
            </div>
          )}
          <pre style={{ margin: 0, flex: 1, overflow: 'auto', lineHeight: '1.7' }}
            dangerouslySetInnerHTML={{ __html: highlighted }} />
        </div>
      </div>
      <style>{`
        .tok-keyword { color: #c792ea; font-weight: 600; }
        .tok-string { color: #c3e88d; }
        .tok-number { color: #f78c6c; }
        .tok-comment { color: #546e7a; font-style: italic; }
        .tok-func { color: #82aaff; }
        .tok-var { color: #eeffff; }
        .tok-op { color: #89ddff; }
        .code-line { display: block; }
      `}</style>
    </div>
  );
}
