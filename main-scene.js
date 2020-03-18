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

        // Set up shadow mapping
        this.webgl_manager = context;      // Save off the Webgl_Manager object that created the scene.
        this.scratchpad = document.createElement('canvas');
        this.scratchpad_context = this.scratchpad.getContext('2d');     // A hidden canvas for re-sizing the real canvas to be square.
        this.scratchpad.width   = 256;
        this.scratchpad.height  = 256;
        this.texture = new Texture ( context.gl, "", false, false );        // Initial image source: Blank gif file
        this.texture.image.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

        this.floor_offset = 2;
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
            stick: new Shape_From_File("assets/billiards_cue_stick.obj"),
            number_ball: new Subdivision_Sphere(5),
            score_text: new Text_Line(100),
            collision_guide: new Cube(),
            power_indicator: new Cube(),
            wall: new Cube(),
            // bounding cube is no longer used since we upgraded the skybox strategy
            bounding_cube: new Cube(),
            skybox: new Square_Map(50), //marker
            hole: new Hole(this.hole_radius, this.floor_offset - this.floor_thickness, 15, 15),
            sign: new Cube()
        };
        this.submit_shapes( context, shapes );
        this.materials = {
            phong: context.get_instance( Phong_Shader ).material( Color.of( 222/ 255,184 / 255, 135 / 255,1 ), {ambient: 0.5, diffusivity: 1, specularity : 0,}),
            phong_opaque: context.get_instance( Phong_Shader ).material( Color.of( 222/ 255,184 / 255, 135 / 255,0 ), {ambient: 0.5, diffusivity: 1, specularity : 0,}),
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
                texture: context.get_instance( "assets/wall_back_ground_256x256.jpg", false )
            } ),
            4: context.get_instance(Phong_Shader).material( Color.of(0,0,0,1), {
                ambient: 1,
                texture: context.get_instance( "assets/wall_back_ground_256x256.jpg", false )
            } ),
            5: context.get_instance(Phong_Shader).material( Color.of(0,0,0,1), {
                ambient: 1,
                texture: context.get_instance( "assets/wall_back_ground_256x256.jpg", false ) } ),
            6: context.get_instance(Phong_Shader).material( Color.of(0,0,0,1), {
                ambient: 1,
                texture: context.get_instance( "assets/wall_back_ground_256x256.jpg", false ) } ),

            skybox_front_back_dark: context.get_instance(Phong_Shader).material( Color.of(0,0,0,1), {
                 ambient: 1,
                 texture: context.get_instance( "assets/casino_front_back_dimmed.jpg", false )
            } ),
            skybox_left_right_dark: context.get_instance(Phong_Shader).material( Color.of(0,0,0,1), {
                ambient: 1,
                texture: context.get_instance( "assets/casino_left_right_dimmed.jpg", false )
            } ),
            shadow_light: context.get_instance(Shadow_Shader).material( Color.of(0, 70/255, 0, 1 ), {
                ambient: 1,
                texture: this.texture,
            } ),
            shadow_dark: context.get_instance(Reflection_Shader).material( Color.of(0, 30/255, 0, 1 ), {
                ambient: 1,
                texture: this.texture,
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
            arrow: context.get_instance( Phong_Shader ).material(Color.of(0, 0, 0, 0.8), {
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
            }),
            power_indicator: context.get_instance( Phong_Shader ).material(Color.of(1, 1, 1, 1), {
                ambient: 1,
                diffuse: 0,
                specularity: 0
            }),
            sign_material: context.get_instance(Phong_Shader).material(Color.of(0,0,0,1), {
                ambient: 1,
                diffusivity: 0,
                specularity: 0,
                texture: context.get_instance("assets/loading_screen.jpg", false)
            })
        };
        this.draw_table = true;

        // audios associated with the project
        this.collide_sound = new Audio("assets/collide_sound.mp3");
        this.casino_music = new Audio("assets/casino_music.mp3");
        this.music_playing = false;

        this.lights = [ new Light( Vec.of( 0, 0, 0, 1 ), Color.of( 0,1,1,1 ), 1000000000 ) ];
        this.floor_width = 100;
        this.floor_height = 89;
        this.floor_transform =
            Mat4.identity()
                .times(Mat4.translation(Vec.of(0, -this.floor_offset, 0)))
                .times(Mat4.scale(Vec.of(this.floor_width / 2, this.floor_thickness / 2, this.floor_height / 2)));
        this.reverse_floor_transform =
            Mat4.identity()
                .times(Mat4.translation(Vec.of(0, -this.floor_offset, 0)))
                .times(Mat4.scale(Vec.of(-1 * this.floor_width / 2, this.floor_thickness / 2, this.floor_height / 2)));
        this.default_time_constant = 1.0;
        this.slow_motion_time_constant = 0.10;
        this.current_time_constant = this.default_time_constant;
        this.paused = false;
        this.collision_guide_length = 5;
        this.initial_collision_guide_transform =
            Mat4.identity()
                .times(Mat4.translation(Vec.of(0, 3, this.collision_guide_length / 2)))
                .times(Mat4.scale(Vec.of(0.1, 0.1, this.collision_guide_length / 2)));
        this.score = 0;
        this.last_launch_time = 0;
        this.game_over = false;

        // game parameters
        this.game_started = false;
        this.arrow_speed = 1.5;
        this.max_ball_speed = .15;
        this.min_ball_speed = 0;
        this.ball_speed = this.min_ball_speed;
        this.floor_damping = 0.0000025;
        this.cue_ball_damping = this.floor_damping;
        this.number_ball_damping = this.floor_damping;
        this.cue_ball_mass = 2;
        this.number_ball_mass = 2;
        this.cue_ball_radius = 2;
        this.number_ball_radius = 2;
        this.num_number_balls = 0;
        this.collide_adjust = -this.number_ball_radius * 2;
        this.launch_left = 5;
        this.arrow_speed = 2;
        this.number_ball_fell_into_hole = [];
        // game state
        this.user_just_launched_ball = false;
        this.cue_ball_transform = Mat4.identity();
        this.cue_ball_hole_capture = undefined;
        this.initial_cue_ball_transform =
            Mat4.identity()
                .times(Mat4.scale(Vec.of(this.cue_ball_radius, this.cue_ball_radius, this.cue_ball_radius)));
        this.cue_ball_physics_object =
            new PhysicsObject(
                this.cue_ball_damping,
                this.cue_ball_mass,
                Mat4.identity(),
                this.cue_ball_radius,
                this.default_time_constant,
                "launch ball",
                Mat4.identity()
                    .times(Mat4.translation(Vec.of(0, 0, 10))));
        this.number_ball_physics_objects = [];
        this.number_ball_hole_captures = [];
        this.hole_physics_objects = [];
        this.base_number_ball_transform =
            Mat4.identity()
                .times(Mat4.scale(Vec.of(this.number_ball_radius, this.number_ball_radius, this.number_ball_radius)))
                .times(Mat4.rotation(Math.PI / 2, Vec.of(1, 0, 0)));
        this.base_stick_transform =
            Mat4.identity()
                .times(Mat4.rotation(3 * Math.PI / 2, Vec.of(0, 1, 0)))
                .times(Mat4.translation(Vec.of(0, this.cue_ball_radius, 0)));
        this.base_power_indicator_transform =
            Mat4.identity()
                .times(Mat4.scale(Vec.of(0.5, 0.1, 1)))
                .times(Mat4.translation(Vec.of(0, 4 * this.cue_ball_radius, 0)));
        this.sign_transform = Mat4.identity().times(Mat4.translation(Vec.of(0, 0, -500)));

        this.initial_number_ball_transforms = [];
        this.number_ball_rotation_transforms = [];
        this.hole_transforms = [];
        this.lock_camera_on_ball = false;
        this.lock_camera_on_number_ball = false;
        this.lock_camera_behind_ball = false;
        this.number_ball_camera_index = 0;
        this.initial_camera_reset = false;
        this.arrow_angle = Math.PI;
        this.ball_launched = false;
        this.reset = false;
        this.dark_mode = false;
        this.stick_adjustment_constant = 150;
        this.arrow_launch_power_mode = false;

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

        // initializations
        this.initialize_triangle_number_balls();
        this.initialize_holes();
    }

    initialize_triangle_number_balls() {
        let ball_spacing = 3.25;
        let x_initial = 0;
        let z_initial = -5;
        let triangle_height = 4;
        let i = 0;
        this.num_number_balls = 0;

        for (let z = z_initial; z > z_initial - triangle_height; z--) {
            for (let x = x_initial - (z_initial - z); x < x_initial + (1 + 2 * (z_initial - z))/2; x+=2) {
                console.log("spawning number_ball at " + "[" + x + ", " + z + "]");
                let number_ball_transform = Mat4.identity()
                    .times(Mat4.translation(Vec.of(x * ball_spacing, 0, z * ball_spacing)))
                    .times(this.base_number_ball_transform);
                this.initial_number_ball_transforms[i] = number_ball_transform;
                this.number_ball_rotation_transforms[i] = Mat4.identity();
                this.number_ball_physics_objects[i] =
                    new PhysicsObject(
                        this.number_ball_damping,
                        this.number_ball_mass,
                        number_ball_transform,
                        this.number_ball_radius,
                        this.default_time_constant,
                        "number_ball " + (i + 1),
                        Mat4.identity());
                this.number_ball_hole_captures[i] = undefined;
                this.number_ball_fell_into_hole[i] = false;
                this.num_number_balls++;
                i++;
            }
        }

        console.log("number of balls: " + this.num_number_balls);
    }

    make_control_panel()
    {
        this.key_triggered_button("Start Game", ["1"], () => {
            this.game_started = true;
        });
        this.new_line();
        this.key_triggered_button("Launch Ball", ["k"], () => {
            if(!this.music_playing){
                this.casino_music.play();
                this.music_playing = true;
            }

            if (this.arrow_launch_power_mode) {
                this.arrow_launch_power_mode = false;
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
                    this.user_just_launched_ball = true
                }
            }
            else {
                this.arrow_launch_power_mode = true;
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
        // this.new_line();
        // this.key_triggered_button("Toggle auto-pause on collision", ["b"], () =>
        //     this.auto_pause_on_collision_toggle = true
        // );
        this.new_line();
        this.key_triggered_button("Focus camera on number_ball", ["e"], () => {
                this.lock_camera_on_ball = false;
                this.lock_camera_behind_ball = false;
                if (this.lock_camera_on_number_ball) {
                    if (this.number_ball_camera_index >= this.num_number_balls - 1) {
                        this.number_ball_camera_index = 0;
                    }
                    else {
                        this.number_ball_camera_index++;
                        console.log(
                            "this.num_number_balls: " + this.num_number_balls + "\n" +
                            "this.number_ball_camera_index: " + this.number_ball_camera_index
                        );
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
        this.key_triggered_button("Move stick to left", ["c"], () => {
                this.arrow_angle -= this.arrow_speed * Math.PI / this.stick_adjustment_constant;
                this.arrow_angle = PhysicsObject.normalize_angle(this.arrow_angle);
            }
        );
        this.new_line();
        this.key_triggered_button("Move stick to right", ["v"], () => {
                this.arrow_angle += this.arrow_speed * Math.PI / this.stick_adjustment_constant;
                this.arrow_angle = PhysicsObject.normalize_angle(this.arrow_angle);
            }
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
        this.slow_motion_toggle = true;
        this.slow_motion = true;
        this.collision_results = [];
        this.cue_ball_transform = Mat4.identity();
        this.cue_ball_physics_object.reset();
        this.cue_ball_hole_capture = undefined;
        this.ball_launched = false;
        graphics_state.camera_transform = this.static_camera_positions[this.current_static_camera_position];
        // for (let i = 0; i < this.num_number_balls; i++) {
        //     this.number_ball_physics_objects[i].reset();
        //     this.number_ball_rotation_transforms[i] = Mat4.identity();
        //  //   console.log("number_ball " + i + " :" + this.number_ball_physics_objects[i].center);
        // }
        this.initialize_triangle_number_balls();
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
        let raised_floor = this.floor_transform.times(Mat4.translation([0,0,0]));
        raised_floor = raised_floor.times(Mat4.scale([-1.7,2,1]));

        this.draw_holes(graphics_state);

        if (this.draw_table) {
            if (!this.dark_mode) {
                this.shapes.floor.draw(
                    graphics_state,
                    raised_floor,
                    this.materials.shadow_light
                );
            } else {
                this.shapes.floor.draw(
                    graphics_state,
                    raised_floor,
                    this.materials.shadow_dark
                );
            }
        }

        // if (this.draw_table) {
        //     if (!this.dark_mode) {
        //         this.shapes.floor.draw(
        //             graphics_state,
        //             this.floor_transform,
        //             this.materials.floor
        //         );
        //     } else {
        //         this.shapes.floor.draw(
        //             graphics_state,
        //             this.floor_transform,
        //             this.materials.floor_dark
        //         );
        //     }
        // }

        // if (!this.dark_mode) {
        //     this.shapes.floor.draw(
        //         graphics_state,
        //         this.floor_transform,
        //         this.materials.floor
        //     );
        //
        // } else {
        //     this.shapes.floor.draw(
        //         graphics_state,
        //         this.floor_transform,
        //         this.materials.floor_dark
        //     );
        // }

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

    draw_stick(graphics_state, arrow_angle) {
        let stick_material = this.materials.phong;
        const t = graphics_state.animation_time / 1000
        if (this.user_just_launched_ball) {
            this.last_launch_time = t;
            this.user_just_launched_ball = false;
        }

        if ( t < this.last_launch_time + 0.5) {
            stick_material = this.materials.phong_opaque; // no not show stick within 1 second of launch
        }

        var transform = this.cue_ball_physics_object.transform;
        if (!this.paused) {
            const new_transforms = this.cue_ball_physics_object.update_and_get_transform(graphics_state);
            transform = new_transforms[0];
        }
        this.shapes.stick.draw(
            graphics_state,
            transform
                .times(this.base_stick_transform)
                .times(Mat4.rotation(arrow_angle, Vec.of(0, 1, 0)))
                .times(Mat4.scale(Vec.of(6, 10, 30)))
                .times(Mat4.translation(Vec.of(-1.4, 0, 0))),
            stick_material
        );
    }

    draw_ball(graphics_state) {
        if (this.cue_ball_physics_object.get_center()[1] >= -2 * this.cue_ball_physics_object.radius) {
            var transform = this.cue_ball_physics_object.transform;
            var ball_center = this.cue_ball_physics_object.get_center();
            if (!this.paused) {
                const new_transforms = this.cue_ball_physics_object.update_and_get_transform(graphics_state);
                transform = new_transforms[0];
            }
            this.cue_ball_transform =
                transform.times(this.initial_cue_ball_transform);
            this.shapes.cue_ball.draw(
                graphics_state,
                this.cue_ball_transform,
                this.materials.cue_ball
            );
            if (this.arrow_launch_power_mode) {
                this.shapes.power_indicator.draw(
                    graphics_state,
                    this.cue_ball_transform
                        .times(this.base_power_indicator_transform)
                        .times(Mat4.translation(
                            Vec.of(
                                (ball_center[0] > 0 ? -1 : 1) * 2 * this.cue_ball_radius,
                                0,
                                (ball_center[2] > 0 ? -1 : 1) * this.cue_ball_radius
                            ))
                        ),
                    this.materials.power_indicator
                );
                this.ball_speed = ((Math.sin(graphics_state.animation_time / 500) + 1) / 2) * (this.max_ball_speed - this.min_ball_speed);
                this.shapes.power_indicator.draw(
                    graphics_state,
                    this.cue_ball_transform
                        .times(this.base_power_indicator_transform)
                        .times(Mat4.translation(
                            Vec.of((ball_center[0] > 0 ? -1 : 1) * 2 * this.cue_ball_radius,
                                0.1,
                                (ball_center[2] > 0 ? -1 : 1) * this.cue_ball_radius +
                                (1 - (this.ball_speed / (this.max_ball_speed - this.min_ball_speed)))
                            )
                        ))
                        .times(Mat4.scale(Vec.of(1, 1, (Math.sin(graphics_state.animation_time / 500) + 1) / 2))),
                    this.materials.power_indicator.override({
                        color: Color.of(1, 0, 0, 1)
                    })
                );
            }
        }
    }

    draw_number_balls(graphics_state) {
        for (let i = 0; i < this.number_ball_physics_objects.length; i++) {
            if (!this.number_ball_fell_into_hole[i] &&
                this.number_ball_physics_objects[i].get_center()[1] >= -2 * this.number_ball_physics_objects[i].radius) {
                let image_filename = this.determine_number_ball_texture(i);
                let material =
                    this.materials.billiards_ball.override({texture: this.context.get_instance(image_filename, true)});
                var transform = this.number_ball_physics_objects[i].transform;
                var rotation_axis_angle = this.number_ball_physics_objects[i].last_zx_fv_angle + Math.PI / 2;
                if (!this.paused) {
                    const new_transforms = this.number_ball_physics_objects[i].update_and_get_transform(graphics_state);
                    this.number_ball_rotation_transforms[i] = new_transforms[1];
                    transform = new_transforms[0];
                    rotation_axis_angle = new_transforms[2];
                }
                const test_rotation_axis_angle = 287 * Math.PI / 180;
                const test_rotation_axis_4 =
                    Mat4.rotation(test_rotation_axis_angle, Vec.of(0, 0, -1))
                        .times(Vec.of(0, 1, 0, 0));
                const test_rotation_axis = Vec.of(test_rotation_axis_4[0], test_rotation_axis_4[1], test_rotation_axis_4[2]);
                //console.log("test rotation axis: " + test_rotation_axis);
                this.shapes.number_ball.draw(
                    graphics_state,
                    transform
                        .times(this.initial_number_ball_transforms[i])
                        .times(this.number_ball_rotation_transforms[i]),
                    material
                );
                // const c = this.number_ball_physics_objects[i].get_center();
                // this.shapes.collision_guide.draw(
                //     graphics_state,
                //     Mat4.identity()
                //         .times(Mat4.translation(Vec.of(c[0], c[1], c[2])))
                //         .times(Mat4.rotation(rotation_axis_angle, Vec.of(0, 1, 0)))
                //         .times(this.initial_collision_guide_transform),
                //     this.materials.collision_guide.override({
                //         color: Color.of(0.8, 0.8, 0.8, 1)
                //     })
                // )
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
            return `assets/ball_13.jpg`;
        }
        else if(i === 7){
            return `assets/ball_6.jpg`;
        }
        else if(i === 8){
            return `assets/ball_12.jpg`;
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
                            .times(Mat4.translation(o_info[0]))
                            .times(Mat4.rotation(o_info[1], Vec.of(0, 1, 0)))
                            .times(this.initial_collision_guide_transform),
                        this.materials.collision_guide.override({
                            color: this.collision_guide_colors[j][0]
                        })
                    );
                    this.shapes.collision_guide.draw(
                        graphics_state,
                        Mat4.identity()
                            .times(Mat4.translation(o_info[0]))
                            .times(Mat4.rotation(o_info[2], Vec.of(0, 1, 0)))
                            .times(this.initial_collision_guide_transform),
                        this.materials.collision_guide.override({
                            color: this.collision_guide_colors[j][1]
                        })
                    );
                    this.shapes.collision_guide.draw(
                        graphics_state,
                        Mat4.identity()
                            .times(Mat4.translation(o_info[0]))
                            .times(Mat4.rotation(o_info[3], Vec.of(0, 1, 0)))
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
        return Math.sqrt(xs**2 + zs**2);
    }

    check_if_collide(o1, o2, hole_collide) {
        let o1_center = o1.get_center();
        let o2_center = o2.get_center();
        let distance = this.get_distance(o1_center, o2_center);
        let required_distance = (o1.radius + o2.radius + (hole_collide ? this.collide_adjust : 0));

        // if (distance < 2 * required_distance) {
        //     console.log(
        //         "collision check for [" + o1.object_tag + "] and [" + o2.object_tag + "]: " + "\n" +
        //         o1.object_tag + " center: " + o1_center + "\n" +
        //         o2.object_tag + " center: " + o2_center + "\n" +
        //         o1.object_tag + " radius: " + o1.radius + "\n" +
        //         o2.object_tag + " radius: " + o2.radius + "\n" +
        //         "distance: " + distance + "\n" +
        //         "required distance: " + required_distance
        //     );
        // }

        const found_collision =
            distance <= required_distance * (hole_collide ? 1.5 : 1) &&
            o1_center[1] == o2_center[1]; // to prevent balls that have fallen off table from colliding
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

        if (this.cue_ball_hole_capture != undefined) {
            //console.log("Cue ball was captured by hole " + this.cue_ball_hole_capture.object_tag);
            if (this.cue_ball_physics_object.get_center()[1] > -10) {
                PhysicsObject.calculate_elastic_collision(this.cue_ball_physics_object, this.cue_ball_hole_capture);
                this.hole_adjust_center(this.cue_ball_physics_object, this.cue_ball_hole_capture);
            }
        }

        for (let i = 0; i < this.number_ball_hole_captures.length; i++) {
            if (this.number_ball_hole_captures[i] != undefined) {
                const hole = this.number_ball_hole_captures[i];
                const ball = this.number_ball_physics_objects[i];
                // console.log(
                //     "[" + ball.object_tag + "] was captured by hole ["
                //     + hole.object_tag + "]"
                // );
                if (ball.get_center()[1] > -10) {
                    PhysicsObject.calculate_elastic_collision(ball, hole);
                    this.hole_adjust_center(ball, hole);
                }
            }
        }

        for (let i = 0; i < this.hole_transforms.length; i++) {
            if (this.check_if_collide(this.cue_ball_physics_object, this.hole_physics_objects[i], true)) {
                this.cue_ball_physics_object.enable_gravity();
                this.cue_ball_hole_capture = this.hole_physics_objects[i];
            }
        }
        for (let i = 0; i < this.number_ball_physics_objects.length; i++) {
            if (!this.number_ball_physics_objects[i].force_vector.equals(Vec.of(0, 0, 0))) {
                for (let j = 0; j < this.hole_transforms.length; j++) {
                    if (this.check_if_collide(this.number_ball_physics_objects[i], this.hole_physics_objects[j],
                        true)) {
                        this.number_ball_physics_objects[i].enable_gravity();
                        this.number_ball_hole_captures[i] = this.hole_physics_objects[j];
                    }
                }
            }
        }
    }

    hole_adjust_center(ball, hole) {
        // assumes hole radius is larger than ball radius
        const ball_center = ball.get_center();
        const hole_center = hole.get_center();
        const distance = this.get_distance(hole_center, ball_center);
        if (distance > hole.radius - ball.radius) {
            const adjust_distance = ball.radius + (distance - hole.radius);
            const ball_vec_angle = PhysicsObject.calculate_vector_angle(
                Vec.of(0, 0, 1),
                Vec.of(ball_center[0] - hole_center[0], 0, ball_center[2] - hole_center[2])
            );
            // console.log(
            //     "adjusting center of captured ball " + ball.object_tag + ": " + "\n" +
            //     "ball center: " + ball_center + "\n" +
            //     "hole center: " + hole_center + "\n" +
            //     "distance: " + distance + "\n" +
            //     "radial difference: " + (hole.radius - ball.radius) + "\n" +
            //     "ball_vec_angle: " + (ball_vec_angle * 180 / Math.PI) + "\n" +
            //     "adjust_distance: " + adjust_distance + "\n" +
            //     "x adjust: " + (Math.sin(ball_vec_angle) * adjust_distance) + "\n" +
            //     "z adjust: " + (Math.cos(ball_vec_angle) * adjust_distance) + "\n"
            // );
            ball.transform[0][3] -= Math.sin(ball_vec_angle) * adjust_distance;
            ball.transform[2][3] -= Math.cos(ball_vec_angle) * adjust_distance;
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

        if(!this.game_started) {
            // this.shapes.sign.draw(graphics_state, Mat4.identity(), this.materials.sign_material);
            graphics_state.camera_transform = this.static_camera_positions[this.current_static_camera_position];
            this.shapes.sign.draw(graphics_state,
                Mat4.identity().times(Mat4.identity()
                    .times(Mat4.scale([50, 40, 40]))
                    .times(Mat4.rotation(-Math.PI / 2, Vec.of(1, 0, 0)))
                    .times(Mat4.translation([0, 0, 0]))),
                this.materials.sign_material);
        }
        else {

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
            if (!this.game_over) {

                if (this.reset) {
                    this.reset_scene(graphics_state);
                    this.reset = false;
                }
                //this.update_camera_transform(graphics_state);

                // Save camera angle before shadows in order to calculate them appropraiately using top-down and then revert
                const previous_camera = this.context.globals.graphics_state.camera_transform;
                this.context.globals.graphics_state.camera_transform = Mat4.look_at(Vec.of(0, 0, 5), Vec.of(0, -80, 0), Vec.of(0, 1, 0))
                    .times(Mat4.translation(Vec.of(0, -110, -2)));

                this.draw_ball(graphics_state);
                this.draw_number_balls(graphics_state);

                this.context.globals.graphics_state.camera_transform = previous_camera;

                this.scratchpad_context.drawImage(this.webgl_manager.canvas, 0, 0, 256, 256);
                this.texture.image.src = this.scratchpad.toDataURL("image/png");
                this.webgl_manager.gl.clear(this.webgl_manager.gl.COLOR_BUFFER_BIT | this.webgl_manager.gl.DEPTH_BUFFER_BIT);


                this.draw_ball(graphics_state);
                this.draw_number_balls(graphics_state);
                this.draw_static_scene(graphics_state);


                if (!this.ball_launched) {
                    this.draw_stick(graphics_state, this.arrow_angle);
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


            } else {

                graphics_state.camera_transform = this.static_camera_positions[this.current_static_camera_position];
                this.shapes.score_text.set_string("  Your Score is " + this.score);
                this.shapes.score_text.draw(graphics_state,
                    Mat4.identity().times(Mat4.identity()
                        .times(Mat4.scale([3, 3, 3]))
                        .times(Mat4.rotation(-Math.PI / 2, Vec.of(1, 0, 0)))
                        .times(Mat4.rotation(Math.PI / 10 * Math.sin(t), Vec.of(0, 0, 1)))
                        // .times(Mat4.rotation(-Math.PI * Math.sin(t ), Vec.of(1,0,1)))
                        .times(Mat4.translation([-15, 0, 0]))),
                    this.materials.text);
            }
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