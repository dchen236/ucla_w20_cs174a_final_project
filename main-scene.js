window.Ten_Ball_Pool = window.classes.Ten_Ball_Pool =
    class Ten_Ball_Pool extends Scene_Component
    { constructor( context, control_box )     // The scene begins by requesting the camera, shapes, and materials it will need.
    { super(   context, control_box );    // First, include a secondary Scene that provides movement controls:
        this.context = context;
        if( !context.globals.has_controls   )
            context.register_scene_component( new Movement_Controls( context, control_box.parentElement.insertCell() ) );

        // graphics parameters
        this.forward_camera_transform = Mat4.look_at( Vec.of( 0,0,5 ), Vec.of( 0,-3,0 ), Vec.of( 0,1,0 ) )
            .times(Mat4.translation(Vec.of(0, -40, -70)));
        this.top_camera_transform = Mat4.look_at( Vec.of( 0,0,5 ), Vec.of( 0,-80,0 ), Vec.of( 0,1,0 ) )
            .times(Mat4.translation(Vec.of(0, -110, -2)));
        this.static_camera_positions = [this.forward_camera_transform, this.top_camera_transform];
        this.current_static_camera_position = 1;
        context.globals.graphics_state.camera_transform = this.static_camera_positions[this.current_static_camera_position];
        const r = context.width/context.height;
        context.globals.graphics_state.projection_transform = Mat4.perspective( Math.PI/4, r, .1, 1000 );
        this.floor_offset = 3;
        this.floor_thickness = .05;
        this.hole_radius = 3;
        const shapes = {
            cue_ball: new Subdivision_Sphere(5),
            floor: new Cube(),
            arrow: new Surface_Of_Revolution( 8, 8, Vec.cast(
                [0, 1, 0], [0, 1, 1], [0, 1, 2],
                [0, 1, 3], [0, 1, 4], [0, 2, 4],
                [0, 1, 5], [0, 0, 7]
            )),
            number_ball: new Subdivision_Sphere(5),
            score_text: new Text_Line(100),
            collision_guide: new Cube(),
            wall: new Cube(),
            // bounding cube is no longer used since we upgraded the skybox strategy
            bounding_cube: new Cube(),
            skybox: new Square_Map(50), //marker
            hole: new Hole(this.hole_radius, this.floor_offset - this.floor_thickness, 15, 15),
        };
        this.submit_shapes( context, shapes );
        this.materials = {
            // testing skybox
            // 1: context.get_instance(Phong_Shader).material( Color.of(0,0,0,1), {
            //     ambient: 1,
            //     texture: context.get_instance( "assets/casino_left_right", false )
            // } ),
            // 2: context.get_instance(Phong_Shader).material( Color.of(0,0,0,1), {
            //     ambient: 1,
            //     texture: context.get_instance( "assets/casino_left_right", false )
            // } ),
            3: context.get_instance(Phong_Shader).material( Color.of(0,0,0,1), {
                ambient: 1,
                texture: context.get_instance( "assets/casino_front_back.jpg", false )
            } ),
            4: context.get_instance(Phong_Shader).material( Color.of(0,0,0,1), {
                ambient: 1,
                texture: context.get_instance( "assets/casino_front_back.jpg", false )
            } ),
            5: context.get_instance(Phong_Shader).material( Color.of(0,0,0,1), {
                ambient: 1,
                texture: context.get_instance( "assets/casino_left_right.jpg", false ) } ),
            6: context.get_instance(Phong_Shader).material( Color.of(0,0,0,1), {
                ambient: 1,
                texture: context.get_instance( "assets/casino_left_right.jpg", false ) } ),

            skybox_front_back_dark: context.get_instance(Phong_Shader).material( Color.of(0,0,0,1), {
                 ambient: 1,
                 texture: context.get_instance( "assets/casino_front_back_dimmed.jpg", false )
            } ),
            skybox_left_right_dark: context.get_instance(Phong_Shader).material( Color.of(0,0,0,1), {
                ambient: 1,
                texture: context.get_instance( "assets/casino_left_right_dimmed.jpg", false )
            } ),

            cue_ball: context.get_instance( Phong_Shader ).material(Color.of(0, 0, 0, 1), {
                ambient: 0.8,
                texture: context.get_instance("assets/BallCue.jpg", true)
            }),
            floor: context.get_instance( Phong_Shader ).material(Color.of(0, 0, 0, 1), {
                ambient: 1,
                texture: context.get_instance("assets/green_felt.jpg", true)
            }),
            floor_dark: context.get_instance( Phong_Shader ).material(Color.of(0, 0, 0, 1), {
                ambient: 1,
                texture: context.get_instance("assets/green_felt_dimmed.jpg", true)
            }),
            arrow: context.get_instance( Phong_Shader ).material(Color.of(0, 0, 1, 0.8), {
                ambient: 1
            }),
            number_ball: context.get_instance (Phong_Shader ).material(Color.of(0, 0, 0, 1), {
                ambient: 0.8,
                texture: context.get_instance("assets/number_ball_texture.png", true)
            }),
            hole:context.get_instance (Phong_Shader ).material(Color.of(0, 0, 0, 1), {
                ambient: 0.8,
                specularity: 0,
                diffuse: 0
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
            wall_dark: context.get_instance( Phong_Shader ).material(Color.of(0, 0, 0, 1), {
                ambient: 1,
                texture: context.get_instance("assets/wood_texture_dimmed.jpg", true)
            }),
            bounding_cube: context.get_instance( Phong_Shader ).material(Color.of(0, 0, 0, 1), {
                ambient: 1,
                texture: context.get_instance("assets/casino.jpg", true)
            })
        };
        this.draw_table = true;

        // audios associated with the project
        this.collide_sound = new Audio("assets/collide_sound.mp3");
        this.casino_music = new Audio("assets/casino_music.mp3");
        this.music_playing = false;

        this.lights = [ new Light( Vec.of( 0,100,0,1 ), Color.of( 0,1,1,1 ), 1000000000 ) ];
        this.floor_width = 80;
        this.floor_height = 80;
        this.floor_transform =
            Mat4.identity()
                .times(Mat4.translation(Vec.of(0, -this.floor_offset, 0)))
                .times(Mat4.scale(Vec.of(this.floor_width / 2, this.floor_thickness / 2, this.floor_height / 2)));
        this.default_time_constant = 1.0;
        this.slow_motion_time_constant = 0.05;
        this.current_time_constant = this.default_time_constant;
        this.paused = false;
        this.collision_guide_length = 5;
        this.initial_collision_guide_transform =
            Mat4.identity()
                .times(Mat4.translation(Vec.of(0, 3, this.collision_guide_length / 2)))
                .times(Mat4.scale(Vec.of(0.1, 0.1, this.collision_guide_length / 2)));
        this.score = 0;
        this.last_launch_time = 60 * 10;
        this.game_over = false;

        // game parameters
        this.arrow_speed = 1.5;
        this.ball_speed = .10;
        this.floor_damping = 0.0000275;
        this.cue_ball_damping = this.floor_damping;
        this.number_ball_damping = this.floor_damping;
        this.ball_mass = 1;
        this.number_ball_mass = 2;
        this.cue_ball_radius = 2;
        this.number_ball_radius = 2;
        this.num_number_balls = 0;
        this.collide_adjust = -this.number_ball_radius;
        this.launch_left = 5;
        this.arrow_speed = 2;
        this.number_ball_fell_into_hole = [];
        // game state
        this.cue_ball_transform = Mat4.identity();
        this.initial_cue_ball_transform =
            Mat4.identity()
                .times(Mat4.scale(Vec.of(this.cue_ball_radius, this.cue_ball_radius, this.cue_ball_radius)));
        this.cue_ball_physics_object =
            new PhysicsObject(
                this.cue_ball_damping,
                this.ball_mass,
                Mat4.identity(),
                this.cue_ball_radius,
                this.default_time_constant,
                "launch ball",
                Mat4.identity()
                    .times(Mat4.translation(Vec.of(0, 0, 10))));
        this.number_ball_physics_objects = [];
        this.hole_physics_objects = [];
        this.base_number_ball_transform =
            Mat4.identity()
                .times(Mat4.scale(Vec.of(this.number_ball_radius, this.number_ball_radius, this.number_ball_radius)))
                .times(Mat4.rotation(Math.PI / 2, Vec.of(1, 0, 0)));
        this.initial_number_ball_transforms = [];
        this.hole_transforms = [];
        this.lock_camera_on_ball = false;
        this.lock_camera_on_number_ball = false;
        this.lock_camera_behind_ball = false;
        this.number_ball_camera_index = 0;
        this.initial_camera_reset = false;
        this.arrow_angle = 0;
        this.ball_launched = false;
        this.reset = false;
        this.dark_mode = false;

        // testing state
        this.collision_results = new Array();
        this.max_collision_results_history_size = 10;
        this.enable_collision_markers = false;
        this.collision_guide_colors = [
            [Color.of(1, 0, 0, 1), Color.of(0, 1, 0, 1), Color.of(0, 0, 1, 1)], // normal, collision, reflection colors for o1
            [Color.of(1, 1, 0, 1), Color.of(0, 1, 1, 1), Color.of(1, 0, 1, 1)] // normal, collision, reflection colors for o2
        ];
        this.free_play_mode = true;
        this.slow_motion_toggle = true;
        this.slow_motion = true;
        this.auto_pause_on_collision_toggle = true;
        this.auto_pause_on_collision = true;
        this.found_hole_collision = false;

        // initializations
        this.initialize_triangle_number_balls();
        this.initialize_holes();

    }

    initialize_triangle_number_balls() {
        let ball_spacing = 3.25;
        let x_initial = 0;
        let z_initial = -5;
        let triangle_height = 0;
        let i = 0;
        this.num_number_balls = 0;

        for (let z = z_initial; z > z_initial - triangle_height; z--) {
            for (let x = x_initial - (z_initial - z); x < (1 + 2 * (z_initial - z))/2; x+=2) {
                console.log("spawning number_ball at " + "[" + x + ", " + z + "]");
                let number_ball_transform = Mat4.identity()
                    .times(Mat4.translation(Vec.of(x * ball_spacing, 0, z * ball_spacing)))
                    .times(this.base_number_ball_transform);
                this.initial_number_ball_transforms[i] = number_ball_transform;
                this.number_ball_physics_objects[i] =
                    new PhysicsObject(
                        this.number_ball_damping,
                        this.number_ball_mass,
                        number_ball_transform,
                        this.number_ball_radius,
                        this.default_time_constant,
                        "number_ball " + (i + 1),
                        Mat4.identity());
                this.number_ball_fell_into_hole[i] = false;
                this.num_number_balls++;
                i++;
            }
        }
    }

    make_control_panel()
    {
        this.key_triggered_button("Launch Ball", ["k"], () => {
            if(!this.music_playing){
                this.casino_music.play();
                this.music_playing = true;
            }

            if (!this.ball_launched && this.launch_left > 0) {
                if (!this.free_play_mode) {
                    this.launch_left -= 1;
                }
                // this.ball_launched = true;
                console.log("---");
                console.log("Ball launched at angle (Radians): " + this.arrow_angle);
                this.cue_ball_physics_object.apply_force(
                    Vec.of(this.arrow_angle, 0, this.ball_speed)
                );
                this.collide_sound.play();
                console.log("---");

            }
        });
        this.new_line();
        this.key_triggered_button("Lock Camera On Main Ball", ["i"], () => {
                this.lock_camera_on_ball = !this.lock_camera_on_ball;
                this.lock_camera_on_number_ball = false;
                this.lock_camera_behind_ball = false;
            }
        );
        this.new_line();
        this.key_triggered_button("Lock Camera Behind Main Ball", ["u"], () => {
                this.lock_camera_behind_ball = !this.lock_camera_behind_ball;
                this.lock_camera_on_ball = false;
                this.lock_camera_on_number_ball = false;
            }
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
        this.key_triggered_button("Reset Game", ["l"], () =>
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
        this.new_line();
        this.key_triggered_button("Toggle party mode", ["y"], () =>
            this.dark_mode = !this.dark_mode
        );
        this.new_line();
        this.key_triggered_button("Pause", ["p"], () =>
            this.paused = !this.paused
        );
        this.new_line();
        this.key_triggered_button("Toggle auto-pause on collision", ["["], () =>
            this.auto_pause_on_collision_toggle = true
        );
        this.new_line();
        this.key_triggered_button("Focus camera on number_ball", ["]"], () => {
                this.lock_camera_on_ball = false;
                this.lock_camera_behind_ball = false;
                if (this.lock_camera_on_number_ball) {
                    if (this.number_ball_camera_index >= this.num_number_balls) {
                        this.number_ball_camera_index = 0;
                    }
                    else {
                        this.number_ball_camera_index++;
                    }
                }
                else {
                    this.lock_camera_on_number_ball = true;
                }
            }
        );
        this.key_triggered_button("Toggle table", ["q"], () =>
            this.draw_table = !this.draw_table
        );
        this.new_line();
    }

    update_camera_transform(graphics_state) {
        var desired;
        const blending_factor = 0.1;
        if(this.lock_camera_behind_ball){
            this.initial_camera_reset = true;
            desired =
                Mat4.inverse(
                    this.cue_ball_transform
                        .times(Mat4.translation(Vec.of(0, 5, 20)))
                );
            graphics_state.camera_transform =
                desired.map((x, i) =>
                    Vec.from(graphics_state.camera_transform[i]).mix(x, blending_factor));
        }
        else if (this.lock_camera_on_ball) {
            this.initial_camera_reset = true;
            desired =
                Mat4.inverse(
                    this.cue_ball_transform
                        .times(Mat4.translation(Vec.of(0, 20, 0)))
                        .times(Mat4.rotation(- Math.PI / 2, Vec.of(1, 0, 0)))
                );
            graphics_state.camera_transform =
                desired.map((x, i) =>
                    Vec.from(graphics_state.camera_transform[i]).mix(x, blending_factor));
        }
        else if (this.lock_camera_on_number_ball) {
            this.initial_camera_reset = true;
            desired =
                Mat4.inverse(
                    this.number_ball_physics_objects[this.number_ball_camera_index].transform
                        .times(this.initial_number_ball_transforms[this.number_ball_camera_index])
                        .times(Mat4.translation(Vec.of(0, 0, -10)))
                        .times(Mat4.rotation(Math.PI, Vec.of(1, 0, 0)))
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
        this.found_hole_collision = false;
        this.slow_motion_toggle = true;
        this.slow_motion = true;
        this.collision_results = [];
        this.cue_ball_transform = Mat4.identity();
        this.cue_ball_physics_object.reset();
        this.ball_launched = false;
        graphics_state.camera_transform = this.static_camera_positions[this.current_static_camera_position];
        for (let i = 0; i < this.num_number_balls; i++) {
            this.number_ball_physics_objects[i].reset();
         //   console.log("number_ball " + i + " :" + this.number_ball_physics_objects[i].center);
        }
        // console.log("ball: " + this.cue_ball_physics_object.center);

    }
    draw_skybox(graphics_state,k,t,disable_front_wall){
        for( var i = 0; i < 3; i++ )
            for( var j = 0; j < 2; j++ )
            {
                k += 1;
                if ( k!= 1 && k != 2) {
                    if (disable_front_wall && k == 5)
                        continue;
                    let square_transform = Mat4.rotation( i == 0 ? Math.PI/2 : 0, Vec.of(1, 0, 0) )
                        .times( Mat4.rotation( Math.PI * j - ( i == 1 ? Math.PI/2 : 0 ), Vec.of( 0, 1, 0 ) ) )
                        .times( Mat4.rotation(  k > 2 ? t/10 : 0, Vec.of( 0, 1, 0 ) ) )
                        .times( Mat4.translation([ 0, 0,50]) );
                    // .times(Mat4.scale(Vec.of(0.5, 0.5, 0.5)));//marker
                    if (!this.dark_mode) {
                        this.shapes.skybox.draw(graphics_state, square_transform, this.materials[k]);
                    } else {
                        if ( k === 3 || k === 4) {
                            this.shapes.skybox.draw(graphics_state, square_transform, this.materials.skybox_front_back_dark);
                        } else {
                            this.shapes.skybox.draw(graphics_state, square_transform, this.materials.skybox_left_right_dark);
                        }
                    }
                }

            }
    }


    draw_static_scene(graphics_state) {
        // let scale_factor = 200;
        // this.bounding_cube_transform =  Mat4.identity().times(Mat4.scale(Vec.of(scale_factor,scale_factor,scale_factor)));
        // this.shapes.bounding_cube.draw(
        //     graphics_state,
        //     this.bounding_cube_transform,
        //     this.materials.bounding_cube
        // );

        this.draw_holes(graphics_state);

        if (this.draw_table) {
            if (!this.dark_mode) {
                this.shapes.floor.draw(
                    graphics_state,
                    this.floor_transform,
                    this.materials.floor
                );
            } else {
                this.shapes.floor.draw(
                    graphics_state,
                    this.floor_transform,
                    this.materials.floor_dark
                );
            }
        }


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

        if (!this.dark_mode) {
            this.shapes.wall.draw(
                graphics_state,
                this.wall_transform_north,
                this.materials.wall
            );
        } else {
            this.shapes.wall.draw(
                graphics_state,
                this.wall_transform_north,
                this.materials.wall_dark
            );
        }

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
        var disable_front_wall = false;
        if (this.current_static_camera_position == 0)
            disable_front_wall = true;
        this.draw_skybox(graphics_state,0, 0, disable_front_wall);
    }

    draw_arrow(graphics_state, arrow_angle) {
        var transform;
        if (this.paused) {
            transform = this.cue_ball_physics_object.transform;
        }
        else {
            transform = this.cue_ball_physics_object.update_and_get_transform(graphics_state);
        }
        this.shapes.arrow.draw(
            graphics_state,
            transform
                .times(Mat4.scale(Vec.of(0.5, 0.5, 1)))
                .times(Mat4.rotation(arrow_angle, Vec.of(0, 1, 0))),
            this.materials.arrow
        );
    }

    draw_ball(graphics_state) {
        var transform;
        if (this.paused) {
            transform = this.cue_ball_physics_object.transform;
        }
        else {
            transform = this.cue_ball_physics_object.update_and_get_transform(graphics_state);
        }
        this.cue_ball_transform =
            transform.times(this.initial_cue_ball_transform);
        this.shapes.cue_ball.draw(
            graphics_state,
            this.cue_ball_transform,
            this.materials.cue_ball
        );
    }

    draw_number_balls(graphics_state) {
        for (let i = 0; i < this.number_ball_physics_objects.length; i++) {
            if (!this.number_ball_fell_into_hole[i]) {
                let image_filename = this.determine_number_ball_texture(i);
                let material =
                    this.materials.billiards_ball.override({texture: this.context.get_instance(image_filename, true)});
                var transform;
                if (this.paused) {
                    transform = this.number_ball_physics_objects[i].transform;
                }
                else {
                    transform = this.number_ball_physics_objects[i].update_and_get_transform(graphics_state);
                }
                this.shapes.number_ball.draw(
                    graphics_state,
                    transform.times(this.initial_number_ball_transforms[i]),
                    material
                );
            }

        }
    }

    initialize_holes() {
        for (let i = 0; i < 3; i++) {
            const wall_offset = 1;
            let z_coordinate = this.floor_height / 2 - (this.floor_height / 2) * i;
            if (z_coordinate != 0)
                z_coordinate += - z_coordinate / Math.abs(z_coordinate) * (this.hole_radius + wall_offset);

            let left_hole_transformation = Mat4.identity().times(
                Mat4.translation([-this.floor_width / 2 + (this.hole_radius + wall_offset), 0, z_coordinate])
            );

            let right_hole_transformation = Mat4.identity().times(
                Mat4.translation([this.floor_width / 2 - (this.hole_radius + wall_offset), 0, z_coordinate])
            );
            this.hole_physics_objects.push(new PhysicsObject(this.number_ball_damping,
                this.number_ball_mass,
                left_hole_transformation, this.hole_radius, this.default_time_constant,
                "hole " + (i + 1),
                Mat4.identity())
            );
            this.hole_physics_objects.push(new PhysicsObject(this.number_ball_damping,
                this.number_ball_mass,
                right_hole_transformation, this.hole_radius, this.default_time_constant,
                "hole " + (i + 2),
                Mat4.identity())
            );
            this.hole_transforms.push(left_hole_transformation);
            this.hole_transforms.push(right_hole_transformation);
        }
    }

    draw_holes(graphics_state) {
        for (let i = 0; i < this.hole_transforms.length; i++) {
            this.shapes.hole.draw(
                graphics_state,
                this.hole_transforms[i],
                this.materials.hole
            );
        }
    }

    determine_number_ball_texture(i) {
        if(i === 0){
            return `assets/ball_1.jpg`;
        }
        else if(i === 1){
            return `assets/ball_5.jpg`;
        }
        else if(i === 2){
            return `assets/ball_9.jpg`;
        }
        else if(i === 3){
            return `assets/ball_4.jpg`;
        }
        else if(i === 4){
            return `assets/ball_10.jpg`;
        }
        else if(i === 5){
            return `assets/ball_3.jpg`;
        }
        else if(i === 6){
            return `assets/ball_2.jpg`;
        }
        else if(i === 7){
            return `assets/ball_6.jpg`;
        }
        else if(i === 8){
            return `assets/ball_8.jpg`;
        }
        else if(i === 9){
            return `assets/ball_7.jpg`;
        }
        else{
            return 'none';
        }
    }

    draw_collision_results(graphics_state) {
        for (let i = 0; i < this.collision_results.length; i++) {
            for (let j = 0; j < 2; j++) {
                const o_info = this.collision_results[i][j];
                if (o_info != undefined) {
                    this.shapes.collision_guide.draw(
                        graphics_state,
                        Mat4.identity()
                            .times(o_info[0])
                            .times(o_info[1])
                            .times(this.initial_collision_guide_transform),
                        this.materials.collision_guide.override({
                            color: this.collision_guide_colors[j][0]
                        })
                    );
                    this.shapes.collision_guide.draw(
                        graphics_state,
                        Mat4.identity()
                            .times(o_info[0])
                            .times(o_info[2])
                            .times(this.initial_collision_guide_transform),
                        this.materials.collision_guide.override({
                            color: this.collision_guide_colors[j][1]
                        })
                    );
                    this.shapes.collision_guide.draw(
                        graphics_state,
                        Mat4.identity()
                            .times(o_info[0])
                            .times(o_info[3])
                            .times(this.initial_collision_guide_transform)
                            .times(Mat4.translation(Vec.of(0, 0.5, 0))),
                        this.materials.collision_guide.override({
                            color: this.collision_guide_colors[j][2]
                        })
                    );
                }
            }
        }

    }

    get_distance(p1, p2) {
        let xs = p1[0] - p2[0];
        //let ys = p1[1] - p2[1];
        let zs = p1[2] - p2[2];
        return Math.sqrt(xs * xs + zs * zs);
    }

    check_if_collide(o1, o2, use_collide_adjust) {
        let o1_center = o1.get_center();
        let o2_center = o2.get_center();
        let distance = this.get_distance(o1_center, o2_center);
        //
        // console.log(
        //     "collision check for [" + o1.object_tag + "] and [" + o2.object_tag + "]: " + "\n" +
        //     o1.object_tag + " center: " + o1_center  + "\n" +
        //     o2.object_tag + " center: " + o2_center + "\n" +
        //     o1.object_tag + " radius: " + o1.radius + "\n" +
        //     o2.object_tag + " radius: " + o2.radius + "\n" +
        //     "distance: " + distance
        // );

        const found_collision = distance <= o1.radius + o2.radius + (use_collide_adjust? this.collide_adjust : 0);
        if (found_collision) {
            console.log("found collision between [" + o1.object_tag + "] and [" + o2.object_tag + "]: " + "\n" +
                            o1.object_tag + " center: " + o1_center  + "\n" +
                            o2.object_tag + " center: " + o2_center + "\n" +
                            o1.object_tag + " radius: " + o1.radius + "\n" +
                            o2.object_tag + " radius: " + o2.radius + "\n" +
                            "distance: " + distance
            );
        }
        return found_collision;
    }

    do_collision(o1, o2, wall_collision) {
        const collision_result = PhysicsObject.calculate_elastic_collision(o1, o2, !wall_collision);
        this.collision_results.push(collision_result);
        while (this.collision_results.length > this.max_collision_results_history_size) {
            this.collision_results.shift();
        }
        if (!wall_collision) {
            if (this.auto_pause_on_collision) {
                this.paused = true;
            }
        }
    }

    handle_ball_collisions() {
        // check if ball collide 0th number_ball
        let score_multiplier = 1;
        for (let i = 0; i < this.number_ball_physics_objects.length; i++) {
            if (this.check_if_collide(this.cue_ball_physics_object, this.number_ball_physics_objects[i], false) ) {
                console.log("did ball to number_ball collide");
                this.do_collision(this.cue_ball_physics_object, this.number_ball_physics_objects[i], false);
            }
        }
        for (let i = 0; i < this.number_ball_physics_objects.length - 1; i++) {
            for (let j = i + 1; j < this.number_ball_physics_objects.length; j++) {
                if (!this.number_ball_physics_objects[i].force_vector.equals(Vec.of(0, 0, 0)) ||
                    !this.number_ball_physics_objects[j].force_vector.equals(Vec.of(0, 0, 0))) {
                    if (this.check_if_collide(this.number_ball_physics_objects[i], this.number_ball_physics_objects[j], false)) {
                        this.do_collision(this.number_ball_physics_objects[i], this.number_ball_physics_objects[j], false);
                    }
                }
            }
        }
    }

    handle_wall_collisions() {
        // check if the main ball has collided with walls
        this.do_wall_collision(this.cue_ball_physics_object);

        // check if any number_balls have collided with the walls
        for (let i = 0; i < this.number_ball_physics_objects.length; i++) {
            if (!this.number_ball_physics_objects[i].force_vector.equals(Vec.of(0, 0, 0))) {
                this.do_wall_collision(this.number_ball_physics_objects[i]);
            }
        }
    }

    handle_hole_collisions() {
        for (let i = 0; i < this.hole_transforms.length; i++) {
            if (this.check_if_collide(this.cue_ball_physics_object, this.hole_physics_objects[i], true)) {
                this.cue_ball_physics_object.enable_gravity();
                if (!this.found_hole_collision) {
                    this.found_hole_collision = true;
                    this.slow_motion_toggle = true;
                    // this.cue_ball_physics_object.force_vector = Vec.of(
                    //     this.cue_ball_physics_object.force_vector[0],
                    //     this.cue_ball_physics_object.force_vector[1],
                    //     this.cue_ball_physics_object.force_vector[2] * .5
                    // )
                }
            }
        }
    }

    do_wall_collision(o) {
        this.wall_adjust_center(o);
        const center = o.get_center();
        const radius = o.radius;
        // collision with left wall
        if (center[0] - radius <= - this.floor_width / 2) {
            this.do_collision(
                o,
                new PhysicsObject(
                    this.floor_damping,
                    999,
                    Mat4.identity()
                        .times(Mat4.translation(Vec.of(center[0], center[1], center[2])))
                        .times(Mat4.translation(Vec.of(-radius, 0, 0))),
                    radius,
                    this.default_time_constant,
                    "phantom ball (left wall)",
                    Mat4.identity()
                ),
                true
            )
        }
        // collision with right wall
        else if (center[0] + radius >= this.floor_width / 2) {
            this.do_collision(
                o,
                new PhysicsObject(
                    this.floor_damping,
                    999,
                    Mat4.identity()
                        .times(Mat4.translation(Vec.of(center[0], center[1], center[2])))
                        .times(Mat4.translation(Vec.of(radius, 0, 0))),
                    radius,
                    this.default_time_constant,
                    "phantom ball (right wall)",
                    Mat4.identity()
                ),
                true
            )
        }
        // collision with bottom wall
        else if (center[2] + radius >= this.floor_height / 2) {
            this.do_collision(
                o,
                new PhysicsObject(
                    this.floor_damping,
                    999,
                    Mat4.identity()
                        .times(Mat4.translation(Vec.of(center[0], center[1], center[2])))
                        .times(Mat4.translation(Vec.of(0, 0, -radius))),
                    radius,
                    this.default_time_constant,
                    "phantom ball (bottom wall)",
                    Mat4.identity()
                ),
                true
            )
        }
        // collision with top wall
        else if (center[2] - radius <= -this.floor_height/2) {
            this.do_collision(
                o,
                new PhysicsObject(
                    this.floor_damping,
                    999,
                    Mat4.identity()
                        .times(Mat4.translation(Vec.of(center[0], center[1], center[2])))
                        .times(Mat4.translation(Vec.of(0, 0, radius))),
                    radius,
                    this.default_time_constant,
                    "phantom ball (top wall)",
                    Mat4.identity()
                ),
                true
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

    toggle_slow_motion() {
        this.slow_motion_toggle = false;
        if (this.slow_motion) {
            this.slow_motion = false;
            this.current_time_constant = this.default_time_constant;
        }
        else {
            this.slow_motion = true;
            this.current_time_constant = this.slow_motion_time_constant;
        }
        this.cue_ball_physics_object.time_constant = this.current_time_constant;
        for (let i = 0; i < this.number_ball_physics_objects.length; i++) {
            this.number_ball_physics_objects[i].time_constant = this.current_time_constant;
        }
    }

    toggle_auto_pause_on_collision() {
        this.auto_pause_on_collision_toggle = false;
        this.auto_pause_on_collision = !this.auto_pause_on_collision;
    }

    display( graphics_state )
    {
        graphics_state.lights = this.lights;        // Use the lights stored in this.lights.

        if (this.slow_motion_toggle) {
            this.toggle_slow_motion();
        }

        if (this.auto_pause_on_collision_toggle) {
            this.toggle_auto_pause_on_collision();
        }

        const t = graphics_state.animation_time / 1000, dt = graphics_state.animation_delta_time / 1000;

        // if (this.launch_left == 0 && !this.game_over) {
        //     this.game_over = true;
        //     this.last_launch_time = t;
        // }

        // if (this.launch_left > 0 || t < this.last_launch_time + 1) {
        if (! this.game_over) {
            if (this.reset) {
                this.reset_scene(graphics_state);
                this.reset = false;
            }
            this.draw_static_scene(graphics_state);

            this.draw_ball(graphics_state);

            this.draw_number_balls(graphics_state);

            if (!this.ball_launched) {
                if (!this.paused) {
                    this.arrow_angle += this.arrow_speed * Math.sin(this.arrow_speed * dt) * this.current_time_constant;
                    if (this.arrow_angle >= 2 * Math.PI) {
                        this.arrow_angle = 0;
                    }
                }
                this.draw_arrow(graphics_state, this.arrow_angle);
            }

            if (!this.paused) {
                this.handle_ball_collisions();
                this.handle_wall_collisions();
                this.handle_hole_collisions();
            }

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

window.Hole = window.classes.Hole =
class Hole extends Shape {
    constructor(radius, floor_offset, rows, columns, texture_range) {
        super( "positions", "normals", "texture_coords" );

        const hole_radius = radius;
        const hole_height = 10;
        const hole_vertical_offset = floor_offset + hole_height / 2;

        Cylindrical_Tube.insert_transformed_copy_into(
            this,
            [15, 15, texture_range],
            Mat4.identity()
                .times(Mat4.translation(Vec.of(0, -hole_vertical_offset, 0)))
                .times(Mat4.scale(Vec.of(hole_radius, hole_height / 2, hole_radius)))
                .times(Mat4.rotation(Math.PI / 2, Vec.of(1, 0, 0)))
        );

        Grid_Sphere.insert_transformed_copy_into(
            this,
            [10, 10, texture_range],
            Mat4.identity()
                .times(Mat4.translation(Vec.of(0, hole_height/2 - hole_vertical_offset, 0)))
                .times(Mat4.scale(Vec.of(hole_radius, 0.001, hole_radius)))
        );

    }
};