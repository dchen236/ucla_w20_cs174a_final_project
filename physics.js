
window.PhysicsObject = window.classes.PhysicsObject =
    class PhysicsObject {
        constructor(damping_constant, mass, center_transform, radius) {
            this.transform = Mat4.identity();
            this.force_vector = Vec.of(0, 0, 0);
            this.damping_constant = damping_constant;
            this.center_transform = center_transform;
            this.center = center_transform.times(Vec.of(0, 0, 0, 1));
            this.radius = radius;
            this.mass = mass;
        }

        reset() {
            this.transform = Mat4.identity();
            this.center = this.center_transform.times(Vec.of(0, 0, 0, 1));
            this.force_vector = Vec.of(0, 0, 0);
        }

        apply_force(force_vector) {
            if (force_vector.equals(0, 0, 0))
                return;
            const current_force_vector_x_y_z = PhysicsObject.calculate_x_y_z(this.force_vector);
            const applied_force_vector_x_y_z = PhysicsObject.calculate_x_y_z(force_vector);
            const new_force_vector_x_y_z = current_force_vector_x_y_z.plus(applied_force_vector_x_y_z);
            const new_force_vector = PhysicsObject.calculate_offset_angles_and_magnitude(new_force_vector_x_y_z);
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

            this.force_vector[2] = this.force_vector[2] - (this.damping_constant * graphics_state.animation_delta_time);
            if (this.force_vector[2] < 0)
                this.force_vector[2] = 0;
            const force_vector_x_y_z = PhysicsObject.calculate_x_y_z(this.force_vector);
            const delta_translation =
                Mat4.identity()
                    .times(Mat4.translation(
                        Vec.of(
                            force_vector_x_y_z[0] * graphics_state.animation_delta_time,
                            force_vector_x_y_z[1] * graphics_state.animation_delta_time,
                            force_vector_x_y_z[2] * graphics_state.animation_delta_time)
                        )
                    );
            this.transform = this.transform.times(delta_translation);
            return this.transform;
        }

        static calculate_elastic_collision(o1, o2) {
            // calculate magnitude of final forces on objects
            const o1_fv_x_y_z_init = PhysicsObject.calculate_x_y_z(o1.force_vector);
            const o2_fv_x_y_z_init = PhysicsObject.calculate_x_y_z(o2.force_vector);
            const vf_x = PhysicsObject.calculate_elastic_collision_1d(o1, o2, o1_fv_x_y_z_init, o2_fv_x_y_z_init, 0);
            const vf_y = PhysicsObject.calculate_elastic_collision_1d(o1, o2, o1_fv_x_y_z_init, o2_fv_x_y_z_init, 1);
            const vf_z = PhysicsObject.calculate_elastic_collision_1d(o1, o2, o1_fv_x_y_z_init, o2_fv_x_y_z_init, 2);
            o1.force_vector = PhysicsObject.calculate_offset_angles_and_magnitude(Vec.of(vf_x[0], vf_y[0], vf_z[0]));
            o2.force_vector = PhysicsObject.calculate_offset_angles_and_magnitude(Vec.of(vf_x[1], vf_y[1], vf_z[1]));

            // adjust angle of final forces on objects based on whether the collision was a glancing collision
            const o1_center = o1.get_center();
            const o2_center = o2.get_center();
            const collision_normal = o1_center.minus(o2_center);
            console.log("collision normal: " + collision_normal);
            const normal_theta =
                (o1_center[0] < o2_center[0] ? -1 : 1) *
                PhysicsObject.calculate_vector_angle(
                Vec.of(collision_normal[0], collision_normal[1], collision_normal[2]),
                Vec.of(0, 0, 1));
            console.log("normal theta: " + (normal_theta * (180 / Math.PI)));

            // calculate o1's angle with splitter
            const x_vector_matrix = Mat4.identity();
            x_vector_matrix[0][3] = 1;
            const zx_collision_splitter_vector =
                x_vector_matrix.times(Mat4.rotation(normal_theta + Math.PI / 2, Vec.of(0, 1, 0)));
            const zx_collision_splitter =
                Vec.of(zx_collision_splitter_vector[0][3], zx_collision_splitter_vector[1][3], zx_collision_splitter_vector[2][3]);
            const o1_zx_collision_theta = PhysicsObject.calculate_collision_theta(o1_fv_x_y_z_init, zx_collision_splitter);
            console.log("zx_collision_splitter: " + zx_collision_splitter);
            console.log("o1_fv_x_y_z_init: " + o1_fv_x_y_z_init);
            console.log()
            console.log("o1 zx collision theta: " + o1_zx_collision_theta);

            const ret = [
                Mat4.translation(Vec.of(o1_center[0], o1_center[1], o1_center[2])),
                Mat4.rotation( normal_theta + Math.PI / 2, Vec.of(0, 1, 0)), // splitter rotation
                Mat4.rotation( o1_zx_collision_theta, Vec.of(0, 1, 0))
            ];
            console.log(ret);
            return ret;
        }

        static calculate_collision_theta(fv_init, collision_splitter) {
            // calculate zx collision theta
            var fv_x_y_z_init_zx = fv_init;
            fv_x_y_z_init_zx[1] = 0;
            const collision_theta = PhysicsObject.calculate_vector_angle(fv_x_y_z_init_zx, collision_splitter);
            return collision_theta;
        }

        static calculate_vector_angle(v1, v2) {
            if (v1.equals(Vec.of(0, 0, 0)) || v2.equals(Vec.of(0, 0, 0)))
                return 0;
            return Math.acos(
                v1.dot(v2) /
                (Math.sqrt(v1.dot(v1)) * Math.sqrt(v2.dot(v2))))
        }

        static calculate_elastic_collision_1d(o1, o2, o1_fv_x_y_z, o2_fv_x_y_z, index) {
            const vo_o1 = o1_fv_x_y_z[index];
            const vo_o2 = o2_fv_x_y_z[index];

            const vf_o2 = (-o1.mass*vo_o2 + 2*o1.mass*vo_o1 + o2.mass*vo_o2)/(o1.mass + o2.mass);
            const vf_o1 = (o1.mass*vo_o1 + o2.mass*vo_o2 - o2.mass*vf_o2)/o1.mass;
            return Vec.of(vf_o1, vf_o2);
        }

        static calculate_x_y_z(offset_angles_and_magnitude_force_vector) {
            const zx_offset_angle = -offset_angles_and_magnitude_force_vector[0];
            const zy_offset_angle = offset_angles_and_magnitude_force_vector[1];
            const magnitude = -offset_angles_and_magnitude_force_vector[2];

            if (magnitude == 0.0)
                return Vec.of(0.0, 0.0, 0.0);

            const zy_h = (magnitude) / Math.sqrt(Math.cos(zy_offset_angle)**2 * Math.tan(zx_offset_angle)**2 + 1);
            const zx_h = Math.cos(zy_offset_angle) * zy_h / Math.cos(zx_offset_angle);

            const z = Math.cos(zy_offset_angle) * zy_h;
            const x = Math.sin(zx_offset_angle) * zx_h;
            const y = Math.sin(zy_offset_angle) * zy_h;

            return Vec.of(x, y, z);
        }

        static calculate_offset_angles_and_magnitude(x_y_z_force_vector) {
            const x = x_y_z_force_vector[0];
            const y = x_y_z_force_vector[1];
            const z = x_y_z_force_vector[2];

            if (x_y_z_force_vector.equals(Vec.of(0.0, 0.0, 0.0)))
                return Vec.of(0.0, 0.0, 0.0);

            const magnitude = Math.sqrt(x**2 + y**2 + z**2);
            var zy_offset_angle = Math.acos(z / Math.sqrt(z**2 + y**2));
            var zx_offset_angle = Math.acos(z / Math.sqrt(z**2 + x**2));

            if (x < 0)
                zx_offset_angle = -zx_offset_angle;
            if (y < 0)
                zy_offset_angle = -zy_offset_angle;

            return Vec.of(-(zx_offset_angle - Math.PI), -(zy_offset_angle - Math.PI), magnitude);
        }
    }