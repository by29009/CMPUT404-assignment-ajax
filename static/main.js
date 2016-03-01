localWorld = []; //at most 100 entities that we've drawn locally
world = {}; //all the things to draw

//XXX: TODO Make this prettier!
function drawCircle(context,entity) {
	with(context) {
		beginPath();              
		lineWidth = 3;
		var x = entity["x"];
		var y = entity["y"];
		//moveTo(x,y);
		fillStyle = entity["colour"];
		strokeStyle = fillStyle;
		arc(x, y, (entity["radius"])?entity["radius"]:50, 0, 2.0 * Math.PI, false);  
		stroke();                                
	}
}

function prepEntity(entity) {
	if (!entity["colour"]) {
		entity["colour"] = "#FF0000";
	}
	if (!entity["radius"]) {
		entity["radius"] = 50;
	}
	return entity;
}

function clearFrame() {
	with(context) {
	moveTo(0,0);
	fillStyle = "#000";
	fillRect(0,0,W,H);
	}

}

function drawCard(num, x, y, isBig)
{
	var img = document.getElementById('img' + num);
	var w = 34;
	var h = 50;
	if(isBig)
	{
		w *= 3;
		h *= 3;
	}
	context.drawImage(img, x - w/2, y - h/2, w, h);
}

// This actually draws the frame
function renderFrame() {
	clearFrame();
	for (var key in world) {
		var entity = world[key];
		if(entity.etype == 'card')
		{
			drawCard(entity.num, entity.x, entity.y, entity.big);
		}
		else if(entity.etype == 'down')
		{
			var img = document.getElementById("enterImage");
    		context.drawImage(img, entity.x - 52, entity.y - 52);
		}
		else if(entity.etype == 'up')
		{
		}
	}
}

var drawNext = true;

// Signals that there's something to be drawn
function drawNextFrame() {
	drawNext = true;
}

// This optionally draws the frame, call this if you're not sure if you should update the canvas
function drawFrame() {
	if (drawNext) {
		renderFrame();
		drawNext = false;
	}
}

function pushEntity(entity, data)
{
	$.ajax({
    url: '/entity/' + entity,
    type: 'PUT',
    data: JSON.stringify(data),
    contentType: "application/json",
    dataType: "json",
    success: function(result) {}
	});
}

function deleteEntity(entity)
{
	$.ajax({
    url: '/entity/' + entity,
    type: 'DELETE',
    dataType: "json",
    success: function(result) {}
	});
}

function addEntity(entity, data) {
	//Adjust world
	world[entity] = data;

	//signal to re-render
	drawNextFrame();

	//PUT the entity
	pushEntity(entity, data);

	//Adjust local world
	localWorld.push([entity, data]);
	if(localWorld.length > 100)
	{
		var deleteID = localWorld.shift()[0];
		delete world[deleteID];

		//DELETE oldest entity
		deleteEntity(deleteID);
	}
}

var counter = 1;
function addEntityWithoutName(data) {
	if(clientID === null)
		return;
	var name = clientID + "x"+(counter++);
	addEntity(name,data);
}

var clientID = null;

function initialPull()
{
	$.getJSON("/unique", function(unique)
	{
		clientID = unique.id;
	});
	$.getJSON("/world", function(initialWorld)
	{
		$.each( initialWorld, function( entity, data ) {world[entity] = data;});
	});
}

function pullDelta()
{
	$.getJSON("/delta/" + clientID, function(deltas)
	{
		var changed = false;
		$.each( deltas.modified, function( entity, data ) {world[entity] = data; changed = true;});
		$.each( deltas.deleted, function( index, entity ) {delete world[entity]; changed = true;});
		if(changed)
			drawNextFrame();
	});
}

function update() {
	pullDelta();
	drawFrame();
}

initialPull();

// 30 frames per second
setInterval( update, 1000/30.0);