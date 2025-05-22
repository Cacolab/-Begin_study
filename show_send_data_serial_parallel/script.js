// Wait for the DOM to be fully loaded before running the script
document.addEventListener('DOMContentLoaded', () => {
    // Get references to DOM elements
    const serialInputElement = document.getElementById('serial-input');
    const serialStartButton = document.getElementById('serial-start-button');
    const serialBinaryRepresentationElement = document.getElementById('serial-binary-representation');
    const serialVisualizationElement = document.getElementById('serial-visualization');
    // The serial channel is a visual guide, bits will be animated within serialVisualizationElement
    const serialChannel = serialVisualizationElement.querySelector('.serial-channel');

    // Get references to DOM elements for Parallel Transfer
    const parallelInputElement = document.getElementById('parallel-input');
    const parallelStartButton = document.getElementById('parallel-start-button');
    const parallelBinaryRepresentationElement = document.getElementById('parallel-binary-representation');
    const parallelVisualizationElement = document.getElementById('parallel-visualization');

    // Get references to status message elements
    const serialStatusElement = document.getElementById('serial-status');
    const parallelStatusElement = document.getElementById('parallel-status');


    // --- Helper Functions ---

    /**
     * Converts a string to its binary representation.
     * Each character is converted to its 8-bit ASCII binary form.
     * @param {string} inputString The string to convert.
     * @returns {string} The binary representation of the input string.
     */
    function stringToBinary(inputString) {
        let binaryString = '';
        for (let i = 0; i < inputString.length; i++) {
            const charCode = inputString.charCodeAt(i);
            // Convert char code to 8-bit binary string, padding with leading zeros if necessary
            binaryString += charCode.toString(2).padStart(8, '0');
        }
        return binaryString;
    }

    /**
     * Creates a new DOM element representing a data bit.
     * @param {string} bitValue The value of the bit ('0' or '1').
     * @returns {HTMLElement} The created bit element.
     */
    function createBitElement(bitValue) {
        const bitElement = document.createElement('div');
        bitElement.classList.add('data-bit');
        bitElement.innerText = bitValue;
        // Style for positioning and animation - will be set before animation starts
        bitElement.style.position = 'absolute';
        return bitElement;
    }

    /**
     * Ensures a specified number of parallel channels are created in the container.
     * Clears existing channels and bits before creating new ones.
     * @param {HTMLElement} container The container element for parallel channels.
     * @param {number} numChannels The number of channels to create (typically 8).
     * @returns {Array<HTMLElement>} An array of the created channel elements.
     */
    function ensureParallelChannels(container, numChannels) {
        container.innerHTML = ''; // Clear previous channels and bits
        const channels = [];
        for (let i = 0; i < numChannels; i++) {
            const channelElement = document.createElement('div');
            channelElement.classList.add('parallel-channel');
            // Set a data attribute for easier identification, though not strictly necessary for this logic
            channelElement.dataset.channelId = i;
            container.appendChild(channelElement);
            channels.push(channelElement);
        }
        return channels;
    }


    // --- Main Serial Transfer Logic ---

    /**
     * Starts the serial data transfer simulation.
     */
    function startSerialTransfer() {
        const data = serialInputElement.value;
        if (!data) {
            alert('Please enter data for serial transfer.');
            return;
        }

        // 0. Clear status message and disable button
        serialStatusElement.textContent = '';
        serialStartButton.disabled = true;

        // 1. Convert data to binary and display it
        const binaryData = stringToBinary(data);
        serialBinaryRepresentationElement.textContent = binaryData;

        // 2. Clear previous animation from the visualization area
        // Remove only elements with the 'data-bit' class
        const existingBits = serialVisualizationElement.querySelectorAll('.data-bit');
        existingBits.forEach(bit => bit.remove());

        // 3. Animate bit by bit
        if (binaryData.length === 0) return;

        let bitIndex = 0;
        const bitAnimationDuration = 1000; // ms for a single bit to cross
        const delayBetweenBits = 500;   // ms delay before sending the next bit

        function sendNextBit() {
            if (bitIndex >= binaryData.length) {
                serialStatusElement.textContent = 'Serial Transfer Complete!';
                serialStartButton.disabled = false;
                return; // All bits sent
            }

            serialStatusElement.textContent = `Transferring bit ${bitIndex + 1} of ${binaryData.length}...`;
            const bitValue = binaryData[bitIndex];
            const bitElement = createBitElement(bitValue);

            // Position bit at the start of the visualization area, vertically centered to the channel
            const visualizationRect = serialVisualizationElement.getBoundingClientRect();
            const channelRect = serialChannel.getBoundingClientRect();
            const bitRect = bitElement.getBoundingClientRect(); // Get width for centering calculation

            // Start bit on the left, vertically aligned with the (visual) channel's center
            bitElement.style.left = '0px'; // Start at the very left
            // Center the bit vertically relative to the channel.
            // (channel center y relative to visualization) - (half bit height)
            const channelCenterY = (channelRect.top - visualizationRect.top) + (channelRect.height / 2);
            bitElement.style.top = (channelCenterY - (bitElement.offsetHeight / 2)) + 'px';


            serialVisualizationElement.appendChild(bitElement);

            // Animate the bit moving across the channel
            // Using a simple timeout for animation step, could be improved with requestAnimationFrame or CSS transitions
            setTimeout(() => {
                // Move to the right end of the visualization area
                // The 'left' property should be the width of the visualization area minus the width of the bit itself.
                bitElement.style.left = (visualizationRect.width - bitElement.offsetWidth) + 'px';
                bitElement.style.transition = `left ${bitAnimationDuration / 1000}s linear`;
            }, 50); // Small delay to ensure the element is rendered before transition starts

            // Remove the bit after animation completes
            setTimeout(() => {
                bitElement.remove();
            }, bitAnimationDuration + 50); // Add the small delay

            bitIndex++;
            // Schedule the next bit
            setTimeout(sendNextBit, delayBetweenBits);
        }

        sendNextBit(); // Start sending the first bit
    }

    // Attach event listener to the serial start button
    if (serialStartButton) {
        serialStartButton.addEventListener('click', startSerialTransfer);
    } else {
        console.error("Serial start button not found!");
    }

    // --- Main Parallel Transfer Logic ---

    /**
     * Starts the parallel data transfer simulation.
     */
    function startParallelTransfer() {
        const data = parallelInputElement.value;
        if (!data) {
            alert('Please enter data for parallel transfer.');
            return;
        }

        // 0. Clear status message and disable button
        parallelStatusElement.textContent = '';
        parallelStartButton.disabled = true;

        // 1. Convert entire data to binary and display it
        const fullBinaryData = stringToBinary(data);
        parallelBinaryRepresentationElement.textContent = fullBinaryData;

        // 2. Ensure 8 parallel channels are set up
        const numChannels = 8;
        const channels = ensureParallelChannels(parallelVisualizationElement, numChannels);

        // 3. Animate byte by byte (8 bits in parallel)
        let charIndex = 0;
        const bitAnimationDuration = 1000; // ms for bits to cross a channel
        const delayBetweenBytes = bitAnimationDuration + 300; // Delay after one byte is sent

        function sendNextByte() {
            if (charIndex >= data.length) {
                parallelStatusElement.textContent = 'Parallel Transfer Complete!';
                parallelStartButton.disabled = false;
                return; // All characters (bytes) sent
            }

            const char = data[charIndex];
            parallelStatusElement.textContent = `Transferring byte ${charIndex + 1} of ${data.length} (Character: '${char}')...`;
            const byteBinary = char.charCodeAt(0).toString(2).padStart(8, '0');

            // Clear bits from previous byte in channels (important if animation is slow)
            channels.forEach(channel => {
                const existingBits = channel.querySelectorAll('.data-bit');
                existingBits.forEach(bit => bit.remove());
            });


            for (let i = 0; i < byteBinary.length; i++) {
                if (i >= channels.length) break; // Should not happen with 8-bit bytes and 8 channels

                const bitValue = byteBinary[i];
                const bitElement = createBitElement(bitValue);
                const channel = channels[i];

                // Position bit at the start of its channel, vertically centered
                // Channel is position:relative (or static), so bit is absolute to channel.
                // Or, if channel is flex/grid, can just append. Let's stick to absolute for consistency.
                bitElement.style.left = '0px';
                // Center bit vertically within the channel.
                // Channel's height is small, so this might make bits overlap if not careful with bit height.
                // Data-bit height is 20px, channel height is 8px (from CSS).
                // The bit is vertically centered in its channel, which might cause visual overflow if bit is taller than channel.
                // This is generally acceptable for this simulation.
                bitElement.style.top = '50%';
                bitElement.style.transform = 'translateY(-50%)'; // Vertically center bit.


                channel.appendChild(bitElement); // Append bit to its specific channel

                // Animate the bit
                setTimeout(() => {
                    bitElement.style.left = (channel.offsetWidth - bitElement.offsetWidth) + 'px';
                    bitElement.style.transition = `left ${bitAnimationDuration / 1000}s linear`;
                }, 50); // Small delay for rendering

                // Remove the bit after animation
                setTimeout(() => {
                    bitElement.remove();
                }, bitAnimationDuration + 100); // Add small buffer
            }

            charIndex++;
            // Schedule the next byte
            setTimeout(sendNextByte, delayBetweenBytes);
        }

        sendNextByte(); // Start sending the first byte
    }

    // Attach event listener to the parallel start button
    if (parallelStartButton) {
        parallelStartButton.addEventListener('click', startParallelTransfer);
    } else {
        console.error("Parallel start button not found!");
    }

});
