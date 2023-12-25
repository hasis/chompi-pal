<template>
  <div>
    <button @click="requestUSBAccess">Connect to SD Card</button>

    <div v-for="n in 14" :key="n">
      <input type="file" @change="handleFileUpload($event)" />
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      usbDevice: null,
    };
  },

  methods: {
    async requestUSBAccess() {
      try {
        const device = await navigator.usb.requestDevice({ filters: [] });
        await device.open();
        await device.selectConfiguration(1);
        await device.claimInterface(0);

        this.usbDevice = device;

        console.log('USB device connected:', device);
      } catch (error) {
        console.error('Error requesting USB access:', error);
      }
    },

    async handleFileUpload(event) {
      const file = event.target.files[0];

      if (!this.usbDevice) {
        console.error('USB device not connected');
        return;
      }

      try {
        // Implement logic to rename and drop the file onto the SD card
        // For simplicity, we'll just log the file details here
        console.log('File Uploaded:', file.name);

        // You can add logic to send the file to the SD card using this.usbDevice
        // For example, you can use this.usbDevice.transferOut() to send data
      } catch (error) {
        console.error('Error uploading file:', error);
      }
    },
  },
};
</script>
