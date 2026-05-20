require("dotenv").config();
const express = require("express");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { Readable } = require("stream");
const rateLimit = require("express-rate-limit");
const app = express();
app.use(express.json());
// configure Cloudinary (image cnd for amy imgs)
cloudinary.config({
  cloud_name: process.env.cloud_name,
  api_key:    process.env.cloud_key,
  api_secret: process.env.cloud_secret,
});
//config for the ratelimit
const limiter = rateLimit({
  windowMs: 60 * 1000,  
  max: 40,             
  message: { status: 429, message: "Too many requests, slow down." },
});

app.use(limiter); // apply to all endpoints
// function to chek the token
function tokencheck(req, res, next) {
  const token = req.headers["x-api-token"];
  if (!token || token !== process.env.token) {
    return res.status(401).json({ status: 401, message: "Unauthorized" });
  }
  next();
}
const upload = multer({ storage: multer.memoryStorage() });
function uploadCloud(buffer, folder) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder },
      (err, result) => err ? reject(err) : resolve(result)
    );
    Readable.from(buffer).pipe(uploadStream);
  });
}
app.get("/api/random", async (req, res) => {
  try {
    const { resources } = await cloudinary.search
      .expression("folder:amy")
      .max_results(500)
      .execute();
    if (!resources.length) {
      return res.status(404).json({ status: 404, message: "No images found" });
    }
    const random = resources[Math.floor(Math.random() * resources.length)];
    res.json({ status: 200, url: random.secure_url });
  } catch (err) {
    console.error("Get Error", err.message);
    res.status(500).json({ status: 500, message: "Failed to fetch image" });
  }
});
app.post("/api/upload", tokencheck, upload.single("image"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ status: 400, message: "No file uploaded" });
  }

  try {
    const result = await uploadCloud(req.file.buffer, "amy");
    res.json({
      status: 200,
      message: "Image uploaded successfully",
      url: result.secure_url,
      public_id: result.public_id,
    });
  } catch (err) {
    console.error("Error on Upload", err.message);
    res.status(500).json({ status: 500, message: "Upload failed" });
  }
});
app.delete("/api/delete/:folder/:public_id", tokencheck, async (req, res) => {
  const public_id = `${req.params.folder}/${req.params.public_id}`;
  try {
    const result = await cloudinary.uploader.destroy(public_id);
    if (result.result !== "ok") {
      return res.status(404).json({ status: 404, message: "Image nt found" });
    }
    res.json({ status: 200, message: "Image deleted", public_id });
  } catch (err) {
    console.error("Delete Error", err.message);
    res.status(500).json({ status: 500, message: "Failed to delete image" });
  }
})
app.get("/api/endpoints", async (req, res) => {
  try {
    const response = {
      status: 200,
      endpoints: [
        "/api/endpoints/ - View all Endpoints", "/api/random/ - Get a random Image", "/api/info/ - Get some info on Amy", "/api/upload/ - Upload an Image to the Cdn", "/api/delete/ - Delete an Image from the Cdn"
      ]
    }
    res.json(response)
  } catch(err) {
    res.status(500).json({status: 500, message: err.message})
    console.error(`Endpoint error: ${err}`)
  }
})
app.get("/api/info", async (req, res) => {
  try {
    const btstamp = 1619654400
    const birthDate = new Date(btstamp * 1000)
    const now = new Date()
    let age = now.getFullYear() - birthDate.getFullYear()
    const monthDif = now.getMonth() - birthDate.getMonth()
    const dayDif = now.getDate() - birthDate.getDate()
    if (monthDif < 0 || (monthDif === 0 && dayDif < 0)) {
      age--
    }
    // prepare response
    const response = {
      status: 200,
      name: "Amy",
      name_original: "Arya",
      gender: "female",
      breed: "EKH", 
      birthday: "29th April 2021",
      bdaytimestamp: btstamp,
      age: age
    }
  res.json(response)
  } catch(err) {
    console.error("Info error", err)
    res.status(500).json({ status: 500, message: err.message})
  }
})
const p = process.env.p || "3000"
app.listen(p, () => {
  console.log(`API running at http://localhost:${p}`);
});