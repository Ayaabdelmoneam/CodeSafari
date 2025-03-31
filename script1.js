document.addEventListener('DOMContentLoaded', () => {
    const startQuizBtn = document.getElementById('start-quiz-btn');
    const quizStartSection = document.getElementById('quiz-start');
    const quizContainer = document.getElementById('quiz-container');
    const questionText = document.getElementById('question-text');
    const answerButtons = document.querySelectorAll('.answer-btn');
    const resultContainer = document.getElementById('result-container');
    const finalScoreElement = document.getElementById('final-score');
    const restartQuizBtn = document.getElementById('restart-quiz-btn');
    const questionContainer = document.getElementById('question-container');
    
    // New elements for timer and streak
    const timerElement = document.createElement('div');
    timerElement.className = 'timer';
    timerElement.style.fontSize = '1.5rem';
    timerElement.style.fontWeight = 'bold';
    timerElement.style.marginBottom = '10px';
    
    const streakElement = document.createElement('div');
    streakElement.className = 'streak';
    streakElement.style.fontSize = '1.2rem';
    streakElement.style.marginBottom = '15px';
    
    // Insert timer and streak elements
    if (questionContainer) {
        questionContainer.insertBefore(timerElement, questionText);
        questionContainer.insertBefore(streakElement, questionText);
    } else if (quizContainer) {
        quizContainer.insertBefore(timerElement, quizContainer.firstChild);
        quizContainer.insertBefore(streakElement, quizContainer.firstChild);
    }

    let currentQuestionIndex = 0;
    let score = 0;
    let totalQuestions = 0;
    let currentStreak = 0;
    let bestStreak = 0;
    let timerInterval;
    let timeLeft = 15;
    
    // Initialize question history in localStorage for persistence
    if (!localStorage.getItem('questionHistory')) {
        const topics = ["Variables", "Loops", "Conditionals", "String Manipulation", "Functions", "Operators"];
        const initialHistory = {};
        topics.forEach(topic => initialHistory[topic] = []);
        localStorage.setItem('questionHistory', JSON.stringify(initialHistory));
    }

    // Function to parse question from API response
    function parseQuestion(responseContent) {
        const matches = responseContent.match(/<QUESTION>\n(.*?)\n<OPTIONS>\n(.*?)\n<ANSWER>\nAnswer: (\d+)/s);
        if (!matches) return null;

        const [_, question, optionsText, answerIndex] = matches;
        const options = optionsText.split('\n').map(opt => opt.replace(/^\d+\.\s*/, '').trim());
        
        return {
            question,
            options,
            correctIndex: parseInt(answerIndex) - 1
        };
    }

    // Function to create hash for question to better track uniqueness
    function createQuestionHash(question, options) {
        // Simple hash function based on question text and options
        return question.trim().toLowerCase().replace(/\s+/g, '') + 
               options.join('').toLowerCase().replace(/\s+/g, '');
    }

    // Function to start timer
    function startTimer() {
        clearInterval(timerInterval);
        timeLeft = 15;
        updateTimerDisplay();
        
        timerInterval = setInterval(() => {
            timeLeft--;
            updateTimerDisplay();
            
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                handleTimeUp();
            }
        }, 1000);
    }
    
    // Function to update timer display
    function updateTimerDisplay() {
        timerElement.textContent = `Time: ${timeLeft}s`;
        
        // Change color when time is running out
        if (timeLeft <= 5) {
            timerElement.style.color = 'red';
        } else {
            timerElement.style.color = 'black';
        }
    }
    
    // Function to update streak display
    function updateStreakDisplay() {
        streakElement.textContent = `Current Streak: ${currentStreak} | Best Streak: ${bestStreak}`;
    }
    
    // Function to handle when time is up
    function handleTimeUp() {
        // Find the correct answer
        const options = Array.from(answerButtons).map(btn => btn.textContent);
        let correctAnswer = "";
        
        answerButtons.forEach(btn => {
            btn.disabled = true;
            if (btn.getAttribute('data-correct') === 'true') {
                correctAnswer = btn.textContent;
                btn.classList.add('correct');
            }
        });
        
        // Reset streak when time is up
        currentStreak = 0;
        updateStreakDisplay();
        
        // Show feedback
        showFeedback(false, correctAnswer, true);
    }

    // Function to fetch MCQ from API
    async function fetchMCQ() {
        // List of Python topics
        const topics = ["Variables", "Loops", "Conditionals", "String Manipulation", "Functions", "Operators"];
        
        // Get question history from localStorage
        const questionHistory = JSON.parse(localStorage.getItem('questionHistory'));
        
        // Create a list of topics that still have fewer than max history entries
        const availableTopics = topics.filter(topic => 
            questionHistory[topic].length < 50  // Allow up to 50 questions per topic before cycling
        );
        
        // If all topics have reached max history, use all topics
        const topicPool = availableTopics.length > 0 ? availableTopics : topics;
        
        // Select a random topic from available topics
        const randomTopic = topicPool[Math.floor(Math.random() * topicPool.length)];
        
        // Try up to 3 times to get a unique question
        let attempts = 0;
        const maxAttempts = 3;
        
        while (attempts < maxAttempts) {
            attempts++;
            try {
                console.log(`Attempt ${attempts} for topic: ${randomTopic}`);
                
                // Add existing questions as context for the AI
                const existingQuestions = questionHistory[randomTopic]
                    .slice(-10) // Only use the last 10 questions for context
                    .map(item => item.question)
                    .join('\n\n');
                
                const response = await fetch('http://localhost:11434/api/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        "model": "mcqmodel",
                        "messages": [
                            {
                                "role": "system",
                                "content": "You are an AI tutor that creates multiple-choice questions (MCQs) to teach Python programming concepts to children aged 10 to 13. Your questions should be clear, engaging, and age-appropriate. Always format your response with <QUESTION>, <OPTIONS>, and <ANSWER> tags. Create UNIQUE questions that are different from previous questions."
                            },
                            {
                                "role": "user",
                                "content": `Generate a Python MCQ question for kids about ${randomTopic}. 
                                
PREVIOUSLY GENERATED QUESTIONS (DO NOT REPEAT THESE):
${existingQuestions}

CREATE A COMPLETELY DIFFERENT QUESTION with different content, different code examples (if applicable), and different answer options. Make sure the question tests a different aspect of ${randomTopic} than the previous questions.`
                            }
                        ],
                        "stream": false
                    })
                });
        
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
        
                const data = await response.json();
                const responseContent = data.message?.content || "Error: No question generated";
                
                // Parse the question from the response
                const parsedQuestion = parseQuestion(responseContent);
                if (!parsedQuestion) {
                    console.error("Failed to parse question format");
                    continue; // Try again
                }
                
                // Create hash for the question to check uniqueness
                const questionHash = createQuestionHash(parsedQuestion.question, parsedQuestion.options);
                
                // Check if this question is unique enough
                const isDuplicate = questionHistory[randomTopic].some(item => 
                    createQuestionHash(item.question, item.options) === questionHash
                );
                
                if (!isDuplicate) {
                    // Store the full question in history
                    questionHistory[randomTopic].push({
                        question: parsedQuestion.question,
                        options: parsedQuestion.options,
                        timestamp: Date.now()
                    });
                    
                    // Keep history size manageable
                    if (questionHistory[randomTopic].length > 50) {
                        questionHistory[randomTopic].shift();
                    }
                    
                    // Update localStorage
                    localStorage.setItem('questionHistory', JSON.stringify(questionHistory));
                    
                    console.log(`Generated unique question about: ${randomTopic}`);
                    return parsedQuestion;
                } else {
                    console.log("Duplicate question detected, trying again...");
                }
            } catch (error) {
                console.error("Error fetching MCQ:", error);
            }
        }
        
        // If we've exhausted our attempts, create a fallback question
        console.log("Could not generate unique question after multiple attempts");
        return getFallbackQuestion();
    }

    // Fallback question if API fails
    function getFallbackQuestion() {
        const fallbackQuestions = [
            {
                question: "What is the output of: print(2 ** 3)?",
                options: ["8", "6", "5", "Error"],
                correctIndex: 0
            },
            {
                question: "How do you create a variable named 'age' with the value 12?",
                options: ["age = 12", "var age = 12", "age == 12", "12 -> age"],
                correctIndex: 0
            },
            {
                question: "Which loop will run at least once even if the condition is false?",
                options: ["do-while loop", "while loop", "for loop", "Python doesn't have do-while loops"],
                correctIndex: 3
            },
            {
                question: "What does len('hello') return?",
                options: ["5", "4", "6", "'hello'"],
                correctIndex: 0
            }
        ];
        
        return fallbackQuestions[Math.floor(Math.random() * fallbackQuestions.length)];
    }

    // Function to show feedback
    function showFeedback(isCorrect, correctAnswer, timeUp = false) {
        clearInterval(timerInterval);
        
        const feedbackElement = document.createElement('div');
        feedbackElement.className = `feedback ${isCorrect ? 'correct' : 'incorrect'}`;
        
        if (timeUp) {
            feedbackElement.textContent = `⏱️ Time's up! The correct answer is: ${correctAnswer}`;
        } else {
            feedbackElement.textContent = isCorrect 
                ? "✅ Correct! Well done!" 
                : `❌ Incorrect. The correct answer is: ${correctAnswer}`;
        }
        
        // Make sure questionContainer exists by using quizContainer as fallback
        const container = questionContainer || quizContainer;
        container.appendChild(feedbackElement);
        
        setTimeout(() => {
            feedbackElement.remove();
            currentQuestionIndex++;
            loadNextQuestion();
        }, 2000);
    }

    // Start Quiz
    startQuizBtn.addEventListener('click', () => {
        quizStartSection.style.display = 'none';
        quizContainer.style.display = 'block';
        resultContainer.style.display = 'none';
        currentQuestionIndex = 0;
        score = 0;
        totalQuestions = 0;
        currentStreak = 0;
        bestStreak = 0;
        updateStreakDisplay();
        loadNextQuestion();
    });

    // Load Next Question
    async function loadNextQuestion() {
        if (currentQuestionIndex >= 10) {
            endQuiz();
            return;
        }

        // Show loading state
        questionText.textContent = "Loading next question...";
        answerButtons.forEach(btn => {
            btn.disabled = true;
            btn.textContent = "...";
        });

        const questionData = await fetchMCQ();
        totalQuestions++;

        // Display just the question text, not the entire response
        questionText.textContent = questionData.question;
        
        // Use the parsed options array
        const options = [...questionData.options];
        const correctAnswer = options[questionData.correctIndex];

        // Shuffle the options
        shuffleArray(options);

        answerButtons.forEach((button, index) => {
            if (index < options.length) {
                button.textContent = options[index];
                button.disabled = false;
                button.className = 'btn answer-btn';
                
                // Mark the correct answer for reference
                button.setAttribute('data-correct', options[index] === correctAnswer ? 'true' : 'false');
                
                button.onclick = () => {
                    clearInterval(timerInterval);
                    const isCorrect = options[index] === correctAnswer;
                    
                    if (isCorrect) {
                        score++;
                        currentStreak++;
                        if (currentStreak > bestStreak) {
                            bestStreak = currentStreak;
                        }
                    } else {
                        currentStreak = 0;
                    }
                    
                    updateStreakDisplay();
                    
                    button.classList.add(isCorrect ? 'correct' : 'incorrect');
                    answerButtons.forEach(btn => btn.disabled = true);
                    
                    showFeedback(isCorrect, correctAnswer);
                };
            }
        });
        
        // Start the timer after displaying the question
        startTimer();
    }

    // End Quiz
    function endQuiz() {
        clearInterval(timerInterval);
        quizContainer.style.display = 'none';
        resultContainer.style.display = 'block';
        finalScoreElement.textContent = `Your Score: ${score}/${totalQuestions} | Best Streak: ${bestStreak}`;
    }

    // Restart Quiz
    restartQuizBtn.addEventListener('click', () => {
        resultContainer.style.display = 'none';
        quizStartSection.style.display = 'block';
    });

    // Utility function to shuffle array
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
});