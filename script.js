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

// ---- Select Answer (Modified for Offline Use) ----
function selectAnswer(i){
    const globalIndex = state.currentBatch*state.batchSize + state.index;
    const q = state.questions[globalIndex];
    state.answers[globalIndex] = i;

    [...el.optionsWrap.children].forEach((btn,j)=> btn.classList.toggle("selected", j===i));

    el.explanation.textContent = "Explanation not available in offline mode.";
    safeClassShow(el.explanation);
}

// ---- Show Results (Modified for Offline Use) ----
function showResults(){
    safeClassHide(el.quizCard);
    safeClassShow(el.resultCard);

    const correct = state.answers.reduce((acc,ans,i)=>{
        const q = state.questions[i];
        return acc + (q && ans===q.correct?1:0);
    },0);

    const score = correct / state.questions.length;
    let recommendation = "";
    if (score >= 0.8) {
        recommendation = "🔮 Recommended AI Career Path: You have strong fundamentals and are on a great path to become an ML Engineer.";
    } else if (score >= 0.5) {
        recommendation = "🔮 Recommended AI Career Path: You have solid knowledge. Consider focusing on a specialized area like Data Science or Computer Vision.";
    } else {
        recommendation = "🔮 Recommended AI Career Path: Your foundational knowledge is developing. Start with a Data Analyst role and build from there.";
    }

    el.resultSummary.textContent = `You answered ${state.questions.length} questions.`;
    el.scoreText.textContent = `Score: ${correct} / ${state.questions.length}`;
    el.timeText.textContent = `Time: ${formatTime(Date.now()-state.startTime)}`;

    const recDiv = document.createElement("div");
    recDiv.className="recommendation";
    recDiv.textContent = recommendation;
    el.resultCard.appendChild(recDiv);

    el.answersList.textContent = state.questions.map((q,i)=>{
        const userAns = q.options && Number.isInteger(state.answers[i])? q.options[state.answers[i]]:"Skipped";
        const correctAns = q.options && q.correct>=0 ? q.options[q.correct]:"(not marked)";
        return `${i+1}. ${q.title}\nYour answer: ${userAns}\nCorrect: ${correctAns}\nExplanation: ${q.explanation||"Not provided"}\n`;
    }).join("\n");
}

// ---- Navigation ----
el.nextBtn.onclick = ()=>{
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

// ---- Offline Questions Array ----
const questionsFallback = [
    { "title": "Which of the following is a key characteristic of a convolutional neural network (CNN)?", "options": ["It uses a sliding window to analyze features in spatial data.", "It relies on recurrent connections to process sequential data.", "It's primarily used for unsupervised clustering.", "It's a shallow learning model with a single hidden layer."], "correct": 0 },
    { "title": "In machine learning, what does 'regularization' help to prevent?", "options": ["Bias-variance trade-off", "Vanishing gradient problem", "Overfitting", "Underfitting"], "correct": 2 },
    { "title": "What is the main purpose of a 'pivot table' in data analysis?", "options": ["To create a new, empty dataframe.", "To calculate correlations between all variables.", "To summarize and reorganize data from a spreadsheet.", "To visualize data in a scatter plot."], "correct": 2 },
    { "title": "What is the difference between a 'classifier' and a 'regressor'?", "options": ["A classifier predicts continuous values; a regressor predicts discrete labels.", "A classifier is for unsupervised tasks; a regressor is for supervised tasks.", "A classifier predicts discrete labels; a regressor predicts continuous values.", "A classifier is for linear models; a regressor is for non-linear models."], "correct": 2 },
    { "title": "Which activation function is most commonly used in the output layer of a multi-class classification problem?", "options": ["ReLU", "Sigmoid", "Tanh", "Softmax"], "correct": 3 },
    { "title": "What is the term for the process of converting categorical data into a numerical format for machine learning models?", "options": ["Standardization", "Normalization", "One-Hot Encoding", "Discretization"], "correct": 2 },
    { "title": "Which of these is a popular library for data visualization in Python?", "options": ["NumPy", "Pandas", "Matplotlib", "Scipy"], "correct": 2 },
    { "title": "What is 'k-fold cross-validation' primarily used for?", "options": ["To speed up model training.", "To find the optimal hyperparameters for a model.", "To evaluate a model's performance on unseen data.", "To reduce the dimensionality of the dataset."], "correct": 2 },
    { "title": "Which of the following is an example of an unsupervised learning algorithm?", "options": ["Linear Regression", "Decision Tree", "K-Means Clustering", "Support Vector Machine"], "correct": 2 },
    { "title": "What does the 'learning rate' parameter control in a neural network?", "options": ["The number of epochs in training.", "The size of the hidden layers.", "The speed at which the model learns and updates weights.", "The number of input features."], "correct": 2 },
    { "title": "In a decision tree, what does a 'node' represent?", "options": ["A prediction value.", "A feature or attribute to be split on.", "A constant bias term.", "A final class label."], "correct": 1 },
    { "title": "What is the purpose of the 'F1-score' in classification?", "options": ["To measure the model's training time.", "To balance precision and recall.", "To calculate the total number of correct predictions.", "To measure the model's bias."], "correct": 1 },
    { "title": "Which of these is a widely used metric for evaluating a regression model?", "options": ["Accuracy", "Confusion Matrix", "Mean Squared Error (MSE)", "Precision"], "correct": 2 },
    { "title": "What is the primary function of a 'kernel' in a Support Vector Machine (SVM)?", "options": ["To reduce the number of features.", "To map data into a higher-dimensional space for separation.", "To normalize the input data.", "To determine the number of support vectors."], "correct": 1 },
    { "title": "What is 'dimensionality reduction'?", "options": ["Removing data points from a dataset.", "Reducing the number of features in a dataset.", "Reducing the size of the training set.", "Reducing the number of epochs in training."], "correct": 1 },
    { "title": "In natural language processing, what is a 'token'?", "options": ["A unique identifier for a document.", "The frequency of a word in a corpus.", "A word or a punctuation mark in a sentence.", "A specific type of neural network."], "correct": 2 },
    { "title": "What is the 'bias-variance trade-off'?", "options": ["The balance between model complexity and interpretability.", "The balance between a model's performance on training and test data.", "The trade-off between model accuracy and training speed.", "The trade-off between a model's simplicity and its ability to generalize."], "correct": 3 },
    { "title": "Which Python library is specifically designed for numerical operations on arrays and matrices?", "options": ["Matplotlib", "Pandas", "Scikit-learn", "NumPy"], "correct": 3 },
    { "title": "What is a 'hyperparameter' in machine learning?", "options": ["A parameter learned by the model during training.", "A value used to tune the model's behavior, set before training.", "A metric for evaluating model performance.", "A type of data preprocessing technique."], "correct": 1 },
    { "title": "Which of these is a common method for handling missing data in a dataset?", "options": ["Removing the entire column.", "Dropping the rows with missing values.", "Imputing values with the mean or median.", "All of the above."], "correct": 3 },
    { "title": "What is the purpose of a 'confusion matrix'?", "options": ["To visualize the relationship between two variables.", "To summarize the performance of a classification model.", "To show the correlation between all features.", "To identify outliers in the dataset."], "correct": 1 },
    { "title": "Which type of AI is designed to mimic human-like intelligence and problem-solving skills?", "options": ["Narrow AI", "General AI", "Super AI", "Specific AI"], "correct": 1 },
    { "title": "What is a 'feature' in the context of a dataset?", "options": ["A row in the dataset.", "A column or attribute of the data.", "The final output of a model.", "A unique data point."], "correct": 1 },
    { "title": "What is the primary function of a 'loss function' in machine learning?", "options": ["To measure the model's accuracy.", "To determine the number of hidden layers.", "To measure the discrepancy between predicted and actual values.", "To reduce the dimensionality of the data."], "correct": 2 },
    { "title": "Which of these is not a common type of neural network?", "options": ["Recurrent Neural Network (RNN)", "Quantum Neural Network (QNN)", "Convolutional Neural Network (CNN)", "Generative Adversarial Network (GAN)"], "correct": 1 },
    { "title": "What is 'clustering'?", "options": ["A supervised learning method for predicting discrete labels.", "An unsupervised learning method for grouping similar data points.", "A method for reducing the number of features.", "A technique for optimizing model hyperparameters."], "correct": 1 },
    { "title": "What is a 'dataset'?", "options": ["A collection of related data.", "A statistical algorithm.", "A single row of data.", "A prediction from a model."], "correct": 0 },
    { "title": "What is a 'model' in machine learning?", "options": ["A collection of data points.", "A program trained to recognize certain types of patterns.", "A data visualization.", "A type of statistical analysis."], "correct": 1 },
    { "title": "In deep learning, what is a 'layer'?", "options": ["A single neuron.", "A group of neurons that process information together.", "A row in a dataset.", "A specific type of activation function."], "correct": 1 },
    { "title": "What is the main goal of 'data cleaning'?", "options": ["To prepare data for visualization.", "To identify and fix errors, inconsistencies, or inaccuracies in a dataset.", "To reduce the size of the dataset.", "To remove all outliers from the data."], "correct": 1 }
];

// ---- Start Quiz (Modified for Offline Use) ----
el.startBtn.onclick = () => {
    state.name = el.name.value || "Candidate";
    state.role = el.role.value || "Data Scientist";
    state.difficulty = el.difficulty.value || "intermediate";

    safeClassHide(el.prefsCard);
    safeClassShow(el.quizCard);

    el.playerName.textContent = state.name;
    el.playerMeta.textContent = `${state.role} — ${state.difficulty}`;

    startTimer();

    // Use the local fallback questions directly
    state.questions = questionsFallback;
    state.currentBatch = 0;
    state.index = 0;
    state.answers = [];
    renderQuestion();
};

// ---- Restart Quiz ----
el.restartBtn.onclick = () => {
    state.questions = [];
    state.index = 0;
    state.currentBatch = 0;
    state.answers = [];
    safeClassHide(el.resultCard);
    safeClassShow(el.prefsCard);
};

// ---- Download Report ----
el.downloadBtn.onclick = () => {
    let report = `AI Career Assessment Report\n\nName: ${state.name}\nRole: ${state.role}\n\n`;
    state.questions.forEach((q, i) => {
        const userAns = q.options && Number.isInteger(state.answers[i]) ? q.options[state.answers[i]] : "Skipped";
        const correctAns = q.options && q.correct >= 0 ? q.options[q.correct] : "(not marked)";
        report += `${i + 1}. ${q.title}\nYour answer: ${userAns}\nCorrect: ${correctAns}\nExplanation: ${q.explanation || "Not provided"}\n\n`;
    });
    const blob = new Blob([report], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${state.name.replace(/\s+/g, "_")}_Report.txt`;
    a.click();
    URL.revokeObjectURL(url);
};

// ---- Certificate ----
el.certificateBtn.onclick = () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF("landscape");
    const name = state.name;
    const role = state.role;
    const score = el.scoreText.innerText || "";
    const timeTaken = el.timeText.innerText || "";

    doc.setFillColor(255, 255, 240);
    doc.rect(0, 0, 297, 210, "F");
    doc.setDrawColor(180, 134, 40);
    doc.setLineWidth(3);
    doc.rect(10, 10, 277, 190);
    doc.setFont("times", "bold");
    doc.setFontSize(34);
    doc.text("Certificate of Achievement", 148.5, 50, { align: "center" });
    doc.setFont("helvetica", "italic");
    doc.setFontSize(16);
    doc.text("This is proudly presented to", 148.5, 75, { align: "center" });
    doc.setFont("times", "bold");
    doc.setFontSize(28);
    doc.text(name, 148.5, 95, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(14);
    doc.text(
        `For successfully completing the AI Career Path Assessment`,
        148.5,
        115,
        { align: "center" }
    );
    doc.setFont("helvetica", "bold");
    doc.text(`Role: ${role}`, 148.5, 130, { align: "center" });
    doc.text(score, 148.5, 140, { align: "center" });
    doc.text(timeTaken, 148.5, 150, { align: "center" });
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