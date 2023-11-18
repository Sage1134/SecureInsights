function signIn(event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const isLocalConnection = window.location.hostname === '10.0.0.138';
    const socket = new WebSocket(isLocalConnection ? 'ws://10.0.0.138:1134' : 'ws://99.245.65.253:1134');

    socket.onopen = function (event) {
        socket.send("SignIn")
        socket.send(username);
        socket.send(password);
    };

    socket.onmessage = function(event) {
        if (event.data !== "Fail") {
            if (String(event.data).startsWith("redirect")) {
                socket.close(1000, "Closing Connection");

                url = String(event.data).split("|")[1]
                window.location.replace(url);
            }
            else {
                setLocalStorageItem("CrimeClusterSessionID", event.data)
                setLocalStorageItem("CrimeClusterUsername", username)
            }
        }
        else {
            alert("Invalid Username Or Password!")
            socket.close(1000, "Closing Connection");
        }

        document.getElementById('username').value = "";
        document.getElementById('password').value = "";
    };
}

function setLocalStorageItem(key, value) {
    localStorage.setItem(key, value);
}
