// eslint-disable-next-line no-unused-vars
function collectData() {
    const csid = document.getElementById('csid').value;
    const csidSource = document.getElementById('csidSource').value;
    const agentType = document.getElementById('agentType').value;
    const collectionMode = document.getElementById('collectionMode').value;
    const sessionHistory = document.getElementById('sessionHistory').value;

    window.location.href = 'https://localhost:9000/hybrid/hybrid.html' +
        '?csid=' + encodeURIComponent(csid) +
        '&agentType=' + encodeURIComponent(agentType) +
        '&collectionMode=' + encodeURIComponent(collectionMode) +
        '&sessionHistory=' + encodeURIComponent(sessionHistory) +
        '&csidSource=' + encodeURIComponent(csidSource);

    // Add your logic here to handle the collected data
}
