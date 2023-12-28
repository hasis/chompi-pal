<template>
    <div>
        <div style="color: pink;">
            <h1>CHOMPI-PAL</h1>
        </div>
        <div style="color: black;">
            <small>Drag and drop or upload your samples, audition from within, and when you're set, click process to get a
                zip of CHOMPI-friendly samples.</small>
        </div>
        <hr />
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
                    <button v-if="slot.audioBuffer" @click.stop="playPreview(index)" class="play-button">
                        ▶
                    </button>
                    <input type="file" @change="handleFileSelect(index, $event)" accept=".wav" style="display: none" />
                    <label v-if="!slot.audioBuffer && !slot.file">{{ 'Select or drag a file' }}</label>
                    <label v-if="!slot.audioBuffer && slot.file">{{ shortenFileName(slot.file.name) }}</label>
                    <div class="slot-number">{{ selectedEngine + '_' + selectedBank + (index + 1) }}</div>
                </div>
            </div>
        </div>
        <div class="normalize">
            <label>
                Normalize <em>(-6db)</em>:
                <input type="checkbox" v-model="normalize" />
            </label>
        </div>
        <button @click="processFiles">Process Files</button>
        <footer style="color: white; padding-top: 5px">
            <hr />
            <em>
                This is a community-maintained web app and is not affiliated with the CHOMPI team or product. But we
                encourage you to buy one and make some jams.
            </em>
    </footer>
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
        const selectedBank = ref('a');
        const fileSlots = ref(Array.from({ length: 14 }, () => ({ file: null, audioBuffer: null })));
        const slotWidth = 120;
        const slotHeight = 80;
        const playingSlots = ref([]);
        const normalize = ref(false);

        async function normalizeAudioBuffer(audioBuffer) {
            const targetDb = -6;

            // Calculate the current peak amplitude of the audio buffer
            const currentDb = calculatePeakAmplitudeDb(audioBuffer);

            // Calculate the gain needed to achieve the target dB level
            const gain = calculateGain(targetDb, currentDb);

            // Apply the gain to normalize the audio buffer with the target sample rate of 48000 Hz
            const targetSampleRate = 48000;
            const normalizedBuffer = applyGain(audioBuffer, gain, targetSampleRate);

            return normalizedBuffer;
        }

        function calculatePeakAmplitudeDb(audioBuffer) {
            let peakAmplitude = 0;

            for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
                const data = audioBuffer.getChannelData(channel);

                for (let i = 0; i < data.length; i++) {
                    const absSample = Math.abs(data[i]);
                    if (absSample > peakAmplitude) {
                        peakAmplitude = absSample;
                    }
                }
            }

            // Convert the peak amplitude to dB
            return 20 * Math.log10(peakAmplitude);
        }

        function calculateGain(targetDb, currentDb) {
            return Math.pow(10, (targetDb - currentDb) / 20);
        }

        function applyGain(audioBuffer, gain, targetSampleRate) {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const numberOfChannels = audioBuffer.numberOfChannels;
            const length = audioBuffer.length;
            const newBuffer = audioContext.createBuffer(numberOfChannels, length, targetSampleRate);

            for (let channel = 0; channel < numberOfChannels; channel++) {
                const oldData = audioBuffer.getChannelData(channel);
                const newData = newBuffer.getChannelData(channel);

                for (let i = 0; i < length; i++) {
                    newData[i] = oldData[i] * gain;
                }
            }

            return newBuffer;
        }


        async function convertAudioBufferToWav(audioBuffer) {
            const options = {
                float32: false,
                stereo: true,
            };

            return new Promise((resolve) => {
                const wavBuffer = audiobufferToWav(audioBuffer, options);
                resolve(new Uint8Array(wavBuffer));
            });
        }

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
                        const normalizedAudioBuffer = normalize.value ? await normalizeAudioBuffer(audioBuffer) : audioBuffer;
                        const wavBuffer = await convertAudioBufferToWav(normalizedAudioBuffer);

                        console.log(`Size of ${selectedEngine.value}_${selectedBank.value}${i + 1}.wav: ${wavBuffer.length} bytes`);

                        zip.file(`${selectedEngine.value}_${selectedBank.value}${i + 1}.wav`, wavBuffer);
                    } catch (error) {
                        console.error('Error processing file:', error);
                    }
                } else {
                    console.log(`No file or audio buffer selected for slot ${i + 1}`);
                }
            }

            zip.generateAsync({ type: 'blob' })
                .then((blob) => {
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
                const sampleRate = 48000;

                audioContext.decodeAudioData(arrayBuffer, (decodedData) => {
                    resolve(decodedData);
                }, (error) => {
                    reject(error);
                }).then((decodedData) => {
                    const offlineContext = new OfflineAudioContext(2, decodedData.length, sampleRate);
                    const source = offlineContext.createBufferSource();
                    source.buffer = decodedData;

                    source.connect(offlineContext.destination);
                    source.start(0);
                    offlineContext.startRendering().then((renderedBuffer) => {
                        resolve(renderedBuffer);
                    }).catch((error) => {
                        reject(error);
                    });
                });
            });
        }

        function playPreview(index) {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const source = audioContext.createBufferSource();
            const audioBuffer = fileSlots.value[index].audioBuffer;

            playingSlots.value.forEach((source) => source.stop());

            const newSource = audioContext.createBufferSource();
            newSource.buffer = audioBuffer;
            newSource.connect(audioContext.destination);
            newSource.start();

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
            return fileName;
        }

        return {
            selectedEngine,
            selectedBank,
            fileSlots,
            slotWidth,
            slotHeight,
            playingSlots,
            normalize,
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
    flex-wrap: wrap;
    gap: 10px;
    overflow-x: auto;
    justify-content: center;
}

.file-slot {
    width: 120px;
    height: 80px;
    margin-bottom: 10px;
    border: 2px solid #ccc;
    border-radius: 10px;
    /* Add rounded borders */
    box-sizing: border-box;
}

.slot-number {
    margin-top: 5px;
    font-size: 12px;
    color: #888; /* Grey color */
    opacity: 0.8; /* Adjust the opacity as needed (0 to 1) */
}

/* Responsive styles for smaller screens */
@media only screen and (max-width: 600px) {
    .file-slot {
        width: calc(33.33% - 10px);
    }
}

/* Responsive styles for larger screens */
@media only screen and (min-width: 1200px) {
    .file-slot {
        flex: 0 0 calc(7.14% - 10px);
    }
}

.slot-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    height: 100%;
}

button {
    margin-top: 5px;
    width: 50%;
}

.play-button {
  display: flex;
  align-items: center;
  justify-content: center;
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

.normalize {
    padding: 10px;
}
</style>

