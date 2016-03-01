#!/usr/bin/env python
# coding: utf-8
# Copyright 2013 Abram Hindle
# 
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# 
#     http://www.apache.org/licenses/LICENSE-2.0
# 
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#
# You can start this by executing it in python:
# python server.py
#
# remember to:
#     pip install flask


import flask
from flask import Flask, request, redirect, Response
import json
app = Flask(__name__)
app.debug = True

# An example world
# {
#    'a':{'x':1, 'y':2},
#    'b':{'x':2, 'y':3}
# }

allTrackers = {}

class World:
    def __init__(self):
        self.clear()
        
    def update(self, entity, key, value):
        entry = self.space.get(entity,dict())
        entry[key] = value
        self.space[entity] = entry

    def set(self, entity, data):
        self.space[entity] = data

    def clear(self):
        self.space = dict()

    def get(self, entity):
        return self.space.get(entity,dict())

    def delete(self, entity):
        if entity in self.space:
            del self.space[entity]
    
    def world(self):
        return self.space

# you can test your webservice from the commandline
# curl -v   -H "Content-Type: appication/json" -X PUT http://127.0.0.1:5000/entity/X -d '{"x":1,"y":1}' 

myWorld = World()          

# I give this to you, this is how you get the raw body/data portion of a post in flask
# this should come with flask but whatever, it's not my project.
def flask_post_json():
    '''Ah the joys of frameworks! They do so much work for you
       that they get in the way of sane operation!'''
    if (request.json != None):
        return request.json
    elif (request.data != None and request.data != ''):
        return json.loads(request.data)
    else:
        return json.loads(request.form.keys()[0])

@app.route("/")
def hello():
    """Redirect to homepage"""
    return redirect('/static/index.html')

@app.route("/entity/<entity>", methods=['POST','PUT','DELETE'])
def update(entity):
    """update the entities via this interface"""
    if request.method == 'PUT':
        data = flask_post_json()
        myWorld.set(entity, data)
        return Response(json.dumps(myWorld.get(entity)))
    elif request.method == 'POST':
        data = flask_post_json()
        myWorld.set(entity, data)
        return Response(json.dumps(myWorld.get(entity)))
    elif request.method == 'DELETE':
        myWorld.delete(entity)
        return Response(json.dumps(dict()))

nextUnique = 1
@app.route("/unique")
def get_unique():
    global nextUnique
    d = {'id': str(nextUnique)}
    allTrackers[str(nextUnique)] = []
    nextUnique += 1
    return Response(json.dumps(d))

@app.route("/delta/<client_id>")
def get_delta(client_id):
    if client_id not in allTrackers:
        return Response(json.dumps(dict())), 404
    data = json.dumps(allTrackers[client_id])
    allTrackers[client_id] = []
    return Response(data)

@app.route("/world", methods=['POST','GET'])    
def world():
    """Return JSON of the world"""
    if request.method == 'GET':
        return Response(json.dumps(myWorld.world()))
    elif request.method == 'POST':
        data = flask_post_json()
        # TODO: do something with data
        return Response(json.dumps(myWorld.world()))

@app.route("/entity/<entity_id>")
def get_entity(entity_id):
    """Return JSON for the entity"""
    entity = myWorld.get(entity_id)
    code = 200
    return Response(json.dumps(entity)), code

@app.route("/clear", methods=['POST','GET'])
def clear():
    """Clear the World"""
    myWorld.clear()
    return Response(json.dumps(myWorld.world()))

if __name__ == "__main__":
    app.run()
