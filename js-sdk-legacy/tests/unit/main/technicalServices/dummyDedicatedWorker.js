// This is for the regular worker (IE for now...)
onmessage = function (e) {
    const workerResult = e.data;
    postMessage(workerResult);
};
