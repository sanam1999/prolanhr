const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
require("dotenv").config();
const { router: authRouter } = require("./routes/auth.route");
const attendance = require("./routes/attendance.route.js");
const dashboard = require("./routes/dashboard.route.js");
const departments = require("./routes/departments.route.js");
const employee = require("./routes/employee.route.js");
const holiday = require("./routes/holiday.route .js");
const leaveRequest = require("./routes/leaveRequest.route.js");
const profile = require("./routes/profile.route.js");
const teamtrack = require("./routes/teamtrack.route.js");
const { router: notificationRoutes } = require("./routes/notification");

const { Employee } = require("./models/employee.model");

const { authMiddleware, isAdmin, isEmployee } = require("./middleware/authMiddleware");

const project = require('./routes/project.route.js')

const app = express();

const { startScheduler } = require("./utils/scheduler.js")

startScheduler();
app.use(cors({
    origin: [process.env.WEBSITE_URL, process.env.ADMIN_URL],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
}));

passport.use(new LocalStrategy({ usernameField: "email" }, Employee.authenticate()));
app.use(passport.initialize());
app.use(express.json());

mongoose.connect(process.env.MONGO_URL)
    .then(() => console.log("MongoDB Connected"))
    .catch(err => console.log(err));


app.use((req, res, next) => {
    console.log(`${req.method} ${req.originalUrl}`);
    next();
});


app.get("/", async (req, res) => {
    res.send("api is working")
})


app.use("/auth", authRouter);
app.use(authMiddleware);
app.use("/notifications", notificationRoutes);


app.use("/holiday", holiday);

app.use("/project", project);
app.use("/attendance", attendance);
app.use("/dashboard", dashboard);
app.use("/departments", departments);
app.use("/employee", employee);
app.use("/leaveRequest", leaveRequest);
app.use("/profile", profile);
app.use("/teamtrack", teamtrack);

app.listen(3050, () => console.log("Server running on port 3050"));

