window.Assignment_Four_Scene = window.classes.Assignment_Four_Scene =
    class Assignment_Four_Scene extends Scene_Component
    { constructor( context, control_box )     // The scene begins by requesting the camera, shapes, and materials it will need.
    { super(   context, control_box );    // First, include a secondary Scene that provides movement controls:
        if( !context.globals.has_controls   )
            context.register_scene_component( new Movement_Controls( context, control_box.parentElement.insertCell() ) );

        // graphics parameters
        this.default_camera_transform = Mat4.look_at( Vec.of( 0,0,5 ), Vec.of( 0,-2,0 ), Vec.of( 0,1,0 ) )
            .times(Mat4.translation(Vec.of(0, -3, -3)));
        context.globals.graphics_state.camera_transform = this.default_camera_transform;
        const r = context.width/context.height;
        context.globals.graphics_state.projection_transform = Mat4.perspective( Math.PI/4, r, .1, 1000 );
        const shapes = {
            bowling_ball: new Subdivision_Sphere(3),
            floor: new Cube(),
            arrow: new Surface_Of_Revolution( 8, 8, Vec.cast(
                [0, 1, 0], [0, 1, 1], [0, 1, 2],
                [0, 1, 3], [0, 1, 4], [0, 2, 4],
                [0, 1, 5], [0, 0, 7]
            ))
        }
        this.submit_shapes( context, shapes );
        this.materials =
            {
                bowling_ball: context.get_instance( Phong_Shader ).material(Color.of(1, 0, 0, 1), {
                    ambient: 1
                }),
                floor: context.get_instance( Phong_Shader ).material(Color.of(0, 0, 0, 1), {
                    ambient: 1,
                    texture: context.get_instance("assets/grid.png", true)
                }),
                arrow: context.get_instance( Phong_Shader ).material(Color.of(0, 0, 1, 0.8), {
                    ambient: 1
                })
            }
        this.lights = [ new Light( Vec.of( 0,100,0,1 ), Color.of( 0,1,1,1 ), 1000000000 ) ];
        this.floor_size = 50;
        this.floor_transform =
            Mat4.identity()
                .times(Mat4.translation(Vec.of(0, -3, 0)))
                .times(Mat4.scale(Vec.of(this.floor_size, 0.10, this.floor_size)));

        // game state
        this.bowling_ball_transform = Mat4.identity();
        this.bowling_ball_physics_object = new PhysicsObject(Mat4.identity());
        this.lock_camera_on_ball = false;
        this.initial_camera_reset = false;
        this.arrow_angle = Mat4.identity();
        this.ball_launched = false;
        this.reset = false;

        // game parameters
        this.arrow_speed = 2.5;
        this.ball_speed = .05;
    }

    make_control_panel()
    {
        this.key_triggered_button("Launch Ball", ["k"], () => {
            this.bowling_ball_physics_object.apply_force(
                Vec.of(Math.sin(this.arrow_angle), 0, -Math.cos(this.arrow_angle), this.ball_speed)
            );
            this.ball_launched = true;
        });
        this.new_line();
        this.key_triggered_button("Lock Camera On Ball", ["c"], () =>
            this.lock_camera_on_ball = !this.lock_camera_on_ball
        );
        this.new_line();
        this.key_triggered_button("Reset", ["l"], () =>
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
                graphics_state.camera_transform = this.default_camera_transform;
            }
        }
    }

    reset_scene(graphics_state) {
        this.bowling_ball_physics_object.reset();
        this.ball_launched = false;
        graphics_state.camera_transform = this.default_camera_transform;
    }

    draw_scene(graphics_state) {
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
                .times(Mat4.scale(Vec.of(0.5, 0.5, -1)))
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

    display( graphics_state )
    { graphics_state.lights = this.lights;        // Use the lights stored in this.lights.
        const t = graphics_state.animation_time / 1000, dt = graphics_state.animation_delta_time / 1000;

        if (this.reset) {
            this.reset_scene(graphics_state);
            this.reset = false;
        }

        this.draw_scene(graphics_state);

        this.draw_ball(graphics_state);

        if (!this.ball_launched) {
            this.arrow_angle = (Math.PI / 6) * Math.sin(this.arrow_speed * t);
            this.draw_arrow(graphics_state, this.arrow_angle);
        }

        this.update_camera_transform(graphics_state);
    }
}

window.PhysicsObject = window.classes.PhysicsObject =
    class PhysicsObject {
        constructor(base_transform) {
            this.base_transform = base_transform;
            this.transform = base_transform;
            this.force_vector = Vec.of(0, 0, 0, 0);
        }

        reset() {
            this.transform = this.base_transform;
            this.force_vector = Vec.of(0, 0, 0, 0);
        }

        apply_force(force_vector) {
            this.force_vector = this.force_vector.plus(force_vector);
        }

        get_transform(graphics_state) {
            const force_magnitude = this.force_vector[3];
            this.transform = this.transform.times(
                Mat4.identity()
                    .times(Mat4.translation(
                            Vec.of(
                                force_magnitude * this.force_vector[0] * graphics_state.animation_delta_time,
                                force_magnitude * this.force_vector[1] * graphics_state.animation_delta_time,
                                force_magnitude * this.force_vector[2] * graphics_state.animation_delta_time
                            )
                        )
                    )
            );
            return this.transform;
        }
    }
