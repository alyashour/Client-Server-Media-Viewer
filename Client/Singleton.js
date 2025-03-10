// VARS
let _initialized = false; // Flag to check if the Singleton has been initialized

// TIMER
const MIN_INIT_VALUE = 1; // Minimum initial value for the timer
const MAX_INIT_VALUE = 999; // Maximum initial value for the timer
const TICK_INTERVAL = 10; // Timer tick interval in milliseconds
const TIMER_LIMIT = 2 ** 32; // Maximum value for the timer before it resets
let timer = Math.floor(Math.random() * (MAX_INIT_VALUE - MIN_INIT_VALUE + 1)) + MIN_INIT_VALUE; // Initialize timer with a random value

/**
 * Starts the timer and increments it at each tick interval.
 */
function startTimer() {
    console.log(`Timer started at: ${timer}`);

    setInterval(() => {
        timer = (timer + 1) % TIMER_LIMIT; // Increment timer and reset if it exceeds TIMER_LIMIT
    }, TICK_INTERVAL);
}

// SEQUENCE NUMBER
const MAX_SEQUENCE_NUMBER = 2 ** 24; // Maximum value for the sequence number before it resets

/**
 * Generates the next sequence number in a cyclic manner.
 */
getNextSequenceNumber = (() => {
    let sequenceNumber = 0; // Initialize sequence number
    return () => {
        sequenceNumber = (sequenceNumber + 1) % MAX_SEQUENCE_NUMBER; // Increment sequence number and reset if it exceeds MAX_SEQUENCE_NUMBER
        return sequenceNumber - 1; // Return the current sequence number
    }
})()

module.exports = {
    /**
     * Initializes the Singleton, starts the timer, and sets up the buffer.
     */
    init: function () {
        _initialized = true;
        startTimer();
        this.buffer = []; // Initialize buffer to store received packets
    },

    /**
     * Receives a packet and stores it in the buffer.
     * @param {Object} headerInfo - The header information of the packet.
     * @param {Object} packet - The packet data.
     */
    receivePacket: function (
        headerInfo,
        packet
    ) {
        const data = {
            ...headerInfo,
            packet
        }

        this.buffer.push(data); // Add the packet to the buffer
        this.buffer.sort((a, b) => a.sequenceNumber - b.sequenceNumber); // Sort the buffer based on sequence numbers
    },

    //--------------------------
    //getSequenceNumber: return the current sequence number + 1
    //--------------------------
    /**
     * Returns the next sequence number.
     * @returns {number} The next sequence number.
     */
    getSequenceNumber: function () {
        if (_initialized == false) {
            console.warn("Singleton method called before initialization. This should *not* happen. Continuing anyways...")
        }

        return getNextSequenceNumber();
    },

    //--------------------------
    //getTimestamp: return the current timer value
    //--------------------------
    /**
     * Returns the current timer value.
     * @returns {number} The current timer value.
     */
    getTimestamp: function () {
        if (_initialized == false) {
            console.warn("Singleton has not been initialized and timer has not started. Returning init value...")
        }

        return timer;
    }
}

