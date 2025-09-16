// ---- State ----
const state = {
    name: "",
    email: "",
    role: "Data Scientist",
    difficulty: "intermediate",
    questions: [],
    batchSize: 5,
    currentBatch: 0,
    index: 0,
    answers: [],
    startTime: null,
};

// ---- UI references ----
const el = {
    prefsCard: document.getElementById("prefsCard"),
    quizCard: document.getElementById("quizCard"),
    resultCard: document.getElementById("resultCard"),
    aboutCard: document.getElementById("aboutCard"),
    startBtn: document.getElementById("startBtn"),
    aboutBtn: document.getElementById("aboutBtn"),
    closeAbout: document.getElementById("closeAbout"),
    name: document.getElementById("name"),
    email: document.getElementById("email"),
    role: document.getElementById("role"),
    difficulty: document.getElementById("difficulty"),
    playerName: document.getElementById("playerName"),
    playerMeta: document.getElementById("playerMeta"),
    timer: document.getElementById("timer"),
    progressFill: document.getElementById("progressFill"),
    questionTitle: document.getElementById("questionTitle"),
    optionsWrap: document.getElementById("options"),
    explanation: document.getElementById("explanation"),
    prevBtn: document.getElementById("prevBtn"),
    skipBtn: document.getElementById("skipBtn"),
    nextBtn: document.getElementById("nextBtn"),
    resultSummary: document.getElementById("resultSummary"),
    scoreText: document.getElementById("scoreText"),
    timeText: document.getElementById("timeText"),
    answersList: document.getElementById("answersList"),
    restartBtn: document.getElementById("restartBtn"),
    downloadBtn: document.getElementById("downloadBtn"),
    certificateBtn: document.getElementById("certificateBtn"),
};

// ---- Helpers ----
function safeClassShow(node){ if(node) node.classList.remove("hidden"); }
function safeClassHide(node){ if(node) node.classList.add("hidden"); }
function formatTime(ms){
    const sec = Math.floor(ms/1000);
    const m = Math.floor(sec/60).toString().padStart(2,"0");
    const s = (sec%60).toString().padStart(2,"0");
    return `${m}:${s}`;
}

// ---- Timer ----
function startTimer() {
    state.startTime = Date.now();
    setInterval(()=>{
        if(state.startTime && el.timer){
            el.timer.textContent = formatTime(Date.now()-state.startTime);
        }
    },1000);
}

// ---- Render Question ----
function renderQuestion(){
    const globalIndex = state.currentBatch*state.batchSize + state.index;
    const q = state.questions[globalIndex];
    if(!q) return;

    el.questionTitle.textContent = q.title || "Question";
    el.optionsWrap.innerHTML = "";
    safeClassHide(el.explanation);

    q.options.forEach((opt,i)=>{
        const btn = document.createElement("button");
        btn.textContent = opt;
        btn.className="optionBtn";
        btn.onclick = () => selectAnswer(i);
        if(state.answers[globalIndex]===i) btn.classList.add("selected");
        el.optionsWrap.appendChild(btn);
    });

    el.progressFill.style.width = `${((globalIndex+1)/(state.questions.length))*100}%`;
}

// ---- Select Answer ----
async function selectAnswer(i){
    const globalIndex = state.currentBatch*state.batchSize + state.index;
    const q = state.questions[globalIndex];
    state.answers[globalIndex] = i;

    [...el.optionsWrap.children].forEach((btn,j)=> btn.classList.toggle("selected", j===i));

    if(el.explanation){
        el.explanation.textContent = "Fetching explanation...";
        safeClassShow(el.explanation);
    }

    const correctAns = q.correct>=0?q.options[q.correct]:q.options[i];
    const res = await fetch("/api/explanation", {
        method:"POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ question:q.title, answer:correctAns })
    });
    const data = await res.json();
    q.explanation = data.explanation || "No explanation available.";
    el.explanation.textContent = q.explanation;
}

// ---- Show Results ----
async function showResults(){
    safeClassHide(el.quizCard);
    safeClassShow(el.resultCard);

    const correct = state.answers.reduce((acc,ans,i)=>{
        const q = state.questions[i];
        return acc + (q && ans===q.correct?1:0);
    },0);

    el.resultSummary.textContent = `You answered ${state.questions.length} questions.`;
    el.scoreText.textContent = `Score: ${correct} / ${state.questions.length}`;
    el.timeText.textContent = `Time: ${formatTime(Date.now()-state.startTime)}`;

    const recRes = await fetch("/api/recommendation", {
        method:"POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ score: correct, role: state.role, difficulty: state.difficulty })
    });
    const recData = await recRes.json();
    const recDiv = document.createElement("div");
    recDiv.className="recommendation";
    recDiv.textContent = `🔮 Recommended AI Career Path: ${recData.recommendation||"No recommendation"}`;
    el.resultCard.appendChild(recDiv);

    el.answersList.textContent = state.questions.map((q,i)=>{
        const userAns = q.options && Number.isInteger(state.answers[i])? q.options[state.answers[i]]:"Skipped";
        const correctAns = q.options && q.correct>=0 ? q.options[q.correct]:"(not marked)";
        return `${i+1}. ${q.title}\nYour answer: ${userAns}\nCorrect: ${correctAns}\nExplanation: ${q.explanation||"Not provided"}\n`;
    }).join("\n");
}

// ---- Navigation ----
el.nextBtn.onclick = async ()=>{
    const globalIndex = state.currentBatch*state.batchSize + state.index;
    if(state.index < state.batchSize-1 && globalIndex < state.questions.length-1){
        state.index++;
        renderQuestion();
    }else{
        const nextBatch = state.currentBatch+1;
        const remaining = state.questions.length - (nextBatch*state.batchSize);
        if(remaining>0){
            state.currentBatch++;
            state.index=0;
            renderQuestion();
        }else{
            showResults();
        }
    }
};
el.prevBtn.onclick = ()=>{
    if(state.index>0){ state.index--; renderQuestion(); }
    else if(state.currentBatch>0){
        state.currentBatch--;
        state.index = state.batchSize-1;
        renderQuestion();
    }
};
el.skipBtn.onclick = ()=>{ 
    const globalIndex = state.currentBatch*state.batchSize + state.index;
    state.answers[globalIndex]=null; 
    el.nextBtn.click(); 
};

// ---- Start Quiz ----
el.startBtn.onclick = async ()=>{
    state.name = el.name.value||"Candidate";
    state.role = el.role.value||"Data Scientist";
    state.difficulty = el.difficulty.value||"intermediate";

    safeClassHide(el.prefsCard);
    safeClassShow(el.quizCard);

    el.playerName.textContent = state.name;
    el.playerMeta.textContent = `${state.role} — ${state.difficulty}`;

    startTimer();

    // Fetch all questions at once (can be modified to fetch batch-by-batch)
    const res = await fetch("/api/questions", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ role: state.role, difficulty: state.difficulty, count: 20 })
    });
    const data = await res.json();
    state.questions = data.questions || [];
    state.currentBatch=0;
    state.index=0;
    state.answers = [];
    renderQuestion();
};

// ---- Restart Quiz ----
el.restartBtn.onclick = ()=>{
    state.questions=[];
    state.index=0;
    state.currentBatch=0;
    state.answers=[];
    safeClassHide(el.resultCard);
    safeClassShow(el.prefsCard);
};

// ---- Download Report ----
el.downloadBtn.onclick = ()=>{
    let report = `AI Career Assessment Report\n\nName: ${state.name}\nRole: ${state.role}\n\n`;
    state.questions.forEach((q,i)=>{
        const userAns = q.options && Number.isInteger(state.answers[i])? q.options[state.answers[i]]:"Skipped";
        const correctAns = q.options && q.correct>=0? q.options[q.correct]:"(not marked)";
        report += `${i+1}. ${q.title}\nYour answer: ${userAns}\nCorrect: ${correctAns}\nExplanation: ${q.explanation||"Not provided"}\n\n`;
    });
    const blob = new Blob([report], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href=url;
    a.download=`${state.name.replace(/\s+/g,"_")}_Report.txt`;
    a.click();
    URL.revokeObjectURL(url);
};

// ---- Certificate ----
el.certificateBtn.onclick = ()=>{
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF("landscape");
    const name = state.name;
    const role = state.role;
    const score = el.scoreText.innerText||"";
    const timeTaken = el.timeText.innerText||"";

    doc.setFillColor(255,255,240); doc.rect(0,0,297,210,"F");
    doc.setDrawColor(180,134,40); doc.setLineWidth(3); doc.rect(10,10,277,190);
    doc.setFont("times","bold"); doc.setFontSize(34); doc.text("Certificate of Achievement",148.5,50,{align:"center"});
    doc.setFont("helvetica","italic"); doc.setFontSize(16); doc.text("This is proudly presented to",148.5,75,{align:"center"});
    doc.setFont("times","bold"); doc.setFontSize(28); doc.text(name,148.5,95,{align:"center"});
    doc.setFont("helvetica","normal"); doc.setFontSize(14); doc.text(`For successfully completing the AI Career Path Assessment`,148.5,115,{align:"center"});
    doc.setFont("helvetica","bold"); doc.text(`Role: ${role}`,148.5,130,{align:"center"});
    doc.text(score,148.5,140,{align:"center"});
    doc.text(timeTaken,148.5,150,{align:"center"});
    doc.save(`${name}_Certificate.pdf`);
};

// ---- About Section Functionality ----
el.aboutBtn.onclick = () => {
    safeClassHide(el.prefsCard);
    safeClassHide(el.quizCard);
    safeClassHide(el.resultCard);
    safeClassShow(el.aboutCard);
};

el.closeAbout.onclick = () => {
    safeClassHide(el.aboutCard);
    safeClassShow(el.prefsCard);
};