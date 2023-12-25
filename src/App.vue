<!-- App.vue -->
<template>
  <div id="app">
    <WAVConverter />
  </div>
</template>

<script>
import USBComponent from './components/USBComponent.vue';
import WAVConverter from './components/WAVConverter.vue';


export default {
  components: {
    USBComponent,
    WAVConverter
  },
};
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
