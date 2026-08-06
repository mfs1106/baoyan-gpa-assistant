const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PORT = 3000;
const HOST = 'localhost';

const distDir = path.join(__dirname, 'dist');

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.map': 'application/json',
};

const server = http.createServer((req, res) => {
  let filePath = path.join(distDir, req.url === '/' ? 'index.html' : req.url);
  
  const extname = path.extname(filePath);
  const contentType = mimeTypes[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (req.url.startsWith('/assets/')) {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end('');
      } else {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        fs.readFile(path.join(distDir, 'index.html'), (err, data) => {
          res.end(data);
        });
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

server.listen(PORT, HOST, () => {
  const url = `http://${HOST}:${PORT}`;
  console.log('========================================');
  console.log('  保研绩点助手 已启动');
  console.log('========================================');
  console.log('');
  console.log('  请在浏览器中打开:');
  console.log(`  ${url}`);
  console.log('');
  console.log('  关闭此窗口即可停止服务器');
  console.log('========================================');
  
  exec(`start ${url}`);
});
