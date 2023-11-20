const openCases = document.getElementById("openCases");
const closedCases = document.getElementById("openCases");

const incidentType = document.getElementById("incidentType");
const caseIDBox = document.getElementById("caseID");
const time = document.getElementById("time");
const loc = document.getElementById("location");
const contact = document.getElementById("contact");
const description = document.getElementById("description");
const caseStatusBox = document.getElementById("status");

const sessionID = getLocalStorageItem("sessionID");
const username = getLocalStorageItem("username")


document.addEventListener("DOMContentLoaded", function() {
    refreshData();
})

function refreshData() {
    const isLocalConnection = window.location.hostname === '10.0.0.138';
    const socket = new WebSocket(isLocalConnection ? 'ws://10.0.0.138:1134' : 'ws://99.245.65.253:1134');

    socket.onopen = function (event) {
        socket.send("Refresh");
        socket.send(sessionID);
        socket.send(username);
    };

    socket.onmessage = function(event) {
        openCases.innerHTML = "";
        closedCases.innerHTML = "";

        if (event.data == "Session Invalid Or Expired") {
            alert("Session Invalid Or Expired");
            window.location.href = "../signIn/signIn.html";
        }
        else {
            var data = JSON.parse(event.data);
            for (key in data) {
                caseData = data[key];
    
                var newButton = document.createElement("button");
                newButton.style.paddingTop = "0.5vh";
                newButton.style.paddingBottom = "0.5vh"
                newButton.style.width = "10vw";
                newButton.innerHTML = caseData["incidentType"];
                newButton.id = caseData["caseID"];
                newButton.addEventListener("click", function() {
                    displayInformation(newButton.id);
                });
    
                if (caseData["caseStatus"] == "open") {
                    openCases.appendChild(newButton);
                }
            }
        }
    };
}

function displayInformation(caseID) {
    const isLocalConnection = window.location.hostname === '10.0.0.138';
    const socket = new WebSocket(isLocalConnection ? 'ws://10.0.0.138:1134' : 'ws://99.245.65.253:1134');

    socket.onopen = function (event) {
        socket.send("getInfo");
        socket.send(sessionID);
        socket.send(username);
        socket.send(caseID)
    };

    socket.onmessage = function(event) {
        if (event.data == "Session Invalid Or Expired") {
            alert("Session Invalid Or Expired");
            window.location.href = "../signIn/signIn.html";
        }
        else {
            var data = JSON.parse(event.data);

            incidentType.value = data["incidentType"];
            caseIDBox.value = data["caseID"];
            time.value = data["dateAndTime"];
            loc.value = data["location"];
            contact.value = data["contactInfo"];
            description.value = data["description"];
            caseStatusBox.value = data["caseStatus"];

        }
    };
}

function getLocalStorageItem(key) {
    return localStorage.getItem(key);
}
