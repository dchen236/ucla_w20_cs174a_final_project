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

We created a skybox in order to create the background of a real casino. In order to do this, we create a square_map which is a wrapper of cubic object and "stick" images inside the cubic to simnulate a skybox, our skybox only attach images to 4 sides (top and bottom are not mapped because we want to put our camera futher away from the scene), images were provided by Tajas Bhat and William Chern.

### Texture Mapping

There were a lot of different textures that we had to map throughout this entire project in order to make the 10-ball pool simulation better.
- Cue Ball:
- Strike Balls:
- Table Felt:
- Table Wood Finish: 

### Lighting

In terms of lighting, we wanted to create several different tyeps of experiences for the user. 

## Group Member Responsibilities

### Tejas Bhat
- Laid out graphical design for game by creating the pool table using various shapes.
- Implemented texture mapping for the felt of the table and wood on the sides 
- Created texture mapping for balls in tradition 10-ball pool formation 
- Utilized texture mapping for balls
- Implemented rudimentary skybox utilizing texture mapping a large cube (was later improved to a Square_Map)

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

