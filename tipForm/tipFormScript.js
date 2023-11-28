const anonymous = document.getElementById("anonymity");

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('crimeForm').addEventListener('submit', function (event) {
        event.preventDefault();
        submit(event);
    });
});

function submit(event) {
    event.preventDefault();

    const incidentType = document.getElementById("incidentType").value;
    const dateAndTime = document.getElementById("dateTime").value;
    const location = document.getElementById("location").value;
    const description = document.getElementById("description").value;
    const contactInfo = document.getElementById("userContact").value;
    
    const data = {
        incidentType: incidentType,
        dateAndTime: dateAndTime,
        location: location,
        description: description,
        contactInfo: contactInfo,
    };

    if (anonymous.checked) {
        data.contactInfo = "Anonymous";
    }

    const isLocalConnection = window.location.hostname === '10.0.0.138';
    const socket = new WebSocket(isLocalConnection ? 'ws://10.0.0.138:1134' : 'ws://99.245.65.253:1134');

    socket.onopen = function (event) {
        socket.send("Submission")
        socket.send(JSON.stringify(data));

        let storedValue = localStorage.getItem("username");
        if (storedValue != undefined || storedValue != null) {
            if (anonymous.checked == false) {
                socket.send(getLocalStorageItem("username"))
                socket.send(getLocalStorageItem("sessionID"))
            }
            else {
                socket.send("Anonymous");
                socket.send("InvalidSessionID");
            }
        }
        else {
            socket.send("Anonymous");
            socket.send("InvalidSessionID");
        }

        alert ("Tip Submitted. Thank You!")
        socket.close(1000, "Closing Connection");
    };
}

function clearContact() {
    const contactBox = document.getElementById("userContact");
    if (anonymous.checked) {
        contactBox.value = "";
    }
}

function getLocalStorageItem(key) {
    return localStorage.getItem(key);
}

function setLocalStorageItem(key, value) {
    localStorage.setItem(key, value);
}
