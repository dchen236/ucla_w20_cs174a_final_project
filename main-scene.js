window.Assignment_Four_Scene = window.classes.Assignment_Four_Scene =
    class Assignment_Four_Scene extends Scene_Component
    { constructor( context, control_box )     // The scene begins by requesting the camera, shapes, and materials it will need.
    { super(   context, control_box );    // First, include a secondary Scene that provides movement controls:
        this.context = context;
        if( !context.globals.has_controls   )
            context.register_scene_component( new Movement_Controls( context, control_box.parentElement.insertCell() ) );

        // graphics parameters
        this.forward_camera_transform = Mat4.look_at( Vec.of( 0,0,5 ), Vec.of( 0,-2,0 ), Vec.of( 0,1,0 ) )
            .times(Mat4.translation(Vec.of(0, -3, -3)));
        this.top_camera_transform = Mat4.look_at( Vec.of( 0,0,5 ), Vec.of( 0,-60,0 ), Vec.of( 0,1,0 ) )
            .times(Mat4.translation(Vec.of(0, -130, 0)));
        this.static_camera_positions = [this.forward_camera_transform, this.top_camera_transform];
        this.current_static_camera_position = 1;
        context.globals.graphics_state.camera_transform = this.static_camera_positions[this.current_static_camera_position];
        const r = context.width/context.height;
        context.globals.graphics_state.projection_transform = Mat4.perspective( Math.PI/4, r, .1, 1000 );
        const shapes = {
            bowling_ball: new Subdivision_Sphere(5),
            floor: new Cube(),
            arrow: new Surface_Of_Revolution( 8, 8, Vec.cast(
                [0, 1, 0], [0, 1, 1], [0, 1, 2],
                [0, 1, 3], [0, 1, 4], [0, 2, 4],
                [0, 1, 5], [0, 0, 7]
            )),
            pin: new Subdivision_Sphere(5),
            score_text: new Text_Line(100),
            collision_guide: new Cube(),
            wall: new Cube(),
            bounding_cube: new Cube()
        };
        this.submit_shapes( context, shapes );
        this.materials = {
            bowling_ball: context.get_instance( Phong_Shader ).material(Color.of(0, 0, 0, 1), {
                ambient: 0.8,
                texture: context.get_instance("assets/BallCue.jpg", true)
            }),
            floor: context.get_instance( Phong_Shader ).material(Color.of(0, 0, 0, 1), {
                ambient: 1,
                texture: context.get_instance("assets/green_felt.jpg", true)
            }),
            arrow: context.get_instance( Phong_Shader ).material(Color.of(0, 0, 1, 0.8), {
                ambient: 1
            }),
            pin: context.get_instance (Phong_Shader ).material(Color.of(0, 0, 0, 1), {
                ambient: 0.8,
                texture: context.get_instance("assets/pin_texture.png", true)
            }),
            billiards_ball: context.get_instance(Phong_Shader).material(Color.of(0, 0, 0, 1), {
                ambient: 0.9,
                texture: context.get_instance("assets/ball_1.jpg", true)
            }),
            collision_guide: context.get_instance( Phong_Shader ).material(Color.of(1, 0, 0, 1), {
                ambient: 1,
                diffusivity: 1,
                specularity: 0,
            }),
            text:  context.get_instance(Phong_Shader).material(Color.of(0,0,0,1),  {
                ambient: 1,
                diffusivity: 0,
                specularity: 0,
                texture: context.get_instance( "assets/text.png", false )}),
            wall: context.get_instance( Phong_Shader ).material(Color.of(0, 0, 0, 1), {
                ambient: 1,
                texture: context.get_instance("assets/wood_texture.jpg", true)
            }),
            bounding_cube: context.get_instance( Phong_Shader ).material(Color.of(0, 0, 0, 1), {
                ambient: 1,
                texture: context.get_instance("assets/casino.jpg", true)
            })
        };

        this.collide_sound = new Audio("assets/collide_sound.mp3");
        this.lights = [ new Light( Vec.of( 0,100,0,1 ), Color.of( 0,1,1,1 ), 1000000000 ) ];
        this.floor_width = 60;
        this.floor_height = 80;
        this.floor_transform =
            Mat4.identity()
                .times(Mat4.translation(Vec.of(0, -3, 0)))
                .times(Mat4.scale(Vec.of(this.floor_width / 2, 0.10, this.floor_height / 2)));

        this.default_time_constant = 1.0;
        this.slow_motion_time_constant = 0.1;
        this.collision_guide_length = 5;
        this.initial_collision_guide_transform =
            Mat4.identity()
                .times(Mat4.translation(Vec.of(0, 0, this.collision_guide_length / 4)))
                .times(Mat4.scale(Vec.of(0.1, 0.1, this.collision_guide_length / 2)));
        this.score = 0;
        this.last_launch_time = 60 * 10;
        this.game_over = false;
        // game parameters
        this.arrow_speed = 1.5;
        this.ball_speed = .10;
        this.floor_damping = 0;
        this.ball_damping = this.floor_damping;
        this.pin_damping = this.floor_damping;
        this.ball_mass = 1;
        this.pin_mass = 2;
        this.bowling_ball_radius = 1;
        this.pin_radius = 2;
        this.num_pins = 0;
        this.collide_adjust = 0.2;
        this.launch_left = 5;
        // game state
        this.bowling_ball_transform = Mat4.identity();
        this.bowling_ball_physics_object =
            new PhysicsObject(
                this.ball_damping,
                this.ball_mass,
                Mat4.identity(),
                this.bowling_ball_radius,
                this.default_time_constant);
        this.pin_physics_objects = [];
        this.base_pin_transform =
            Mat4.identity()
                .times(Mat4.scale(Vec.of(this.pin_radius, this.pin_radius, this.pin_radius)))
                .times(Mat4.rotation(Math.PI / 2, Vec.of(1, 0, 0)));
        this.initial_pin_transforms = [];
        this.lock_camera_on_ball = false;
        this.initial_camera_reset = false;
        this.arrow_angle = 0;
        this.ball_launched = false;
        this.reset = false;

        // testing state
        this.collision_results = new Array();
        this.max_collision_results_history_size = 10;
        this.enable_collision_markers = false;
        this.collision_guide_colors = [
            [Color.of(1, 0, 0, 1), Color.of(0, 1, 0, 1), Color.of(0, 0, 1, 1)], // normal, collision, reflection colors for o1
            [Color.of(1, 1, 0, 1), Color.of(0, 1, 1, 1), Color.of(1, 0, 1, 1)] // normal, collision, reflection colors for o2
        ];
        this.free_play_mode = false;
        this.slow_motion_toggle = false;
        this.slow_motion = false;

        // initializations
        this.initialize_triangle_pins();

    }

    initialize_triangle_pins() {
        let ball_spacing = 5;
        let x_initial = 0;
        let z_initial = -3;
        let triangle_height = 3;
        let i = 0;

        for (let z = z_initial; z > z_initial - triangle_height; z--) {
            for (let x = x_initial - (z_initial - z); x < (1 + 2 * (z_initial - z))/2; x++) {
                console.log("spawning pin at " + "[" + x + ", " + z + "]");
                let pin_transform = Mat4.identity()
                    .times(Mat4.translation(Vec.of(x * ball_spacing, 0, z * ball_spacing)))
                    .times(this.base_pin_transform);
                this.initial_pin_transforms[i] = pin_transform;
                this.pin_physics_objects[i] =
                    new PhysicsObject(this.pin_damping, this.pin_mass, pin_transform, this.pin_radius, this.default_time_constant);
                this.num_pins++;
                i++;
            }
        }
    }

    make_control_panel()
    {
        this.key_triggered_button("Launch Ball", ["k"], () => {
            if (!this.ball_launched && this.launch_left > 0) {
                if (!this.free_play_mode) {
                    this.launch_left -= 1;
                }
                // this.ball_launched = true;
                console.log("---");
                this.bowling_ball_physics_object.apply_force(
                    Vec.of(this.arrow_angle, 0, this.ball_speed)
                );
                this.collide_sound.play();
                console.log("---");

            }
        });
        this.new_line();
        this.key_triggered_button("Lock Camera On Ball", ["i"], () =>
            this.lock_camera_on_ball = !this.lock_camera_on_ball
        );
        this.new_line();
        this.key_triggered_button("Cycle Static Camera Positions", ["j"], () => {
                if (this.current_static_camera_position == this.static_camera_positions.length - 1) {
                    this.current_static_camera_position = 0;
                } else {
                    this.current_static_camera_position += 1;
                }
                this.initial_camera_reset = true;
            }
        );
        this.new_line();
        this.key_triggered_button("Reset Ball", ["l"], () =>
            this.reset = true
        );
        this.new_line();
        this.key_triggered_button("Toggle collision markers", ["t"], () =>
            this.enable_collision_markers = !this.enable_collision_markers
        );
        this.new_line();
        this.key_triggered_button("Toggle free play mode", ["-"], () =>
            this.free_play_mode = !this.free_play_mode
        );
        this.new_line();
        this.key_triggered_button("Toggle slow motion", ["x"], () =>
            this.slow_motion_toggle = true
        );
    }

    update_camera_transform(graphics_state) {
        var desired;
        const blending_factor = 0.1;
        if (this.lock_camera_on_ball) {
            this.initial_camera_reset = true;
            desired =
                Mat4.inverse(
                    this.bowling_ball_transform
                        .times(Mat4.translation(Vec.of(0, 5, 15)))
                );
            graphics_state.camera_transform =
                desired.map((x, i) =>
                    Vec.from(graphics_state.camera_transform[i]).mix(x, blending_factor));
        }
        else {
            if (this.initial_camera_reset) {
                this.initial_camera_reset = false;
                graphics_state.camera_transform = this.static_camera_positions[this.current_static_camera_position];
            }
        }
    }

    reset_scene(graphics_state) {
        this.collision_results = [];
        this.bowling_ball_transform = Mat4.identity();
        this.bowling_ball_physics_object.reset();
        this.ball_launched = false;
        graphics_state.camera_transform = this.static_camera_positions[this.current_static_camera_position];
        for (let i = 0; i < this.num_pins; i++) {
            this.pin_physics_objects[i].reset();
         //   console.log("pin " + i + " :" + this.pin_physics_objects[i].center);
        }
        // console.log("ball: " + this.bowling_ball_physics_object.center);

    }

    draw_static_scene(graphics_state) {
        let scale_factor = 200;
        this.bounding_cube_transform =  Mat4.identity().times(Mat4.scale(Vec.of(scale_factor,scale_factor,scale_factor)));
        this.shapes.bounding_cube.draw(
            graphics_state,
            this.bounding_cube_transform,
            this.materials.bounding_cube
        );
        this.shapes.floor.draw(
            graphics_state,
            this.floor_transform,
            this.materials.floor
        );
        this.wall_transform_north =
            Mat4.identity()
                .times(Mat4.translation(Vec.of(0, -3, this.floor_height/2)))
                .times(Mat4.scale(Vec.of(this.floor_width / 2, 5, 1)));
        this.wall_transform_south =
            Mat4.identity()
                .times(Mat4.translation(Vec.of(0, -3, -1 * this.floor_height/2)))
                .times(Mat4.scale(Vec.of(this.floor_width / 2, 5, 1)));
        this.wall_transform_west =
            Mat4.identity()
                .times(Mat4.translation(Vec.of(this.floor_width/2, -3, 0)))
                .times(Mat4.scale(Vec.of(1, 5, this.floor_height/2 + 1)));
        this.wall_transform_east =
            Mat4.identity()
                .times(Mat4.translation(Vec.of(-1 * this.floor_width/2, -3, 0)))
                .times(Mat4.scale(Vec.of(1, 5, this.floor_height/2 + 1)));

        this.shapes.wall.draw(
            graphics_state,
            this.wall_transform_north,
            this.materials.wall
        );

        this.shapes.wall.draw(
            graphics_state,
            this.wall_transform_south,
            this.materials.wall
        );

        this.shapes.wall.draw(
            graphics_state,
            this.wall_transform_west,
            this.materials.wall
        );

        this.shapes.wall.draw(
            graphics_state,
            this.wall_transform_east,
            this.materials.wall
        );

    }

    draw_arrow(graphics_state, arrow_angle) {
        this.shapes.arrow.draw(
            graphics_state,
            this.bowling_ball_physics_object.get_transform(graphics_state)
                .times(Mat4.scale(Vec.of(0.5, 0.5, 1)))
                .times(Mat4.rotation(arrow_angle, Vec.of(0, 1, 0))),
            this.materials.arrow
        );
    }

    draw_ball(graphics_state) {
        this.bowling_ball_transform =
            Mat4.identity().times(
                this.bowling_ball_physics_object.get_transform(graphics_state)
            );
        this.shapes.bowling_ball.draw(
            graphics_state,
            this.bowling_ball_transform,
            this.materials.bowling_ball
        );
    }

    draw_pins(graphics_state) {
        for (let i = 0; i < this.pin_physics_objects.length; i++) {
            let image_filename = `assets/ball_${i+1}.jpg`;
            let material = this.materials.billiards_ball.override({texture: this.context.get_instance(image_filename, true)});
            this.shapes.pin.draw(
                graphics_state,
                this.pin_physics_objects[i]
                    .get_transform(graphics_state)
                    .times(this.initial_pin_transforms[i]),
                material
            );
        }
    }

    draw_collision_results(graphics_state) {

        for (let i = 0; i < this.collision_results.length; i++) {
            for (let j = 0; j < 2; j++) {
                this.shapes.collision_guide.draw(
                    graphics_state,
                    Mat4.identity()
                        .times(this.collision_results[i][j][0])
                        .times(this.collision_results[i][j][1])
                        .times(this.initial_collision_guide_transform),
                    this.materials.collision_guide.override({
                        color: this.collision_guide_colors[j][0]
                    })
                );
                this.shapes.collision_guide.draw(
                    graphics_state,
                    Mat4.identity()
                        .times(this.collision_results[i][j][0])
                        .times(this.collision_results[i][j][2])
                        .times(this.initial_collision_guide_transform),
                    this.materials.collision_guide.override({
                        color: this.collision_guide_colors[j][1]
                    })
                );
                this.shapes.collision_guide.draw(
                    graphics_state,
                    Mat4.identity()
                        .times(this.collision_results[i][j][0])
                        .times(this.collision_results[i][j][3])
                        .times(this.initial_collision_guide_transform)
                        .times(Mat4.translation(Vec.of(0, 0.5, 0))),
                    this.materials.collision_guide.override({
                        color: this.collision_guide_colors[j][2]
                    })
                );
            }
        }

    }

    get_distance(p1, p2) {
        let xs = p1[0] - p2[0];
        let ys = p1[1] - p2[1];
        let zs = p1[2] - p2[2];
        return Math.sqrt(xs * xs + ys * ys + zs * zs);
    }

    check_if_collide(o1, o2) {
        // console.log("collision check: ");
        let o1_center = o1.get_center();
        let o2_center = o2.get_center();
        let distance = this.get_distance(o1_center, o2_center);
        // console.log("o1 center: " + o1_center);
        // console.log("o2 center: " + o2_center);
        // console.log("o1 radius: " + o1.radius);
        // console.log("o2 radius: " + o2.radius);
        // console.log("distance: " + distance);
        return distance <= o1.radius + o2.radius + this.collide_adjust;
    }

    do_collision(o1, o2) {
        const collision_result = PhysicsObject.calculate_elastic_collision(o1, o2);
        this.collision_results.push(collision_result);
        while (this.collision_results.length > this.max_collision_results_history_size) {
            this.collision_results.shift();
        }
        // console.log("o1 center: " + o1.get_center());
        // console.log("o2 center: " + o2.get_center());
        // console.log("o1 force vector: " + o1.force_vector);
        // console.log("o2 force vector: " + o2.force_vector);
    }

    handle_ball_collisions() {
        // check if ball collide 0th pin
        let score_multiplier = 1;
        for (let i = 0; i < this.pin_physics_objects.length; i++) {
            if (this.check_if_collide(this.pin_physics_objects[i], this.bowling_ball_physics_object) ) {
                console.log("did ball to pin collide");
                this.score += 1 * score_multiplier;
                score_multiplier += 2;
                this.do_collision(this.bowling_ball_physics_object, this.pin_physics_objects[i]);
            }
        }
        for (let i = 0; i < this.pin_physics_objects.length - 1; i++) {
            for (let j = i + 1; j < this.pin_physics_objects.length; j++) {
                if (!this.pin_physics_objects[i].force_vector.equals(Vec.of(0, 0, 0)) ||
                    !this.pin_physics_objects[j].force_vector.equals(Vec.of(0, 0, 0))) {
                    if (this.check_if_collide(this.pin_physics_objects[i], this.pin_physics_objects[j])) {
                        console.log("did pin to pin collide, index " + i + " to index " + j);
                        this.score += 1 * score_multiplier;
                        score_multiplier *= 2;
                        this.do_collision(this.pin_physics_objects[i], this.pin_physics_objects[j]);
                    }
                }
            }
        }
    }

    handle_wall_collisions() {
        // check if the main ball has collided with walls
        this.do_wall_collision(this.bowling_ball_physics_object);

        // check if any pins have collided with the walls
        for (let i = 0; i < this.pin_physics_objects.length; i++) {
            if (!this.pin_physics_objects[i].force_vector.equals(Vec.of(0, 0, 0))) {
                this.do_wall_collision(this.pin_physics_objects[i]);
            }
        }
    }

    do_wall_collision(o) {
        this.wall_adjust_center(o);
        const center = o.get_center();
        const radius = o.radius;
        // collision with left wall
        if (center[0] - radius <= - this.floor_width / 2) {
            this.do_collision(o,
                new PhysicsObject(
                    this.floor_damping,
                    999,
                    Mat4.identity()
                        .times(Mat4.translation(Vec.of(center[0], center[1], center[2])))
                        .times(Mat4.translation(Vec.of(-radius, 0, 0))),
                    radius,
                    this.default_time_constant
                )
            )
        }
        // collision with right wall
        else if (center[0] + radius >= this.floor_width / 2) {
            this.do_collision(o,
                new PhysicsObject(
                    this.floor_damping,
                    999,
                    Mat4.identity()
                        .times(Mat4.translation(Vec.of(center[0], center[1], center[2])))
                        .times(Mat4.translation(Vec.of(radius, 0, 0))),
                    radius,
                    this.default_time_constant
                )
            )
        }
        // collision with bottom wall
        else if (center[2] + radius >= this.floor_height / 2) {
            this.do_collision(o,
                new PhysicsObject(
                    this.floor_damping,
                    999,
                    Mat4.identity()
                        .times(Mat4.translation(Vec.of(center[0], center[1], center[2])))
                        .times(Mat4.translation(Vec.of(0, 0, -radius))),
                    radius,
                    this.default_time_constant
                )
            )
        }
        // collision with top wall
        else if (center[2] - radius <= -this.floor_height/2) {
            this.do_collision(o,
                new PhysicsObject(
                    this.floor_damping,
                    999,
                    Mat4.identity()
                        .times(Mat4.translation(Vec.of(center[0], center[1], center[2])))
                        .times(Mat4.translation(Vec.of(0, 0, radius))),
                    radius,
                    this.default_time_constant
                )
            )
        }
    }

    wall_adjust_center(o) {
        const center = o.get_center();
        const radius = o.radius;
        // outside left wall bounds
        if (center[0] - radius <= - this.floor_width / 2) {
            o.transform[0][3] = - this.floor_width / 2 + radius - o.center[0];
        }
        // outside right wall bounds
        if (center[0] + radius >= this.floor_width / 2) {
            o.transform[0][3] = this.floor_width / 2 - radius - o.center[0] ;
        }
        // outside bottom wall bounds
        if (center[2] + radius >= this.floor_height / 2) {
            o.transform[2][3] = this.floor_height / 2 - radius - o.center[2];
        }
        // outside top wall bounds
        if (center[2] - radius <= -this.floor_height/2) {
            o.transform[2][3] = - this.floor_height / 2 + radius - o.center[2];
        }
    }

    sphere_to_sphere_adjust_center(o1, o2) {

    }

    toggle_slow_motion() {
        this.slow_motion_toggle = false;
        var new_time_constant;
        if (this.slow_motion) {
            this.slow_motion = false;
            new_time_constant = this.default_time_constant;
        }
        else {
            this.slow_motion = true;
            new_time_constant = this.slow_motion_time_constant;
        }
        this.bowling_ball_physics_object.time_constant = new_time_constant;
        for (let i = 0; i < this.pin_physics_objects.length; i++) {
            this.pin_physics_objects[i].time_constant = new_time_constant;
        }
    }

    display( graphics_state )
    { graphics_state.lights = this.lights;        // Use the lights stored in this.lights.

        if (this.slow_motion_toggle) {
            this.toggle_slow_motion();
        }

        const t = graphics_state.animation_time / 1000, dt = graphics_state.animation_delta_time / 1000;

        if (this.launch_left == 0 && !this.game_over) {
            this.game_over = true;
            this.last_launch_time = t;
        }

        if (this.launch_left > 0 || t < this.last_launch_time + 1) {
            if (this.reset) {
                this.reset_scene(graphics_state);
                this.reset = false;
            }
            this.draw_static_scene(graphics_state);

            this.draw_ball(graphics_state);

            this.draw_pins(graphics_state);

            if (!this.ball_launched) {
                this.arrow_angle =  Math.PI + (Math.PI / 1) * Math.sin(this.arrow_speed * t);
                this.draw_arrow(graphics_state, this.arrow_angle);
            }

            this.handle_ball_collisions();

            this.handle_wall_collisions();

            if (this.enable_collision_markers) {
                this.draw_collision_results(graphics_state);
            }

            this.update_camera_transform(graphics_state);


        }
        else {

            graphics_state.camera_transform = this.static_camera_positions[this.current_static_camera_position];
            this.shapes.score_text.set_string("  Your Score is " + this.score);
            this.shapes.score_text.draw(graphics_state,
                Mat4.identity().times(Mat4.identity()
                    .times(Mat4.scale([3, 3 ,3]))
                    .times(Mat4.rotation(- Math.PI  / 2 , Vec.of(1,0,0)))
                    .times(Mat4.rotation(Math.PI  / 10 * Math.sin(t), Vec.of(0,0,1)))
                    // .times(Mat4.rotation(-Math.PI * Math.sin(t ), Vec.of(1,0,1)))
                    .times(Mat4.translation([-15,0,0]))),
                this.materials.text);
        }


    }
}
