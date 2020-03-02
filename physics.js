
window.PhysicsObject = window.classes.PhysicsObject =
    class PhysicsObject {
        constructor(base_transform, damping_constant, mass) {
            this.base_transform = base_transform;
            this.transform = base_transform;
            this.force_vector = Vec.of(0, 0, 0);
            this.damping_constant = damping_constant;
            this.mass = mass;
        }

        reset() {
            this.transform = this.base_transform;
            this.force_vector = Vec.of(0, 0, 0);
        }

        apply_force(force_vector) {
            const current_force_vector_x_y_z = PhysicsObject.calculate_x_y_z(this.force_vector);
            const applied_force_vector_x_y_z = PhysicsObject.calculate_x_y_z(force_vector);
            const new_force_vector_x_y_z = current_force_vector_x_y_z.plus(applied_force_vector_x_y_z);
            const new_force_vector = PhysicsObject.calculate_offset_angles_and_magnitude(new_force_vector_x_y_z);
            this.force_vector = new_force_vector;
        }

        apply_damping(damping_constant) {
            this.damping_constant = damping_constant;
        }

        get_transform(graphics_state) {
            this.force_vector[2] = this.force_vector[2] - (this.damping_constant * graphics_state.animation_delta_time);
            if (this.force_vector[2] < 0)
                this.force_vector[2] = 0;
            const force_vector_x_y_z = PhysicsObject.calculate_x_y_z(this.force_vector);
            this.transform = this.transform.times(
                Mat4.identity()
                    .times(Mat4.translation(
                        Vec.of(
                            force_vector_x_y_z[0] * graphics_state.animation_delta_time,
                            force_vector_x_y_z[1] * graphics_state.animation_delta_time,
                            force_vector_x_y_z[2] * graphics_state.animation_delta_time
                        )
                        )
                    )
            );
            return this.transform;
        }

        static calculate_elastic_collision(o1, o2) {
            const vf_x = this.calculate_elastic_collision(o1, o2, 0);
            const vf_y = this.calculate_elastic_collision(o1, o2, 1);
            const vf_z = this.calculate_elastic_collision(o1, o2, 2);
        }

        static calculate_elastic_collision(o1, o2, index) {
            const vo_o1 = o1.force_vector[index];
            const vo_o2 = o2.force_vector[index];

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