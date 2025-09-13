const { app, BrowserWindow, ipcMain } = require('electron');
const escpos = require('escpos');
const usb = require('usb');

// Nạp driver network và USB
escpos.Network = require('escpos-network');
escpos.USB = require('escpos-usb');



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

// Hàm tìm máy in USB
// function findUSBPrinters() {
//   try {
//     // Sử dụng thư viện usb để lấy danh sách thiết bị
//     const devices = usb.getDeviceList();
//     console.log('Found USB devices:', devices);
    
//     // Lọc các thiết bị có thể là máy in
//     return devices.map(device => ({
//       vendorId: device.deviceDescriptor.idVendor,
//       productId: device.deviceDescriptor.idProduct,
//       manufacturer: device.deviceDescriptor.iManufacturer,
//       product: device.deviceDescriptor.iProduct,
//       // Thêm bus và address để dễ nhận diện
//       busNumber: device.busNumber,
//       deviceAddress: device.deviceAddress
//     }));
//   } catch (err) {
//     console.error('Error finding USB devices:', err);
//     return [];
//   }
// }

function findUSBPrinters() {
  try {
    const devices = usb.getDeviceList()
      .filter(device => device && device.configDescriptor && device.configDescriptor.interfaces && device.configDescriptor.interfaces.length)
      .map(device => {
        const interfaces = [];
        device.configDescriptor.interfaces.forEach(its => {
          its.forEach(it => {
            interfaces.push({
              id: it.bInterfaceNumber,
              type: it.bInterfaceClass
            });
          });
        });
        return {
          busNumber: device.busNumber,
          deviceAddress: device.deviceAddress,
          vendorId: device.deviceDescriptor.idVendor,
          productId: device.deviceDescriptor.idProduct,
          interfaces: interfaces
        };
      })
      .filter(device => !!device.interfaces.find(it => it.type === 7)); // chỉ lấy máy in

    return devices;
  } catch (err) {
    console.error('Error finding USB printers:', err);
    return [];
  }
}

function printTestReceipt(printer) {
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
}

ipcMain.on('get-usb-printers', (event) => {
  try {
    const printers = findUSBPrinters();
    event.reply('usb-printers-list', { success: true, printers });
  } catch (err) {
    event.reply('usb-printers-list', { success: false, error: err.message });
  }
});

// Test kết nối máy in USB mà không in
ipcMain.on('test-usb-connection', (event, printerInfo) => {
  try {
    // const device = new escpos.USB(printerInfo.vendorId, printerInfo.productId);
    const device = new escpos.USB(printerInfo.vendorId, printerInfo.productId);
    device.open((err) => {
      if (err) {
        event.reply('connection-test-result', {
          success: false,
          message: '❌ Lỗi kết nối USB: ' + err.message
        });
      } else {
        device.close();
        event.reply('connection-test-result', {
          success: true,
          message: '✅ Kết nối USB thành công!'
        });
      }
    });
  } catch (err) {
    console.error('Error testing USB connection:', err);
    event.reply('connection-test-result', {
      success: false,
      message: '❌ Lỗi kết nối USB: ' + err.message
    });
  }
});

// In thử qua USB
ipcMain.on('print-test-usb', (event, printerInfo) => {
  try {
    const device = new escpos.USB(printerInfo.vendorId, printerInfo.productId);
    const printer = new escpos.Printer(device, { encoding: "GB18030" }); // Hỗ trợ tiếng Việt

    device.open(() => {
      printTestReceipt(printer);
      event.reply('print-result', '✅ In thành công qua USB!');
    });
  } catch (err) {
    event.reply('print-result', '❌ Lỗi: ' + err.message);
  }
});

// In thử qua Network (giữ nguyên code cũ)
ipcMain.on('print-test', (event, printerIP) => {
  try {
    const device = new escpos.Network(printerIP);
    const printer = new escpos.Printer(device, { encoding: "GB18030" }); // Hỗ trợ tiếng Việt nếu máy in hỗ trợ

    device.open(() => {
      printTestReceipt(printer);
      event.reply('print-result', '✅ In thành công!');
    });
  } catch (err) {
    event.reply('print-result', '❌ Lỗi: ' + err.message);
  }
});