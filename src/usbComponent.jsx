// USBComponent.js
import React, { useState } from 'react';

const USBComponent = () => {
  const [usbDevice, setUsbDevice] = useState(null);

  const requestUSBAccess = async () => {
    try {
      const device = await navigator.usb.requestDevice({ filters: [] });
      await device.open();
      await device.selectConfiguration(1);
      await device.claimInterface(0);

      setUsbDevice(device);
    } catch (error) {
      console.error('Error requesting USB access:', error);
    }
  };

  return (
    <div>
      <button onClick={requestUSBAccess}>Connect to SD Card</button>
      {/* Implement file slots and upload functionality here */}
    </div>
  );
};

export default USBComponent;
