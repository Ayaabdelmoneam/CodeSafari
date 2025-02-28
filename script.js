// Handle navigation item clicks
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault(); // Prevent default link behavior
      
      // Remove active class from all items
      document.querySelectorAll('.nav-item').forEach(navItem => {
        navItem.classList.remove('active');
      });
      
      // Add active class to clicked item
      item.classList.add('active');
      
      // Get the page id from the item's data attribute
      const pageId = item.getAttribute('data-page');
      showPage(pageId);
    });
  });
  
  // Function to show the selected page
  function showPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
      page.classList.remove('active');
    });
    
    // Show the selected page
    const selectedPage = document.getElementById(pageId);
    if (selectedPage) {
      selectedPage.classList.add('active');
    }
  }

  
/////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////// Python Assistant Chat functionality /////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////

document.addEventListener('DOMContentLoaded', () => {

  firebase.auth().onAuthStateChanged((user) => {
    if (user) {

        let firstName = user.displayName ? user.displayName.split(" ")[0] : "User";
        document.getElementById("dashboard-username").textContent = firstName;

    } else {
        document.getElementById("dashboard-username").textContent = "Guest";
    }
});


  const chatMessages = document.querySelector('.chat-messages');
  const messageInput = document.querySelector('.message-input');
  const sendButton = document.querySelector('.send-message');

  // Add initial bot message
  addMessage("Hello! I'm your Python learning assistant. I can help you with Python concepts, debug your code, or answer any programming questions you have. How can I help you today?", 'bot');

  // Send message function
  function sendMessage() {
    const message = messageInput.value.trim();
    if (message === '') return;

    // Add user message
    addMessage(message, 'user');
    messageInput.value = '';

    // Simulate bot response
    setTimeout(() => {
      const botResponse = getBotResponse(message);
      addMessage(botResponse, 'bot');
    }, 500);
  }

  // Add message to chat
  function addMessage(content, type) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', type);
    messageElement.textContent = content;
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // Simple bot response logic
  function getBotResponse(message) {
    const lowerMessage = message.toLowerCase();
    
    // Basic response patterns
    const responses = {
      'hello': "Hi there! How can I help you with Python today?",
      'help': "I can help you with Python concepts, debugging, best practices, and more. What would you like to know?",
      'variables': "In Python, variables are containers for storing data values. They are created when you assign a value to them. For example: x = 5",
      'loops': "Python has two main types of loops: 'for' loops for iterating over sequences, and 'while' loops for executing code while a condition is true.",
      'functions': "Functions in Python are defined using the 'def' keyword. They help you organize and reuse code. Example: def greet(name): return f'Hello, {name}!'",
    };

    // Check if the message contains any keywords
    for (const [keyword, response] of Object.entries(responses)) {
      if (lowerMessage.includes(keyword)) {
        return response;
      }
    }

    // Default response
    return "I understand you're asking about Python. Could you please provide more details about what you'd like to learn?";
  }

  // Event listeners
  sendButton.addEventListener('click', sendMessage);

  messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Auto-resize textarea
  messageInput.addEventListener('input', () => {
    messageInput.style.height = 'auto';
    messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
  });
});