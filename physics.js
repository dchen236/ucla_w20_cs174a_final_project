
window.PhysicsObject = window.classes.PhysicsObject =
    class PhysicsObject {
        constructor(damping_constant, mass, center_transform, radius, time_constant) {
            this.transform = Mat4.identity();
            this.force_vector = Vec.of(0, 0, 0);
            this.damping_constant = damping_constant;
            this.center_transform = center_transform;
            this.center = center_transform.times(Vec.of(0, 0, 0, 1));
            this.mass = mass;
            this.radius = radius;
            this.time_constant = time_constant;
        }

        reset() {
            this.transform = Mat4.identity();
            this.center = this.center_transform.times(Vec.of(0, 0, 0, 1));
            this.force_vector = Vec.of(0, 0, 0);
        }

        apply_force(force_vector) {
            if (force_vector.equals(0, 0, 0))
                return;

            if (force_vector[0] < 0 || force_vector[0] > 2 * Math.PI) {
                console.log("apply_force only takes positive angles between 0 and 2pi, " + force_vector[0] + " is invalid");
                return;
            }

            const current_force_vector_x_y_z = PhysicsObject.calculate_x_y_z(this.force_vector);
            const applied_force_vector_x_y_z = PhysicsObject.calculate_x_y_z(force_vector);
            const new_force_vector_x_y_z = current_force_vector_x_y_z.plus(applied_force_vector_x_y_z);
            const new_force_vector = PhysicsObject.calculate_offset_angles_and_magnitude(new_force_vector_x_y_z);

            console.log("force_vector[0]: " + force_vector[0] * 180 / Math.PI);
            console.log("current_force_vector_x_y_z: " + current_force_vector_x_y_z);
            console.log("applied_force_vector_x_y_z: " + applied_force_vector_x_y_z);
            console.log("new_force_vector_x_y_z: " + new_force_vector_x_y_z);
            console.log("new_force_vector[0]: " + (new_force_vector[0] * 180 / Math.PI));

            this.force_vector = new_force_vector;
        }

        apply_damping(damping_constant) {
            this.damping_constant = damping_constant;
        }

        get_center() {
            return this.transform.times(this.center);
        }

        get_transform(graphics_state) {
            if (this.force_vector.equals(Vec.of(0, 0, 0)))
                return this.transform;

            console.log("time constant " + this.time_constant);
            this.force_vector[2] =
                this.force_vector[2] -
                (this.damping_constant * graphics_state.animation_delta_time) * this.time_constant;
            if (this.force_vector[2] < 0)
                this.force_vector[2] = 0;
            const force_vector_x_y_z = PhysicsObject.calculate_x_y_z(this.force_vector);

            const delta_translation =
                Mat4.identity()
                    .times(Mat4.translation(
                        Vec.of(
                            force_vector_x_y_z[0] * graphics_state.animation_delta_time * this.time_constant,
                            force_vector_x_y_z[1] * graphics_state.animation_delta_time * this.time_constant,
                            force_vector_x_y_z[2] * graphics_state.animation_delta_time * this.time_constant)
                        )
                    );
            this.transform = this.transform.times(delta_translation);
            return this.transform;
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

        static calculate_elastic_collision(o1, o2) {
            // calculate magnitude of final forces on objects
            const o1_fv_init = o1.force_vector;
            const o2_fv_init = o2.force_vector;
            const o1_fv_x_y_z_init = PhysicsObject.calculate_x_y_z(o1_fv_init);
            const o2_fv_x_y_z_init = PhysicsObject.calculate_x_y_z(o2_fv_init);
            const vf_x = PhysicsObject.calculate_elastic_collision_1d(o1, o2, o1_fv_x_y_z_init, o2_fv_x_y_z_init, 0);
            const vf_y = PhysicsObject.calculate_elastic_collision_1d(o1, o2, o1_fv_x_y_z_init, o2_fv_x_y_z_init, 1);
            const vf_z = PhysicsObject.calculate_elastic_collision_1d(o1, o2, o1_fv_x_y_z_init, o2_fv_x_y_z_init, 2);
            o1.force_vector = PhysicsObject.calculate_offset_angles_and_magnitude(Vec.of(vf_x[0], vf_y[0], vf_z[0]));
            o2.force_vector = PhysicsObject.calculate_offset_angles_and_magnitude(Vec.of(vf_x[1], vf_y[1], vf_z[1]));

            // adjust angle of final forces on objects based on whether the collision was a glancing collision
            const o1_info = PhysicsObject.update_object_fv_angle(o1_fv_x_y_z_init, o1, o2);
            const o2_info = PhysicsObject.update_object_fv_angle(o2_fv_x_y_z_init, o2, o1);

            const ret = [o1_info, o2_info];

            return ret;
        }

        static update_object_fv_angle(o1_fv_x_y_z_init, o1, o2) {
            const o1_center = o1.get_center();
            const o2_center = o2.get_center();
            const normal_vector = o2_center.minus(o1_center);
            const normal = Vec.of(normal_vector[0], normal_vector[1], normal_vector[2]);

            // the angle between collision normal and positive z axis
            const normal_theta = PhysicsObject.calculate_vector_angle(Vec.of(0, 0, 1), normal);

            // calculate angle with splitter
            const zx_collision_theta = PhysicsObject.calculate_vector_angle(normal, o1_fv_x_y_z_init);
            // all rotations are calculated relative to the positive z axis
            const normal_rotation = PhysicsObject.normalize_angle(normal_theta);
            const collision_rotation = PhysicsObject.normalize_angle(normal_rotation + zx_collision_theta - Math.PI);
            const reflection_rotation = PhysicsObject.normalize_angle(normal_rotation - zx_collision_theta - Math.PI);
            o1.force_vector[0] = reflection_rotation;

            console.log("---");
            console.log("collision normal: " + normal);
            console.log("normal theta: " + (normal_theta * (180 / Math.PI)));
            console.log("o1_fv_x_y_z_init: " + o1_fv_x_y_z_init);
            console.log("zx collision theta: " + (zx_collision_theta * 180 / Math.PI));
            console.log("normal_rotation: " + normal_rotation * 180 / Math.PI);
            console.log("collision_rotation: " + collision_rotation * 180 / Math.PI);
            console.log("reflection_rotation: " + reflection_rotation * 180 / Math.PI);
            console.log("---");

            return [
                Mat4.translation(Vec.of(o1_center[0], o1_center[1], o1_center[2])),
                Mat4.rotation( normal_rotation, Vec.of(0, 1, 0)),
                Mat4.rotation( collision_rotation, Vec.of(0, 1, 0)),
                Mat4.rotation( reflection_rotation, Vec.of(0, 1, 0))
            ];
        }

        static calculate_elastic_collision_1d(o1, o2, o1_fv_x_y_z, o2_fv_x_y_z, index) {
            const vo_o1 = o1_fv_x_y_z[index];
            const vo_o2 = o2_fv_x_y_z[index];

            const vf_o2 = (-o1.mass*vo_o2 + 2*o1.mass*vo_o1 + o2.mass*vo_o2)/(o1.mass + o2.mass);
            const vf_o1 = (o1.mass*vo_o1 + o2.mass*vo_o2 - o2.mass*vf_o2)/o1.mass;
            return Vec.of(vf_o1, vf_o2);
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