const anonymous = document.getElementById("anonymity");
const sessionID = getLocalStorageItem("sessionID");
const username = getLocalStorageItem("username")
const welcomeDisplay = document.getElementById("welcome");
const repDisplay = document.getElementById("rep");
const signOut = document.getElementById("signIn");

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('crimeForm').addEventListener('submit', function (event) {
        event.preventDefault();
        submit(event);
    });

    let username = localStorage.getItem("username");
    let sessionID = localStorage.getItem("sessionID");

    welcomeDisplay.hidden = true;
    repDisplay.hidden = true;

    if ((username != undefined || username != null) && (sessionID != undefined || sessionID != null)) {

        const isLocalConnection = window.location.hostname === '10.0.0.138';
        const socket = new WebSocket(isLocalConnection ? 'ws://10.0.0.138:1134' : 'ws://99.245.65.253:1134');

        socket.onopen = function (event) {
            socket.send("getRep");
            socket.send(sessionID);
            socket.send(username);
        };
    
        socket.onmessage = function(event) {
            if (event.data == "Session Invalid Or Expired") {
                alert("Session Invalid Or Expired");
                window.location.href = "../signIn/signIn.html";
            }
            else {
                signOut.removeAttribute("href")
                welcomeDisplay.hidden = false;
                repDisplay.hidden = false;

                welcomeDisplay.innerHTML = "Welcome, " + username + "!";
                repDisplay.innerHTML = "Your Reputation: " + event.data;

                signOut.innerHTML = "Log Out"
            socket.close(1000, "Closing Connection");
            };
        }
    }
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

function logOut(event) {
    if ((username == undefined)) {
        return;
    }

    const isLocalConnection = window.location.hostname === '10.0.0.138';
    const socket = new WebSocket(isLocalConnection ? 'ws://10.0.0.138:1134' : 'ws://99.245.65.253:1134');
    
    socket.onopen = function (event) {
        socket.send("logout");
        socket.send(sessionID);
        socket.send(username);
    };

    socket.onmessage = function(event) {
        if (event.data == "Session Invalid Or Expired") {
            alert("Session Invalid Or Expired");
            window.location.href = "../signIn/signIn.html";
        }
        else {
            localStorage.removeItem("username");
            localStorage.removeItem("sessionID");
            window.location.replace("../signIn/signIn.html")
        }
        socket.close(1000, "Closing Connection");   
    };
}

function getLocalStorageItem(key) {
    return localStorage.getItem(key);
}

function setLocalStorageItem(key, value) {
    localStorage.setItem(key, value);
}
