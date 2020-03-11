# Ten-Ball Pool

**UCLA CS 174A, Winter 2020**

Team Members: Tejas Bhat, Danni Chen, William Chern, Edward Lu

## Game Setup and Rules
This is an implementation of 10-ball pool using tinygraphics. However, we put our own spin on the game in order to make it more entertaining and unique. The balls are set up exactly the same way as in standard 10-ball pool. However, the user cannot simply select the angle and power to shoot at. Instead, the power is set to high automatically and there is a spinning arrow that the user must use and time perfectly in order to get the angle that he or she wants. 

The goal of the game is to get in as many of the ten balls in as possible without regard for the order that they are shot in. Each time the user gets a ball in, he or she is awarded 10 points. If the user gets the cue ball in, he or she loses 10 points. If the user's score ever goes negative, then the game is over. If the user scores all the balls in, then he or she wins!

## Features

### Physics Simulation

edward/danni insight

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
- edward

### William Chern
- Found textures for all the pool balls

