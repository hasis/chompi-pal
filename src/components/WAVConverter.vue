<template>
    <div>
        <div style="color: pink;">
            <h2>CHOMPI-PAL</h2>
        </div>
        <div class="selection-container">
            <label>
                Engine Selector:
                <select v-model="selectedEngine">
                    <option value="jammi">JAMMI</option>
                    <option value="cubbi">CUBBI</option>
                </select>
            </label>
            <label>
                Bank Selector:
                <select v-model="selectedBank">
                    <option value="a">A - Purple</option>
                    <option value="b">B - Gold</option>
                    <option value="c">C - Teal Blue</option>
                </select>
            </label>
        </div>
        <div class="file-slots-container">
            <div class="file-slot" v-for="(slot, index) in fileSlots" :key="index" @dragover.prevent="handleDragOver"
                @drop.prevent="handleFileDrop(index, $event)" @click="handleSlotClick(index)"
                :style="{ width: slotWidth + 'px', height: slotHeight + 'px' }">
                <div class="slot-content">
                    <button v-if="slot.audioBuffer" @click.stop="playPreview(index)">PLAY</button>
                    <input type="file" @change="handleFileSelect(index, $event)" accept=".wav" style="display: none" />
                    <label v-if="!slot.audioBuffer && !slot.file">{{ 'Select or drag a file' }}</label>
                    <label v-if="!slot.audioBuffer && slot.file">{{ shortenFileName(slot.file.name) }}</label>
                </div>
            </div>
        </div>
        <button @click="processFiles">Process Files</button>
    </div>
</template>

<script>
import { ref } from 'vue';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import audiobufferToWav from 'audiobuffer-to-wav';

export default {
    setup() {
        const selectedEngine = ref('jammi');
        const selectedBank = ref('a'); // Add this line
        const fileSlots = ref(Array.from({ length: 14 }, () => ({ file: null, audioBuffer: null })));
        const slotWidth = 120;
        const slotHeight = 80;
        const playingSlots = ref([]);

        function handleFileSelect(index, event) {
            const fileInput = event.target;
            const file = fileInput.files[0];
            updateSlotFile(index, file);
        }

        function handleDragOver(event) {
            event.dataTransfer.dropEffect = 'copy';
        }

        function handleFileDrop(index, event) {
            const file = event.dataTransfer.files[0];
            updateSlotFile(index, file);
        }

        function updateSlotFile(index, file) {
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
                        console.log(`Size of ${selectedEngine.value}_${selectedBank.value}${i + 1}.wav: ${wavBuffer.length} bytes`);

                        // Add the processed file to the zip
                        zip.file(`${selectedEngine.value}_${selectedBank.value}${i + 1}.wav`, wavBuffer);
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

        async function convertAudioBufferToWav(audioBuffer) {
            const wavBuffer = audiobufferToWav(audioBuffer);
            return new Uint8Array(wavBuffer);
        }

        function playPreview(index) {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const source = audioContext.createBufferSource();
            const audioBuffer = fileSlots.value[index].audioBuffer;

            // Stop any currently playing sources
            playingSlots.value.forEach((source) => source.stop());

            // Create a new source
            const newSource = audioContext.createBufferSource();
            newSource.buffer = audioBuffer;
            newSource.connect(audioContext.destination);
            newSource.start();

            // Save the new source to stop later
            playingSlots.value = [newSource];
        }

        function handleSlotClick(index) {
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = '.wav';
            fileInput.style.display = 'none';
            fileInput.addEventListener('change', (event) => handleFileSelect(index, event));
            document.body.appendChild(fileInput);
            fileInput.click();
            document.body.removeChild(fileInput);
        }

        function shortenFileName(fileName) {
            // Implement your file name shortening logic here
            // For now, just return the original file name
            return fileName;
        }

        return {
            selectedEngine,
            selectedBank,
            fileSlots,
            slotWidth,
            slotHeight,
            playingSlots,
            handleSlotClick,
            handleFileSelect,
            handleDragOver,
            handleFileDrop,
            processFiles,
            playPreview,
            shortenFileName,
        };
    },
};
</script>

<style scoped>
.file-slots-container {
    display: flex;
    gap: 10px;
}

.file-slot {
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    border: 1px solid #ccc;
    border-radius: 5px;
    overflow: hidden;
}

.slot-content {
    display: flex;
    flex-direction: column;
    align-items: center;
}

button {
    margin-top: 5px;
}

.custom-file-label {
    padding: 5px;
    border: 1px solid #ccc;
    border-radius: 5px;
    background-color: #f8f8f8;
    text-align: center;
}

.selection-container {
    display: flex;
    justify-content: center;
    gap: 10px;
    margin-bottom: 10px;
}
</style>