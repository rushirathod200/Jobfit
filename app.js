// Required modules
const express = require("express");
const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const multer = require("multer");

// Models
const userModel = require("./models/user.model");
const companymodel = require("./models/company.model");
const jobModel = require("./models/job.model");

// Express setup
const app = express();
const SECRET = "spider";

// DB connection
const url = "mongodb+srv://dhruvpaun28:dhruv123@cluster0.jpxdica.mongodb.net/jobfitdata?retryWrites=true&w=majority&appName=Cluster0";
mongoose.connect(url).then(() => console.log("\u2705 MongoDB Connected")).catch(console.error);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");

// Create media folder if it doesn't exist
const mediaDir = path.join(__dirname, "media");
if (!fs.existsSync(mediaDir)) fs.mkdirSync(mediaDir);

// File upload setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, mediaDir),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// --------- Custom Middleware for Auth -----------
function requireAuth(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.redirect("/login");

  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.clearCookie("token");
    return res.redirect("/login");
  }
}

function requireRole(role) {
  return (req, res, next) => {
    if (req.user.role !== role) return res.status(403).send("Access denied");
    next();
  };
}

// ------------------- Routes -------------------
app.get("/", (req, res) => res.render("Homepage"));
app.get("/login", (req, res) => res.render("LoginPage"));
app.get("/register", (req, res) => res.render("SignInpage"));
app.get("/register/Company", (req, res) => res.render("signin_rec"));
app.get("/job", (req, res) => res.render("Job matching"));
app.get("/Resume_Comparison", (req, res) => res.render("Resume Comparison"));

// Registration (User)
app.post("/register", async (req, res) => {
  const { email, password, role, name } = req.body;

  try {
    if (await userModel.findOne({ email })) return res.status(400).send("Email already in use");
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await userModel.create({ email, password: hashedPassword, role, name });

    const token = jwt.sign({ id: user._id, role: user.role }, SECRET, { expiresIn: "1d" });
    res.cookie("token", token, { httpOnly: true, maxAge: 86400000 });
    res.redirect("/login");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// Registration (Company)
app.post("/register/Company", upload.single("logoUrl"), async (req, res) => {
  const { name, email, password, role, description, industry, size } = req.body;
  const logoPath = req.file ? path.join("media", req.file.filename) : "";

  try {
    if (await companymodel.findOne({ email })) return res.status(400).send("Email already exists");
    const hashedPassword = await bcrypt.hash(password, 10);

    const company = await companymodel.create({
      name, email, password: hashedPassword, role, description, industry, size, logoUrl: logoPath,
    });

    const token = jwt.sign({ id: company._id, role: company.role }, SECRET, { expiresIn: "7d" });
    res.cookie("token", token, { httpOnly: true });
    res.redirect("/dashboard");
  } catch (err) {
    console.error(err);
    res.status(500).send("Registration failed");
  }
});

// Login Handler
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  console.log("Email:", email);
  console.log("Password:", password);

  if (!email || !password) {
    return res.status(400).send("Email and password are required");
  }

  try {
    // First, try finding in userModel
    let user = await userModel.findOne({ email });
    console.log(user);
    

    if (user && user.password) {
      const match = await bcrypt.compare(password, user.password);
      if (match) {
        const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, SECRET, { expiresIn: "1d" });
        res.cookie("token", token, { httpOnly: true, maxAge: 86400000 });
        return res.redirect("/dashboard");
      }
    }

    // Try company model next
    user = await companymodel.findOne({ email });

    if (user && user.password) {
      const match = await bcrypt.compare(password, user.password);
      if (match) {
        const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, SECRET, { expiresIn: "1d" });
        res.cookie("token", token, { httpOnly: true, maxAge: 86400000 });
        return res.redirect("/dashboard");
      }
    } 

    return res.status(400).send("Invalid credentials");
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).send("Server error");
  }
});


// Dashboard - Protected
app.get("/dashboard", requireAuth, async (req, res) => {
  try {
    if (req.user.role === "job_seeker") {
      const user = await userModel.findById(req.user.id);
      return res.render("UserDashboard", { user });
    } else if (req.user.role === "company") {
      const company = await companymodel.findById(req.user.id);
      return res.render("RecruiterDaseboard", { user: company });
    } else {
      return res.redirect("/login");
    }
  } catch (err) {
    res.clearCookie("token").redirect("/login");
  }
});

// Job Creation - Company Only
app.get("/job_creation", requireAuth, requireRole("company"), (req, res) => {
  res.render("jobCreation");
});

app.post("/job_creation", async (req, res) => {
  try {
    const token = req.cookies.token;

    // 1. Token check
    if (!token) {
      return res.status(401).send("Unauthorized: No token provided");
    }

    // 2. Decode token and get user info
    const decoded = jwt.verify(token, SECRET_KEY);
    const userId = decoded.id;
    const userRole = decoded.role;

    // 3. Role check (must be company)
    if (userRole !== "company") {
      return res.status(403).send("Access denied: Only companies can post jobs");
    }

    // 4. Get job details from form
    const { title, location, minsalary, maxsalary, description, requirements } = req.body;

    // 5. Create job in DB
    const job = await Job.create({
      title,
      location,
      minsalary,
      maxsalary,
      description,
      requirements,
      company: userId
    });

    res.send("Job posted successfully");

  } catch (error) {
    console.error("Job creation error:", error);
    res.status(500).send("Failed to post job");
  }
});

// Logout
app.get("/logout", (req, res) => {
  res.clearCookie("token");
  res.redirect("/");
});

// Start server
app.listen(2000, () => console.log("\uD83D\uDE80 Server running on http://localhost:2000"));
