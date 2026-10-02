const API = "/api";

const state = {
  token: localStorage.getItem("edu_token"),
  user: JSON.parse(localStorage.getItem("edu_user") || "null"),
  subjects: [],
  chapters: [],
  materials: [],
  quizzes: [],
  careers: [],
  currentQuiz: null,
  quizAnswers: {}
};

const app = document.getElementById("app");

function escapeHTML(value=""){
  return String(value).replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[c]));
}

function toast(message){
  const el=document.getElementById("toast");
  el.textContent=message;
  el.classList.add("show");
  setTimeout(()=>el.classList.remove("show"),2600);
}

async function api(path, options={}){
  const headers = options.headers || {};
  if(!(options.body instanceof FormData)) headers["Content-Type"]="application/json";
  if(state.token) headers["Authorization"]=`Bearer ${state.token}`;
  const res=await fetch(API+path,{...options,headers});
  const data=await res.json().catch(()=>({}));
  if(!res.ok) throw new Error(data.message || "Something went wrong");
  return data;
}

function logout(){
  localStorage.removeItem("edu_token");
  localStorage.removeItem("edu_user");
  state.token=null; state.user=null;
  renderHome();
}

function navbar(){
  return `
  <nav class="navbar">
    <a class="brand" href="#" onclick="renderHome();return false;">
      <span class="brand-bubble">✨</span> EduVision
    </a>
    <div class="nav-links">
      <button class="nav-btn" onclick="renderHome()">Home</button>
      <button class="nav-btn" onclick="renderPublicSubjects()">Subjects</button>
      <button class="nav-btn" onclick="renderCareers()">Career Explorer</button>
      ${state.user
        ? `<button class="primary-btn" onclick="${state.user.role==="teacher"?"renderTeacher":"renderStudent"}()">Dashboard</button>
           <button class="ghost-btn" onclick="logout()">Logout</button>`
        : `<button class="ghost-btn" onclick="renderLogin('student')">Student</button>
           <button class="primary-btn" onclick="renderLogin('teacher')">Teacher</button>`
      }
    </div>
  </nav>`;
}

function renderHome(){
  app.innerHTML=`
  <div class="app-shell">
    ${navbar()}
    <section class="hero">
      <div>
        <span class="pill">🌈 Learn beyond the textbook</span>
        <h1>Make learning <span>curious, visual & fun.</span></h1>
        <p>
          EduVision is a digital classroom where students can learn through
          visual explanations, videos, notes, activities and quizzes — while
          teachers can publish classroom content from one simple dashboard.
        </p>
        <div class="hero-actions">
          <button class="primary-btn" onclick="renderLogin('student')">🎒 I'm a Student</button>
          <button class="ghost-btn" onclick="renderLogin('teacher')">👩‍🏫 I'm a Teacher</button>
        </div>
      </div>
      <div class="hero-art">
        <div class="learning-card card-book"><div class="emoji-big">📖</div><b>Smart Notes</b><p class="small">Learn with simple explanations.</p></div>
        <div class="learning-card card-video"><div class="emoji-big">🎬</div><b>Visual Learning</b><p class="small">See concepts instead of only reading them.</p></div>
        <div class="learning-card card-quiz"><div class="emoji-big">🧩</div><b>Daily Quiz</b><p class="small">Practice → understand mistakes → improve.</p></div>
      </div>
    </section>

    <section class="page">
      <h2 class="section-title">Everything a digital classroom needs 💜</h2>
      <p class="section-subtitle">Designed around how students can explore and understand concepts.</p>
      <div class="feature-grid">
        <div class="feature-card"><div class="icon">🎬</div><h3>Visual Learning</h3><p>Videos, diagrams, images and interactive activities can sit beside normal notes.</p></div>
        <div class="feature-card"><div class="icon">🧠</div><h3>Think, Don't Memorise</h3><p>Use examples, explanations and quizzes to encourage understanding and curiosity.</p></div>
        <div class="feature-card"><div class="icon">🧩</div><h3>Daily Quizzes</h3><p>Subject and chapter quizzes help students practise a little every day.</p></div>
        <div class="feature-card"><div class="icon">👩‍🏫</div><h3>Teacher Publishing</h3><p>Teachers can publish notes, images, resources and quizzes without editing code.</p></div>
        <div class="feature-card"><div class="icon">🚀</div><h3>Career Explorer</h3><p>Help older students discover career areas beyond only the most commonly discussed choices.</p></div>
        <div class="feature-card"><div class="icon">🌐</div><h3>Built to Grow</h3><p>Subjects, chapters and learning resources are stored as data so the platform can expand.</p></div>
      </div>
    </section>

    <section class="page">
      <h2 class="section-title">Choose your learning space</h2>
      <div class="role-grid">
        <div class="role-card"><div class="role-icon">🎒</div><h3>Student</h3><p>Study subjects, explore chapters, watch resources, take quizzes and discover careers.</p><button class="primary-btn" onclick="renderLogin('student')">Enter Student Space</button></div>
        <div class="role-card"><div class="role-icon">👩‍🏫</div><h3>Teacher</h3><p>Publish classroom resources, create quizzes and view student learning results.</p><button class="primary-btn" onclick="renderLogin('teacher')">Enter Teacher Space</button></div>
        <div class="role-card"><div class="role-icon">💡</div><h3>Career Explorer</h3><p>Explore healthcare, technology, creative, science and people-focused career areas.</p><button class="primary-btn" onclick="renderCareers()">Explore Careers</button></div>
      </div>
    </section>
    <footer class="footer">EduVision • Learn • Imagine • Explore • Create</footer>
  </div>`;
}

function renderLogin(role="student"){
  app.innerHTML=`
  ${navbar()}
  <div class="auth-wrap">
    <form class="auth-card" onsubmit="login(event)">
      <div class="pill">${role==="teacher"?"👩‍🏫 Teacher":"🎒 Student"}</div>
      <h1>Welcome back!</h1>
      <p class="section-subtitle">Enter your account to continue.</p>
      <input type="hidden" id="loginRole" value="${role}">
      <div class="form-group"><label>Email</label><input id="email" type="email" required placeholder="you@example.com"></div>
      <div class="form-group"><label>Password</label><input id="password" type="password" required placeholder="••••••••"></div>
      <button class="primary-btn" style="width:100%">Login</button>
      <p class="small" style="margin-top:15px">Demo teacher: teacher@eduvision.local / Teacher@123<br>Demo student: student@eduvision.local / Student@123</p>
    </form>
  </div>`;
}

async function login(e){
  e.preventDefault();
  try{
    const role=document.getElementById("loginRole").value;
    const data=await api("/auth/login",{method:"POST",body:JSON.stringify({
      email:document.getElementById("email").value,
      password:document.getElementById("password").value,
      role
    })});
    state.token=data.token; state.user=data.user;
    localStorage.setItem("edu_token",state.token);
    localStorage.setItem("edu_user",JSON.stringify(state.user));
    role==="teacher"?renderTeacher():renderStudent();
  }catch(err){toast(err.message)}
}

function dashboardShell(type, content){
  const teacher=type==="teacher";
  return `
  <div class="app-shell">
    ${navbar()}
    <div class="dashboard-layout">
      <aside class="sidebar">
        <div class="sidebar-brand">${teacher?"👩‍🏫 Teacher Space":"🎒 Student Space"}</div>
        ${teacher ? `
          <button class="side-btn active" onclick="renderTeacher()">🏠 Overview</button>
          <button class="side-btn" onclick="renderTeacherSubjects()">📚 Subjects</button>
          <button class="side-btn" onclick="renderTeacherMaterials()">📤 Publish Material</button>
          <button class="side-btn" onclick="renderTeacherQuiz()">🧩 Create Quiz</button>
          <button class="side-btn" onclick="renderResults()">📊 Student Results</button>
        ` : `
          <button class="side-btn active" onclick="renderStudent()">🏠 Home</button>
          <button class="side-btn" onclick="renderPublicSubjects()">📚 Subjects</button>
          <button class="side-btn" onclick="renderStudentQuizzes()">🧩 Quizzes</button>
          <button class="side-btn" onclick="renderCareers()">🚀 Career Explorer</button>
          <button class="side-btn" onclick="renderProgress()">📈 My Progress</button>
        `}
        <button class="side-btn" onclick="logout()">🚪 Logout</button>
      </aside>
      <main class="dashboard-main">${content}</main>
    </div>
  </div>`;
}

async function loadCore(){
  const [subjects, careers] = await Promise.all([
    api("/subjects"),
    api("/careers")
  ]);
  state.subjects=subjects;
  state.careers=careers;
}

async function renderStudent(){
  try{
    await loadCore();
    const results=await api("/results/me");
    const avg=results.length ? Math.round(results.reduce((a,b)=>a+b.percentage,0)/results.length) : 0;
    app.innerHTML=dashboardShell("student",`
      <div class="dashboard-header">
        <div><h1>Hi, ${escapeHTML(state.user?.name||"Learner")}! 🌟</h1><p class="section-subtitle">What would you like to discover today?</p></div>
        <div class="user-chip">🎒 Student</div>
      </div>
      <div class="stats">
        <div class="stat-card"><div class="num">${state.subjects.length}</div><div class="label">Subjects</div></div>
        <div class="stat-card"><div class="num">${results.length}</div><div class="label">Quizzes attempted</div></div>
        <div class="stat-card"><div class="num">${avg}%</div><div class="label">Average quiz score</div></div>
        <div class="stat-card"><div class="num">🚀</div><div class="label">Keep exploring</div></div>
      </div>
      <h2 class="section-title">Explore subjects 📚</h2>
      <p class="section-subtitle">Choose a subject and jump into its chapters.</p>
      <div class="subject-grid">${state.subjects.map(subjectCard).join("")}</div>
      <div style="margin-top:30px" class="panel">
        <h2>🌈 Your learning idea</h2>
        <p style="color:var(--muted);line-height:1.7">Don't understand something after reading it once? Try another mode: watch a video, look at a diagram, read the note, try an activity and then take the quiz.</p>
      </div>
    `);
  }catch(err){toast(err.message)}
}

function subjectCard(s){
  return `<div class="subject-card color-${escapeHTML(s.color||"purple")}">
    <div class="subject-emoji">${escapeHTML(s.emoji||"📚")}</div>
    <h3>${escapeHTML(s.name)}</h3>
    <p>${escapeHTML(s.description||"Explore this subject.")}</p>
    <button class="primary-btn" onclick="openSubject('${s.id}')">Explore →</button>
  </div>`;
}

async function renderPublicSubjects(){
  try{
    const subjects=await api("/subjects"); state.subjects=subjects;
    app.innerHTML=`
    ${navbar()}
    <div class="page">
      <span class="pill">📚 Subjects</span>
      <h1 class="section-title" style="margin-top:10px">Pick something to explore</h1>
      <p class="section-subtitle">Every subject can contain chapters, notes, visuals, videos and quizzes.</p>
      <div class="subject-grid">${subjects.map(subjectCard).join("")}</div>
    </div>`;
  }catch(err){toast(err.message)}
}

async function openSubject(subjectId){
  try{
    const subject=state.subjects.find(s=>s.id===subjectId) || (await api(`/subjects/${subjectId}`)).subject;
    const chapters=await api(`/subjects/${subjectId}/chapters`);
    app.innerHTML=`
      ${navbar()}
      <div class="page">
        <button class="ghost-btn" onclick="${state.user?.role==="student"?"renderStudent()":"renderPublicSubjects()"}">← Back</button>
        <h1 class="section-title">${escapeHTML(subject.emoji)} ${escapeHTML(subject.name)}</h1>
        <p class="section-subtitle">${escapeHTML(subject.description||"Explore chapters.")}</p>
        <div class="chapter-grid">
          ${chapters.length?chapters.map(c=>`<div class="chapter-card">
            <span class="tag">Chapter</span>
            <h3>${escapeHTML(c.title)}</h3>
            <p>${escapeHTML(c.description||"Learn this chapter.")}</p>
            <button class="primary-btn" onclick="openChapter('${c.id}')">Start learning →</button>
          </div>`).join(""):`<div class="empty">No chapters published yet. A teacher can add one from the teacher dashboard.</div>`}
        </div>
      </div>`;
  }catch(err){toast(err.message)}
}

async function openChapter(chapterId){
  try{
    const data=await api(`/chapters/${chapterId}`);
    state.materials=data.materials;
    state.quizzes=data.quizzes;
    app.innerHTML=`
      ${navbar()}
      <div class="page">
        <button class="ghost-btn" onclick="openSubject('${data.chapter.subjectId}')">← Back to subject</button>
        <span class="pill">🌟 Learn visually</span>
        <h1 class="section-title">${escapeHTML(data.chapter.title)}</h1>
        <p class="section-subtitle">${escapeHTML(data.chapter.description||"")}</p>
        <div class="material-list">
          ${data.materials.length?data.materials.map(materialHTML).join(""):`<div class="empty">No learning materials have been published yet.</div>`}
        </div>
        <div style="margin-top:25px" class="panel">
          <h2>🧩 Chapter Quiz</h2>
          ${data.quizzes.length?data.quizzes.map(q=>`<div class="chapter-card"><h3>${escapeHTML(q.title)}</h3><p>${escapeHTML(q.description||"")}</p><button class="primary-btn" onclick="startQuiz('${q.id}')">Start quiz →</button></div>`).join(""):`<p class="small">No quiz published yet.</p>`}
        </div>
      </div>`;
  }catch(err){toast(err.message)}
}

function materialHTML(m){
  const icons={note:"📝",video:"🎬",image:"🖼️",pdf:"📄",link:"🔗",file:"📎"};
  return `<div class="material-card">
    <div><div class="type-icon">${icons[m.type]||"📚"}</div></div>
    <div style="flex:1">
      <h3>${escapeHTML(m.title)}</h3>
      <p>${escapeHTML(m.description||"")}</p>
      ${m.content?`<div style="margin-top:12px;line-height:1.7">${escapeHTML(m.content).replace(/\n/g,"<br>")}</div>`:""}
    </div>
    ${m.url?`<a class="primary-btn" href="${escapeHTML(m.url)}" target="_blank" rel="noopener">Open ↗</a>`:""}
  </div>`;
}

async function renderStudentQuizzes(){
  try{
    const quizzes=await api("/quizzes");
    app.innerHTML=`
    ${navbar()}
    <div class="page">
      <span class="pill">🧩 Practice time</span>
      <h1 class="section-title" style="margin-top:10px">Quizzes</h1>
      <p class="section-subtitle">Try short quizzes and learn from the explanations.</p>
      <div class="chapter-grid">${quizzes.map(q=>`<div class="chapter-card"><span class="tag">Quiz</span><h3>${escapeHTML(q.title)}</h3><p>${escapeHTML(q.description||"")}</p><button class="primary-btn" onclick="startQuiz('${q.id}')">Start →</button></div>`).join("")||`<div class="empty">No quizzes yet.</div>`}</div>
    </div>`;
  }catch(err){toast(err.message)}
}

async function startQuiz(id){
  try{
    const quiz=await api(`/quizzes/${id}`);
    state.currentQuiz=quiz; state.quizAnswers={};
    renderQuizQuestion(0);
  }catch(err){toast(err.message)}
}

function renderQuizQuestion(index){
  const q=state.currentQuiz.questions[index];
  app.innerHTML=`
  ${navbar()}
  <div class="page">
    <div class="quiz-box">
      <span class="tag">Question ${index+1} of ${state.currentQuiz.questions.length}</span>
      <h1 class="section-title">${escapeHTML(state.currentQuiz.title)}</h1>
      <h2>${escapeHTML(q.question)}</h2>
      ${q.options.map((o,i)=>`<button class="quiz-option ${state.quizAnswers[index]===i?"selected":""}" onclick="chooseAnswer(${index},${i})">${String.fromCharCode(65+i)}. ${escapeHTML(o)}</button>`).join("")}
      <div style="margin-top:15px;display:flex;justify-content:space-between;gap:10px">
        ${index>0?`<button class="ghost-btn" onclick="renderQuizQuestion(${index-1})">← Previous</button>`:"<span></span>"}
        ${index<state.currentQuiz.questions.length-1
          ?`<button class="primary-btn" onclick="renderQuizQuestion(${index+1})">Next →</button>`
          :`<button class="primary-btn" onclick="submitQuiz()">Finish quiz 🎉</button>`}
      </div>
    </div>
  </div>`;
}

function chooseAnswer(q,i){state.quizAnswers[q]=i;renderQuizQuestion(q)}

async function submitQuiz(){
  const answers=state.currentQuiz.questions.map((_,i)=>state.quizAnswers[i]??-1);
  try{
    const result=await api(`/quizzes/${state.currentQuiz.id}/submit`,{method:"POST",body:JSON.stringify({answers})});
    app.innerHTML=`
    ${navbar()}
    <div class="page">
      <div class="quiz-box" style="text-align:center">
        <div class="emoji-big">🎉</div>
        <h1 class="section-title">Quiz completed!</h1>
        <div style="font-size:55px;font-weight:900;color:var(--primary)">${result.score}/${result.total}</div>
        <p>You scored <b>${result.percentage}%</b>.</p>
        <p class="section-subtitle">${result.message}</p>
        <button class="primary-btn" onclick="renderStudentQuizzes()">Try another quiz</button>
        <button class="ghost-btn" onclick="renderProgress()">View my progress</button>
      </div>
    </div>`;
  }catch(err){toast(err.message)}
}

async function renderProgress(){
  try{
    const results=await api("/results/me");
    app.innerHTML=dashboardShell("student",`
      <div class="dashboard-header"><div><h1>My Progress 📈</h1><p class="section-subtitle">See your quiz practice history.</p></div></div>
      ${results.length?`<div class="table-wrap"><table><thead><tr><th>Quiz</th><th>Score</th><th>Percentage</th><th>Date</th></tr></thead><tbody>${results.map(r=>`<tr><td>${escapeHTML(r.quizTitle)}</td><td>${r.score}/${r.total}</td><td><b>${r.percentage}%</b></td><td>${new Date(r.createdAt).toLocaleDateString()}</td></tr>`).join("")}</tbody></table></div>`:`<div class="empty">No quiz attempts yet. Start a quiz and your progress will appear here.</div>`}
    `);
  }catch(err){toast(err.message)}
}

async function renderCareers(){
  try{
    state.careers=await api("/careers");
    const categories=[...new Set(state.careers.map(c=>c.category))];
    app.innerHTML=`
    ${navbar()}
    <div class="page">
      <span class="pill">🚀 For curious future explorers</span>
      <h1 class="section-title" style="margin-top:10px">Career Explorer</h1>
      <p class="section-subtitle">There are many pathways. Explore what people do, useful school subjects and skills, and related areas.</p>
      <div class="career-filter"><button class="primary-btn" onclick="renderCareerCards('All')">All</button>${categories.map(c=>`<button class="ghost-btn" onclick="renderCareerCards('${escapeHTML(c)}')">${escapeHTML(c)}</button>`).join("")}</div>
      <div id="careerCards" class="career-grid">${state.careers.map(careerCard).join("")}</div>
      <div class="panel" style="margin-top:25px">
        <h2>🤖 Interest Helper</h2>
        <p class="section-subtitle">Choose an interest and get related career areas. This starter uses the career data in the platform; an external AI model can be connected later through the backend.</p>
        <div class="chips">
          ${["Biology","Technology","Creativity","Helping People","Mathematics","Research"].map(i=>`<button class="ghost-btn" onclick="interestHelper('${i}')">${i}</button>`).join("")}
        </div>
        <div id="interestResult" style="margin-top:15px"></div>
      </div>
    </div>`;
  }catch(err){toast(err.message)}
}

function careerCard(c){
  return `<div class="career-card"><div class="emoji">${escapeHTML(c.emoji)}</div><span class="tag">${escapeHTML(c.category)}</span><h3>${escapeHTML(c.title)}</h3><p>${escapeHTML(c.summary)}</p><button class="primary-btn" onclick="showCareer('${c.id}')">Explore →</button></div>`;
}
function renderCareerCards(category){
  const list=category==="All"?state.careers:state.careers.filter(c=>c.category===category);
  document.getElementById("careerCards").innerHTML=list.map(careerCard).join("");
}
function interestHelper(interest){
  const keywords={
    Biology:["Healthcare","Medical Research","Biotechnology"],
    Technology:["Data Science","Cybersecurity"],
    Creativity:["Animation & Digital Design"],
    "Helping People":["Psychology","Medical Research"],
    Mathematics:["Data Science","Cybersecurity"],
    Research:["Medical Research","Biotechnology"]
  };
  const names=keywords[interest]||[];
  const matches=state.careers.filter(c=>names.includes(c.title)||names.includes(c.category));
  document.getElementById("interestResult").innerHTML=`<div class="feedback"><b>If you enjoy ${escapeHTML(interest)}:</b> ${matches.map(m=>escapeHTML(m.title)).join(", ")||"explore the career cards above."}</div>`;
}
function showCareer(id){
  const c=state.careers.find(x=>x.id===id); if(!c)return;
  app.innerHTML=`
  ${navbar()}
  <div class="page">
    <button class="ghost-btn" onclick="renderCareers()">← Back to careers</button>
    <div class="career-detail" style="margin-top:10px">
      <div class="emoji-big">${escapeHTML(c.emoji)}</div>
      <span class="tag">${escapeHTML(c.category)}</span>
      <h1>${escapeHTML(c.title)}</h1>
      <p style="font-size:18px;color:var(--muted);line-height:1.7">${escapeHTML(c.summary)}</p>
      <h2>📚 Useful school subjects</h2>
      <div class="chips">${c.subjects.map(x=>`<span class="tag">${escapeHTML(x)}</span>`).join("")}</div>
      <h2>🛠 Useful skills</h2>
      <div class="chips">${c.skills.map(x=>`<span class="tag">${escapeHTML(x)}</span>`).join("")}</div>
      <h2>🧭 Example learning path</h2><p>${escapeHTML(c.path)}</p>
      <h2>🔗 Related areas</h2><div class="chips">${c.related.map(x=>`<span class="tag">${escapeHTML(x)}</span>`).join("")}</div>
      <p class="small" style="margin-top:20px">Career information can change by country, institution and time. Verify current eligibility and admission requirements using official sources before making education decisions.</p>
    </div>
  </div>`;
}

/* ---------------- Teacher ---------------- */

async function renderTeacher(){
  try{
    const [subjects, quizzes, results]=await Promise.all([api("/subjects"),api("/quizzes"),api("/results/all")]);
    state.subjects=subjects;
    app.innerHTML=dashboardShell("teacher",`
      <div class="dashboard-header"><div><h1>Teacher Dashboard 👩‍🏫</h1><p class="section-subtitle">Create once, publish to your students.</p></div><div class="user-chip">${escapeHTML(state.user.name)}</div></div>
      <div class="stats">
        <div class="stat-card"><div class="num">${subjects.length}</div><div class="label">Subjects</div></div>
        <div class="stat-card"><div class="num">${quizzes.length}</div><div class="label">Published quizzes</div></div>
        <div class="stat-card"><div class="num">${results.length}</div><div class="label">Quiz submissions</div></div>
        <div class="stat-card"><div class="num">✨</div><div class="label">Your classroom</div></div>
      </div>
      <div class="admin-grid">
        <div class="panel"><h2>📤 Publish learning content</h2><p class="section-subtitle">Add notes, images, files, videos or trusted resource links.</p><button class="primary-btn" onclick="renderTeacherMaterials()">Add material →</button></div>
        <div class="panel"><h2>🧩 Create a quiz</h2><p class="section-subtitle">Create subject or chapter quizzes with explanations.</p><button class="primary-btn" onclick="renderTeacherQuiz()">Create quiz →</button></div>
        <div class="panel"><h2>📚 Manage subjects</h2><p class="section-subtitle">Add a subject or chapter without changing code.</p><button class="primary-btn" onclick="renderTeacherSubjects()">Manage →</button></div>
        <div class="panel"><h2>📊 Student results</h2><p class="section-subtitle">Review quiz submissions from your classroom.</p><button class="primary-btn" onclick="renderResults()">View results →</button></div>
      </div>
    `);
  }catch(err){toast(err.message)}
}

async function renderTeacherSubjects(){
  const subjects=await api("/subjects"); state.subjects=subjects;
  app.innerHTML=dashboardShell("teacher",`
    <div class="dashboard-header"><div><h1>Manage Subjects 📚</h1><p class="section-subtitle">Add subjects and chapters for your students.</p></div></div>
    <div class="admin-grid">
      <div class="panel">
        <h2>➕ Add Subject</h2>
        <form onsubmit="addSubject(event)">
          <div class="form-group"><label>Subject name</label><input id="newSubjectName" required placeholder="e.g. General Knowledge"></div>
          <div class="form-group"><label>Emoji</label><input id="newSubjectEmoji" value="📘" maxlength="3"></div>
          <div class="form-group"><label>Description</label><textarea id="newSubjectDescription" required></textarea></div>
          <div class="form-group"><label>Card color</label><select id="newSubjectColor"><option>pink</option><option>blue</option><option>yellow</option><option>green</option><option>purple</option><option>orange</option><option>cyan</option></select></div>
          <button class="primary-btn">Publish subject</button>
        </form>
      </div>
      <div class="panel">
        <h2>➕ Add Chapter</h2>
        <form onsubmit="addChapter(event)">
          <div class="form-group"><label>Subject</label><select id="chapterSubject">${subjects.map(s=>`<option value="${s.id}">${escapeHTML(s.name)}</option>`).join("")}</select></div>
          <div class="form-group"><label>Chapter title</label><input id="chapterTitle" required></div>
          <div class="form-group"><label>Description</label><textarea id="chapterDescription" required></textarea></div>
          <button class="primary-btn">Publish chapter</button>
        </form>
      </div>
    </div>
    <div class="panel" style="margin-top:18px"><h2>Current subjects</h2><div class="subject-grid">${subjects.map(subjectCard).join("")}</div></div>
  `);
}
async function addSubject(e){
  e.preventDefault();
  try{
    await api("/subjects",{method:"POST",body:JSON.stringify({
      name:newSubjectName.value,emoji:newSubjectEmoji.value,description:newSubjectDescription.value,color:newSubjectColor.value
    })});
    toast("Subject published!");
    renderTeacherSubjects();
  }catch(err){toast(err.message)}
}
async function addChapter(e){
  e.preventDefault();
  try{
    await api("/chapters",{method:"POST",body:JSON.stringify({
      subjectId:chapterSubject.value,title:chapterTitle.value,description:chapterDescription.value
    })});
    toast("Chapter published!");
    renderTeacherSubjects();
  }catch(err){toast(err.message)}
}

async function renderTeacherMaterials(){
  const subjects=await api("/subjects"); state.subjects=subjects;
  const allChapters=(await Promise.all(subjects.map(s=>api(`/subjects/${s.id}/chapters`)))).flat();
  app.innerHTML=dashboardShell("teacher",`
    <div class="dashboard-header"><div><h1>Publish Material 📤</h1><p class="section-subtitle">Anything you publish here can become visible in the student learning area.</p></div></div>
    <div class="panel">
      <form onsubmit="publishMaterial(event)" enctype="multipart/form-data">
        <div class="admin-grid">
          <div>
            <div class="form-group"><label>Chapter</label><select id="materialChapter" required>${allChapters.map(c=>`<option value="${c.id}">${escapeHTML(c.title)}</option>`).join("")}</select></div>
            <div class="form-group"><label>Title</label><input id="materialTitle" required placeholder="e.g. Reflection of Light Notes"></div>
            <div class="form-group"><label>Type</label><select id="materialType"><option value="note">Notes</option><option value="video">Video</option><option value="image">Image</option><option value="pdf">PDF / File</option><option value="link">Resource Link</option></select></div>
            <div class="form-group"><label>Description</label><textarea id="materialDescription" required></textarea></div>
          </div>
          <div>
            <div class="form-group"><label>Text content (for notes)</label><textarea id="materialContent" placeholder="Write a simple explanation..."></textarea></div>
            <div class="form-group"><label>External URL (video/resource)</label><input id="materialUrl" type="url" placeholder="https://..."></div>
            <div class="form-group"><label>Upload file</label><input id="materialFile" type="file"></div>
            <p class="small">For a school deployment, use cloud storage for large videos. This starter stores uploaded files locally.</p>
          </div>
        </div>
        <button class="primary-btn">🚀 Publish to students</button>
      </form>
    </div>
  `);
}
async function publishMaterial(e){
  e.preventDefault();
  const fd=new FormData();
  fd.append("chapterId",materialChapter.value);
  fd.append("title",materialTitle.value);
  fd.append("type",materialType.value);
  fd.append("description",materialDescription.value);
  fd.append("content",materialContent.value);
  fd.append("url",materialUrl.value);
  if(materialFile.files[0]) fd.append("file",materialFile.files[0]);
  try{await api("/materials",{method:"POST",body:fd});toast("Published to students!");renderTeacherMaterials()}
  catch(err){toast(err.message)}
}

function renderTeacherQuiz(){
  api("/subjects").then(subjects=>{
    state.subjects=subjects;
    app.innerHTML=dashboardShell("teacher",`
      <div class="dashboard-header"><div><h1>Create Quiz 🧩</h1><p class="section-subtitle">Make quizzes short, useful and explanation-based.</p></div></div>
      <div class="panel">
        <form onsubmit="createQuiz(event)">
          <div class="admin-grid">
            <div>
              <div class="form-group"><label>Subject</label><select id="quizSubject" onchange="loadQuizChapters()">${subjects.map(s=>`<option value="${s.id}">${escapeHTML(s.name)}</option>`).join("")}</select></div>
              <div class="form-group"><label>Chapter (optional)</label><select id="quizChapter"><option value="">Subject-level quiz</option></select></div>
              <div class="form-group"><label>Quiz title</label><input id="quizTitle" required placeholder="Science Daily Quiz"></div>
              <div class="form-group"><label>Description</label><textarea id="quizDescription"></textarea></div>
            </div>
            <div>
              <h3>Questions</h3>
              <div id="questionBuilder"></div>
              <button type="button" class="ghost-btn" onclick="addQuestionBuilder()">+ Add question</button>
            </div>
          </div>
          <button class="primary-btn" style="margin-top:18px">🚀 Publish quiz</button>
        </form>
      </div>
    `);
    addQuestionBuilder();
    loadQuizChapters();
  });
}
async function loadQuizChapters(){
  const chapters=await api(`/subjects/${quizSubject.value}/chapters`);
  quizChapter.innerHTML=`<option value="">Subject-level quiz</option>`+chapters.map(c=>`<option value="${c.id}">${escapeHTML(c.title)}</option>`).join("");
}
let qCount=0;
function addQuestionBuilder(){
  qCount++;
  const id=qCount;
  const div=document.createElement("div");
  div.className="question-builder";
  div.id=`qb-${id}`;
  div.innerHTML=`
    <b>Question ${id}</b>
    <div class="form-group"><label>Question</label><input class="qb-question" required></div>
    <div class="option-row"><input class="qb-option" required placeholder="Option A"><label><input type="radio" name="correct-${id}" value="0" checked> Correct</label></div>
    <div class="option-row"><input class="qb-option" required placeholder="Option B"><label><input type="radio" name="correct-${id}" value="1"> Correct</label></div>
    <div class="option-row"><input class="qb-option" required placeholder="Option C"><label><input type="radio" name="correct-${id}" value="2"> Correct</label></div>
    <div class="option-row"><input class="qb-option" required placeholder="Option D"><label><input type="radio" name="correct-${id}" value="3"> Correct</label></div>
    <div class="form-group"><label>Explanation shown after the quiz</label><textarea class="qb-explanation"></textarea></div>`;
  questionBuilder.appendChild(div);
}
async function createQuiz(e){
  e.preventDefault();
  const blocks=[...document.querySelectorAll(".question-builder")];
  const questions=blocks.map(block=>{
    const options=[...block.querySelectorAll(".qb-option")].map(x=>x.value);
    const correct=Number(block.querySelector("input[type=radio]:checked").value);
    return {question:block.querySelector(".qb-question").value,options,answer:correct,explanation:block.querySelector(".qb-explanation").value};
  });
  try{
    await api("/quizzes",{method:"POST",body:JSON.stringify({
      subjectId:quizSubject.value,chapterId:quizChapter.value||null,title:quizTitle.value,description:quizDescription.value,questions
    })});
    toast("Quiz published!");
    renderTeacher();
  }catch(err){toast(err.message)}
}

async function renderResults(){
  const results=await api("/results/all");
  app.innerHTML=dashboardShell("teacher",`
    <div class="dashboard-header"><div><h1>Student Results 📊</h1><p class="section-subtitle">See quiz submissions from students.</p></div></div>
    ${results.length?`<div class="table-wrap"><table><thead><tr><th>Student</th><th>Quiz</th><th>Score</th><th>%</th><th>Date</th></tr></thead><tbody>${results.map(r=>`<tr><td>${escapeHTML(r.studentName)}</td><td>${escapeHTML(r.quizTitle)}</td><td>${r.score}/${r.total}</td><td><b>${r.percentage}%</b></td><td>${new Date(r.createdAt).toLocaleDateString()}</td></tr>`).join("")}</tbody></table></div>`:`<div class="empty">No quiz submissions yet.</div>`}
  `);
}

if(state.user){
  state.user.role==="teacher"?renderTeacher():renderStudent();
}else{
  renderHome();
}
