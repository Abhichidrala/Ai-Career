// ===== Background Canvas =====
(function(){
const c=document.getElementById('bgCanvas');if(!c)return;const ctx=c.getContext('2d');let w,h,pts=[];
function resize(){w=c.width=innerWidth;h=c.height=innerHeight;}
addEventListener('resize',resize);resize();
class P{constructor(){this.reset();}
reset(){this.x=Math.random()*w;this.y=Math.random()*h;this.r=Math.random()*2+.5;this.vx=(Math.random()-.5)*.3;this.vy=(Math.random()-.5)*.3;this.a=Math.random()*.4+.1;}
update(){this.x+=this.vx;this.y+=this.vy;if(this.x<0||this.x>w)this.vx*=-1;if(this.y<0||this.y>h)this.vy*=-1;}
draw(){ctx.beginPath();ctx.arc(this.x,this.y,this.r,0,Math.PI*2);ctx.fillStyle=`rgba(99,102,241,${this.a})`;ctx.fill();}}
for(let i=0;i<80;i++)pts.push(new P());
(function anim(){ctx.clearRect(0,0,w,h);pts.forEach(p=>{p.update();p.draw();});
for(let i=0;i<pts.length;i++)for(let j=i+1;j<pts.length;j++){const dx=pts[i].x-pts[j].x,dy=pts[i].y-pts[j].y,d=Math.sqrt(dx*dx+dy*dy);
if(d<120){ctx.beginPath();ctx.moveTo(pts[i].x,pts[i].y);ctx.lineTo(pts[j].x,pts[j].y);ctx.strokeStyle=`rgba(99,102,241,${.06*(1-d/120)})`;ctx.lineWidth=.5;ctx.stroke();}}
requestAnimationFrame(anim);})();
})();

// ===== State =====
const state={name:"",email:"",role:"Data Scientist",difficulty:"intermediate",questionCount:10,questions:[],index:0,answers:[],startTime:null,timerInterval:null,certMode:false,certBatchNum:0,certTotalAnswered:0,certCorrect:0,certMinQuestions:50,certBatchSize:10};

const $=id=>document.getElementById(id);
const sections={hero:$('heroSection'),features:$('featuresSection'),setup:$('setupSection'),loading:$('loadingSection'),quiz:$('quizSection'),results:$('resultsSection'),about:$('aboutSection')};

function showSection(name){
Object.values(sections).forEach(s=>{if(s)s.classList.add('hidden');});
if(sections[name]){sections[name].classList.remove('hidden');sections[name].scrollIntoView({behavior:'smooth',block:'start'});}
if(name==='hero'){sections.hero.classList.remove('hidden');sections.features.classList.remove('hidden');}
document.querySelectorAll('.nav-link').forEach(l=>l.classList.remove('active'));
const a=document.querySelector(`.nav-link[data-section="${name}"]`);if(a)a.classList.add('active');
}

// Nav
document.querySelectorAll('.nav-link').forEach(btn=>{btn.addEventListener('click',()=>{
const s=btn.dataset.section;
if(s==='hero')showSection('hero');
else if(s==='features'){
    showSection('hero');
    setTimeout(() => {
        sections.features.scrollIntoView({behavior:'smooth'});
        document.querySelectorAll('.nav-link').forEach(l=>l.classList.remove('active'));
        $('navFeatures')?.classList.add('active');
    }, 50);
}
else if(s==='about')showSection('about');
});});

// Scroll Highlighting
window.addEventListener('scroll', () => {
    if (!sections.hero.classList.contains('hidden')) {
        const featuresTop = sections.features.getBoundingClientRect().top;
        if (featuresTop < window.innerHeight / 2) {
            document.querySelectorAll('.nav-link').forEach(l=>l.classList.remove('active'));
            $('navFeatures')?.classList.add('active');
        } else {
            document.querySelectorAll('.nav-link').forEach(l=>l.classList.remove('active'));
            $('navHome')?.classList.add('active');
        }
    }
});

$('homeLink')?.addEventListener('click',e=>{e.preventDefault();showSection('hero');});
$('heroStartBtn')?.addEventListener('click',()=>{state.certMode=false;$('questionCountGroup').classList.remove('hidden');$('certModeInfo').classList.add('hidden');$('noCertHint').style.display='flex';showSection('setup');});
$('heroCertBtn')?.addEventListener('click',()=>{state.certMode=true;$('questionCountGroup').classList.add('hidden');$('certModeInfo').classList.remove('hidden');showSection('setup');});
$('heroLearnBtn')?.addEventListener('click',()=>{sections.features.scrollIntoView({behavior:'smooth'});});
$('backFromSetup')?.addEventListener('click',()=>showSection('hero'));
$('closeAboutBtn')?.addEventListener('click',()=>showSection('hero'));
$('giveUpBtn')?.addEventListener('click',()=>{
const currentBatchAnswered = state.answers.filter(a => a !== null).length;
const currentBatchCorrect = state.answers.reduce((acc,a,i)=>{
    const q=state.questions[i];
    return acc+(q&&a===q.correct?1:0);
},0);
state.certCorrect+=currentBatchCorrect;
state.certTotalAnswered+=currentBatchAnswered;
showCertResults();
});

function formatTime(ms){const s=Math.floor(ms/1000),m=Math.floor(s/60).toString().padStart(2,'0'),ss=(s%60).toString().padStart(2,'0');return`${m}:${ss}`;}

function startTimer(){state.startTime=Date.now();if(state.timerInterval)clearInterval(state.timerInterval);state.timerInterval=setInterval(()=>{const el=$('quizTimer');if(el&&state.startTime)el.textContent=formatTime(Date.now()-state.startTime);},1000);}
function stopTimer(){if(state.timerInterval)clearInterval(state.timerInterval);}

// Fallback questions
const fallbackQ=[
{title:"Which is a key characteristic of a CNN?",options:["Sliding window for spatial features","Recurrent connections for sequences","Unsupervised clustering","Single hidden layer"],correct:0,explanation:"CNNs use convolutional filters that slide across input data to detect spatial features and patterns."},
{title:"What does regularization prevent?",options:["Bias-variance trade-off","Vanishing gradients","Overfitting","Underfitting"],correct:2,explanation:"Regularization penalizes model complexity to prevent overfitting."},
{title:"What is a pivot table used for?",options:["Create empty dataframe","Calculate correlations","Summarize and reorganize data","Visualize scatter plots"],correct:2,explanation:"Pivot tables restructure and summarize large datasets."},
{title:"Classifier vs Regressor?",options:["Classifier: continuous; Regressor: discrete","Classifier: unsupervised; Regressor: supervised","Classifier: discrete labels; Regressor: continuous values","Classifier: linear; Regressor: non-linear"],correct:2,explanation:"Classifiers predict categories, regressors predict continuous numbers."},
{title:"Best output activation for multi-class?",options:["ReLU","Sigmoid","Tanh","Softmax"],correct:3,explanation:"Softmax outputs probability distribution across all classes."},
{title:"Converting categorical data to numerical?",options:["Standardization","Normalization","One-Hot Encoding","Discretization"],correct:2,explanation:"One-Hot Encoding creates binary columns per category."},
{title:"Popular Python visualization library?",options:["NumPy","Pandas","Matplotlib","Scipy"],correct:2,explanation:"Matplotlib is Python's foundational plotting library."},
{title:"K-fold cross-validation is for?",options:["Speed up training","Find hyperparameters","Evaluate on unseen data","Reduce dimensionality"],correct:2,explanation:"K-fold CV gives robust performance estimates on unseen data."},
{title:"Unsupervised learning algorithm?",options:["Linear Regression","Decision Tree","K-Means Clustering","SVM"],correct:2,explanation:"K-Means groups data without labels."},
{title:"Learning rate controls?",options:["Number of epochs","Hidden layer size","Weight update speed","Input features"],correct:2,explanation:"Learning rate determines step size during gradient descent."},
{title:"Decision tree node represents?",options:["Prediction value","Feature to split on","Constant bias","Final class label"],correct:1,explanation:"Each node tests a feature for splitting."},
{title:"F1-score purpose?",options:["Measure training time","Balance precision and recall","Count correct predictions","Measure bias"],correct:1,explanation:"F1-score is harmonic mean of precision and recall."},
{title:"Regression evaluation metric?",options:["Accuracy","Confusion Matrix","MSE","Precision"],correct:2,explanation:"MSE measures average squared prediction error."},
{title:"SVM kernel function?",options:["Reduce features","Map to higher dimensions","Normalize data","Count support vectors"],correct:1,explanation:"Kernels map data to higher dimensions for linear separation."},
{title:"Dimensionality reduction is?",options:["Removing data points","Reducing features","Reducing training set","Reducing epochs"],correct:1,explanation:"Reduces features while preserving important information."},
{title:"NLP token is?",options:["Document identifier","Word frequency","Word or punctuation mark","Neural network type"],correct:2,explanation:"Tokenization breaks text into individual units."},
{title:"Bias-variance trade-off?",options:["Complexity vs interpretability","Training vs test performance","Accuracy vs speed","Simplicity vs generalization"],correct:3,explanation:"Finding the sweet spot between underfitting and overfitting."},
{title:"NumPy is designed for?",options:["Plotting","DataFrames","ML models","Numerical array operations"],correct:3,explanation:"NumPy provides efficient multi-dimensional array operations."},
{title:"Hyperparameter is?",options:["Learned during training","Set before training","Performance metric","Preprocessing technique"],correct:1,explanation:"Hyperparameters are set before training begins."},
{title:"Handling missing data?",options:["Remove column","Drop rows","Impute mean/median","All of the above"],correct:3,explanation:"All are valid strategies depending on the situation."}
];

async function fetchQuestions(count,diff){
const{role,difficulty}=state;const d=diff||difficulty;const c2=count||state.questionCount;
try{const res=await fetch('/api/questions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({role,difficulty:d,count:c2})});
const data=await res.json();if(data.questions?.length>0)return data.questions;}catch(e){console.warn('API unavailable:',e);}
return[...fallbackQ].sort(()=>Math.random()-.5).slice(0,c2);
}

async function fetchExplanation(question,answer,correctAnswer){
try{const res=await fetch('/api/explanation',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question,answer,correctAnswer})});
const data=await res.json();return data.explanation||'Explanation not available.';}catch{return'Explanation not available (offline).';}
}

async function fetchRecommendation(score,role,difficulty){
try{const res=await fetch('/api/recommendation',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({score,role,difficulty})});
const data=await res.json();return data.recommendation||offlineRec(score);}catch{return offlineRec(score);}
}

function offlineRec(s){
if(parseFloat(s)>=80)return"Excellent! Strong AI fundamentals. Consider advanced specializations in deep learning or RL.";
if(parseFloat(s)>=50)return"Solid knowledge. Focus on a specialized area like Data Science or Computer Vision.";
return"Foundational knowledge developing. Start with Data Analyst role and build skills progressively.";
}

function renderQuestion(){
const q=state.questions[state.index];if(!q)return;
$('questionNumber').textContent=`Question ${state.certMode?state.certTotalAnswered+state.index+1:state.index+1}`;
$('questionText').textContent=q.title||'Question';
const total=state.questions.length;
$('quizCounter').textContent=state.certMode?`Batch ${state.certBatchNum} · ${state.index+1}/${total}`:`${state.index+1}/${total}`;
$('quizProgressBar').style.width=`${((state.index+1)/total)*100}%`;
const ol=$('optionsList');ol.innerHTML='';const letters=['A','B','C','D','E','F'];
q.options.forEach((opt,i)=>{const btn=document.createElement('button');btn.className='option-btn';
if(state.answers[state.index]===i)btn.classList.add('selected');
btn.innerHTML=`<span class="option-letter">${letters[i]}</span><span>${opt}</span>`;
btn.addEventListener('click',()=>selectAnswer(i));ol.appendChild(btn);});
$('explanationBox').classList.add('hidden');
$('prevBtn').style.visibility=state.index===0?'hidden':'visible';
$('nextBtn').textContent=state.index===total-1?(state.certMode?'Submit Batch ✓':'Finish ✓'):'Next →';
// Update cert streak
if(state.certMode){
$('certStreak').classList.remove('hidden');
const answered=state.certTotalAnswered+state.answers.filter(a=>a!=null).length;
const correct=state.certCorrect+state.answers.reduce((acc,a,i)=>{const qq=state.questions[i];return acc+(qq&&a===qq.correct?1:0);},0);
const pct=answered>0?Math.round((correct/answered)*100):0;
$('streakFill').style.width=`${pct}%`;$('streakText').textContent=`Accuracy: ${pct}%`;
if(state.certTotalAnswered>=50){$('giveUpBtn')?.classList.remove('hidden');}
else{$('giveUpBtn')?.classList.add('hidden');}
}else{
$('certStreak').classList.add('hidden');
$('giveUpBtn')?.classList.add('hidden');
}
}

async function selectAnswer(i){
const q=state.questions[state.index];state.answers[state.index]=i;
document.querySelectorAll('.option-btn').forEach((btn,j)=>btn.classList.toggle('selected',j===i));
const expBox=$('explanationBox');expBox.classList.remove('hidden');
if(q.explanation){expBox.textContent=q.explanation;}
else{expBox.textContent='⏳ Loading explanation...';const exp=await fetchExplanation(q.title,q.options[i],q.options[q.correct]);expBox.textContent=exp;q.explanation=exp;}
if(state.certMode)renderQuestion();// update streak
}

// Certification adaptive algorithm
function calcAdaptiveDifficulty(){
const pct=state.certTotalAnswered>0?(state.certCorrect/state.certTotalAnswered)*100:50;
if(pct>=85)return'advanced';if(pct>=60)return'intermediate';return'beginner';
}

function shouldContinueCert(){
const total=state.certTotalAnswered;const pct=total>0?(state.certCorrect/total)*100:0;
if(total<state.certMinQuestions)return true;
// After 50, continue if accuracy is between 65-85% (borderline) up to max 100
if(total>=100)return false;
if(pct>=65&&pct<=85&&total<80)return true;
// High performers get more questions
if(pct>85&&total<70)return true;
return false;
}

// Begin quiz
$('beginQuizBtn')?.addEventListener('click',async()=>{
state.name=$('nameInput').value.trim()||'Candidate';
state.email=$('emailInput').value.trim();
state.role=$('roleSelect').value;
state.difficulty=$('difficultySelect').value;
state.index=0;state.answers=[];

if(state.certMode){
state.certBatchNum=1;state.certTotalAnswered=0;state.certCorrect=0;
state.questionCount=state.certBatchSize;
}else{
state.questionCount=parseInt($('countSelect').value);
}

showSection('loading');
$('loadingText').textContent=state.certMode?`Generating certification questions for ${state.role}...`:`Generating ${state.questionCount} AI-powered questions for ${state.role}...`;

state.questions=await fetchQuestions(state.certMode?state.certBatchSize:state.questionCount);
showSection('quiz');
$('quizUserName').textContent=state.name;
$('quizUserMeta').textContent=`${state.role} · ${state.difficulty}${state.certMode?' · Certification':''}`;
startTimer();renderQuestion();
});

// Nav
$('nextBtn')?.addEventListener('click',()=>{
if(state.index<state.questions.length-1){state.index++;renderQuestion();}
else{
if(state.certMode)finishCertBatch();
else showResults();
}
});
$('prevBtn')?.addEventListener('click',()=>{if(state.index>0){state.index--;renderQuestion();}});
$('skipBtn')?.addEventListener('click',()=>{
state.answers[state.index]=null;
if(state.index<state.questions.length-1){state.index++;renderQuestion();}
else{if(state.certMode)finishCertBatch();else showResults();}
});

async function finishCertBatch(){
// Tally this batch
const batchCorrect=state.answers.reduce((acc,a,i)=>{const q=state.questions[i];return acc+(q&&a===q.correct?1:0);},0);
state.certCorrect+=batchCorrect;
state.certTotalAnswered+=state.questions.length;

if(shouldContinueCert()){
state.certBatchNum++;
const adaptDiff=calcAdaptiveDifficulty();
showSection('loading');
$('loadingText').textContent=`Batch ${state.certBatchNum}: Generating ${adaptDiff} questions... (${state.certTotalAnswered} answered so far)`;
const newQ=await fetchQuestions(state.certBatchSize,adaptDiff);
state.questions=newQ;state.index=0;state.answers=[];
showSection('quiz');renderQuestion();
}else{
showCertResults();
}
}

function showCertResults(){
stopTimer();const elapsed=Date.now()-state.startTime;
const pct=Math.round((state.certCorrect/state.certTotalAnswered)*100);
const passed=pct>=70;

showSection('results');
$('resultsTitle').textContent=passed?'🏆 Certification Passed!':'📋 Assessment Complete';
$('resultSummaryText').textContent=`${state.name} completed ${state.certTotalAnswered} questions as ${state.role}`;
$('scoreValue').textContent=`${state.certCorrect}/${state.certTotalAnswered}`;
$('percentValue').textContent=`${pct}%`;
$('timeValue').textContent=formatTime(elapsed);
$('gradeValue').textContent=pct>=90?'A+':pct>=80?'A':pct>=70?'B+':pct>=60?'B':'C';

const cr=$('certResult');cr.classList.remove('hidden','passed','failed');
cr.classList.add(passed?'passed':'failed');
$('certResultIcon').textContent=passed?'🏆':'📝';
$('certResultText').textContent=passed?'Certification Passed!':'Certification Not Passed';
$('certResultSub').textContent=passed?`You scored ${pct}% across ${state.certTotalAnswered} adaptive questions`:`You needed 70% but scored ${pct}%. Keep practicing!`;

if(passed){$('certificateBtn').classList.remove('hidden');}else{$('certificateBtn').classList.add('hidden');}

$('recommendationText').textContent='Analyzing...';
fetchRecommendation(`${state.certCorrect}/${state.certTotalAnswered} (${pct}%)`,state.role,state.difficulty).then(r=>$('recommendationText').textContent=r);
$('answersListContainer').innerHTML='<p style="color:var(--text-muted);font-size:0.9rem;">Certification mode: detailed review covers the final batch of questions.</p>';
}

async function showResults(){
stopTimer();const elapsed=Date.now()-state.startTime;
const correct=state.answers.reduce((acc,a,i)=>{const q=state.questions[i];return acc+(q&&a===q.correct?1:0);},0);
const total=state.questions.length;const pct=Math.round((correct/total)*100);

showSection('results');
$('resultsTitle').textContent='🎉 Assessment Complete!';
$('resultSummaryText').textContent=`${state.name} completed ${total} questions as ${state.role} (${state.difficulty})`;
$('scoreValue').textContent=`${correct}/${total}`;
$('percentValue').textContent=`${pct}%`;
$('timeValue').textContent=formatTime(elapsed);
$('gradeValue').textContent=pct>=90?'A+':pct>=80?'A':pct>=70?'B+':pct>=60?'B':'C';

// No certificate for practice mode
$('certificateBtn').classList.add('hidden');
$('certResult').classList.add('hidden');

$('recommendationText').textContent='Analyzing...';
const rec=await fetchRecommendation(`${correct}/${total} (${pct}%)`,state.role,state.difficulty);
$('recommendationText').textContent=rec;

const container=$('answersListContainer');container.innerHTML='';
state.questions.forEach((q,i)=>{
const uAns=Number.isInteger(state.answers[i])?q.options[state.answers[i]]:'Skipped';
const cAns=q.correct>=0?q.options[q.correct]:'—';
const ok=state.answers[i]===q.correct;const skip=state.answers[i]==null;
const item=document.createElement('div');item.className='answer-item';
item.innerHTML=`<div class="aq">${i+1}. ${q.title}</div>
<div class="aa ${skip?'':ok?'correct-ans':'wrong-ans'}">Your answer: ${uAns} ${ok?'✓':skip?'—':'✗'}</div>
<div class="aa correct-ans">Correct: ${cAns}</div>
${q.explanation?`<div class="ae">💡 ${q.explanation}</div>`:''}`;
container.appendChild(item);});
}

$('restartBtn')?.addEventListener('click',()=>{state.questions=[];state.index=0;state.answers=[];state.startTime=null;state.certMode=false;showSection('hero');});

// Report download
$('downloadReportBtn')?.addEventListener('click',()=>{
const correct=state.certMode?state.certCorrect:state.answers.reduce((a,ans,i)=>{const q=state.questions[i];return a+(q&&ans===q.correct?1:0);},0);
const total=state.certMode?state.certTotalAnswered:state.questions.length;
let r=`AI CAREER PATH — ASSESSMENT REPORT\n${'='.repeat(40)}\nName: ${state.name}\nRole: ${state.role}\nDifficulty: ${state.difficulty}\nMode: ${state.certMode?'Certification':'Practice'}\nScore: ${correct}/${total}\nDate: ${new Date().toLocaleDateString()}\n`;
const blob=new Blob([r],{type:'text/plain'});const url=URL.createObjectURL(blob);
const a=document.createElement('a');a.href=url;a.download=`${state.name.replace(/\s+/g,'_')}_Report.txt`;a.click();URL.revokeObjectURL(url);
});

// ===== Certificate — Premium Design =====
$('certificateBtn')?.addEventListener('click',()=>{
const{jsPDF}=window.jspdf;const doc=new jsPDF('landscape');
const W=297,H=210,CX=W/2;
const pct=Math.round((state.certCorrect/state.certTotalAnswered)*100);
const dateStr=new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'});
const certId=`AICP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2,6).toUpperCase()}`;

// Deep navy background
doc.setFillColor(12,15,35);doc.rect(0,0,W,H,'F');

// Gold border system
doc.setDrawColor(197,168,81);doc.setLineWidth(2.5);doc.rect(6,6,W-12,H-12);
doc.setDrawColor(168,139,60);doc.setLineWidth(0.8);doc.rect(11,11,W-22,H-22);
doc.setDrawColor(197,168,81);doc.setLineWidth(0.3);doc.rect(14,14,W-28,H-28);

// Corner ornaments
const co=16,cl=22;doc.setDrawColor(197,168,81);doc.setLineWidth(1.2);
[[co,co,1,1],[W-co,co,-1,1],[co,H-co,1,-1],[W-co,H-co,-1,-1]].forEach(([x,y,dx,dy])=>{
doc.line(x,y,x+cl*dx,y);doc.line(x,y,x,y+cl*dy);
doc.setFillColor(197,168,81);doc.circle(x,y,2,'F');});

// Top decorative line
doc.setDrawColor(197,168,81);doc.setLineWidth(0.4);
doc.line(55,28,CX-35,28);doc.line(CX+35,28,W-55,28);
doc.setFillColor(197,168,81);doc.circle(CX,28,2,'F');

// Header text
doc.setTextColor(197,168,81);doc.setFont('helvetica','bold');doc.setFontSize(9);
doc.text('AI CAREER PATH',CX,38,{align:'center',charSpace:4});

// Decorative subtitle line
doc.setFontSize(7);doc.setTextColor(140,120,60);
doc.text('— PROFESSIONAL CERTIFICATION —',CX,45,{align:'center',charSpace:2});

// Main title
doc.setTextColor(245,240,220);doc.setFont('times','bold');doc.setFontSize(34);
doc.text('Certificate of Excellence',CX,62,{align:'center'});

// Gold divider
doc.setDrawColor(197,168,81);doc.setLineWidth(0.6);
doc.line(80,68,CX-8,68);doc.line(CX+8,68,W-80,68);
doc.setFillColor(197,168,81);doc.circle(CX,68,1.5,'F');

// Certify text
doc.setFont('times','italic');doc.setFontSize(12);doc.setTextColor(160,150,120);
doc.text('This is to certify that',CX,80,{align:'center'});

// Name
doc.setFont('times','bolditalic');doc.setFontSize(30);doc.setTextColor(220,195,100);
doc.text(state.name,CX,96,{align:'center'});
const nw=doc.getTextWidth(state.name);
doc.setDrawColor(197,168,81);doc.setLineWidth(0.4);
doc.line(CX-nw/2-15,100,CX+nw/2+15,100);

// Achievement
doc.setFont('times','normal');doc.setFontSize(11);doc.setTextColor(180,175,155);
doc.text('has successfully demonstrated outstanding proficiency in the',CX,112,{align:'center'});

// Role
doc.setFont('times','bold');doc.setFontSize(16);doc.setTextColor(245,240,220);
doc.text(`${state.role} Certification Assessment`,CX,124,{align:'center'});

// Score
doc.setFont('times','normal');doc.setFontSize(10);doc.setTextColor(160,150,120);
doc.text(`Scoring ${state.certCorrect}/${state.certTotalAnswered} (${pct}%) across ${state.certTotalAnswered} adaptive questions`,CX,134,{align:'center'});

// Divider
doc.setDrawColor(168,139,60);doc.setLineWidth(0.3);doc.line(90,141,W-90,141);

// Date
doc.setFont('times','italic');doc.setFontSize(9);doc.setTextColor(140,130,100);
doc.text(`Awarded on ${dateStr}`,CX,149,{align:'center'});

// Signatures
const sy=170;doc.setDrawColor(140,120,70);doc.setLineWidth(0.3);
doc.line(50,sy,125,sy);doc.line(W-125,sy,W-50,sy);
doc.setFont('times','normal');doc.setFontSize(7.5);doc.setTextColor(140,130,100);
doc.text('Assessment Director',87.5,sy+5,{align:'center'});
doc.setFont('times','italic');doc.text('AI Career Path',87.5,sy+10,{align:'center'});
doc.text('Verified & Certified',W-87.5,sy+5,{align:'center'});
doc.setFont('times','italic');doc.text('Powered by Google Gemini',W-87.5,sy+10,{align:'center'});

// Center seal
doc.setFillColor(140,25,25);doc.circle(CX,sy-2,14,'F');
doc.setFillColor(170,35,35);doc.circle(CX,sy-2,10.5,'F');
doc.setFillColor(190,50,50);doc.circle(CX,sy-2,7.5,'F');
doc.setTextColor(245,240,220);doc.setFont('helvetica','bold');doc.setFontSize(6);
doc.text('CERTIFIED',CX,sy-4,{align:'center'});
doc.setFontSize(4.5);doc.text('AI CAREER',CX,sy-1,{align:'center'});
doc.text('PATH',CX,sy+2,{align:'center'});

// Bottom line
doc.setDrawColor(197,168,81);doc.setLineWidth(0.4);
doc.line(55,H-28,CX-35,H-28);doc.line(CX+35,H-28,W-55,H-28);
doc.setFillColor(197,168,81);doc.circle(CX,H-28,2,'F');

// Cert ID
doc.setFont('helvetica','normal');doc.setFontSize(5.5);doc.setTextColor(100,95,75);
doc.text(`Certificate ID: ${certId}`,CX,H-20,{align:'center'});

doc.save(`${state.name.replace(/\s+/g,'_')}_AI_Career_Certificate.pdf`);
});

showSection('hero');