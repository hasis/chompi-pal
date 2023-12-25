<!-- App.vue -->
<template>
  <div id="app">
    <WAVConverter />
  </div>
</template>

<script>
import WAVConverter from './components/WAVConverter.vue';

export default {
  components: {
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
