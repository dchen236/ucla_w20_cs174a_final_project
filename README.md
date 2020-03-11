# Ten-Ball Pool

**UCLA CS 174A, Winter 2020**

Team Members: Tejas Bhat, Danni Chen, William Chern, Edward Lu

## Game Setup and Rules
This is an implementation of 10-ball pool using tinygraphics. However, we put our own spin on the game in order to make it more entertaining and unique. The balls are set up exactly the same way as in standard 10-ball pool. However, the user cannot simply select the angle and power to shoot at. Instead, the power is set to high automatically and there is a spinning arrow that the user must use and time perfectly in order to get the angle that he or she wants. 

The goal of the game is to get in as many of the ten balls in as possible without regard for the order that they are shot in. Each time the user gets a ball in, he or she is awarded 10 points. If the user gets the cue ball in, he or she loses 10 points. If the user's score ever goes negative, then the game is over. If the user scores all the balls in, then he or she wins!

## Features

### Physics Simulation


This section of the readme will go over the physics implementation. The explanation for the physics implementation will be split into three main parts: Part 1 will give a brief overview of the PhysicsObject API we made to represent a simple physics object, Part 2 will go into the two representations of a PhysicsObject's force vector used, Part 3 will go into basic collision calculations ignoring glancing collisions, aPart 4 will go over glancing collision calculations, and Part 5 will go over general challenges in the Physics implementation.

1) PhysicsObject API
	We created a PhysicsObject API to encapsulate the complexity of representing a physics object. The PhysicsObject API is contained in physics.js. In this documentation, we will only briefly go over the constructor of the object; other calculations in the PhysicsObject API like glancing collisions are explained in later sections.
	The constructor for the PhysicsObject contains the damping_constant, mass, center_transform, radius, time_constant, object_tag, and initial_transform parameters. A brief explanation of each is given below.
	damping_constant: This controls how much friction acts on the object over time, slowing it down.
	mass: This is the mass of the object, and is used in physics based calculations to properly calculated transfer of energy between objects.
	center_transform: This is the initial transform of the center of the object.
	radius: This is the radius of the object (the PhysicsObject calculations assume a spherical or circular object for simplicity).
	time_constant: This is the current speed at which physics calculations are done; a lower time_constant will mean a "slow-motion" effect.
	object_tag: This is a string passed into to uniquely identify the object for debugging purposes.
	initial_transform: This is an initial offset transform from the object's center.
2) Representation of objects' force vectors
	One nontrivial piece of work was in deciding how to represent the force vector acting on a PhysicsObject. Since our game is based on billiards, it is convenient to have a force vector which is represented as two angles (one angle offset from the zx axis, another angle offset from the zy axis) and a magnitude, which makes the launching of the ball easy. However, it is also convenient to have a force vector represented as three x, y, and z magnitude components. Both of these representations are used within PhysicsObject, and converted to and from each other depending on which format is more convenient for calculation. For example, for basic collision calculations, x y and z format of force vectors are used since the collision calculation becomes basic vector addition. On the other hand, when applying force to an object, we used the two angle offsets and magnitude representation, to make it easier to apply force to the cue ball based on the user input.
	You can find the code for converting between these two representations in the calculate_x_y_z and calculate_offset_angles_and_magnitude functions of the PhysicsObject.
3) Basic collision calculations
	This section will go over basic collision calculation. The function of PhysicsObject responsible for this calculation is the calculate_elastic_collision function. 
	The equations we used for calculating elastic collision between objects were standard (https://www.softschools.com/formulas/physics/elastic_collision_formula/67/). We simply did a 1d elastic collision calculation for all three components of two colliding objects' force vectors. However, this calculation does not take glancing collision into account (i.e., when objects do not collide in a perfectly straight line). We go over adjustments we made to account for glancing collisions in the next section.
4) Glancing collision calculations
	In order to make collisions look more realistic, we implemented glancing collision logic. This involved finding the angles at which objects collided, and making sure that the objects' post collision trajectories properly reflected this initial angle of collision.
	We found in attempting to implement glancing collisions that there are actually two types of glancing collisions, the logic for both of which we will go over separately.
	Before going into the two types of glancing collisions and their necessary calculations, it is good to clear out some general terminology first. We define the collision normal as the vector which goes through both of the objects' centers (it is important to note that we are only dealing with basic spherical and circular collisions in 2d, which allows us to make this simplification). We define the separation vector as the vector perpendicular to the collision normal. We define the pre-collision trajectory as the force vectors of the objects before they undergo collision and transfer energy. We define the post-collision trajectory as the force vectors of the objects after they undergo collision and exchange energy.
	With the basic terminology out of the way, we can go over the two types of glancing collisions.
	The first type of glancing collision is one in which both of the initial force vectors of the two objects colliding are on opposite sides of the separation vector. In order to properly calculate post-collision trajectories of objects for this type of glancing collision, one can simply reflect the initial force vectors of both objects across the collision normal, and this gives reasonable looking results. Below we give a picture to demonstrate this type of collision in our simulation. The red, green, and blue vectors are the collision normal, pre-collision trajectory, and post-collision trajectory of the first object. The yellow, teal, and violet vectors are the collision normal, pre-collision trajectory, and post-collision trajectory of the second object. Note that the only difference between the first and second object's collision normals is their direction.
	![Type 1 glancing collision](https://github.com/peurpdapeurp/ucla_w20_cs174a_final_project/blob/master/readme_images/type_1_collision.PNG)
	
	The second type of glancing collision is one in which both of the initial force vectors of the two objects colliding are on the same side of the separation vector. In order to detect this case, we used something akin to the implicit formula of the separation vector and checked the initial force vectors (see the is_right function of PhysicsObject).  For this case, it is necessary to decide which object is "behind" the other object; the object which is "behind" can be reflected using the same logic as the first type of glancing collision, but the object which is "in front" cannot, otherwise it will be reflected backward. In our current implementation, we simply do not adjust the angle of the "in front" object, but there is likely a more physically correct way to handle it. However, we chose to keep the implementation simpler, as this way of doing things gives reasonable looking results. In order to decide which object is "behind" the other, we first see what side of the collision normal the force vectors are on, and then see which side of the separation vectors the centers of the two colliding objects are on. This is enough information to determine which object is "behind" and calculate final trajectories accordingly. Below we give an example of this type of collision in our simulation. The meaning of the colors of collision markers is the same as in the first image we showed.
	![Type 2 glancing collision](https://github.com/peurpdapeurp/ucla_w20_cs174a_final_project/blob/master/readme_images/type_2_collision.PNG)
	
5) General challenges in the Physics implementation
	Although the physics implementation is relatively trivial (it all occurs within a 2d plane which simplifies things significantly), it was still fairly challenging to get the implementation working to the degree that it currently is, and it is still not perfect by any stretch. The main challenges were:
	1) Ensuring that angular calculations were carried out correctly. Initially, many calculations were seemingly unpredictable and hard to work with; this was solved by doing more strict cleaning of inputs (i.e. ensuring input angles were always positive and in between 0 and 2pi radians).
	2) A major challenge to get the physics to work correctly is the unpredictability of when physical calculations will be done in time; at many points of our simulation, physics calculations are done too late in time which leads to undesirable results (i.e., a ball to ball collision will be detected when the balls are already too far inside each other, which leads to unexpected behavior). We solved this through various fixes such as re-adjusting the positions of balls during collision to reasonable positions if they were too far inside each other, and forcing the centers of balls to be within the playing area during every update, and this leads to some undesirable visuals. For example, when balls bounce against the side of the walls, you can visually see a "snap" as they are moved into a more appropriate place, since their collision was detected when they were already too far within the wall. However, without this position readjustment fix, balls that collide will often curve into each other unrealistically. There are many improvements that could be made to make the physics look more realistic and perform better, but given our time constraints we believe the physics simulation we achieved was reasonable.

### Collision Detection

edward/danni insight

- Detecting the collision: 
 * Giving each object a center and radius, we detect two object collides with each other whenever the distance between the center of two objects is less than or equal to the sum of their radii

### Skybox

We created a skybox in order to create the background of a real casino. In order to do this, we create a square_map which is a wrapper of cubic object and "stick" images inside the cubic to simnulate a skybox, our skybox only attach images to 4 sides (top and bottom are not mapped because we want to put our camera futher away from the scene), images were provided by Tejas Bhat and William Chern.

### Texture Mapping

There were a lot of different textures that we had to map throughout this entire project in order to make the 10-ball pool simulation better. Some of the textures were flat, like the table felt and wood. However, others had to be optimized for spherical shapes, especially the cue ball and number balls. 
- Cue Ball
- Number Balls
- Table Felt
- Table Wood Finish

### Lighting

In terms of lighting, we wanted to create several different types of experiences for the user. While the original light setting is set to more of a family pool table, the 'party mode' makes the pool table seem like it is in a club with overhead lighting on the balls. In this way, the environment is dynamic and can be changed to the user's wishes. 

We implemented the 'party mode' by dimming the texture objects and changing the location of the main light source. All the balls, utilizing the Phong Shader, are affected by this change.

## Group Member Responsibilities

### Tejas Bhat
- Laid out graphical design for game by creating the pool table using various shapes
- Found appropriate textures and mapped the felt of the table and wood finish on the sides 
- Created texture mapping for balls in tradition 10-ball pool formation 
- Implemented rudimentary skybox utilizing texture mapping a large cube (was later improved to a Square_Map)
- Added music to the game which complies with all browswer regulations and starts only when the user has started playing
- Upscaled/upgraded various textures in order to increase smoothness on all parts of the game
- Optimized game by finding best friction and shooting speed for ball to mimic realistic pool game 
- Created slide deck, voiceovers, and video for in-class final presentation

### Danni Chen
* Implemented collision detection feature 
* Implemented the scoring system
    * Tracking locations and motion of balls (cue ball and colored-balls)
    * Increase user's scores when colored ball fell into holes
    * Display text line when game is over (cue-ball fell into one of the holes)
* Added casino-skybox to the game (images provided by Tejas Bhat and William Chern)
* Helped with the physics part by adding and tracking the center of objects for collision detection.

### Edward Lu
* Helped with collision detection feature (adding feature of detecting all ball to ball collisions, not just cue ball to ball)
* Implemented physics simulation
	* Creating the PhysicsObject API
    * Implementing basic collision calculation, glancing collision calculation
    * Added collision logic for balls against walls of table (inserted phantom balls at points of collision, to turn the wall collision into sphere collisions and keep the collision code simpler)
* Wrote physics section of readme

### William Chern
- Found textures for all the pool balls

