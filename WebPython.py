from pymongo import MongoClient
from dotenv import load_dotenv
import websockets
import os
import asyncio
import json
import hashlib
import uuid
sessionTokens = dict()

async def addSessionToken(username, token):
    sessionTokens[username] = token

    async def expireToken():
        await asyncio.sleep(86400)
        if username in sessionTokens.keys() and sessionTokens[username] == token:
            del sessionTokens[username]

    asyncio.create_task(expireToken())

load_dotenv("Vars.env")
uri = os.environ.get("MONGODB_URI")

client = MongoClient(uri)
database = client["CrimeTipper"]
collection = database["CrimeCluster"]

def getData(path):
    data = collection.find()

    for document in data:
        if document["_id"] == path[0]:
            data = document
            break
    else:
        return None

    for key in path:
        if key in data.keys():
            data = data[key]
        else:
            return None
        
    return data

def setData(path, data):
    newData = collection.find_one({"_id":path[0]})
    if newData != None:
        newData = dict(newData)
        dataUpdate = newData
        
        for key in enumerate(path):
            if key[0] != len(path) - 1:
                if key[1] in dataUpdate.keys():
                    if isinstance(dataUpdate[key[1]], dict):
                        dataUpdate = dataUpdate[key[1]]
                    else:
                        dataUpdate[key[1]] = {}
                        dataUpdate = dataUpdate[key[1]]
                else:
                    dataUpdate[key[1]] = {}
                    dataUpdate = dataUpdate[key[1]]
        dataUpdate[path[-1]] = data
        collection.find_one_and_replace({"_id":path[0]}, newData)

    else:
        newData = {}
        dataUpdate = newData
        
        for key in enumerate(path):
            dataUpdate[key[1]] = {}
            if (key[0] != len(path) - 1):
                dataUpdate = dataUpdate[key[1]]
        dataUpdate[path[-1]] = data

        newData["_id"] = path[0]
        collection.insert_one(newData)

def delData(path):
    data = collection.find()

    target = path.pop()

    for document in data:
        if len(path) != 0:
            if document["_id"] == path[0]:
                doc = document
                data = doc
                for key in path:
                    if key in data.keys():
                        data = data[key]
                if target in data.keys():
                    del data[target]
                
                collection.find_one_and_replace({"_id":path[0]}, doc)
                break
        else:
            collection.delete_one({"_id":target})


connectedClients = set()
ip = os.environ.get("ServerIP")
port = os.environ.get("Port")

async def newClientConnected(client_socket):
    try:
        connectedClients.add(client_socket)
        connectionPurpose = await client_socket.recv()
        if connectionPurpose == "Registration":
            await register(client_socket)
        elif connectionPurpose == "SignIn":
            await signIn(client_socket)
        elif connectionPurpose == "Submission":
            await submission(client_socket)
        elif connectionPurpose == "Refresh":
            await refresh(client_socket)
        elif connectionPurpose == "getInfo":
            await getInfo(client_socket)
        elif connectionPurpose == "logout":
            await logout(client_socket)
        elif connectionPurpose == "toggle":
            await toggle(client_socket)
        elif connectionPurpose == "RegistrationPublic":
            await registerPublic(client_socket)
        elif connectionPurpose == "plusRep":
            await plusRep(client_socket)
        elif connectionPurpose == "minusRep":
            await minusRep(client_socket)
        elif connectionPurpose == "getRep":
            await getRep(client_socket)
    except:
        pass


async def plusRep(client_socket):
    try:
        sessionID = await client_socket.recv()
        username = await client_socket.recv()
        caseID = await client_socket.recv()
        if username in sessionTokens.keys():
            if sessionTokens[username] == sessionID:
                if getData(["Credentials", username, "accountType"]) == "Enforcement":
                    case = getData(["crimeTips", caseID])
                    case = dict(case)
                    submitter = getData(["crimeTips", caseID, "submitter"])
                    if case["approvalStatus"] == "Unreviewed":
                        if submitter != None:
                            setData(["Credentials", submitter, "rep"], getData(["Credentials", submitter, "rep"]) + 1)
                            case["approvalStatus"] = "Approved"
                    elif case["approvalStatus"] == "Denied":
                        setData(["Credentials", submitter, "rep"], getData(["Credentials", submitter, "rep"]) + 2)
                        case["approvalStatus"] = "Approved"
                    setData(["crimeTips", caseID], case)
                else:
                    await client_socket.send("Session Invalid Or Expired")
            else:
                await client_socket.send("Session Invalid Or Expired")
        else:
            await client_socket.send("Session Invalid Or Expired")
    except:
        pass
    finally:
        connectedClients.remove(client_socket)

async def minusRep(client_socket):
    try:
        sessionID = await client_socket.recv()
        username = await client_socket.recv()
        caseID = await client_socket.recv()
        if username in sessionTokens.keys():
            if sessionTokens[username] == sessionID:
                if getData(["Credentials", username, "accountType"]) == "Enforcement":
                    case = getData(["crimeTips", caseID])
                    case = dict(case)
                    submitter = getData(["crimeTips", caseID, "submitter"])
                    if case["approvalStatus"] == "Unreviewed":
                        if submitter != None:
                            setData(["Credentials", submitter, "rep"], getData(["Credentials", submitter, "rep"]) - 1)
                            case["approvalStatus"] = "Denied"
                    elif case["approvalStatus"] == "Approved":
                        setData(["Credentials", submitter, "rep"], getData(["Credentials", submitter, "rep"]) - 2)
                        case["approvalStatus"] = "Denied"
                    setData(["crimeTips", caseID], case)
                else:
                    await client_socket.send("Session Invalid Or Expired")
            else:
                await client_socket.send("Session Invalid Or Expired")
        else:
            await client_socket.send("Session Invalid Or Expired")
    except:
        pass
    finally:
        connectedClients.remove(client_socket)

async def getRep(client_socket):
    try:
        sessionID = await client_socket.recv()
        username = await client_socket.recv()
        if username in sessionTokens.keys():
            if sessionTokens[username] == sessionID:
                await client_socket.send(str(getData(["Credentials", username, "rep"])))
            else:
                await client_socket.send("Session Invalid Or Expired")
        else:
            await client_socket.send("Session Invalid Or Expired")
    except:
        pass
    finally:
        connectedClients.remove(client_socket)


async def toggle(client_socket):
    try:
        sessionID = await client_socket.recv()
        username = await client_socket.recv()
        toDo = await client_socket.recv()
        caseID = await client_socket.recv()

        if username in sessionTokens.keys():
            if sessionTokens[username] == sessionID:
                if getData(["Credentials", username, "accountType"]) == "Enforcement":
                    case = getData(["crimeTips", caseID])
                    case = dict(case)
                    if toDo == "Close Case":
                        case["caseStatus"] = "closed"
                    else:
                        case["caseStatus"] = "open"
                    setData(["crimeTips", caseID], case)
                else:
                    await client_socket.send("Session Invalid Or Expired")
                await client_socket.send("Success")
            else:
                await client_socket.send("Session Invalid Or Expired")
        else:
            await client_socket.send("Session Invalid Or Expired")
    except:
        pass
    finally:
        connectedClients.remove(client_socket)

async def logout(client_socket):
    try:
        sessionID = await client_socket.recv()
        username = await client_socket.recv()

        if username in sessionTokens.keys():
            if sessionTokens[username] == sessionID:
                del sessionTokens[username]
                await client_socket.send("Logout Success")
            else:
                await client_socket.send("Session Invalid Or Expired")
        else:
            await client_socket.send("Session Invalid Or Expired")
    except:
        pass
    finally:
        connectedClients.remove(client_socket)


async def register(client_socket):
    try:
        username = await client_socket.recv()
        password = await client_socket.recv()
        department = await client_socket.recv()

        if getData(["Credentials", username]) == None:
            if getData(["depIDs", department]) != None:
                hash_object = hashlib.sha256()
                hash_object.update(password.encode())
                hashed_password = hash_object.hexdigest()
                setData(["Credentials", username, "password"], hashed_password)
                setData(["Credentials", username, "accountType"], "Enforcement")
                setData(["Credentials", username, "rep"], 0)
                await client_socket.send("Registration Successful! Please Sign In.")
            else:
                await client_socket.send("Invalid Department ID!")
        else:
            await client_socket.send("Username Already Taken!")
    except:
        pass
    finally:
        connectedClients.remove(client_socket)

async def registerPublic(client_socket):
    try:
        username = await client_socket.recv()
        password = await client_socket.recv()

        if getData(["Credentials", username]) == None:
            hash_object = hashlib.sha256()
            hash_object.update(password.encode())
            hashed_password = hash_object.hexdigest()
            setData(["Credentials", username, "password"], hashed_password)
            setData(["Credentials", username, "accountType"], "Public")
            setData(["Credentials", username, "rep"], 0)
            await client_socket.send("Registration Successful! Please Sign In.")
        else:
            await client_socket.send("Username Already Taken!")
    except:
        pass
    finally:
        connectedClients.remove(client_socket)

async def signIn(client_socket):
    try:
        username = await client_socket.recv()
        password = await client_socket.recv()

        hash_object = hashlib.sha256()
        hash_object.update(password.encode())
        hashed_password = hash_object.hexdigest()
        
        if getData(["Credentials", username, "password"]) == hashed_password:
            sessionToken = str(uuid.uuid4())
            await addSessionToken(username, sessionToken)
            await client_socket.send(sessionToken)

            if getData(["Credentials", username, "accountType"]) == "Enforcement":
                await client_socket.send("redirect|../innerPage/innerPage.html")
            else:
                await client_socket.send("redirect|../tipForm/tipForm.html")
        else:
            await client_socket.send("Fail")
    except:
        pass
    finally:
        connectedClients.remove(client_socket)

async def submission(client_socket):
    try:
        data = await client_socket.recv()
        username = await client_socket.recv()
        sessionID = await client_socket.recv()
        valid = False

        if username in sessionTokens.keys():
            if sessionTokens[username] == sessionID:
                reputation = getData(["Credentials", username, "rep"])
                valid = True
            else:
                reputation = 0
        else:
            reputation = 0
        
        data = json.loads(data)
        caseID = str(uuid.uuid4())

        while getData(["crimeTips", caseID]) != None:
             caseID = uuid.uuid4()
        
        data["caseID"] = caseID
        data["caseStatus"] = "open"
        data["rep"] = reputation
        data["approvalStatus"] = "Unreviewed"

        if valid:
            data["submitter"] = username

        setData(["crimeTips", caseID], data)

    except:
        pass
    finally:
        connectedClients.remove(client_socket)

async def refresh(client_socket):
    try:
        sessionID = await client_socket.recv()
        username = await client_socket.recv()

        if username in sessionTokens.keys():
            if sessionTokens[username] == sessionID:
                if getData(["Credentials", username, "accountType"]) == "Enforcement":
                    data = getData(["crimeTips"])
                    data = json.dumps(data)
                    await client_socket.send(data)
                else:
                    await client_socket.send("Session Invalid Or Expired")
            else:
                await client_socket.send("Session Invalid Or Expired")
        else:
            await client_socket.send("Session Invalid Or Expired")
    except:
        pass
    finally:
        connectedClients.remove(client_socket)

async def getInfo(client_socket):
    try:
        sessionID = await client_socket.recv()
        username = await client_socket.recv()
        caseID = await client_socket.recv()

        if username in sessionTokens.keys():
            if sessionTokens[username] == sessionID:
                if getData(["Credentials", username, "accountType"]) == "Enforcement":
                    data = getData(["crimeTips", caseID])
                    data = json.dumps(data)
                    await client_socket.send(data)
                else:
                    await client_socket.send("Session Invalid Or Expired")
            else:
                await client_socket.send("Session Invalid Or Expired")
        else:
            await client_socket.send("Session Invalid Or Expired")
    except:
        pass
    finally:
        connectedClients.remove(client_socket)

async def startServer():
    print("Server Started")
    await websockets.serve(newClientConnected, ip, port)
    
event_loop = asyncio.get_event_loop()
event_loop.run_until_complete(startServer())
event_loop.run_forever()