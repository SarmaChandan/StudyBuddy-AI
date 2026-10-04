// ========================================
// GET HTML ELEMENTS
// ========================================

const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const chatMessages = document.getElementById("chatMessages");

const subjectSelect = document.getElementById("subject");
const modeSelect = document.getElementById("mode");

const themeBtn = document.getElementById("themeBtn");


// ========================================
// SEND MESSAGE
// ========================================

async function sendMessage() {

    // Get the user's message
    const message = userInput.value.trim();

    // Don't send empty messages
    if (message === "") {
        return;
    }


    // Get selected subject
    const subject = subjectSelect.value;


    // Get selected learning mode
    const mode = modeSelect.value;


    // ========================================
    // SHOW USER MESSAGE
    // ========================================

    addUserMessage(message);


    // Clear input box
    userInput.value = "";


    // ========================================
    // SHOW TYPING INDICATOR
    // ========================================

    showTypingIndicator();


    try {

        // ========================================
        // SEND REQUEST TO BACKEND
        // ========================================

        const response = await fetch(
            "http://localhost:5000/api/chat",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    message: message,
                    subject: subject,
                    mode: mode
                })
            }
        );


        // ========================================
        // CHECK RESPONSE
        // ========================================

        if (!response.ok) {
            throw new Error(
                `Backend request failed: ${response.status}`
            );
        }


        // Make sure streaming is supported
        if (!response.body) {
            throw new Error(
                "Streaming is not supported by this browser."
            );
        }


        // ========================================
        // REMOVE THINKING INDICATOR
        // ========================================

        removeTypingIndicator();


        // ========================================
        // CREATE EMPTY AI MESSAGE
        // ========================================

        const messageDiv =
            document.createElement("div");

        messageDiv.classList.add(
            "message",
            "ai-message"
        );


        messageDiv.innerHTML = `
            <div class="avatar">
                🤖
            </div>

            <div class="message-content">

                <div class="message-name">
                    StudyBuddy
                </div>

                <div class="ai-response"></div>

            </div>
        `;


        chatMessages.appendChild(messageDiv);


        // Get the AI response container
        const aiResponseDiv =
            messageDiv.querySelector(
                ".ai-response"
            );


        // ========================================
        // CREATE STREAM READER
        // ========================================

        const reader =
            response.body.getReader();


        // Convert binary data into text
        const decoder =
            new TextDecoder();


        // Store complete AI response
        let aiReply = "";


        // ========================================
        // READ STREAM
        // ========================================

        while (true) {

            const {
                value,
                done
            } = await reader.read();


            // Stop when stream is finished
            if (done) {
                break;
            }


            // Convert received chunk to text
            const chunk =
                decoder.decode(
                    value,
                    {
                        stream: true
                    }
                );


            // Add chunk to complete response
            aiReply += chunk;


            // ========================================
            // SHOW RESPONSE IMMEDIATELY
            // ========================================

            aiResponseDiv.textContent =
                aiReply;


            // Keep chat scrolled to bottom
            scrollToBottom();
        }


        // ========================================
        // DECODE REMAINING DATA
        // ========================================

        aiReply += decoder.decode();


        // ========================================
        // FINAL MARKDOWN FORMATTING
        // ========================================

        const formattedMessage =
            DOMPurify.sanitize(
                marked.parse(aiReply)
            );


        aiResponseDiv.innerHTML =
            formattedMessage;


        // Scroll to bottom
        scrollToBottom();


    } catch (error) {

        // ========================================
        // ERROR HANDLING
        // ========================================

        console.error(
            "Error connecting to backend:",
            error
        );


        // Remove typing indicator
        removeTypingIndicator();


        // Show error message
        addAIMessage(
            "❌ Sorry, I couldn't connect to the StudyBuddy server. Please make sure the backend is running."
        );
    }

}


// ========================================
// ADD USER MESSAGE
// ========================================

function addUserMessage(message) {

    const messageDiv =
        document.createElement("div");


    messageDiv.classList.add(
        "message",
        "user-message"
    );


    messageDiv.innerHTML = `
        <div class="message-content">

            <div class="message-name">
                You
            </div>

            <p>
                ${escapeHTML(message)}
            </p>

        </div>
    `;


    chatMessages.appendChild(
        messageDiv
    );


    scrollToBottom();
}


// ========================================
// ADD AI MESSAGE
// ========================================

function addAIMessage(message) {

    const messageDiv =
        document.createElement("div");


    messageDiv.classList.add(
        "message",
        "ai-message"
    );


    // Convert Markdown into HTML
    const formattedMessage =
        DOMPurify.sanitize(
            marked.parse(message)
        );


    messageDiv.innerHTML = `
        <div class="avatar">
            🤖
        </div>

        <div class="message-content">

            <div class="message-name">
                StudyBuddy
            </div>

            <div class="ai-response">
                ${formattedMessage}
            </div>

        </div>
    `;


    chatMessages.appendChild(
        messageDiv
    );


    scrollToBottom();
}


// ========================================
// TYPING INDICATOR
// ========================================

function showTypingIndicator() {

    // Prevent duplicate typing indicators
    if (
        document.getElementById(
            "typingIndicator"
        )
    ) {
        return;
    }


    const typingDiv =
        document.createElement("div");


    typingDiv.classList.add(
        "message",
        "ai-message"
    );


    typingDiv.id =
        "typingIndicator";


    typingDiv.innerHTML = `
        <div class="avatar">
            🤖
        </div>

        <div class="message-content">

            <div class="message-name">
                StudyBuddy
            </div>

            <p>
                Thinking...
            </p>

        </div>
    `;


    chatMessages.appendChild(
        typingDiv
    );


    scrollToBottom();
}


// ========================================
// REMOVE TYPING INDICATOR
// ========================================

function removeTypingIndicator() {

    const typingIndicator =
        document.getElementById(
            "typingIndicator"
        );


    if (typingIndicator) {

        typingIndicator.remove();

    }
}


// ========================================
// ENTER KEY SUPPORT
// ========================================

userInput.addEventListener(
    "keydown",
    function (event) {

        // Enter = send message
        // Shift + Enter = new line

        if (
            event.key === "Enter" &&
            !event.shiftKey
        ) {

            event.preventDefault();

            sendMessage();

        }

    }
);


// ========================================
// SEND BUTTON
// ========================================

sendBtn.addEventListener(
    "click",
    sendMessage
);


// ========================================
// AUTO SCROLL
// ========================================

function scrollToBottom() {

    chatMessages.scrollTop =
        chatMessages.scrollHeight;
}


// ========================================
// ESCAPE HTML
// ========================================

function escapeHTML(text) {

    const div =
        document.createElement("div");


    div.textContent =
        text;


    return div.innerHTML;
}


// ========================================
// SUBJECT CHANGE
// ========================================

subjectSelect.addEventListener(
    "change",
    function () {

        const subjectName =
            subjectSelect.options[
                subjectSelect.selectedIndex
            ].text;


        addAIMessage(
            `📚 Your subject is now set to **${subjectName}**. Ask me anything about it!`
        );

    }
);


// ========================================
// LEARNING MODE CHANGE
// ========================================

modeSelect.addEventListener(
    "change",
    function () {

        const modeName =
            modeSelect.options[
                modeSelect.selectedIndex
            ].text;


        addAIMessage(
            `🎯 Learning mode changed to **${modeName}**.`
        );

    }
);


// ========================================
// DARK MODE
// ========================================

themeBtn.addEventListener(
    "click",
    function () {

        document.body.classList.toggle(
            "dark-mode"
        );


        if (
            document.body.classList.contains(
                "dark-mode"
            )
        ) {

            themeBtn.textContent =
                "☀️";

        } else {

            themeBtn.textContent =
                "🌙";

        }

    }
);

// ========================================
// SIDEBAR NAVIGATION
// ========================================

const chatMenuBtn =
    document.getElementById("chatMenuBtn");

const summarizerMenuBtn =
    document.getElementById("summarizerMenuBtn");

const quizMenuBtn =
    document.getElementById("quizMenuBtn");

const plannerMenuBtn =
    document.getElementById("plannerMenuBtn");


const chatSection =
    document.getElementById("chatSection");

const quizSection =
    document.getElementById("quizSection");

const summarizerSection =
    document.getElementById("summarizerSection");

 const plannerSection =
    document.getElementById("plannerSection");

// ========================================
// SHOW CHAT
// ========================================

// chatMenuBtn.addEventListener(
//     "click",
//     function () {

//         chatSection.style.display = "flex";

//         summarizerSection.style.display = "none";


//         // Active menu
//         chatMenuBtn.classList.add("active");

//         summarizerMenuBtn.classList.remove("active");

//         quizMenuBtn.classList.remove("active");

//         plannerMenuBtn.classList.remove("active");

//     }
// );
// SHOW CHAT
chatMenuBtn.addEventListener(
    "click",
    function () {

        chatSection.style.display = "flex";

        quizSection.style.display = "none";

        summarizerSection.style.display = "none";


        chatMenuBtn.classList.add("active");

        quizMenuBtn.classList.remove("active");

        summarizerMenuBtn.classList.remove("active");

        plannerMenuBtn.classList.remove("active");

    }
);

// ========================================
// SHOW SUMMARIZER
// ========================================

// summarizerMenuBtn.addEventListener(
//     "click",
//     function () {

//         chatSection.style.display = "none";

//         summarizerSection.style.display = "flex";


//         // Active menu
//         summarizerMenuBtn.classList.add("active");

//         chatMenuBtn.classList.remove("active");

//         quizMenuBtn.classList.remove("active");

//         plannerMenuBtn.classList.remove("active");

//     }
// );
// SHOW SUMMARIZER
summarizerMenuBtn.addEventListener(
    "click",
    function () {

        chatSection.style.display = "none";

        quizSection.style.display = "none";

        summarizerSection.style.display = "flex";


        summarizerMenuBtn.classList.add("active");

        chatMenuBtn.classList.remove("active");

        quizMenuBtn.classList.remove("active");

        plannerMenuBtn.classList.remove("active");

    }
);


// SHOW QUIZ
quizMenuBtn.addEventListener(
    "click",
    function () {

        chatSection.style.display = "none";

        quizSection.style.display = "flex";

        summarizerSection.style.display = "none";


        quizMenuBtn.classList.add("active");

        chatMenuBtn.classList.remove("active");

        summarizerMenuBtn.classList.remove("active");

        plannerMenuBtn.classList.remove("active");

    }
);


// ========================================
// STUDY PLANNER - COMING SOON
// ========================================

// ========================================
// SHOW STUDY PLANNER
// ========================================

plannerMenuBtn.addEventListener(
    "click",
    function () {

        chatSection.style.display = "none";

        quizSection.style.display = "none";

        summarizerSection.style.display = "none";

        plannerSection.style.display = "flex";


        plannerMenuBtn.classList.add("active");

        chatMenuBtn.classList.remove("active");

        quizMenuBtn.classList.remove("active");

        summarizerMenuBtn.classList.remove("active");

    }
);

// ========================================
// NOTES SUMMARIZER
// ========================================

const notesInput =
    document.getElementById("notesInput");

const summarizeBtn =
    document.getElementById("summarizeBtn");

const summaryResult =
    document.getElementById("summaryResult");


// ========================================
// SUMMARIZE NOTES
// ========================================

summarizeBtn.addEventListener(
    "click",
    async function () {

        // Get notes
        const notes =
            notesInput.value.trim();


        // Check if empty
        if (notes === "") {

            summaryResult.innerHTML =
                "<p>⚠️ Please paste your notes first.</p>";

            return;
        }


        // Show loading message
        summaryResult.innerHTML =
            "<p>🤖 StudyBuddy is summarizing your notes...</p>";


        try {

            // ========================================
            // SEND NOTES TO BACKEND
            // ========================================

            const response = await fetch(
                "http://localhost:5000/api/chat",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({

                        message: `
Summarize the following study notes.

Give me:
1. A short summary
2. Important points
3. Key terms or concepts

Keep the explanation simple and useful
for a student preparing for exams.

Study notes:

${notes}
                        `,

                        subject: "General",

                        mode: "beginner"

                    })
                }
            );


            // Check response
            if (!response.ok) {

                throw new Error(
                    "Failed to summarize notes"
                );

            }


            // ========================================
            // READ RESPONSE
            // ========================================

            const summary =
                await response.text();


            // ========================================
            // FORMAT MARKDOWN
            // ========================================

            const formattedSummary =
                DOMPurify.sanitize(
                    marked.parse(summary)
                );


            // ========================================
            // SHOW SUMMARY
            // ========================================

            summaryResult.innerHTML =
                formattedSummary;


        } catch (error) {

            console.error(
                "Summarizer error:",
                error
            );


            summaryResult.innerHTML = `
                <p>
                    ❌ Sorry, I couldn't summarize
                    your notes. Please make sure
                    the backend is running.
                </p>
            `;

        }

    }
);


// ========================================
// AI QUIZ
// ========================================

const quizSubject =
    document.getElementById("quizSubject");

const quizDifficulty =
    document.getElementById("quizDifficulty");

const startQuizBtn =
    document.getElementById("startQuizBtn");

const quizContainer =
    document.getElementById("quizContainer");


// ========================================
// START QUIZ
// ========================================

startQuizBtn.addEventListener(
    "click",
    async function () {

        const subject =
            quizSubject.value;

        const difficulty =
            quizDifficulty.value;


        quizContainer.innerHTML = `
            <div class="quiz-result">
                🤖 Generating your quiz...
            </div>
        `;


        const prompt = `
Create a quiz for a student.

Subject: ${subject}
Difficulty: ${difficulty}

Create exactly 5 multiple-choice questions.

For each question provide:
- question
- exactly 4 options
- correct answer

Return ONLY valid JSON in this exact format:

[
    {
        "question": "Question text",
        "options": [
            "Option A",
            "Option B",
            "Option C",
            "Option D"
        ],
        "answer": 0
    }
]

The answer value must be the index
of the correct option:
0 = first option
1 = second option
2 = third option
3 = fourth option.

Do not include Markdown.
Do not include explanations.
Return only JSON.
`;


        try {

            const response =
                await fetch(
                    "http://localhost:5000/api/chat",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            message: prompt,
                            subject: subject,
                            mode: "exam"
                        })
                    }
                );


            if (!response.ok) {

                throw new Error(
                    "Failed to generate quiz"
                );

            }


            const result =
                await response.text();


            // Remove possible Markdown code fences

            const cleanResult =
                result
                    .replace(/```json/g, "")
                    .replace(/```/g, "")
                    .trim();


            const questions =
                JSON.parse(cleanResult);


            displayQuiz(questions);


        } catch (error) {

            console.error(
                "Quiz generation error:",
                error
            );


            quizContainer.innerHTML = `
                <div class="quiz-result">
                    ❌ Sorry, I couldn't generate
                    the quiz. Please try again.
                </div>
            `;

        }

    }
);

// ========================================
// DISPLAY QUIZ
// ========================================

function displayQuiz(questions) {

    quizContainer.innerHTML = "";


    questions.forEach(
        function (quiz, index) {

            const questionDiv =
                document.createElement("div");

            questionDiv.classList.add(
                "quiz-question"
            );


            questionDiv.innerHTML = `
                <h3>
                    ${index + 1}. ${escapeHTML(
                        quiz.question
                    )}
                </h3>

                ${quiz.options
                    .map(
                        function (option, optionIndex) {

                            return `
                                <button
                                    class="quiz-option"
                                    data-question="${index}"
                                    data-answer="${optionIndex}"
                                >
                                    ${escapeHTML(option)}
                                </button>
                            `;

                        }
                    )
                    .join("")}
            `;


            quizContainer.appendChild(
                questionDiv
            );

        }
    );


    const submitButton =
        document.createElement("button");

    submitButton.classList.add(
        "submit-quiz-btn"
    );

    submitButton.textContent =
        "✅ Submit Quiz";


    submitButton.addEventListener(
        "click",
        function () {

            calculateScore(questions);

        }
    );


    quizContainer.appendChild(
        submitButton
    );


    addQuizOptionListeners();
}


// ========================================
// QUIZ OPTION SELECTION
// ========================================

function addQuizOptionListeners() {

    const options =
        document.querySelectorAll(
            ".quiz-option"
        );


    options.forEach(
        function (option) {

            option.addEventListener(
                "click",
                function () {

                    const questionNumber =
                        this.dataset.question;


                    const questionOptions =
                        document.querySelectorAll(
                            `.quiz-option[data-question="${questionNumber}"]`
                        );


                    questionOptions.forEach(
                        function (item) {

                            item.classList.remove(
                                "selected"
                            );

                        }
                    );


                    this.classList.add(
                        "selected"
                    );

                }
            );

        }
    );
}

// ========================================
// CALCULATE QUIZ SCORE
// ========================================

function calculateScore(questions) {

    let score = 0;


    questions.forEach(
        function (quiz, questionIndex) {

            const selected =
                document.querySelector(
                    `.quiz-option.selected[data-question="${questionIndex}"]`
                );


            if (selected) {

                const selectedAnswer =
                    Number(
                        selected.dataset.answer
                    );


                if (
                    selectedAnswer ===
                    quiz.answer
                ) {

                    score++;

                }

            }

        }
    );


    quizContainer.innerHTML += `
        <div class="quiz-result">

            <h2>
                🎉 Quiz Complete!
            </h2>

            <p>
                You scored
                <strong>${score} / ${questions.length}</strong>
            </p>

        </div>
    `;
}


// ========================================
// STUDY PLANNER
// ========================================

const plannerSubject =
    document.getElementById("plannerSubject");

const plannerTopics =
    document.getElementById("plannerTopics");

const plannerDays =
    document.getElementById("plannerDays");

const plannerHours =
    document.getElementById("plannerHours");

const generatePlanBtn =
    document.getElementById("generatePlanBtn");

const plannerResult =
    document.getElementById("plannerResult");


generatePlanBtn.addEventListener(
    "click",
    async function () {

        const subject =
            plannerSubject.value.trim();

        const topics =
            plannerTopics.value.trim();

        const days =
            plannerDays.value;

        const hours =
            plannerHours.value;


        // Check required fields
        if (!subject || !topics) {

            plannerResult.innerHTML = `
                <p>
                    ⚠️ Please enter a subject and
                    topics to study.
                </p>
            `;

            return;
        }


        // Show loading message
        plannerResult.innerHTML = `
            <p>
                🤖 Creating your study plan...
            </p>
        `;


        const prompt = `
Create a simple and realistic study plan.

Subject: ${subject}

Topics:
${topics}

Number of days: ${days}

Hours available per day: ${hours}

Create a day-by-day study plan.

Distribute the topics across the available days.

Include:
- Main topics to study
- Practice or revision where useful
- Approximate study time

Keep the plan practical and easy for a student to follow.

Use Markdown headings and bullet points.

Do not make the plan unnecessarily long.
`;


        try {

            const response =
                await fetch(
                    "http://localhost:5000/api/chat",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            message: prompt,
                            subject: subject,
                            mode: "teacher"
                        })
                    }
                );


            if (!response.ok) {

                throw new Error(
                    "Failed to generate study plan"
                );

            }


            const plan =
                await response.text();


            plannerResult.innerHTML =
                DOMPurify.sanitize(
                    marked.parse(plan)
                );


        } catch (error) {

            console.error(
                "Study planner error:",
                error
            );

            plannerResult.innerHTML = `
                <p>
                    ❌ Sorry, I couldn't create
                    the study plan. Please try again.
                </p>
            `;
        }
    }
);