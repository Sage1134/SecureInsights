function register(event) {
    event.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const confirm = document.getElementById("confirm").value;
    if (password === confirm) {
        const socket = new WebSocket('ws://99.245.65.253:1134')

        socket.onopen = function (event) {
            socket.send("Registration")

            socket.send(username);
            socket.send(password);
        };

        socket.onmessage = function(event) {
            alert(event.data)
            socket.close(1000, "Closing Connection");
        };

    }
    else {
        alert("Passwords do not match!")
    }
}