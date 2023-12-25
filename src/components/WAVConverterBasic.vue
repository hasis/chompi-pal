<template>
    <div>
        <div class="file-slots-container">
            <div class="file-slot" v-for="(slot, index) in fileSlots" :key="index">
                <input type="file" @change="handleFileSelect(index, $event)" accept=".wav" />
                <button v-if="slot.audioBuffer" @click="playPreview(index)">PLAY</button>
            </div>
        </div>
        <label>
            Mode Selector:
            <select v-model="selectedMode">
                <option value="JAMMI">JAMMI</option>
                <option value="CUBBI">CUBBI</option>
            </select>
        </label>
        <button @click="processFiles">Process Files</button>
    </div>
</template>



<script>
import { ref } from 'vue';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export default {
    setup() {
        const selectedMode = ref('JAMMI');
        const fileSlots = ref(Array.from({ length: 14 }, () => ({ file: null, audioBuffer: null })));

        function handleFileSelect(index, event) {
            const fileInput = event.target;
            const file = fileInput.files[0];

            if (file) {
                // Convert arrayBuffer to AudioBuffer and update the audioBuffer in fileSlots
                readFile(file)
                    .then((arrayBuffer) => convertToAudioBuffer(arrayBuffer))
                    .then((audioBuffer) => {
                        fileSlots.value[index].file = file;
                        fileSlots.value[index].audioBuffer = audioBuffer;
                    })
                    .catch((error) => {
                        console.error('Error handling file:', error);
                    });
            }
        }

        async function processFiles() {
            const zip = new JSZip();

            for (let i = 0; i < fileSlots.value.length; i++) {
                const slot = fileSlots.value[i];
                const { file, audioBuffer } = slot;

                if (file && audioBuffer) {
                    try {
                        // Convert AudioBuffer to WAV format
                        const wavBuffer = await convertAudioBufferToWav(audioBuffer);

                        // Log the size of the processed data
                        console.log(`Size of ${selectedMode.value}_${i + 1}.wav: ${wavBuffer.length} bytes`);

                        // Add the processed file to the zip
                        zip.file(`${selectedMode.value}_${i + 1}.wav`, wavBuffer);
                    } catch (error) {
                        console.error('Error processing file:', error);
                    }
                } else {
                    console.log(`No file or audio buffer selected for slot ${i + 1}`);
                }
            }

            // Generate the zip file
            zip.generateAsync({ type: 'blob' })
                .then((blob) => {
                    // Save or process the zip file as needed
                    console.log('Zip file size:', blob.size, 'bytes');
                    saveAs(blob, 'processed_files.zip');
                });
        }

        function readFile(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (event) => resolve(event.target.result);
                reader.onerror = (error) => reject(error);
                reader.readAsArrayBuffer(file);
            });
        }

        function convertToAudioBuffer(arrayBuffer) {
            return new Promise((resolve, reject) => {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                audioContext.decodeAudioData(arrayBuffer, (decodedData) => {
                    resolve(decodedData);
                }, (error) => {
                    reject(error);
                });
            });
        }

        function convertAudioBufferToWav(audioBuffer) {
            const numberOfChannels = audioBuffer.numberOfChannels;
            const length = audioBuffer.length;
            const buffer = new Float32Array(length * numberOfChannels);

            for (let channel = 0; channel < numberOfChannels; channel++) {
                buffer.set(audioBuffer.getChannelData(channel), channel * length);
            }

            // Convert Float32Array to Uint8Array (16-bit PCM)
            const wavBuffer = new Uint8Array(buffer.length * 2);
            for (let i = 0, offset = 0; i < buffer.length; offset += 2) {
                const value = Math.max(-1, Math.min(1, buffer[i++]));
                wavBuffer[offset] = (value < 0 ? value * 0x8000 : value * 0x7FFF) | 0;
            }

            return wavBuffer;
        }

        function playPreview(index) {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const source = audioContext.createBufferSource();
            const audioBuffer = fileSlots.value[index].audioBuffer;

            // Stop any currently playing sources
            audioContext.close().then(() => {
                // Create a new audio context for the current source
                const newAudioContext = new (window.AudioContext || window.webkitAudioContext)();
                const newSource = newAudioContext.createBufferSource();

                // Set the buffer and connect to the destination
                newSource.buffer = audioBuffer;
                newSource.connect(newAudioContext.destination);

                // Start playing
                newSource.start();

                // Save the new audio context and source
                fileSlots.value[index].audioContext = newAudioContext;
                fileSlots.value[index].audioSource = newSource;
            });
        }


        return {
            selectedMode,
            fileSlots,
            handleFileSelect,
            processFiles,
            playPreview,
        };
    },
};
</script>
