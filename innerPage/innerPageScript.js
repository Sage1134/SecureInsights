function test(event) {
    const textBox = document.getElementById('textBox');
    const sessionID = getLocalStorageItem("CrimeClusterSessionID");
    const username = getLocalStorageItem("CrimeClusterUsername")

    const isLocalConnection = window.location.hostname === '10.0.0.138';
    const socket = new WebSocket(isLocalConnection ? 'ws://10.0.0.138:1134' : 'ws://99.245.65.253:1134');

    socket.onopen = function (event) {
        socket.send("Test")
        socket.send(sessionID)
        socket.send(username)
    };

    socket.onmessage = function(event) {
        console.log(event.data)
        textBox.value = String(event.data);
        socket.close(1000, "Closing Connection");
    };
}

function getLocalStorageItem(key) {
    return localStorage.getItem(key);
}
