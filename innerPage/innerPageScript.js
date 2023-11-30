const openCases = document.getElementById("openCases");
const closedCases = document.getElementById("closedCases");

const incidentType = document.getElementById("incidentType");
const caseIDBox = document.getElementById("caseID");
const time = document.getElementById("time");
const loc = document.getElementById("location");
const contact = document.getElementById("contact");
const description = document.getElementById("description");
const caseStatusBox = document.getElementById("status");
const approvalBox = document.getElementById("caseApproval");
const welcome = document.getElementById("welcome");
const toggleCase = document.getElementById("toggleCase");
const logOut = document.getElementById("logout");
const upRep = document.getElementById("plusRep");
const downRep = document.getElementById("minusRep");

const sessionID = getLocalStorageItem("sessionID");
const username = getLocalStorageItem("username")


document.addEventListener("DOMContentLoaded", function() {
    refreshData();
    welcome.innerHTML = "Welcome, " + username + "!";
    localStorage.removeItem("caseID");
    toggleCase.hidden = true;
    upRep.hidden = true;
    downRep.hidden = true;
})

function refreshData() {
    const isLocalConnection = window.location.hostname === '10.0.0.138';
    const socket = new WebSocket(isLocalConnection ? 'ws://10.0.0.138:1134' : 'ws://99.245.65.253:1134');

    socket.onopen = function (event) {
        socket.send("Refresh");
        socket.send(sessionID);
        socket.send(username);
    };

    socket.onmessage = function (event) {
        openCases.innerHTML = "";
        closedCases.innerHTML = "";
    
        if (event.data == "Session Invalid Or Expired") {
            alert("Session Invalid Or Expired");
            window.location.href = "../signIn/signIn.html";
        } else {
            var data = JSON.parse(event.data);
    
            var buttons = [];
    
            for (key in data) {
                (function () {
                    var caseData = data[key];
    
                    var newButton = document.createElement("button");
                    newButton.style.paddingTop = "0.5vh";
                    newButton.style.paddingBottom = "0.5vh";
                    newButton.style.width = "10vw";
                    newButton.innerHTML = caseData["incidentType"];
                    newButton.id = caseData["caseID"];
    
                    if (caseData["caseID"] == getLocalStorageItem("caseID")) {
                        newButton.style.color = "rgb(50, 50, 160)";
                    }
    
                    newButton.addEventListener("click", function () {
                        displayInformation(newButton.id);
                    });
    
                    buttons.push(newButton);
                })();
            }
    
            buttons.sort(function (a, b) {
                var aValue = data[a.id]["rep"];
                var bValue = data[b.id]["rep"];
                return bValue - aValue;
            });
    
            buttons.forEach(function (button) {
                if (data[button.id]["caseStatus"] == "open") {
                    openCases.appendChild(button);
                } else {
                    closedCases.appendChild(button);
                }
            });
        }
        socket.close(1000, "Closing Connection");
    };
    
}

function displayInformation(caseID) {
    const isLocalConnection = window.location.hostname === '10.0.0.138';
    const socket = new WebSocket(isLocalConnection ? 'ws://10.0.0.138:1134' : 'ws://99.245.65.253:1134');

    socket.onopen = function (event) {
        socket.send("getInfo");
        socket.send(sessionID);
        socket.send(username);
        socket.send(caseID);
    };

    socket.onmessage = function(event) {
        if (event.data == "Session Invalid Or Expired") {
            alert("Session Invalid Or Expired");
            window.location.href = "../signIn/signIn.html";
        }
        else {
            refreshData();
            toggleCase.hidden = false;
            var data = JSON.parse(event.data);
            setLocalStorageItem("caseID", data["caseID"]);

            incidentType.value = data["incidentType"];
            caseIDBox.value = data["caseID"];
            time.value = data["dateAndTime"];
            loc.value = data["location"];
            contact.value = data["contactInfo"];
            description.value = data["description"];
            caseStatusBox.value = data["caseStatus"];
            approvalBox.value = data["approvalStatus"];
            if (data["caseStatus"] == "open") {
                toggleCase.innerHTML = "Close Case";
            }
            else {
                toggleCase.innerHTML = "Reopen Case";
            }

            if (data["submitter"] != undefined || data["submitter"] != null) {
                upRep.hidden = false;
                downRep.hidden = false;
            }
            else {
                upRep.hidden = true;
                downRep.hidden = true;
            }
        }
        socket.close(1000, "Closing Connection");
    };
}

function logout(event) {
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

function toggleCaseStatus(event) {
    const isLocalConnection = window.location.hostname === '10.0.0.138';
    const socket = new WebSocket(isLocalConnection ? 'ws://10.0.0.138:1134' : 'ws://99.245.65.253:1134');

    socket.onopen = function (event) {
        socket.send("toggle");
        socket.send(sessionID);
        socket.send(username);
        socket.send(toggleCase.innerHTML);
        socket.send(getLocalStorageItem("caseID"));
    };

    socket.onmessage = function(event) {
        if (event.data == "Session Invalid Or Expired") {
            alert("Session Invalid Or Expired");
            window.location.href = "../signIn/signIn.html";
        }
        else {
            refreshData()
            displayInformation(getLocalStorageItem("caseID"))
            if (toggleCase.innerHTML == "Close Case") {
                toggleCase.innerHTML = "Reopen Case";
            }
            else {
                toggleCase.innerHTML = "Close Case";
            }
        }
        socket.close(1000, "Closing Connection");    
    };
}

function plusRep(event) {
    const isLocalConnection = window.location.hostname === '10.0.0.138';
    const socket = new WebSocket(isLocalConnection ? 'ws://10.0.0.138:1134' : 'ws://99.245.65.253:1134');

    socket.onopen = function (event) {
        socket.send("plusRep");
        socket.send(sessionID);
        socket.send(username);
        socket.send(getLocalStorageItem("caseID"));
    };

    socket.onmessage = function(event) {
        if (event.data == "Session Invalid Or Expired") {
            alert("Session Invalid Or Expired");
            window.location.href = "../signIn/signIn.html";
        }
        refreshData();
        socket.close(1000, "Closing Connection");    
    };
}

function minusRep(event) {
    const isLocalConnection = window.location.hostname === '10.0.0.138';
    const socket = new WebSocket(isLocalConnection ? 'ws://10.0.0.138:1134' : 'ws://99.245.65.253:1134');

    socket.onopen = function (event) {
        socket.send("minusRep");
        socket.send(sessionID);
        socket.send(username);
        socket.send(getLocalStorageItem("caseID"));
    };

    socket.onmessage = function(event) {
        if (event.data == "Session Invalid Or Expired") {
            alert("Session Invalid Or Expired");
            window.location.href = "../signIn/signIn.html";
        }
        refreshData();
        socket.close(1000, "Closing Connection");    
    };
}
function getLocalStorageItem(key) {
    return localStorage.getItem(key);
}

function setLocalStorageItem(key, value) {
    localStorage.setItem(key, value);
}
