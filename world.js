

importScripts("vendors/box2d/Box2d.min.js");

// Nice aliases
var   b2Vec2 = Box2D.Common.Math.b2Vec2
	 , b2BodyDef = Box2D.Dynamics.b2BodyDef
	 , b2Body = Box2D.Dynamics.b2Body
	 , b2FixtureDef = Box2D.Dynamics.b2FixtureDef
	 , b2Fixture = Box2D.Dynamics.b2Fixture
	 , b2World = Box2D.Dynamics.b2World
	 , b2MassData = Box2D.Collision.Shapes.b2MassData
	 , b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape
	 , b2CircleShape = Box2D.Collision.Shapes.b2CircleShape
	 , b2DebugDraw = Box2D.Dynamics.b2DebugDraw
	   ;

/*
 * Initializes the physics world, creates the ground.
 */
function PhysicsWorld (intervalRate, adaptive){
	this.intervalRate = parseInt(intervalRate);
	this.adaptive = adaptive;
	
	this.lastTimestamp = Date.now();
	
	this.world = new b2World(new b2Vec2(0, 10) /* gravity*/, true /*allow sleep*/);
	
	var SCALE = 30;
	
	this.fixDef = new b2FixtureDef;
	this.fixDef.density = 1.0;
	this.fixDef.friction = 0.5;
	this.fixDef.restitution = 0.5;

	this.bodyDef = new b2BodyDef;

	//create ground
	this.bodyDef.type = b2Body.b2_staticBody;

	// positions the center of the object (not upper left!)
	this.bodyDef.position.x = 1300 / 2 / SCALE;
	this.bodyDef.position.y = 600 / (SCALE * 1.15);

	this.fixDef.shape = new b2PolygonShape;

	// half width, half height. eg actual height here is 1 unit
	//this.fixDef.shape.SetAsBox((1300 / SCALE) / 2, (10/SCALE) / 2);
	this.fixDef.shape.SetAsBox((1300 / SCALE),  /*1*/ (10/SCALE) /2); // Full width
	
	this.world.CreateBody(this.bodyDef).CreateFixture(this.fixDef);
};

/*
 * Updates the simulation
 */
PhysicsWorld.prototype.update = function(){
	var now = Date.now();
	var stepRate = (this.adaptive) ? (now - this.lastTimestamp) / 1000 : (1 / this.intervalRate);
	
	this.lastTimestamp = now;
	this.world.Step(stepRate /*frame-rate*/, 10 /* velocity iterations*/, 10 /* position iterations*/)
	this.world.ClearForces();
	this.sendUpdate();
}

/*
 * Sends coordinates of the bodies to the entities
 */
PhysicsWorld.prototype.sendUpdate = function(){
	var world = {};
	for(var b = this.world.GetBodyList(); b; b = b.m_next){
		if (typeof b.GetUserData() !== 'undefined' && b.GetUserData() != null){
			world[b.GetUserData()] = {
				x : b.GetPosition().x,
				y : b.GetPosition().y,
				a : b.GetAngle()
			};
		}
	}
	postMessage(world);
}

/*
 * Creates physical bodies from list of entities
 */
PhysicsWorld.prototype.setBodies = function(bodyEntities){
	this.bodyDef.type = b2Body.b2_dynamicBody;
	for(var id in bodyEntities){
		var entity = bodyEntities[id];
		
		this.fixDef.shape = new b2CircleShape(entity.radius);
		
		this.bodyDef.position.x = entity.x;
		this.bodyDef.position.y = entity.y;
		this.bodyDef.userData = entity.id;
		this.world.CreateBody(this.bodyDef).CreateFixture(this.fixDef);		
	}
	this.ready = true;
}

var phWorld = new PhysicsWorld(30, false);

var loop = function(){	
	if(phWorld.ready){
		phWorld.update();
	}
};

// Start loop
setInterval(loop, 1000/30);

self.onmessage = function(e){
	phWorld.setBodies(e.data);
};