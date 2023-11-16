from pymongo import MongoClient
from dotenv import load_dotenv
import websockets
import os
import asyncio
import json
import hashlib
import uuid

sessionTokens = dict()

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
    except:
        pass

async def register(client_socket):
    try:
        username = await client_socket.recv()
        password = await client_socket.recv()
        department = await client_socket.recv()

        if getData(["Credentials", username]) == None:
            if getData(["depIDs"]) != None:
                hash_object = hashlib.sha256()
                hash_object.update(password.encode())
                hashed_password = hash_object.hexdigest()
                setData(["Credentials", username], hashed_password)
                await client_socket.send("Registration Successful! Please Sign In.")
            else:
                await client_socket.send("Invalid Department ID!")
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
        
        if getData(["Credentials", username]) == hashed_password:
            sessionToken = uuid.uuid4()

            while sessionToken in sessionTokens:
                sessionToken = uuid.uuid4()
            
            sessionTokens[username] = str(sessionToken)

            await client_socket.send(str(sessionToken))
        else:
            await client_socket.send("Fail")
    except:
        pass
    finally:
        connectedClients.remove(client_socket)

async def submission(client_socket):
    try:
        data = await client_socket.recv()
        data = json.loads(data)

        caseID = str(uuid.uuid4())

        while getData(["crimeTips", caseID]) != None:
            caseID = uuid.uuid4()
        
        data["caseID"] = caseID

        setData(["crimeTips", caseID], data)

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