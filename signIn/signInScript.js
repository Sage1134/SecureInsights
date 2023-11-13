function signIn(event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const socket = new WebSocket('ws://10.0.0.138:1134')

    socket.onopen = function (event) {
        socket.send("SignIn")
        socket.send(username);
        socket.send(password);
    };

    socket.onmessage = function(event) {
        if (event.data !== "Fail") {
            alert("Login Success")
            setLocalStorageItem("CrimeClusterSessionID", event.data)
        }
        else {
            alert("Login Fail")
        }

        socket.close(1000, "Closing Connection");
        document.getElementById('username').value = "";
        document.getElementById('password').value = "";
    };
}

function setLocalStorageItem(key, value) {
    localStorage.setItem(key, value);
}
