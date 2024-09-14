<!-- App.vue -->
<template>
  <div id="app" class="font-sans">
    <div id="monitor">
      <div id="crt" class="off" onClick="handleClick(event)">
        <!-- slowly moving scanline -->
        <div class="scanline"></div>
        <div class="font-sans">This is using the Inter font.</div>
        <DarkMode />
        <WAVConverter />
      </div>
    </div>
  </div>
</template>

<script>
import WAVConverter from './components/WAVConverter.vue';
import DarkMode from './components/DarkMode.vue'

export default {
  components: {
    WAVConverter,
    DarkMode
  },
};
</script>

<style>
  html.dark {
    color-scheme: dark;
  }
</style>