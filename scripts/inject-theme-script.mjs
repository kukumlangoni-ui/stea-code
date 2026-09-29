import fs from 'fs';
const html = fs.readFileSync('index.html', 'utf-8');
if (!html.includes('id="stea-theme-init"')) {
  const script = `
    <script id="stea-theme-init">
      (function() {
        try {
          var stored = localStorage.getItem('stea_theme');
          var isLight = false;
          if (stored === 'light') { isLight = true; }
          else if (stored === 'dark') { isLight = false; }
          else if (stored === 'system' || !stored) {
            isLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
          }
          var cls = isLight ? 'stea-home-light light' : 'stea-home-dark dark';
          document.documentElement.className += ' ' + cls;
        } catch (e) {}
      })();
    </script>
`;
  const newHtml = html.replace('<head>', '<head>' + script);
  fs.writeFileSync('index.html', newHtml);
}
