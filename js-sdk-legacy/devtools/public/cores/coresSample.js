function getCorsResource() {
	let xhr = new XMLHttpRequest();
    let url = document.getElementById('url').value;

    xhr.open('GET', url, true);
    xhr.setRequestHeader('Content-Type', 'text/plain; charset=utf-8');
    //xhr.withCredentials = true;

    xhr.onreadystatechange = function (e) {
    	if (xhr.readyState === XMLHttpRequest.DONE) {
	        if(xhr.status === 200) {
	            document.getElementById('txtArea').value = xhr.responseText;
	        }
	        else {
	            //TODO: log
	            alert('Failed to send data to server: status = ' + xhr.status
	                + ';' + xhr.statusText);
	        }
    	}
    };
    xhr.send(null);
}