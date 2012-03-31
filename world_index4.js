

//importScripts("vendors/box2d/Box2d.min.js");

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
	 , b2PrismaticJointDef = Box2D.Dynamics.Joints.b2PrismaticJointDef
	 , b2PrismaticJoint = Box2D.Dynamics.Joints.b2PrismaticJoint
	   ;

/*
 * Initializes the physics world, creates the ground.
 */
function PhysicsWorld (intervalRate, adaptive, ctx, withDebug){
	this.intervalRate = parseInt(intervalRate);
	this.adaptive = adaptive;
	
	this.lastTimestamp = Date.now();
	
	this.world = new b2World(new b2Vec2(0, 0) /* gravity*/, true /*allow sleep*/);
	
	this.SCALE = 30;
	
	this.fixDef = new b2FixtureDef;
	this.bodyDef = new b2BodyDef;
	
	this.bodiesMap = {}
	
	if(withDebug && ctx){

		var debugDraw = new b2DebugDraw();
		debugDraw.SetSprite( ctx );
		debugDraw.SetDrawScale( this.SCALE );
		debugDraw.SetFillAlpha( 0.3 );
		debugDraw.SetLineThickness( 2.0 );
		debugDraw.SetFlags( b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit);
		this.world.SetDebugDraw(debugDraw);
	}	

	/*
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
	this.fixDef.shape.SetAsBox((1300 / SCALE),  /*1 / (10/SCALE) /2); // Full width
	
	this.world.CreateBody(this.bodyDef).CreateFixture(this.fixDef);
	*/
};

/*
 * Updates the simulation
 */
PhysicsWorld.prototype.update = function(callback){
	var now = Date.now();
	var stepRate = (this.adaptive) ? (now - this.lastTimestamp) / 1000 : (1 / this.intervalRate);
	
	this.lastTimestamp = now;
	this.world.Step(stepRate /*frame-rate*/, 10 /* velocity iterations*/, 10 /* position iterations*/)
	this.world.DrawDebugData();
	this.world.ClearForces();
	
	var world = {};
	for(var b = this.world.GetBodyList(); b; b = b.m_next){
		if (typeof b.GetUserData() !== 'undefined' && b.GetUserData() != null){
			world[b.GetUserData()] = {
				x : b.GetPosition().x * this.SCALE,
				y : b.GetPosition().y * this.SCALE,
				a : b.GetAngle()
			};
		}
	}
	
	callback(world);
}

/*
 * Creates physical bodies from list of entities
 */
PhysicsWorld.prototype.setBodies = function(bodyEntities){
		
	var entity = bodyEntities.ball;
	
	this.fixDef.shape = new b2CircleShape(entity.radius / this.SCALE);
		
	this.bodyDef.type = b2Body.b2_dynamicBody;
	this.bodyDef.position.x = entity.x / this.SCALE;
	this.bodyDef.position.y = entity.y / this.SCALE;
	this.bodyDef.userData = entity.id;
	this.bodiesMap[entity.id] = this.world.CreateBody(this.bodyDef) 
	this.bodiesMap[entity.id].CreateFixture(this.fixDef);

	for(var i in bodyEntities.players){
		entity = bodyEntities.players[i];
		
		this.bodyDef.type = b2Body.b2_dynamicBody;

		// positions the center of the object (not upper left!)
		this.bodyDef.position.x = (entity.x + entity.width / 2) / this.SCALE;
		this.bodyDef.position.y = (entity.y + entity.height / 2) / this.SCALE;
		this.bodyDef.userData = entity.id;
		
		this.fixDef.shape = new b2PolygonShape;
		this.fixDef.shape.SetAsBox( (entity.width / 2) / this.SCALE, (entity.height / 2) / this.SCALE);
		
		this.bodiesMap[entity.id] = this.world.CreateBody(this.bodyDef) 
		this.bodiesMap[entity.id].CreateFixture(this.fixDef);
	}
	
	for(var i in bodyEntities.barriers){
		entity = bodyEntities.barriers[i];
		
		this.bodyDef.type = b2Body.b2_staticBody;

		// positions the center of the object (not upper left!)
		this.bodyDef.position.x = (entity.x ) / this.SCALE;
		this.bodyDef.position.y = (entity.y ) / this.SCALE;
		this.bodyDef.userData = entity.id;
		
		this.fixDef.shape = new b2CircleShape(entity.radius / this.SCALE);
				
		this.bodiesMap[entity.id] = this.world.CreateBody(this.bodyDef) 
		this.bodiesMap[entity.id].CreateFixture(this.fixDef);
	}
	
	var joint = new b2PrismaticJointDef();
	/*joint.Initialize(
			this.bodiesMap['playerleft'], 
			this.bodiesMap['playerbottom'], 
			this.bodiesMap['playerbottom'].GetWorldCenter(),
			new b2Vec2(1.0, 0.0));
	*/
	
	joint.bodyA = this.bodiesMap['playerleft'];
	joint.bodyB = this.bodiesMap['playerbottom'];
	joint.collideConnected = false;
	
	joint.localAxisA = new b2Vec2(1.0, 0.0);
	
	joint.localAnchorA = this.bodiesMap['playerleft'].GetWorldCenter();
	joint.localAnchorB = this.bodiesMap['playerbottom'].GetWorldCenter();
	
	joint.referenceAngle = 2*Math.PI;
	
	joint.enableLimit = true; 
	joint.lowerTranslation = 0; 
	joint.upperTranslation = 15;
	
	joint.enableMotor = true; 
	joint.maxMotorForce = 0; 
	joint.motorSpeed = 15;
	
	/*joint.bodyA = this.bodiesMap['barrier_bottomleft']
	joint.bodyB = this.bodiesMap['pbottom']
	joint.collideConnected = false;
	
	joint.localAxisA = vec;
	joint.referenceAngle = Math.PI*/
	
	/*joint.maxMotorForce = 0.0; 
	joint.motorSpeed = 0.0; 
	joint.enableMotor = false;*/
	
	//this.joint = this.world.CreateJoint(joint);
	
	/*
	entity = bodyEntities.all['playertop'];
	
	this.bodyDef.type = b2Body.b2_staticBody;

	// positions the center of the object (not upper left!)
	this.bodyDef.position.x = (entity.x + entity.width / 2) / this.SCALE;
	this.bodyDef.position.y = (entity.y + entity.height / 2) / this.SCALE;
	this.bodyDef.userData = 'playertop';
	
	this.fixDef.shape = new b2PolygonShape;
	this.fixDef.shape.SetAsBox( (entity.width / 2) / this.SCALE, (entity.height / 2) / this.SCALE);
	
	this.world.CreateBody(this.bodyDef).CreateFixture(this.fixDef);
	*/
	/*
	for(var id in bodyEntities){
		var entity = bodyEntities[id];
		
		this.fixDef.shape = new b2CircleShape(entity.radius);
		
		this.bodyDef.position.x = entity.x;
		this.bodyDef.position.y = entity.y;
		this.bodyDef.userData = entity.id;
		this.world.CreateBody(this.bodyDef).CreateFixture(this.fixDef);		
	}*/
		
	
	this.ready = true;
}

PhysicsWorld.prototype.applyImpulse = function(bodyId, power){
    var body = this.bodiesMap[bodyId];
    body.ApplyImpulse(new b2Vec2(Math.cos(0 * (Math.PI / 180)) * power,
                                 Math.sin(0 * (Math.PI / 180)) * power),
                                 body.GetWorldCenter());
}

//var phWorld = new PhysicsWorld(30, false);

//var loop = function(){	
//if(phWorld.ready){
//		phWorld.update();
//	}
//};

// Start loop
//setInterval(loop, 1000/30);

//self.onmessage = function(e){
//	phWorld.setBodies(e.data);
//};