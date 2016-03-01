localWorld = [];
world = {};

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

// This actually draws the frame
function renderFrame() {
	clearFrame();
	for (var key in world) {
		var entity = world[key];
		drawCircle(context,prepEntity(entity));
	}
}

var drawNext = true;

// Signals that there's something to be drawn
function drawNextFrame() {
	drawNext = true;
}

// This optionally draws the frame, call this if you're not sure if you should update
// the canvas
function drawFrame() {
	if (drawNext) {
		renderFrame();
		drawNext = false;
	}
}

// This is unpleasent, canvas clicks are not handled well
// So use this code, it works well on multitouch devices as well.

function getPosition(e) {
	if ( e.targetTouches && e.targetTouches.length > 0) {
		var touch = e.targetTouches[0];
		var x = touch.pageX  - canvas.offsetLeft;
		var y = touch.pageY  - canvas.offsetTop;
		return [x,y];
	} else {
		var rect = e.target.getBoundingClientRect();
		var x = e.offsetX || e.pageX - rect.left - window.scrollX;
		var y = e.offsetY || e.pageY - rect.top  - window.scrollY;
		var x = e.pageX  - canvas.offsetLeft;
		var y = e.pageY  - canvas.offsetTop;
		return [x,y];
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

	drawNextFrame(); // (but should we?)

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
	//var name = "X"+Math.floor((Math.random()*100)+1);
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

	});
}

function update() {
	//XXX: TODO Get the world from the webservice using a XMLHTTPRequest
	//pullDelta();
	drawFrame();
}

initialPull();

// 30 frames per second
setInterval( update, 1000/30.0);