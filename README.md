# Ten-Ball Pool

**UCLA CS 174A, Winter 2020**

Team Members: Tejas Bhat, Danni Chen, William Chern, Edward Lu

##### Here is a quick demo of the game with some explanations:
[https://drive.google.com/open?id=16MbXTAngm7eMn44hqjHllA7-FqHh3Tf4]


## Game Setup and Rules
This is an implementation of 10-ball pool using tinygraphics. The balls are set up exactly the same way as in standard 10-ball pool. The user selects the angle for the pool stick and a specific power. This game mimics a popular 'practice mode' in 10 ball pool, in which one player tries to 'run the rack,' or clear every ball on the table without scratching.

The goal of the game is to get in as many of the ten balls in as possible without regard for the order that they are shot in. If the user gets the cue ball in, he or she loses the game and the game can be reset. If the user pots all the number balls in correctly, then he or she wins! 

## Features

### Physics Simulation

This section of the readme will go over the physics implementation. The explanation for the physics implementation will be split into five parts: Part 1 will give a brief overview of the PhysicsObject API we made to represent a simple physics object, Part 2 will go into the two representations of a PhysicsObject's force vector used, Part 3 will go into basic collision calculations ignoring glancing collisions, Part 4 will go over glancing collision calculations, part 5 will go over ball rolling, part 6 will go over hole collision detection, and Part 7 will go over general challenges in the Physics implementation.

1) PhysicsObject API - 
	We created a PhysicsObject API to encapsulate the complexity of representing a physics object. The PhysicsObject API is contained in physics.js. In this documentation, we will only briefly go over the constructor of the object; other calculations in the PhysicsObject API like glancing collisions are explained in later sections.
	The constructor for the PhysicsObject contains the damping_constant, mass, center_transform, radius, time_constant, object_tag, and initial_transform parameters. A brief explanation of each is given below.
	damping_constant: This controls how much friction acts on the object over time, slowing it down.
	mass: This is the mass of the object, and is used in physics based calculations to properly calculated transfer of energy between objects.
	center_transform: This is the initial transform of the center of the object.
	radius: This is the radius of the object (the PhysicsObject calculations assume a spherical or circular object for simplicity).
	time_constant: This is the current speed at which physics calculations are done; a lower time_constant will mean a "slow-motion" effect.
	object_tag: This is a string passed into to uniquely identify the object for debugging purposes.
	initial_transform: This is an initial offset transform from the object's center.
	
2) Representation of objects' force vectors - 
	One nontrivial piece of work was in deciding how to represent the force vector acting on a PhysicsObject. Since our game is based on billiards, it is convenient to have a force vector which is represented as two angles (one angle offset from the zx axis, another angle offset from the zy axis) and a magnitude, which makes the launching of the ball easy. However, it is also convenient to have a force vector represented as three x, y, and z magnitude components. Both of these representations are used within PhysicsObject, and converted to and from each other depending on which format is more convenient for calculation. For example, for basic collision calculations, x y and z format of force vectors are used since the collision calculation becomes basic vector addition. On the other hand, when applying force to an object, we used the two angle offsets and magnitude representation, to make it easier to apply force to the cue ball based on the user input.
	You can find the code for converting between these two representations in the calculate_x_y_z and calculate_offset_angles_and_magnitude functions of the PhysicsObject.
3) Basic collision calculations - 
	This section will go over basic collision calculation. The function of PhysicsObject responsible for this calculation is the calculate_elastic_collision function. 
	The equations we used for calculating elastic collision between objects were standard (https://www.softschools.com/formulas/physics/elastic_collision_formula/67/). We simply did a 1d elastic collision calculation for all three components of two colliding objects' force vectors. However, this calculation does not take glancing collision into account (i.e., when objects do not collide in a perfectly straight line). We go over adjustments we made to account for glancing collisions in the next section.
4) Glancing collision calculations - 
	In order to make collisions look more realistic, we implemented glancing collision logic. This involved finding the angles at which objects collided, and making sure that the objects' post collision trajectories properly reflected this initial angle of collision.
	We found in attempting to implement glancing collisions that there are actually two types of glancing collisions, the logic for both of which we will go over separately.
	Before going into the two types of glancing collisions and their necessary calculations, it is good to clear out some general terminology first. We define the collision normal as the vector which goes through both of the objects' centers (it is important to note that we are only dealing with basic spherical and circular collisions in 2d, which allows us to make this simplification). We define the separation vector as the vector perpendicular to the collision normal. We define the pre-collision trajectory as the force vectors of the objects before they undergo collision and transfer energy. We define the post-collision trajectory as the force vectors of the objects after they undergo collision and exchange energy.
	With the basic terminology out of the way, we can go over the two types of glancing collisions.
	The first type of glancing collision is one in which both of the initial force vectors of the two objects colliding are on opposite sides of the separation vector. In order to properly calculate post-collision trajectories of objects for this type of glancing collision, one can simply reflect the initial force vectors of both objects across the collision normal, and this gives reasonable looking results. Below we give a picture to demonstrate this type of collision in our simulation. The red, green, and blue vectors are the collision normal, pre-collision trajectory, and post-collision trajectory of the first object. The yellow, teal, and violet vectors are the collision normal, pre-collision trajectory, and post-collision trajectory of the second object. Note that the only difference between the first and second object's collision normals is their direction.
	
	![Type 1 glancing collision](https://github.com/peurpdapeurp/ucla_w20_cs174a_final_project/blob/master/readme_images/type_1_collision.PNG)
	
	The second type of glancing collision is one in which both of the initial force vectors of the two objects colliding are on the same side of the separation vector. In order to detect this case, we used something akin to the implicit formula of the separation vector and checked the initial force vectors (see the is_right function of PhysicsObject).  For this case, it is necessary to decide which object is "behind" the other object; the object which is "behind" can be reflected using the same logic as the first type of glancing collision, but the object which is "in front" cannot, otherwise it will be reflected backward. In our current implementation, we simply do not adjust the angle of the "in front" object, but there is likely a more physically correct way to handle it. However, we chose to keep the implementation simpler, as this way of doing things gives reasonable looking results. In order to decide which object is "behind" the other, we first see what side of the collision normal the force vectors are on, and then see which side of the separation vectors the centers of the two colliding objects are on. This is enough information to determine which object is "behind" and calculate final trajectories accordingly. Below we give an example of this type of collision in our simulation. The meaning of the colors of collision markers is the same as in the first image we showed. Note that only the collision markers for the "behind" object are shown.
	
	![Type 2 glancing collision](https://github.com/peurpdapeurp/ucla_w20_cs174a_final_project/blob/master/readme_images/type_2_collision.PNG)
	
	Below is given a sketch which may help in visualizing the difference between the two types of collisions further:
	
	![Glancing_collision_types](https://github.com/peurpdapeurp/ucla_w20_cs174a_final_project/blob/master/readme_images/glancing_collision_types.jpg)
	
5) Ball rolling - 
	The ball rolling was implemented using the velocity vectors of the balls' physics objects to determine the distance that they travelled in a time step, and then using the balls' radii to calculate the proper angle to rotate the balls by. The general relationship used is that the ball's circumference is given by (2)(PI)(radius), and so the angle in radians, x, to rotate the ball if it travelled a distance d is given by the following equation:
	
	x / (2(PI)) = d / (2(PI)(radius))
	
	The only other issue is deciding the axis to roll the ball on; we do this by simply checking the direction in which the ball is currently rolling using its velocity vector, and then taking the vector perpendicular to that in order to get the axis of rotation.
	
6) Hole Implementation - 

	In order to implement the holes, we implemented a limited amount of vertical physics, in that we added an option to enable gravity to the PhysicsObject API. For the holes, we simply detect when a ball is over a hole, and if it is, we enable gravity on the ball to make it look like it is falling into the hole.

	One of the problems we ran into while implementing this is that the balls would sometimes move too quickly while falling "into" the hole and look as if they were falling through the table. In order to fix this, we had to implement some hole "catching" logic, so that a ball didn't leave the bounds of a hole after it had been detected as falling into the hole. To do this, we added extra logic to the hole collision detection so that once a ball was "caught" by a hole, there would be the necessary logic to keep the ball from leaving the bounds of the hole. We did this by moving the ball back along its current direction of motion whenever it left the bounds of the hole it was captured by. 

	We also re-used our physics elastic collision in a different way here to give the illusion of the ball rolling around in the hole. We noticed before we had fixed the physics collision to avoid it that sometimes balls would curve into each other after a collision and spin around. We realized this happened whenever the physics collision calculation happened too late, when the balls that collided were already inside one another. We used this fact to create the illusion of the ball spinning around in the hole by having the balls that fall into holes collide with a fake ball placed on the hole, so that it looks like the ball is spinning around the hole. Even though this is a hack, it still gives a reasonable illusion of circular motion after a ball has entered a hole.

7) General challenges in the Physics implementation - 
	Although the physics implementation is relatively trivial (it all occurs within a 2d plane which simplifies things significantly), it was still fairly challenging to get the implementation working to the degree that it currently is, and it is still not perfect by any stretch. The main challenges were:
	1) Ensuring that angular calculations were carried out correctly. Initially, many calculations were seemingly unpredictable and hard to work with; this was solved by doing more strict cleaning of inputs (i.e. ensuring input angles were always positive and in between 0 and 2pi radians).
	2) A major challenge to get the physics to work correctly is the unpredictability of when physical calculations will be done in time; at many points of our simulation, physics calculations are done too late in time which leads to undesirable results (i.e., a ball to ball collision will be detected when the balls are already too far inside each other, which leads to unexpected behavior). We solved this through various fixes such as re-adjusting the positions of balls during collision to reasonable positions if they were too far inside each other, and forcing the centers of balls to be within the playing area during every update, and this leads to some undesirable visuals. For example, when balls bounce against each other, you may notice a "snap" as they are moved into a more appropriate place, since their collision was detected when they were already too far within each other. However, without this position readjustment fix, balls that collide will often curve into each other unrealistically. There are many improvements that could be made to make the physics look more realistic and perform better, but given our time constraints we believe the physics simulation we achieved was reasonable.

### Collision Detection

 * In order to detect collisions, we gave each object a center and radius, and we detect two object that collide with each other whenever the distance between the center of two objects is less than or equal to the sum of their radii.

### Skybox

We created a skybox in order to create the background of a real casino. In order to do this, we create a square_map which is a wrapper of cubic object and "stick" images inside the cubic to simnulate a skybox, our skybox only attach images to 4 sides (top and bottom are not mapped because we want to put our camera futher away from the scene), images were provided by Tejas Bhat and William Chern.

### Texture Mapping

There were a lot of different textures that we had to map throughout this entire project in order to make the 10-ball pool simulation better. Some of the textures were flat, like the table felt and wood. However, others had to be optimized for spherical shapes, especially the cue ball and number balls. 
- Cue Ball
- Number Balls
- Table Felt
- Table Wood Finish

## Shadows

We implemented shadows using a two-pass rendering technique and a custom shadow shader. We first drew all the balls and calculated the shadow map using the ball's relative position with regard to the overhead lighting. Then, on the second pass, we drew the pool table's felt utilizing the shadow textures and overlaid the rest of the environment as well. Since graphic rendering times were too slow on our machines when utilizing the best shadow technique, we opted for lower resolution shadows.

## Reflections

We implemented reflections very similarly to shadows. Instead of using a shadow shader, however, we used a reflection shader. We created this reflection shader by utilizing the fragment code of a Phong Shader and combining that with the existing Shadow Shader code.
 
We used a two-pass rendering technique here as well. We first drew all the balls and calculated the reflection map using the ball's relative position with regard to the overhead lighting. Then, on the second pass, we drew the pool table's glass utilizing the reflection textures and overlaid the rest of the environment as well. Since graphic rendering times were too slow on our machines when utilizing the best reflection technique, we opted for lower resolution reflections.

### Lighting

In terms of lighting, we wanted to create several different types of experiences for the user. While the original light setting is set to more of a family pool table with regular dark shadows, the 'party mode' makes the pool table seem like it is in a club with overhead lighting on the balls. In this way, the environment is dynamic and can be changed to the user's wishes. 

We implemented the 'party mode' by dimming the texture objects, changing the location of the main light source, and creating the simulation of a glass table using reflections. All the balls, utilizing the Phong Shader, are affected by this change.

## Group Member Responsibilities

### Tejas Bhat
- Laid out graphical design for game by creating the pool table using various scaled shapes
- Found appropriate textures and mapped the felt of the table and wood finish on the sides 
- Created texture mapping for balls in traditional 10-ball pool formation 
- Implemented rudimentary skybox by texture mapping a large bounding cube (was later improved to a Square_Map by Danni)
- Added casino music to the game which complies with all browser regulations and starts only when the user has started playing
- Implemented a loading screen for the game to greet user with instructions
- Implemented 'you win' and 'you lose' screens to tell user their status at end of game
- Upscaled and changed various textures in order to increase smoothness on all parts of the game
- Optimized game by tuning factors such as friction and shooting speed for ball to mimic realistic pool game 
- Implemented dark, realistic shadows for normal game by utilizing a Shadow_Shader and utilizing a two-pass rendering technique
- Implemented reflections for party mode by creating a custom Reflection_Shader and utilizing a two-pass rendering technique
- Increased speed of rendering by modifying shaders and loading technique to ensure no game lag
- Created and edited slide deck, voiceovers, and video for in-class final presentation (new for each deadline)
- Added through documentation to entire project after it was finished to help readers

### Danni Chen
* Implemented collision detection feature
	* implemented the collision logic ( distance between two objects less than sum of radii )
	* provided collsion API allow object to object collision detection, (ball to ball, ball to hole and ball to wall )
* Implemented the scoring system
    * Tracking locations and motion of balls (cue ball and colored-balls)
    * Increase user's scores when colored ball fell into holes
    * Display text line when game is over (cue-ball fell into one of the holes)
* Implemented the game logic and ball falling into hole scene
	* make balls disappear when they fell into holes
	* game over when cue ball fell into the holes.
* Added casino-skybox to the game (images provided by Tejas Bhat and William Chern)
* Added chamber-skybox to the game, found the image.
* Added stick to the game 
	* adjusted the position, rotation angle of the stick to match the postion of the cue ball
	* mapped texture to the stick object
* Added move back and force motion to the stick, the closer the stick to the cue ball, the weaker force will be applied when user launch the cue ball and vice versa
* Added collision audio
	* selectively play the music when objects collides
* Helped with the physics part by adding and tracking the center of objects for collision detection.
* Wrote the skybox and collision detection section of the readme

### William Chern
* Found and reformatted textures for all pool balls to be compatible with tinygraphics
* Implemented image textures onto number balls
* Found cue stick object, added to game
* Worked with Danni and Tejas to create casino textures and implement casino skybox
* Created and implemented "party mode" (dark mode) visuals
    * Dimmed textures
    * Adjusted lighting
* Designed game intro screens with instructions for players, including important keys for the game
* Designed game won/lost screens, indicating reasons for winning/losing the game and how to reset the game
* Reset cue stick during game resets
* Recorded screen recordings and voiceovers for in-class final presentation video
* Compiled and edited final report

### Edward Lu
* Helped with collision detection feature (adding feature of detecting all ball to ball collisions, not just cue ball to ball)
* Implemented physics simulation
	* Creating the PhysicsObject API
    * Implementing basic collision calculation, glancing collision calculation
    * Added collision logic for balls against walls of table (inserted phantom balls at points of collision, to turn the wall collision into sphere collisions and keep the collision code simpler)
    * Implemented ball rolling logic
	* Implemented hole physics
		* Ball falling through hole
		* Hole "capturing" ball so that ball doesn't escape hole
* Wrote physics section of readme
* Implemented initial base framework in main-scene.js
	* triangle ball spawning logic
	* ball arrow launch logic
	* slow motion logic
	* pause logic
	* shift of camera to cue ball and other balls
* Created objects to add to side of table to "hug" holes to create a more realistic looking table
* Implemented drawing of collision markers

## References and Resources
* Pool ball textures: [https://www.robinwood.com/Catalog/FreeStuff/Textures/TexturePages/BallMaps.html](https://www.robinwood.com/Catalog/FreeStuff/Textures/TexturePages/BallMaps.html)
* Wynn casino panorama: [https://www.flickr.com/photos/mattslocum/4401059901](https://www.flickr.com/photos/mattslocum/4401059901)
* Cue stick .obj file: https://free3d.com/3d-model/billiards-cuebasic-v1--740465.html 
* Billiards background image for intro/won/lost screens: https://unsplash.com/photos/DUcVepObkXk 
