// VARS
let _initialized = false;

// TIMER
const MIN_INIT_VALUE = 1;
const MAX_INIT_VALUE = 999;
const TICK_INTERVAL = 10; // milliseconds
const TIMER_LIMIT = 2 ** 32; // 4294967296
let timer = Math.floor(Math.random() * (MAX_INIT_VALUE - MIN_INIT_VALUE + 1)) + MIN_INIT_VALUE;

function startTimer() {
    console.log(`Timer started at: ${timer}`);

    setInterval(() => {
        timer = (timer + 1) % TIMER_LIMIT;
    }, TICK_INTERVAL);
}

// SEQUENCE NUMBER
const MAX_SEQUENCE_NUMBER = 2 ** 24;
getNextSequenceNumber = (() => {
    let sequenceNumber = 0;
    return () => {
        sequenceNumber = (sequenceNumber + 1) % MAX_SEQUENCE_NUMBER;
        return sequenceNumber - 1;
    }
})()

module.exports = {
    init: function () {
        _initialized = true;
        startTimer();
    },

    //--------------------------
    //getSequenceNumber: return the current sequence number + 1
    //--------------------------
    getSequenceNumber: function () {
        if (_initialized == false) {
            console.warn("Singleton method called before initialization. This should *not* happen. Continuing anyways...")
        }

        return getNextSequenceNumber();
    },

    //--------------------------
    //getTimestamp: return the current timer value
    //--------------------------
    getTimestamp: function () {
        if (_initialized == false) {
            console.warn("Singleton has not been initialized and timer has not started. Returning init value...")
        }
        console.log("Current Timer:", timer);
        return timer;
    }
}

    