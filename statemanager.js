var stateManager = function () {
        var globalStateChangeCallback, mutexes = {},
            states = {},
            stateChangeCallbacks = {},
            operations = {
                on: function (state) {
                    return states[state];
                },
                toggle: function ( /* state1, state2, state3 etc...*/ ) {
                    iterateArray(arguments, function (state) {
                        states[state] ? operations.turnOff(state) : operations.turnOn(state);
                    });
                    return operations;
                },
                turnOff: function ( /* state1, state2, state3 etc...*/ ) {
                    iterateArray(arguments, function (state) {
                        if (!states[state]) { // if it's already off, leave it.
                            return;
                        }
                        states[state] = 0;
                        globalStateChangeCallback && globalStateChangeCallback(state, 0); // If we have a global change callback, invoke it
                        if (stateChangeCallbacks[state]) {
                            stateChangeCallbacks[state](0); // invoke the callback, passing in the new state
                        }
                    });

                    return operations;
                },
                turnOn: function ( /* state1, state2, state3 etc...*/ ) {
                    iterateArray(arguments, function (state) {
                        if (states[state]) { // if it's already on, leave it.
                            return;
                        }
                        var mutex;
                        if (mutexes[state]) {
                            for (mutex in mutexes[state]) {
                                if (!mutexes[state].hasOwnProperty(mutex)) {
                                    continue;
                                }

                                if (mutexes[state][mutex]) {
                                    operations.turnOff(mutex);
                                }
                            }
                        }
                        states[state] = 1;
                        globalStateChangeCallback && globalStateChangeCallback(state, 1); // If we have a global change callback, invoke it
                        if (stateChangeCallbacks[state]) {
                            stateChangeCallbacks[state](1); // invoke the callback, passing in the new state
                        }
			return operations;
                    });

                    return operations;
                },
                mutex: function ( /* state1, state2, state3 etc...*/ ) {
                    return setMutexes(arguments, 1);
                },
                removeMutex: function ( /* state1, state2, state3 etc...*/ ) {
                    return setMutexes(arguments, 0);
                },
                onStateChanged: function (state, callback) {
                    if (typeof state === "function") { // function was invoked as onStateChanged(function (state, value) ...)
                        // Set the function passed in as the globalStateChangeCallback
                        globalStateChangeCallback = state;
                        return;
                    }
                    stateChangeCallbacks[state] = callback;
                }
            },
            setMutexes = function (mutexesArray, value) {
                var i = 0,
                    j = mutexesArray.length;
                for (; i < j; ++i) {
                    iterateArray(mutexesArray, function (otherState) {
                        setMutex(mutexesArray[i], otherState, value);
                    }, i);
                }
                return operations;
            },
            setMutex = function (state1, state2, value) {
                makeSureMutexHolderExists(state1);
                makeSureMutexHolderExists(state2);

                mutexes[state1][state2] = value;
                mutexes[state2][state1] = value;
            }
        makeSureMutexHolderExists = function (state) {
            !mutexes[state] && (mutexes[state] = {});
        }, iterateArray = function (arr, callback, exceptIndex) {
            var i = 0,
                j = arr.length;
            for (; i < j; ++i) {
                if (i === exceptIndex) {
                    continue;
                }

                callback(arr[i], i);
            }
        };

        return operations;
    };
