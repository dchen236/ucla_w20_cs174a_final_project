
window.PhysicsObject = window.classes.PhysicsObject =
    class PhysicsObject {
        constructor(damping_constant, mass, center_transform, radius, time_constant,
                    object_tag, initial_transform) {
            this.initial_transform = initial_transform;
            this.transform = this.initial_transform;
            this.force_vector = Vec.of(0, 0, 0);
            this.damping_constant = damping_constant;
            this.center_transform = center_transform;
            this.center = center_transform.times(Vec.of(0, 0, 0, 1));
            this.mass = mass;
            this.radius = radius;
            this.time_constant = time_constant;
            this.object_tag = object_tag;
            this.gravity = false;
            this.current_gravity_force = 0;
            this.current_rotation = Mat4.identity();
            this.last_zx_fv_angle = 0;
        }

        reset() {
            this.transform = this.initial_transform;
            this.center = this.center_transform.times(Vec.of(0, 0, 0, 1));
            this.force_vector = Vec.of(0, 0, 0);
            this.current_rotation = Mat4.identity();
            this.last_zx_fv_angle = 0;
            this.disable_gravity();
        }

        apply_force(force_vector) {
            if (force_vector.equals(0, 0, 0))
                return;

            if (force_vector[0] < 0 || force_vector[0] > 2 * Math.PI) {
                console.log("[" + this.object_tag + "]: apply_force only takes positive angles between 0 and 2pi, " + force_vector[0] + " is invalid");
                return;
            }

            const current_force_vector_x_y_z = PhysicsObject.calculate_x_y_z(this.force_vector);
            const applied_force_vector_x_y_z = PhysicsObject.calculate_x_y_z(force_vector);
            const new_force_vector_x_y_z = current_force_vector_x_y_z.plus(applied_force_vector_x_y_z);
            const new_force_vector = PhysicsObject.calculate_offset_angles_and_magnitude(new_force_vector_x_y_z);

            // console.log("force_vector[0]: " + force_vector[0] * 180 / Math.PI);
            // console.log("current_force_vector_x_y_z: " + current_force_vector_x_y_z);
            // console.log("applied_force_vector_x_y_z: " + applied_force_vector_x_y_z);
            // console.log("new_force_vector_x_y_z: " + new_force_vector_x_y_z);
            // console.log("new_force_vector[0]: " + (new_force_vector[0] * 180 / Math.PI));

            this.force_vector = new_force_vector;
        }

        apply_damping(damping_constant) {
            this.damping_constant = damping_constant;
        }

        get_center() {
            return this.transform.times(this.center);
        }

        enable_gravity() {
            this.gravity = true;
        }

        disable_gravity() {
            this.current_gravity_force = 0;
            this.gravity = false;
        }

        update_and_get_transform(graphics_state) {
            if (this.force_vector[2] == 0.0 && !this.gravity) {
                return [this.transform, this.current_rotation, this.last_zx_fv_angle + Math.PI / 2];
            }

            this.force_vector[2] =
                this.force_vector[2] -
                (this.damping_constant * graphics_state.animation_delta_time) * this.time_constant;
            if (this.force_vector[2] < 0)
                this.force_vector[2] = 0;
            const force_vector_x_y_z = PhysicsObject.calculate_x_y_z(this.force_vector);

            if (this.gravity) {
                this.current_gravity_force -= 9.8 * graphics_state.animation_delta_time * .0001;
            }

            const delta_translation =
                Mat4.identity()
                    .times(Mat4.translation(
                        Vec.of(
                            force_vector_x_y_z[0] * graphics_state.animation_delta_time * this.time_constant,
                            force_vector_x_y_z[1] * graphics_state.animation_delta_time * this.time_constant +
                            this.current_gravity_force * this.time_constant,
                            force_vector_x_y_z[2] * graphics_state.animation_delta_time * this.time_constant)
                        )
                    );
            this.transform = this.transform.times(delta_translation);
            const distance = Math.sqrt(
                (force_vector_x_y_z[0] * graphics_state.animation_delta_time * this.time_constant)**2 +
                (force_vector_x_y_z[2] * graphics_state.animation_delta_time * this.time_constant)**2
            );
            // the balls seem to operate in a different coordinate system for whatever reason, for the balls
            // y and z are switched so that the equivalent of Vec.of(0, 1, 0) in the physics coordinate system
            // is Vec.of(0, 0, -1) in the balls coordinate system
            const rotation_axis =
                Mat4.rotation(this.force_vector[0] + Math.PI / 2, Vec.of(0, 0, -1))
                    .times(Vec.of(0, 1, 0, 0));
            if (!rotation_axis.equals(Vec.of(0, 0, 0, 0))) {
                this.last_zx_fv_angle = this.force_vector[0];
                this.current_rotation =
                    Mat4.rotation(distance / this.radius, rotation_axis).times(
                        this.current_rotation
                    );
                console.log(
                    this.object_tag + ": " + "\n" +
                    "rotation axis: " + rotation_axis + "\n" +
                    "current rotation angle: " + distance / this.radius
                );
            }

            return [this.transform, this.current_rotation, this.last_zx_fv_angle + Math.PI / 2];
        }

        static calculate_x_y_z(offset_angles_and_magnitude_force_vector) {
            const zx_offset_angle = offset_angles_and_magnitude_force_vector[0];
            const magnitude = offset_angles_and_magnitude_force_vector[2];

            if (magnitude == 0.0)
                return Vec.of(0.0, 0.0, 0.0);

            const x = Math.sin(zx_offset_angle) * magnitude;
            const z = Math.cos(zx_offset_angle) * magnitude;

            return Vec.of(x, 0, z);
        }

        static calculate_offset_angles_and_magnitude(x_y_z_force_vector) {
            const x = x_y_z_force_vector[0];
            const y = 0;
            const z = x_y_z_force_vector[2];

            if (x_y_z_force_vector.equals(Vec.of(0.0, 0.0, 0.0)))
                return Vec.of(0.0, 0.0, 0.0);

            const magnitude = Math.sqrt(x**2 + y**2 + z**2);
            var zx_offset_angle = Math.atan(x / z);

            if (z < 0) {
                if (x < 0)
                    zx_offset_angle -= Math.PI;
                else
                    zx_offset_angle += Math.PI;
            }

            if (zx_offset_angle < 0) {
                zx_offset_angle += 2 * Math.PI;
            }

            return Vec.of(zx_offset_angle, 0, magnitude);
        }

        static calculate_elastic_collision(o1, o2, add_center_adjust) {

            const o1_fv_init = Vec.of(o1.force_vector[0], o1.force_vector[1], o1.force_vector[2]);
            const o2_fv_init = Vec.of(o2.force_vector[0], o2.force_vector[1], o2.force_vector[2]);
            const o1_fv_x_y_z_init = PhysicsObject.calculate_x_y_z(o1_fv_init);
            const o2_fv_x_y_z_init = PhysicsObject.calculate_x_y_z(o2_fv_init);

            // calculate object centers, collision normal
            const o1_center = o1.get_center();
            const o2_center = o2.get_center();
            const normal_vector = o2_center.minus(o1_center);
            const normal = Vec.of(normal_vector[0], normal_vector[1], normal_vector[2]);
            const normal_perpendicular = Vec.of(-normal[2], normal[1], normal[0]);

            var o1_info = undefined;
            var o2_info = undefined;

            // check whether collision is type 1 (init fv's on opposite side of collision normal)
            // or type 2 (init fv's on same side of collision normal)
            if (!o1_fv_x_y_z_init.equals(Vec.of(0, 0, 0)) && !o2_fv_x_y_z_init.equals(Vec.of(0, 0, 0)) &&
                PhysicsObject.is_right(Vec.of(0, 0, 0,), normal_perpendicular, o1_fv_x_y_z_init) ==
                PhysicsObject.is_right(Vec.of(0, 0, 0,), normal_perpendicular, o2_fv_x_y_z_init)) {
                const zx_collision_theta = PhysicsObject.calculate_vector_angle(normal, o1_fv_x_y_z_init);
                const o1_fv_x_y_z_normal_theta = PhysicsObject.calculate_vector_angle(o1_fv_x_y_z_init, normal);
                console.log("TYPE 2 collision between [" + o1.object_tag + "] and [" + o2.object_tag + "]");
                if (PhysicsObject.is_right(Vec.of(0, 0, 0), normal_perpendicular, o1_fv_x_y_z_init) &&
                    o1_fv_x_y_z_normal_theta >= Math.PI / 2 && o1_fv_x_y_z_normal_theta <= Math.PI) {
                    console.log("[" + o2.object_tag + "] is behind [" + o1.object_tag + "]");
                    // adjust angle of final forces on objects based on whether the collision was a glancing collision
                    o1_info = [Vec.of(o1_center[0], o1_center[1], o1_center[2]), 0, 0, o1_fv_init[0]];
                    o2_info = PhysicsObject.update_object_fv_angle(o2_fv_x_y_z_init, o2, o2_center, o1, normal.times(-1));
                }
                else {
                    console.log("[" + o1.object_tag + "] is behind [" + o2.object_tag + "]");
                    // adjust angle of final forces on objects based on whether the collision was a glancing collision
                    o1_info = PhysicsObject.update_object_fv_angle(o1_fv_x_y_z_init, o1, o1_center, o2, normal);
                    o2_info = [Vec.of(o1_center[0], o1_center[1], o1_center[2]), 0, 0, o2_fv_init[0]];
                }
            }
            else {
                console.log("TYPE 1 collision between [" + o1.object_tag + "] and [" + o2.object_tag + "]");
                // adjust angle of final forces on objects based on whether the collision was a glancing collision
                o1_info = PhysicsObject.update_object_fv_angle(o1_fv_x_y_z_init, o1, o1_center, o2, normal);
                o2_info = PhysicsObject.update_object_fv_angle(o2_fv_x_y_z_init, o2, o2_center, o1, normal.times(-1));
            }

            // calculate magnitude of final forces on objects
            // const vf = PhysicsObject.calculate_elastic_collision_2d(
            //     o1, o2, o1_fv_x_y_z_init, o2_fv_x_y_z_init, o1_info[3], o2_info[3]
            // );
            const vf = PhysicsObject.calculate_elastic_collision_2d(
                o1, o2, o1_fv_x_y_z_init, o2_fv_x_y_z_init, normal, normal_perpendicular
            );
            o1.force_vector[2] = vf[0];
            o2.force_vector[2] = vf[1];
            // console.log(
            //     "final force vectors: " +
            //     "o1 final force vector (x, y, z): " + PhysicsObject.calculate_x_y_z(o1.force_vector) + "\n" +
            //     "o2 final force vector (x, y, z): " + PhysicsObject.calculate_x_y_z(o2.force_vector)
            // );

            if (add_center_adjust) {
                // adjust center of o1 to avoid subsequent incorrect collision calculations
                const distance = Math.sqrt(normal_vector[0] ** 2 + normal_vector[1] ** 2 + normal_vector[2] ** 2);
                const overlap = o1.radius + o2.radius - distance;
                const offset_vector = PhysicsObject.calculate_x_y_z(Vec.of(o1.force_vector[0], 0, overlap));
                console.log("overlap between [" + o1.object_tag + "] and [" + o2.object_tag + "]: " + overlap);
                console.log("adjusting center of [" + o1.object_tag + "] by offset vector " + offset_vector);
                o1.transform[0][3] += offset_vector[0];
                o1.transform[1][3] += offset_vector[1];
                o1.transform[2][3] += offset_vector[2];
            }

            // console.log(
            //     "Collision info: " + "\n" +
            //     "init [" + o1.object_tag + "] force vector: " + o1_fv_init + "\n" +
            //     "init [" + o2.object_tag + "] force vector: " + o2_fv_init + "\n" +
            //     "final [" + o1.object_tag + "] force vector: " + o1.force_vector + "\n" +
            //     "final [" + o2.object_tag + "] force vector: " + o2.force_vector
            // );

            const ret = [o1_info, o2_info];

            return ret;
        }

        static update_object_fv_angle(o1_fv_x_y_z_init, o1, o1_center, o2, normal) {

            // the angle between collision normal and positive z axis
            const normal_theta = PhysicsObject.calculate_vector_angle(Vec.of(0, 0, 1), normal);

            // calculate angle with splitter
            const zx_collision_theta = PhysicsObject.calculate_vector_angle(normal, o1_fv_x_y_z_init);
            // all rotations are calculated relative to the positive z axis
            const normal_rotation = PhysicsObject.normalize_angle(normal_theta);
            const collision_rotation = PhysicsObject.normalize_angle(normal_rotation + zx_collision_theta - Math.PI);
            const reflection_rotation = PhysicsObject.normalize_angle(normal_rotation - zx_collision_theta - Math.PI);
            o1.force_vector[0] = reflection_rotation;

            // console.log("---");
            // console.log("collision normal: " + normal);
            // console.log("normal theta: " + (normal_theta * (180 / Math.PI)));
            // console.log("[" + o1.object_tag + "] fv_x_y_z_init: " + o1_fv_x_y_z_init);
            // console.log("zx collision theta: " + (zx_collision_theta * 180 / Math.PI));
            // console.log("normal_rotation: " + normal_rotation * 180 / Math.PI);
            // console.log("collision_rotation: " + collision_rotation * 180 / Math.PI);
            // console.log("reflection_rotation: " + reflection_rotation * 180 / Math.PI);
            // console.log("---");

            return [
                Vec.of(o1_center[0], o1_center[1], o1_center[2]),
                normal_rotation,
                collision_rotation,
                reflection_rotation
            ];
        }

        // static calculate_elastic_collision_2d(o1, o2, o1_fv_x_y_z, o2_fv_x_y_z, o1_final_angle, o2_final_angle) {
        //
        //     const o1_magnitude_init = o1.force_vector[2];
        //     const o2_magnitude_init = o2.force_vector[2];
        //     const magnitude_init = o1_magnitude_init + o2_magnitude_init;
        //
        //     console.log(
        //         "elastic collision magnitude calculation inputs: " + "\n" +
        //         "o1_fv: " + o1.force_vector + "\n" +
        //         "o2_fv: " + o2.force_vector + "\n" +
        //         "o1_fv_x_y_z: " + o1_fv_x_y_z + "\n" +
        //         "o2_fv_x_y_z: " + o2_fv_x_y_z + "\n" +
        //         "o1_final_angle: " + (o1_final_angle * 180 / Math.PI) + "\n" +
        //         "o2_final_angle: " + (o2_final_angle * 180 / Math.PI) + "\n" +
        //         "original total force magnitude: " + magnitude_init
        //     );
        //
        //     const o1_x = o1_fv_x_y_z[0];
        //     const o2_x = o2_fv_x_y_z[0];
        //     const o1_z = o1_fv_x_y_z[2];
        //     const o2_z = o2_fv_x_y_z[2];
        //
        //     const o2_final_u =
        //         Math.abs(
        //         (o1_z + o2_z - (1 / Math.tan(o1_final_angle)) * (o1_x + o2_x))
        //         /
        //         (Math.cos(o2_final_angle) + (1 / Math.tan(o1_final_angle)) * Math.sin(o2_final_angle))
        //         );
        //     const o1_final_u =
        //         Math.abs(
        //         (o1_x + o2_x - Math.sin(o2_final_angle) * o2_final_u)
        //         /
        //         (Math.sin(o1_final_angle))
        //         );
        //
        //     // const o1_final = (o1_final_u / (o1_final_u + o2_final_u)) * (magnitude_init);
        //     // const o2_final = (o2_final_u / (o1_final_u + o2_final_u)) * (magnitude_init);
        //
        //     console.log(
        //         "elastic collision magnitude calculation results: " + "\n" +
        //         "o2 final: " + o2_final_u + "\n" +
        //         "o1 final: " + o1_final_u
        //     );
        //     return [o1_final_u, o2_final_u];
        // }

        static calculate_elastic_collision_2d(o1, o2, o1_fv_x_y_z, o2_fv_x_y_z, normal, normal_perpendicular) {

            const o1_magnitude_init = o1.force_vector[2];
            const o2_magnitude_init = o2.force_vector[2];
            const magnitude_init = o1_magnitude_init + o2_magnitude_init;

            var o1_final;
            var o2_final;

            if (o1_magnitude_init > o2_magnitude_init) {
                o2_final = .70 * magnitude_init;
                o1_final = .30 * magnitude_init;
            }
            else if (o2_magnitude_init > o1_magnitude_init) {
                o1_final = .70 * magnitude_init;
                o2_final = .30 * magnitude_init;
            }
            else {
                o1_final = .50 * magnitude_init;
                o2_final = .50 * magnitude_init;
            }

            return [o1_final, o2_final];
        }

        static calculate_vector_angle(v1, v2) {
            if (v1.equals(Vec.of(0, 0, 0)) || v2.equals(Vec.of(0, 0, 0)))
                return 0;

            const v2_on_right = PhysicsObject.is_right(Vec.of(0, 0, 0), v1, v2);
            const angle = Math.acos(v1.dot(v2) / (Math.sqrt(v1.dot(v1)) * Math.sqrt(v2.dot(v2))));

            return (v2_on_right == 1) ? 2 * Math.PI - angle : angle;
        }

        static is_right(p1, p2, p3) {
            const res = (p2[0] - p1[0]) * (p3[2] - p1[2]) - (p2[2] - p1[2]) * (p3[0] - p1[0]);
            return res / Math.abs(res);
        }

        static normalize_angle(angle) {
            while (angle > 2 * Math.PI) {
                angle -= 2 * Math.PI;
            }
            while (angle < 0) {
                angle += 2 * Math.PI;
            }
            return angle;
        }
    }