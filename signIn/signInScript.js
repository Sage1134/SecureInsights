function signIn(event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const socket = new WebSocket('99.245.65.253:1134')

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

    };
}

function setLocalStorageItem(key, value) {
    localStorage.setItem(key, value);
}
