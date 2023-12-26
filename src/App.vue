<!-- App.vue -->
<template>
  <div id="app">
    <div id="monitor">
      <div id="crt" class="off" onClick="handleClick(event)"> 
              <!-- slowly moving scanline -->
              <div class="scanline"></div>
              <WAVConverter />
          </div>
    </div>
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
  padding-top: 0; /* Remove the top padding */
}

body {
    background: linear-gradient(to bottom, #6f019c, #f3c309, #009688);
    margin: 0;
    overflow: hidden;
    font-family: 'Arial', sans-serif; /* You can adjust the font-family as needed */
}

#crt:before {
    content: " ";
    display: block;
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    background: linear-gradient(
        to bottom,
        rgba(18, 16, 16, 0) 50%,
        rgba(0, 0, 0, 0.25) 50%
    );
    background-size: 100% 2px;
    z-index: 2;
    pointer-events: none;
    opacity: 0.3;
}

@keyframes textShadow {
  0% {
    text-shadow: 0.4389924193300864px 0 1px rgba(0,30,255,0.5), -0.4389924193300864px 0 1px rgba(255,0,80,0.3), 0 0 3px;
  }
  5% {
    text-shadow: 2.7928974010788217px 0 1px rgba(0,30,255,0.5), -2.7928974010788217px 0 1px rgba(255,0,80,0.3), 0 0 3px;
  }
  /** etc */
}

.scanline {
    width: 100%;
    height: 4px; /* Adjust the height of the scanlines as needed */
    z-index: 8;
    background: linear-gradient(
        0deg,
        rgba(0, 0, 0, 0) 0%,
        rgba(255, 255, 255, 0.2) 10%,
        rgba(0, 0, 0, 0.1) 100%
    );
    opacity: 0.5;
    position: absolute;
    bottom: 100%;
    animation: scanline 5s linear infinite;
}

@keyframes scanline {
    0% {
        bottom: 100%;
    }
    80% {
        bottom: 100%;
    }
    100% {
        bottom: 0%;
    }
}

</style>
