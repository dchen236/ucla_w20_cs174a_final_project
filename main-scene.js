window.Assignment_Four_Scene = window.classes.Assignment_Four_Scene =
    class Assignment_Four_Scene extends Scene_Component
    { constructor( context, control_box )     // The scene begins by requesting the camera, shapes, and materials it will need.
    { super(   context, control_box );    // First, include a secondary Scene that provides movement controls:
        if( !context.globals.has_controls   )
            context.register_scene_component( new Movement_Controls( context, control_box.parentElement.insertCell() ) );

        // graphics parameters
        this.forward_camera_transform = Mat4.look_at( Vec.of( 0,0,5 ), Vec.of( 0,-2,0 ), Vec.of( 0,1,0 ) )
            .times(Mat4.translation(Vec.of(0, -3, -3)));
        this.top_camera_transform = Mat4.look_at( Vec.of( 0,0,5 ), Vec.of( 0,-40,0 ), Vec.of( 0,1,0 ) )
            .times(Mat4.translation(Vec.of(0, -100, 0)));
        this.static_camera_positions = [this.forward_camera_transform, this.top_camera_transform];
        this.current_static_camera_position = 1;
        context.globals.graphics_state.camera_transform = this.static_camera_positions[this.current_static_camera_position];
        const r = context.width/context.height;
        context.globals.graphics_state.projection_transform = Mat4.perspective( Math.PI/4, r, .1, 1000 );
        const shapes = {
            bowling_ball: new Subdivision_Sphere(3),
            floor: new Cube(),
            arrow: new Surface_Of_Revolution( 8, 8, Vec.cast(
                [0, 1, 0], [0, 1, 1], [0, 1, 2],
                [0, 1, 3], [0, 1, 4], [0, 2, 4],
                [0, 1, 5], [0, 0, 7]
            )),
            pin: new Cylindrical_Tube(20, 80),
            collision_guide: new Cube()
        };
        this.submit_shapes( context, shapes );
        this.materials = {
            bowling_ball: context.get_instance( Phong_Shader ).material(Color.of(0, 0, 0, 1), {
                ambient: 0.8
            }),
            floor: context.get_instance( Phong_Shader ).material(Color.of(0, 0, 0, 1), {
                ambient: 1,
                texture: context.get_instance("assets/grid.png", true)
            }),
            arrow: context.get_instance( Phong_Shader ).material(Color.of(0, 0, 1, 0.8), {
                ambient: 1
            }),
            pin: context.get_instance (Phong_Shader ).material(Color.of(0, 0, 0, 1), {
                ambient: 0.8,
                texture: context.get_instance("assets/pin_texture.png", true)
            }),
            collision_guide: context.get_instance( Phong_Shader ).material(Color.of(1, 0, 0, 1), {
                ambient: 1,
                diffusivity: 1,
                specularity: 0
            })
        };
        this.lights = [ new Light( Vec.of( 0,100,0,1 ), Color.of( 0,1,1,1 ), 1000000000 ) ];
        this.floor_size = 30;
        this.floor_transform =
            Mat4.identity()
                .times(Mat4.translation(Vec.of(0, -3, 0)))
                .times(Mat4.scale(Vec.of(this.floor_size, 0.10, this.floor_size)));
        this.initial_collision_guide_transform =
            Mat4.identity()
                .times(Mat4.scale(Vec.of(0.1, 0.1, 2.5)))
                .times(Mat4.translation(Vec.of(0, 0, 2.5 / 2)));

        // game parameters
        this.arrow_speed = 1.5;
        this.ball_speed = .05;
        this.floor_damping = .00002;
        this.ball_damping = this.floor_damping;
        this.pin_damping = this.floor_damping;
        this.ball_mass = 1;
        this.pin_mass = 200;
        this.bowling_ball_radius = 1;
        this.pin_radius = 75;
        this.num_pins = 1;
        this.collide_adjust = 0.2;
        // game state
        this.bowling_ball_transform = Mat4.identity();
        this.bowling_ball_physics_object =
            new PhysicsObject(this.ball_damping, this.ball_mass, Mat4.identity(), this.bowling_ball_radius);

        this.pin_physics_objects = [];
        this.initial_pin_transforms = [];
        this.initialize_pins();

        this.lock_camera_on_ball = false;
        this.initial_camera_reset = false;
        this.arrow_angle = 0;
        this.ball_launched = false;
        this.reset = false;

        // testing state
        this.collision_results = [];
    }

    // takes cares of both this.pin_physics_objects and this.initial_pin_transforms
    initialize_pins() {
        // let pin_spacing = 2;
        // let outermost_pin_loc = this.num_pins * this.pin_radius;
        // for (let i = 0; i < this.num_pins; i++) {
        //     let location_adjuster = i * pin_spacing + i * this.pin_radius;
        //     let pin_transform =  Mat4.identity()
        //         .times(Mat4.translation(Vec.of(-outermost_pin_loc + location_adjuster , 0, -12 )))
        //         .times(Mat4.scale(Vec.of(this.pin_radius, 5, this.pin_radius)))
        //         .times(Mat4.rotation(Math.PI / 2, Vec.of(1, 0, 0)));
        //     this.initial_pin_transforms[i] = pin_transform;
        //     this.pin_physics_objects[i] = new PhysicsObject(this.pin_damping, this.pin_mass, pin_transform, this.pin_radius);
        //     //console.log("initalization:" + this.pin_physics_objects[i].center)
        // }
        // console.log("ball initalization:" + this.bowling_ball_physics_object.center)

        const pin_distance = 100;

        this.initial_pin_transforms[0] =
            Mat4.identity()
                .times(Mat4.translation(Vec.of(0, 0, -pin_distance)))
                .times(Mat4.scale(Vec.of(this.pin_radius, 5, this.pin_radius)))
                .times(Mat4.rotation(Math.PI / 2, Vec.of(1, 0, 0)));
        this.pin_physics_objects[0] = new PhysicsObject(this.pin_damping, this.pin_mass, this.initial_pin_transforms[0], this.pin_radius);

        this.initial_pin_transforms[1] =
            Mat4.identity()
                .times(Mat4.translation(Vec.of(0, 0, pin_distance)))
                .times(Mat4.scale(Vec.of(this.pin_radius, 5, this.pin_radius)))
                .times(Mat4.rotation(Math.PI / 2, Vec.of(1, 0, 0)));
        this.pin_physics_objects[1] = new PhysicsObject(this.pin_damping, this.pin_mass, this.initial_pin_transforms[1], this.pin_radius);

        this.initial_pin_transforms[2] =
            Mat4.identity()
                .times(Mat4.translation(Vec.of(pin_distance, 0, 0)))
                .times(Mat4.scale(Vec.of(this.pin_radius, 5, this.pin_radius)))
                .times(Mat4.rotation(Math.PI / 2, Vec.of(1, 0, 0)));
        this.pin_physics_objects[2] = new PhysicsObject(this.pin_damping, this.pin_mass, this.initial_pin_transforms[2], this.pin_radius);

        this.initial_pin_transforms[3] =
            Mat4.identity()
                .times(Mat4.translation(Vec.of(-pin_distance, 0, 0)))
                .times(Mat4.scale(Vec.of(this.pin_radius, 5, this.pin_radius)))
                .times(Mat4.rotation(Math.PI / 2, Vec.of(1, 0, 0)));
        this.pin_physics_objects[3] = new PhysicsObject(this.pin_damping, this.pin_mass, this.initial_pin_transforms[3], this.pin_radius);
    }

    make_control_panel()
    {
        this.key_triggered_button("Launch Ball", ["k"], () => {
            if (!this.ball_launched) {
                this.ball_launched = true;
                console.log("---");
                this.bowling_ball_physics_object.apply_force(
                    Vec.of(this.arrow_angle, 0, this.ball_speed)
                );
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
    }

    update_camera_transform(graphics_state) {
        var desired;
        const blending_factor = 0.1;
        if (this.lock_camera_on_ball) {
            this.initial_camera_reset = true;
            desired =
                Mat4.inverse(
                    this.bowling_ball_transform
                        .times(Mat4.translation(Vec.of(0, 0, 5)))
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
        // for (let i = 0; i < this.num_pins; i++) {
        //     this.pin_physics_objects[i].reset();
        //  //   console.log("pin " + i + " :" + this.pin_physics_objects[i].center);
        // }
        // console.log("ball: " + this.bowling_ball_physics_object.center);

    }

    draw_static_scene(graphics_state) {
        this.shapes.floor.draw(
            graphics_state,
            this.floor_transform,
            this.materials.floor
        );
    }

    draw_arrow(graphics_state, arrow_angle) {
        this.shapes.arrow.draw(
            graphics_state,
            Mat4.identity()
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
            this.shapes.pin.draw(
                graphics_state,
                this.pin_physics_objects[i].get_transform(graphics_state)
                    .times(this.initial_pin_transforms[i]),
                this.materials.pin
            );
        }
    }

    draw_collision_results(graphics_state) {

        for (let i = 0; i < this.collision_results.length; i++) {
            this.shapes.collision_guide.draw(
                graphics_state,
                Mat4.identity()
                    .times(this.collision_results[i][0])
                    .times(this.collision_results[i][1])
                    .times(this.initial_collision_guide_transform),
                this.materials.collision_guide
            );
            this.shapes.collision_guide.draw(
                graphics_state,
                Mat4.identity()
                    .times(this.collision_results[i][0])
                    .times(this.collision_results[i][2])
                    .times(this.initial_collision_guide_transform),
                this.materials.collision_guide.override({
                    color: Color.of(0, 1, 0, 1)
                })
            );
            this.shapes.collision_guide.draw(
                graphics_state,
                Mat4.identity()
                    .times(this.collision_results[i][0])
                    .times(this.collision_results[i][3])
                    .times(this.initial_collision_guide_transform),
                this.materials.collision_guide.override({
                    color: Color.of(0, 0, 1, 1)
                })
            );
        }

    }

    get_distance(p1, p2) {
        let xs = p1[0] - p2[0];
        let ys = p1[1] - p2[1];
        let zs = p1[2] - p2[2];
        return Math.sqrt(xs * xs + ys * ys + zs * zs);
    }

    check_if_collide(pin, ball) {
        let pin_center = pin.get_center();
        let ball_center = ball.get_center();
        let distance = this.get_distance(pin_center, ball_center);
        return distance <= this.pin_radius + this.bowling_ball_radius + this.collide_adjust;
    }

    display( graphics_state )
    { graphics_state.lights = this.lights;        // Use the lights stored in this.lights.
        const t = graphics_state.animation_time / 1000, dt = graphics_state.animation_delta_time / 1000;

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
        // check if ball collide 0th pin
        for (let i = 0; i < this.pin_physics_objects.length; i++) {
            if (this.check_if_collide(this.pin_physics_objects[i], this.bowling_ball_physics_object) ){
                console.log("did collide")
                const collision_result = PhysicsObject.calculate_elastic_collision(
                    this.bowling_ball_physics_object, this.pin_physics_objects[i]
                );
                this.collision_results.push(collision_result);
                console.log("pin center: " + this.pin_physics_objects[i].get_center());
                console.log("ball center: " + this.bowling_ball_physics_object.get_center());
                console.log("pin force vector: " + this.pin_physics_objects[i].force_vector);
                console.log("ball force vector: " + this.bowling_ball_physics_object.force_vector);
            }
        }

        this.draw_collision_results(graphics_state);

        this.update_camera_transform(graphics_state);
    }
}
