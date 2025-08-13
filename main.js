const { app, BrowserWindow, ipcMain } = require('electron');
const escpos = require('escpos');

// Nạp driver network
escpos.Network = require('escpos-network');

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 500,
    webPreferences: {
      preload: __dirname + '/renderer.js',
      contextIsolation: false,
      nodeIntegration: true
    }
  });

  win.loadFile('index.html');
}

app.on('ready', createWindow);

ipcMain.on('print-test', (event, printerIP) => {
  try {
    const device = new escpos.Network(printerIP);
    const printer = new escpos.Printer(device, { encoding: "GB18030" }); // Hỗ trợ tiếng Việt nếu máy in hỗ trợ

    device.open(() => {
      printer
      .font('a')
      .align('ct')
      .style('bu')
      .size(1, 1)
      .text('CUA HANG ABC')
      .style('normal')
      .size(0, 0)
      .text('') // Thêm dòng trống
      .text('Dia chi: 123 Duong ABC, Quan 1, TP.HCM')
      .text('Dien thoai: 0123 456 789')
      .text('') // Thêm dòng trống
      .text('============================')
      .align('lt')
      .tableCustom([
        { text: 'San pham', align: 'LEFT', width: 0.5, style: 'b' },
        { text: 'SL', align: 'CENTER', width: 0.15, style: 'b' },
        { text: 'Gia', align: 'RIGHT', width: 0.35, style: 'b' }
      ])
      .text('----------------------------')
      .tableCustom([
        { text: 'Ca phe sua', align: 'LEFT', width: 0.5 },
        { text: '2', align: 'CENTER', width: 0.15 },
        { text: '30,000', align: 'RIGHT', width: 0.35 }
      ])
      .tableCustom([
        { text: 'Tra sua tran chau', align: 'LEFT', width: 0.5 },
        { text: '1', align: 'CENTER', width: 0.15 },
        { text: '40,000', align: 'RIGHT', width: 0.35 }
      ])
      .text('----------------------------')
      .align('rt')
      .text('Tong cong: 70,000 VND')
      .align('ct')
      .text('') // Thêm dòng trống
      .text('Cam on quy khach!')
      .text('Hen gap lai!')
      .feed(2) // Thêm 2 dòng trống để tránh cắt mất nội dung
      .text('============================')
      .feed(2)
      .cut()
      .close();
    });
    event.reply('print-result', '✅ In thành công!');
  } catch (err) {
    event.reply('print-result', '❌ Lỗi: ' + err.message);
  }
});
