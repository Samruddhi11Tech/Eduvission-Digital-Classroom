const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const multer = require("multer");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "dev_only_change_me";

const ROOT = __dirname;
const DB_PATH = path.join(ROOT, "data", "db.json");
const UPLOAD_DIR = path.join(ROOT, "uploads");
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

function db() {
  return JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
}
function saveDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}
function id(prefix="id") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
}

app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(UPLOAD_DIR));
app.use(express.static(path.join(ROOT, "frontend")));

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, UPLOAD_DIR),
  filename: (_, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${Date.now()}-${safe}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }
});

function signUser(user) {
  return jwt.sign(
    { id: user.id, role: user.role, name: user.name, email: user.email },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}
function auth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Login required." });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: "Session expired. Please login again." });
  }
}
function role(...roles) {
  return (req,res,next) => {
    if (!roles.includes(req.user.role)) return res.status(403).json({ message: "You do not have permission for this action." });
    next();
  };
}

app.post("/api/auth/login", async (req,res) => {
  const { email, password, role: requestedRole } = req.body;
  const data=db();
  const user=data.users.find(u => u.email.toLowerCase()===String(email||"").toLowerCase());
  if (!user) return res.status(401).json({ message:"Invalid email or password." });
  if (requestedRole && user.role !== requestedRole) return res.status(403).json({ message:`This account is registered as ${user.role}.` });
  // Demo accounts are intentionally available for local project testing.
  // This fallback also makes the starter project independent of pre-generated
  // password hashes in the JSON file. Real accounts still use bcrypt.
  const demoPasswords = {
    "teacher@eduvision.local": "Teacher@123",
    "student@eduvision.local": "Student@123"
  };
  const normalizedEmail = user.email.toLowerCase();
  const isDemoLogin = demoPasswords[normalizedEmail] === String(password || "");
  const ok = isDemoLogin || await bcrypt.compare(password || "", user.passwordHash);
  if(!ok) return res.status(401).json({ message:"Invalid email or password." });
  res.json({
    token:signUser(user),
    user:{
      id:user.id,
      name:user.name,
      email:user.email,
      role:user.role,
      className:user.className || ""
    }
  });
});
// ---------------- Student Class ----------------

app.get("/api/profile", auth, (req,res)=>{
  const data = db();
  const user = data.users.find(u => u.id === req.user.id);

  if(!user) return res.status(404).json({message:"User not found."});

  res.json({
    id:user.id,
    name:user.name,
    email:user.email,
    role:user.role,
    className:user.className || ""
  });
});

app.patch("/api/profile/class", auth, role("student"), (req,res)=>{
  const { className } = req.body;

  const allowedClasses = [
    "5","6","7","8","9","10","11","12"
  ];

  if(!allowedClasses.includes(String(className))){
    return res.status(400).json({
      message:"Please select a valid class."
    });
  }

  const data = db();
  const user = data.users.find(u => u.id === req.user.id);

  if(!user){
    return res.status(404).json({message:"User not found."});
  }

  user.className = String(className);

  saveDB(data);

  res.json({
    message:"Class saved successfully.",
    className:user.className
  });
});
app.patch("/api/profile/language", auth, role("student"), (req,res)=>{
  const { language } = req.body;

  const allowedLanguages = [
    "English",
    "Marathi",
    "Hindi"
  ];

  if(!allowedLanguages.includes(language)){
    return res.status(400).json({
      message:"Please select a valid language."
    });
  }

  const data = db();
  const user = data.users.find(u => u.id === req.user.id);

  if(!user){
    return res.status(404).json({message:"User not found."});
  }

  user.language = language;

  saveDB(data);

  res.json({
    message:"Language saved successfully.",
    language:user.language
  });
});
app.get("/api/subjects", (req,res)=>res.json(db().subjects));
app.get("/api/subjects/:id", (req,res)=>{
  const data=db(); const subject=data.subjects.find(s=>s.id===req.params.id);
  if(!subject) return res.status(404).json({message:"Subject not found."});
  res.json({subject});
});
app.get("/api/subjects/:id/chapters",(req,res)=>{
  const data = db();

  let chapters = data.chapters.filter(
    c => c.subjectId === req.params.id && c.published !== false
  );

  // Students see their own class + "all" content.
  if(req.headers.authorization){
    try{
      const token = req.headers.authorization.startsWith("Bearer ")
        ? req.headers.authorization.slice(7)
        : null;

      if(token){
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = data.users.find(u => u.id === decoded.id);

        if(user?.role === "student" && user.className){
          chapters = chapters.filter(
            c => !c.className ||
                 c.className === "all" ||
                 c.className === user.className
          );
        }
      }
    }catch{}
  }

  res.json(chapters);
});

app.post("/api/subjects", auth, role("teacher"), (req,res)=>{
  const {name,emoji,description,color}=req.body;
  if(!name) return res.status(400).json({message:"Subject name is required."});
  const data=db();
  const subject={id:id("subject"),name,emoji:emoji||"📚",description:description||"",color:color||"purple"};
  data.subjects.push(subject); saveDB(data); res.status(201).json(subject);
});

app.post("/api/chapters", auth, role("teacher"), (req,res)=>{
  const {subjectId,title,description,className}=req.body;
  const data=db();
  if(!data.subjects.some(s=>s.id===subjectId)) return res.status(400).json({message:"Subject not found."});
  if(!title) return res.status(400).json({message:"Chapter title is required."});const chapter={
  id:id("chapter"),
  subjectId,
  title,
  description:description||"",
  className:className || "all",
  published:true
};
  data.chapters.push(chapter); saveDB(data); res.status(201).json(chapter);
});

app.get("/api/chapters/:id",(req,res)=>{
  const data=db();

  const chapter=data.chapters.find(
    c => c.id===req.params.id && c.published!==false
  );

  if(!chapter)
    return res.status(404).json({message:"Chapter not found."});

  let student = null;

  // Read logged-in student if a token exists
  try{
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ")
      ? header.slice(7)
      : null;

    if(token){
      const decoded = jwt.verify(token, JWT_SECRET);
      student = data.users.find(u => u.id === decoded.id);
    }
  }catch{}

  let materials=data.materials.filter(
    m => m.chapterId===chapter.id && m.published!==false
  );

  if(student?.role === "student"){
    materials = materials.filter(m =>
      (!m.className || m.className === "all" || m.className === student.className) &&
      (!m.language || m.language === student.language || m.language === "all")
    );
  }

  const quizzes=data.quizzes
    .filter(q=>q.chapterId===chapter.id && q.published!==false)
    .map(q=>({
      id:q.id,
      title:q.title,
      description:q.description,
      subjectId:q.subjectId,
      chapterId:q.chapterId
    }));

  res.json({chapter,materials,quizzes});
});

app.post("/api/materials", auth, role("teacher"), upload.single("file"), (req,res)=>{
  const {
    chapterId,
    title,
    type,
    description,
    content,
    url,
    className,
    language
  } = req.body;

  const data=db();
  if(!data.chapters.some(c=>c.id===chapterId)) return res.status(400).json({message:"Chapter not found."});
  if(!title) return res.status(400).json({message:"Material title is required."});
  const material={
  id:id("material"),
  chapterId,
  title,
  type:type||"note",
  description:description||"",
  content:content||"",
  url:url||"",
  className:className || "all",
  language:language || "English",
  createdBy:req.user.id,
  createdAt:new Date().toISOString(),
  published:true
};
  if(req.file) material.url=`/uploads/${req.file.filename}`;
  data.materials.push(material); saveDB(data);
  res.status(201).json(material);
});

app.get("/api/quizzes",(req,res)=>{
  res.json(db().quizzes.filter(q=>q.published!==false).map(q=>({
    id:q.id,title:q.title,description:q.description,subjectId:q.subjectId,chapterId:q.chapterId,
    questionCount:q.questions.length
  })));
});
app.get("/api/quizzes/:id",(req,res)=>{
  const q=db().quizzes.find(x=>x.id===req.params.id && x.published!==false);
  if(!q) return res.status(404).json({message:"Quiz not found."});
  res.json(q);
});
app.post("/api/quizzes", auth, role("teacher"), (req,res)=>{
  const {subjectId,chapterId,title,description,questions}=req.body;
  if(!title || !Array.isArray(questions) || !questions.length) return res.status(400).json({message:"Quiz title and at least one question are required."});
  const data=db();
  if(!data.subjects.some(s=>s.id===subjectId)) return res.status(400).json({message:"Subject not found."});
  if(chapterId && !data.chapters.some(c=>c.id===chapterId)) return res.status(400).json({message:"Chapter not found."});
  for(const q of questions){
    if(!q.question || !Array.isArray(q.options) || q.options.length!==4 || q.answer<0 || q.answer>3)
      return res.status(400).json({message:"Every question must have four options and one correct answer."});
  }
  const quiz={id:id("quiz"),subjectId,chapterId:chapterId||null,title,description:description||"",questions,createdBy:req.user.id,published:true};
  data.quizzes.push(quiz); saveDB(data); res.status(201).json(quiz);
});

app.post("/api/quizzes/:id/submit", auth, role("student"), (req,res)=>{
  const data=db(); const quiz=data.quizzes.find(q=>q.id===req.params.id && q.published!==false);
  if(!quiz) return res.status(404).json({message:"Quiz not found."});
  const answers=Array.isArray(req.body.answers)?req.body.answers:[];
  let score=0;
  quiz.questions.forEach((q,i)=>{if(Number(answers[i])===Number(q.answer)) score++;});
  const percentage=Math.round(score/quiz.questions.length*100);
  const result={
    id:id("result"),studentId:req.user.id,studentName:req.user.name,
    quizId:quiz.id,quizTitle:quiz.title,score,total:quiz.questions.length,percentage,
    createdAt:new Date().toISOString()
  };
  data.results.push(result); saveDB(data);
  res.json({
    ...result,
    message:percentage>=80?"Great work! Keep challenging yourself.":percentage>=50?"Good start! Review the explanations and try again.":"Keep going! Revisit the chapter and try the quiz again."
  });
});

app.get("/api/results/me",auth,role("student"),(req,res)=>{
  res.json(db().results.filter(r=>r.studentId===req.user.id).sort((a,b)=>b.createdAt.localeCompare(a.createdAt)));
});
app.get("/api/results/all",auth,role("teacher"),(req,res)=>{
  res.json(db().results.sort((a,b)=>b.createdAt.localeCompare(a.createdAt)));
});

app.get("/api/careers",(req,res)=>res.json(db().careers));
app.get("/api/careers/:id",(req,res)=>{
  const c=db().careers.find(x=>x.id===req.params.id);
  if(!c)return res.status(404).json({message:"Career not found."});
  res.json(c);
});

app.get("*",(req,res)=>{
  res.sendFile(path.join(ROOT,"frontend","index.html"));
});

app.listen(PORT,()=>{
  console.log(`EduVision running at http://localhost:${PORT}`);
});
