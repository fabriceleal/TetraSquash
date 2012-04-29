

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
	
	var sound = new Audio("ball.mp3");
	
	this.world.SetContactListener(
		{			
			BeginContact : function(contact){
				//console.log('BeginContact');
			},
			EndContact : function(contact){
				//console.log('EndContact');
			},
			PreSolve : function(contact, oldManifold){
				if(contact.IsTouching()){
					var bodya = contact.GetFixtureA().GetBody().GetUserData();
					var bodyb = contact.GetFixtureB().GetBody().GetUserData();
				
					/*console.log(
						contact.GetFixtureA().GetBody().GetUserData() + ' vs. ' +
						contact.GetFixtureB().GetBody().GetUserData());
					*/
					var other = bodyb;
					if(bodyb == 'ball'){
						other = bodya;
					}
					else if(bodya != 'ball'){
						return; /* neither body is a ball*/
					}
					
					if(other.indexOf("ground") == 0){
						other = other.replace("ground", "");
						
						var elem = document.getElementById(other);
						elem.innerText = new Number(elem.innerText) + 1;
					}
				}
			},
			PostSolve : function(contact, impulse){
				//console.log('PostSolve');
			}		
		}
	);
	
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

	/*
	var i = 0;
	for(var x = this.world.GetContactList(); x != null; x = x.GetNext() ){
		if(x.IsTouching()){
			console.log(
				x.GetFixtureA().GetBody().GetUserData() + ' vs. ' +
				x.GetFixtureB().GetBody().GetUserData());
		}
	}*/
}

/*
 * Creates physical bodies from list of entities
 */
PhysicsWorld.prototype.setBodies = function(bodyEntities){
		
	var entity = bodyEntities.ball;
	
	// Create ball
	this.fixDef.shape = new b2CircleShape(entity.radius / this.SCALE);
	this.fixDef.density = 0.3;
	this.fixDef.restitution = 1.0;
	
	this.bodyDef.type = b2Body.b2_dynamicBody;

	this.bodyDef.position.x = entity.x / this.SCALE;
	this.bodyDef.position.y = entity.y / this.SCALE;
	this.bodyDef.userData = entity.id;
	this.bodiesMap[entity.id] = this.world.CreateBody(this.bodyDef) 
	this.bodiesMap[entity.id].CreateFixture(this.fixDef);

	// * Ball created *

	for(var i in bodyEntities.players){
		entity = bodyEntities.players[i];
		
		this.bodyDef.type = b2Body.b2_dynamicBody;

		// positions the center of the object (not upper left!)
		this.bodyDef.position.x = (entity.x + entity.width / 2) / this.SCALE;
		this.bodyDef.position.y = (entity.y + entity.height / 2) / this.SCALE;
		this.bodyDef.userData = entity.id;
		this.bodyDef.linearDamping = 1.2;
		
		/* To make sure that the player can move the player
		before the ball touches it !!! */
		this.bodyDef.allowSleep = false;
		this.bodyDef.awake = true;

		this.fixDef.shape = new b2PolygonShape;
		this.fixDef.shape.SetAsBox( (entity.width / 2) / this.SCALE, (entity.height / 2) / this.SCALE);
		this.fixDef.density = 1.0;
		this.fixDef.restitution = 0.2;
		
		this.bodiesMap[entity.id] = this.world.CreateBody(this.bodyDef) 
		this.bodiesMap[entity.id].CreateFixture(this.fixDef);
		
		// Create ground (to joint with)
		//if (entity.ground && entity.ground.x > 0){
		this.bodyDef.type = b2Body.b2_staticBody;
		this.bodyDef.position.x = (entity.ground.x ) / this.SCALE;
		this.bodyDef.position.y = (entity.ground.y) / this.SCALE;
		this.bodyDef.userData = 'ground' + entity.id;
		this.fixDef.shape = new b2PolygonShape;
		this.fixDef.shape.SetAsBox( (entity.ground.width / 2) / this.SCALE, (entity.ground.height / 2) / this.SCALE);
				
		this.bodiesMap['ground' + entity.id] = this.world.CreateBody(this.bodyDef);
		this.bodiesMap['ground' + entity.id].CreateFixture(this.fixDef);
		// * Ground created*

		// Ugly hack
		var axis = new b2Vec2(0.0, 1.0); // y axis
		if(entity.ground.width > entity.ground.height){
			// Horizontal ground
			axis = new b2Vec2(1.0, 0.0) // x axis
		}
		
		// create joint
		var joint = new b2PrismaticJointDef();
		joint.Initialize(
					this.bodiesMap['ground' + entity.id], 
					this.bodiesMap[entity.id], 
					this.bodiesMap[entity.id].GetWorldCenter(),
					axis
					);

		joint.lowerTranslation = 0.0;
		joint.upperTranslation = 0.0;
		
		this.world.CreateJoint(joint);
		// * Joint created *
		//}/**/
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
	/*	
	var joint = new b2PrismaticJointDef();
joint.Initialize(
			this.bodiesMap['playerleft'], 
			this.bodiesMap['playerbottom'], 
			this.bodiesMap['playerbottom'].GetWorldCenter(),
			new b2Vec2(1.0, 0.0));

	
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
		*/
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

PhysicsWorld.prototype.applyImpulse = function(bodyId, power, angle){
    var body = this.bodiesMap[bodyId];
    body.ApplyImpulse(new b2Vec2(Math.cos(angle*(Math.PI / 180)) * power,
                                 Math.sin(angle*(Math.PI / 180)) * power),
                                 body.GetWorldCenter());
}

PhysicsWorld.prototype.setVelocity = function(bodyId, power, angle){
    var body = this.bodiesMap[bodyId];
    body.SetLinearVelocity(new b2Vec2(Math.cos(angle*(Math.PI / 180)) * power,
                                 Math.sin(angle*(Math.PI / 180)) * power));
	/*document.getElementById('dbg').innerHTML = 
		'<p>' + 
			(function(v){return v.x + ", " + v.y})(body.GetLinearVelocity()) + 
		'</p>';*/
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