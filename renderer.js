const { ipcRenderer } = require('electron');

window.onload = () => {
  const ipInput = document.getElementById('printer-ip');
  const btn = document.getElementById('test-btn');
  const result = document.getElementById('status');

  btn.addEventListener('click', () => {
    const ip = ipInput.value.trim();
    if (!ip) {
      result.textContent = '⚠️ Vui lòng nhập IP máy in!';
      return;
    }
    result.textContent = '⏳ Đang in thử...';
    ipcRenderer.send('print-test', ip);
  });

  ipcRenderer.on('print-result', (event, message) => {
    result.textContent = message;
  });
};
