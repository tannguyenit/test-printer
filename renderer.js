const { ipcRenderer } = require('electron');

window.onload = () => {
  // Network printer elements
  const ipInput = document.getElementById('printer-ip');
  const networkTestBtn = document.getElementById('network-test-btn');
  const networkResult = document.getElementById('network-status');

  // USB printer elements
  const usbPrinterSelect = document.getElementById('usb-printer-select');
  const refreshUsbBtn = document.getElementById('refresh-usb-btn');
  const testUsbConnectionBtn = document.getElementById('test-usb-connection-btn');
  const printUsbTestBtn = document.getElementById('print-usb-test-btn');
  const usbResult = document.getElementById('usb-status');

  // Load USB printers on startup
  loadUsbPrinters();

  // Refresh USB printer list
  refreshUsbBtn.addEventListener('click', () => {
    loadUsbPrinters();
  });

  // Test USB connection
  testUsbConnectionBtn.addEventListener('click', () => {
    const selectedOption = usbPrinterSelect.options[usbPrinterSelect.selectedIndex];
    if (!selectedOption || selectedOption.value === "") {
      usbResult.textContent = '⚠️ Vui lòng chọn máy in USB!';
      return;
    }

    const printerInfo = JSON.parse(selectedOption.value);
    usbResult.textContent = '⏳ Đang kiểm tra kết nối...';
    ipcRenderer.send('test-usb-connection', printerInfo);
  });

  // Print test receipt via USB
  printUsbTestBtn.addEventListener('click', () => {
    const selectedOption = usbPrinterSelect.options[usbPrinterSelect.selectedIndex];
    if (!selectedOption || selectedOption.value === "") {
      usbResult.textContent = '⚠️ Vui lòng chọn máy in USB!';
      return;
    }

    const printerInfo = JSON.parse(selectedOption.value);
    usbResult.textContent = '⏳ Đang in thử qua USB...';
    ipcRenderer.send('print-test-usb', printerInfo);
  });

  // Network printer test print
  networkTestBtn.addEventListener('click', () => {
    const ip = ipInput.value.trim();
    if (!ip) {
      networkResult.textContent = '⚠️ Vui lòng nhập IP máy in!';
      return;
    }
    networkResult.textContent = '⏳ Đang in thử qua mạng...';
    ipcRenderer.send('print-test', ip);
  });

  // IPC event listeners
  ipcRenderer.on('print-result', (event, message) => {
    // Update both status elements for convenience
    networkResult.textContent = message;
    usbResult.textContent = message;
  });

  ipcRenderer.on('usb-printers-list', (event, data) => {
    if (data.success) {
      populateUsbPrinters(data.printers);
    } else {
      usbResult.textContent = '❌ Lỗi tìm máy in USB: ' + data.error;
    }
  });

  ipcRenderer.on('connection-test-result', (event, result) => {
    usbResult.textContent = result.message;
  });

  // Helper function to load USB printers
  function loadUsbPrinters() {
    usbResult.textContent = '⏳ Đang tìm máy in USB...';
    ipcRenderer.send('get-usb-printers');
  }

  // Helper function to populate USB printer dropdown
  function populateUsbPrinters(printers) {
    // Clear dropdown first
    usbPrinterSelect.innerHTML = '<option value="">-- Chọn máy in USB --</option>';
    
    if (printers.length === 0) {
      usbResult.textContent = '⚠️ Không tìm thấy máy in USB nào';
      return;
    }
    
    printers.forEach(printer => {
      const option = document.createElement('option');
      option.value = JSON.stringify({
        vendorId: printer.vendorId,
        productId: printer.productId
      });
      option.textContent = `${printer.manufacturer || 'Unknown'} - ${printer.product || 'Printer'} (${printer.vendorId}:${printer.productId})`;
      usbPrinterSelect.appendChild(option);
    });
    
    usbResult.textContent = `✅ Đã tìm thấy ${printers.length} máy in USB`;
  }
};