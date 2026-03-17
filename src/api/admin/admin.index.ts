import { createElysia } from "src/utils/createElysia";

/** Admin Routes */
import authRoutes from "./auth/auth.routes";
import rolesRoutes from "./roles/roles.routes";
import moduleRoutes from "./modules/module.routes";
import adminsRoutes from "./admins/admins.routes";
import doctorRoutes from "./doctor/doctor.routes";
import doctorTimeSlotRoutes from "./doctor-time-slot/doctor-time-slot.routes";
import patientRoutes from "./patient/patient.routes";
import appointmentRoutes from "./appointment/appointment.routes";
import patientHealthRecordRoutes from "./patient-health-record/patient-health-record.routes";
import mediaRoutes from "./media/media.routes";
import schemaVisualizerRoutes from "./schema-visualizer/schema-visualizer.routes";
/** Admin Routes */
export const adminRoutes = createElysia({ prefix: "/admin" });
adminRoutes.use(authRoutes);
adminRoutes.use(rolesRoutes);
adminRoutes.use(moduleRoutes);
adminRoutes.use(adminsRoutes);

// Doctor Route
adminRoutes.use(doctorRoutes);
adminRoutes.use(doctorTimeSlotRoutes);

// Patient Route
adminRoutes.use(patientRoutes);

// Appointment Route
adminRoutes.use(appointmentRoutes);

// Patient Health Record Route
adminRoutes.use(patientHealthRecordRoutes);

// Media Route
adminRoutes.use(mediaRoutes);

/** Schema Visualizer */
adminRoutes.use(schemaVisualizerRoutes);
