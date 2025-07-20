import { assert } from 'chai';

/* eslint-disable valid-typeof, eqeqeq */
export class TestUtils {
    static verifyCallHappened(stub, eventNameCond, errorMsg, verifyFunc) {
        const calls = stub.getCalls();
        let verifiedOnce = false;
        for (let i = 0; i < calls.length; i++) {
            if (calls[i].args[1].eventName === eventNameCond) {
                try {
                    verifyFunc(calls[i].args[1].data);
                    verifiedOnce = true;
                } catch (ex) {
                    if (typeof ex == 'AssertionError') {
                        continue;
                    } else {
                        assert.isTrue(false, 'Exception thrown while verifyCallHappened for:' + eventNameCond + ': ' + ex.message);
                    }
                }
            }
        }
        assert.isTrue(verifiedOnce, 'verifyCallHappened did not succeed even once, data=' + errorMsg);
    }

    static verifyMsgToWorker(stub, msgName, verifyFunc) {
        const calls = stub.getCalls();
        let verifiedOnce = false;
        for (let i = 0; i < calls.length; i++) {
            if (calls[i].args[0] === msgName) {
                try {
                    verifyFunc(calls[i].args[1]);
                    verifiedOnce = true;
                } catch (ex) {
                    if (typeof ex == 'AssertionError') {
                        continue;
                    } else {
                        assert.isTrue(false, 'Exception thrown while verifyCallHappened for:' + msgName + ': ' + ex.message);
                    }
                }
            }
        }
        assert.isTrue(verifiedOnce, 'verifyMsgToWorker did not succeed even once');
    }

    static waitForNoAssertion(condition, timeToWaitInMS = 15000, retryIntervalInMS = 10) {
        return new Promise((resolve, reject) => {
            // If this time is exceeded we stop the wait and fail
            const stopTime = performance.now() + timeToWaitInMS;
            let lastError = null;

            const internalWaitFor = () => {
                if (performance.now() > stopTime) {
                    reject(new Error(`waiting for condition to meet has exceeded ${timeToWaitInMS} ms. user agent: ${navigator.userAgent}. Last error was: ${lastError}`));
                    return;
                }

                try {
                    condition();
                    resolve();
                } catch (error) {
                    lastError = error;
                    setTimeout(internalWaitFor, retryIntervalInMS);
                }
            };

            internalWaitFor();
        });
    }

    static findLatestEventByName(stub, eventName) {
        const calls = stub.getCalls();
        // Run in reverse to find the latest event of the requested name
        for (let i = calls.length - 1; i >= 0; i--) {
            if (calls[i].args[1].eventName === eventName) {
                return calls[i].args[1];
            }
        }
    }

    static findAllEventsByName(stub, eventName) {
        const calls = stub.getCalls();
        const eventsArray = [];
        // Run in reverse to find the latest event of the requested name
        for (let i = calls.length - 1; i >= 0; i--) {
            if (calls[i].args[1].eventName === eventName) {
                eventsArray.push(calls[i].args[1]);
            }
        }

        return eventsArray;
    }

    static findFirstEventByPredicate(stub, eventName, predicate) {
        const eventsArray = TestUtils.findAllEventsByName(stub, eventName);

        if (!eventsArray) {
            throw new Error(`No events of type ${eventName}`);
        }

        const foundEvent = eventsArray.find(predicate);

        if (!foundEvent) {
            throw new Error(`Unable to find ${eventName} event`);
        }

        return foundEvent;
    }

    static findAllStaticFields(stub) {
        const staticEvents = TestUtils.findAllEventsByName(stub, 'static_fields');

        if (!staticEvents) {
            throw new Error('Unable to find any static_fields');
        }

        const staticFieldsArray = [];
        // Run in reverse to find the latest event of the requested name
        for (let i = staticEvents.length - 1; i >= 0; i--) {
            staticFieldsArray.push(staticEvents[i].data);
        }

        return staticFieldsArray;
    }

    static findStaticFieldByName(stub, fieldName) {
        const staticEvents = TestUtils.findAllEventsByName(stub, 'static_fields');

        if (!staticEvents) {
            throw new Error('Unable to find any static_fields');
        }

        // Run in reverse to find the latest event of the requested name
        for (let i = staticEvents.length - 1; i >= 0; i--) {
            const staticFieldName = staticEvents[i].data[0];

            if (staticFieldName === fieldName) {
                return staticEvents[i];
            }
        }

        return null;
    }

    static waitForEvent(serverWorkerSendAsync, eventName, predicate) {
        // Make sure we processed the touch end event
        return TestUtils.waitForNoAssertion(() => {
            const event = TestUtils.findLatestEventByName(serverWorkerSendAsync, eventName);
            predicate(event);
        });
    }

    static wait(timeToWaitInMS) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve();
            }, timeToWaitInMS);
        });
    }

    static startMutation(callback, context) {
        const config = { attributes: true, childList: true, subtree: true };
        const observer = new MutationObserver(() => {
            callback();
        });
        observer.observe(context, config);
        return observer;
    }

    /**
     * Wait until a spy/stub is called a certain number of times before continuing.
     * @param {SinonSpy} spy - The Sinon spy/stub to monitor.
     * @param {number} callCount - Number of times the function should be called before resolving.
     * @param {number} timeout - Maximum time (in ms) to wait before rejecting.
     * @returns {Promise<void>}
     */
    static async waitForCall(spy, callCount = 1, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            const checkInterval = setInterval(() => {
                if (spy.callCount >= callCount) {
                    clearInterval(checkInterval);
                    resolve();
                }
                if (Date.now() - startTime > timeout) {
                    clearInterval(checkInterval);
                    reject(new Error(`[ERROR] Function was not called ${callCount} times within ${timeout}ms`));
                }
            }, 50);
        });
    }

    /**
     * Waits until a specific event with the given name is received in the stub's calls.
     * @param {Object} stub - The Sinon.js stub or similar object with a `getCalls()` method.
     * @param {string} eventName - The name of the event to wait for.
     * @param {number} timeToWaitInMS - Total time to wait before timing out (default: 1000ms).
     * @param {number} retryIntervalInMS - Interval in milliseconds to retry the condition (default: 200ms).
     * @returns {Promise<Object>} - The latest matching event.
     * @throws {Error} - If the event is not received within the timeout period.
     */
    static async waitUntilEventReceived(stub, eventName, timeToWaitInMS = 1000, retryIntervalInMS = 200) {
        const startTime = Date.now();

        while (Date.now() - startTime < timeToWaitInMS) {
            const event = TestUtils.findLatestEventByName(stub, eventName);

            if (event) {
                return event; // Return the event if found
            }

            await new Promise(resolve => setTimeout(resolve, retryIntervalInMS));
        }

        throw new Error(`Timeout: Event "${eventName}" not received within ${timeToWaitInMS} ms`);
    }
}

/* eslint-enable valid-typeof, eqeqeq */
