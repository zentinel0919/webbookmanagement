let recognition;
let isListening = false;

// Check if the browser supports the Web Speech API
if ('webkitSpeechRecognition' in window) {
  recognition = new webkitSpeechRecognition();
} else if ('SpeechRecognition' in window) {
  recognition = new SpeechRecognition();
} else {
  alert('Your browser does not support speech recognition. Please try a different browser.');
}

recognition.continuous = false;
recognition.interimResults = false;
recognition.lang = "en-US";

recognition.onresult = function(e) {
  const userMessageInput = document.getElementById('user-prompt');
  userMessageInput.value = e.results[0][0].transcript;
  stopDictation();
};

recognition.onerror = function(e) {
  stopDictation();
};

function startDictation() {
  if (!isListening) {
    recognition.start();
    isListening = true;
    // Change the button color to indicate it's listening
    document.getElementById('micButton').style.backgroundColor = "red";
  } else {
    stopDictation();
  }
}

function stopDictation() {
  recognition.stop();
  isListening = false;
  // Reset the button color
  document.getElementById('micButton').style.backgroundColor = "";
}

// interview-simulation.js

function updateAvatar(expression) {
  // This function will update the avatar's image based on the expression parameter
  const avatarImage = document.getElementById('avatar-image'); // Make sure you have an img element with this id in your HTML
  avatarImage.src = `/assets/animation/${expression}.png`; // Update the src attribute to the path of your images
}

let currentQuestionIndex = 0;
let isBotSpeaking = false;

function toggleExpression() {
  if (!isBotSpeaking) {
    const currentSrc = document.getElementById('avatar-image').src;
    const newSrc = currentSrc.includes('Normal') ? 'Smile' : 'Normal';
    updateAvatar(newSrc);
  }
}

setInterval(toggleExpression, 3000);

function speak(text) {
  isBotSpeaking = true;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.onboundary = function(event) {
    // Check the event for word boundaries and update the avatar's image based on the current word
    updateAvatarForPronunciation(event.charIndex, text);
  };
  utterance.onend = function() {
    isBotSpeaking = false;
  };
  speechSynthesis.speak(utterance);
}

function updateAvatarForPronunciation(charIndex, text) {
  const word = getCurrentWord(charIndex, text);
  const expression = getExpressionForWord(word);
  if (expression) {
    updateAvatar(expression);
  }
}

function getCurrentWord(charIndex, text) {
  // Implement logic to extract the current word being spoken based on charIndex
  // This is a placeholder function, and you would need to implement the logic based on your application's needs
}

function getExpressionForWord(word) {
  // Map specific words to their corresponding expressions
  const pronunciationMap = {
    // Words or sounds mapped to their corresponding image file name (without .png)
    'A,E,I': 'A_E_I',
    'B,M,P': 'B_M_P',
    'C,D,N,S,T,X,Y,Z': 'C_D_N_S_T_X_Y_Z',
    'CH,J,SH': 'CH_J_SH',
    'EE': 'EE',
    'F,V': 'F_V',
    'G,K': 'G_K',
    'L': 'L',
    'O': 'O',
    'TH': 'TH',
    'U': 'U',
    'W,Q': 'W_Q',
  };

  // Find and return the correct expression for the current word
  return pronunciationMap[word] || null;
}

function updateAvatar(expression) {
  const avatarImage = document.getElementById('avatar-image');
  avatarImage.src = `/assets/animation/${expression}.png`;
}


async function sendMessage() {
  const userInput = document.getElementById('user-prompt').value;
  document.getElementById('user-prompt').value = '';

  if (userInput.trim() === '') {
    alert('Please enter a message.');
    return;
  }

  displayMessage('User', userInput);

  // Send the user input to the server to get a response
  const botResponse = await getBotResponse(userInput);

  displayMessage('Bot', botResponse);
  const expression = determineExpression(botResponse); // Implement this function based on your logic
  updateAvatar(expression);

  currentQuestionIndex++;
}

// Function to get the bot's response from the server
async function getBotResponse(userInput) {
  try {
    const response = await fetch('/generate-text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ prompt: userInput })
    });

    if (!response.ok) {
      const errorDetails = await response.json();
      console.error('Error sending message:', errorDetails);
      return `Error: ${errorDetails.error}`;
    }

    const data = await response.json();
    const botResponse = data.choices[0].message.content;
    return botResponse; 

  } catch (error) {
    console.error('Error sending message:', error);
    return 'Sorry, something went wrong.';
  }
}

let lastBotMessage = "";


function repeatLastMessage() {
  if (lastBotMessage) {
    speak(lastBotMessage);
  } else {
    alert("There's no message to repeat.");
  }
}

function displayMessage(sender, message) {
  if (sender === 'Bot') {
    lastBotMessage = message;
  }
  const chatContainer = document.getElementById('chat-container');
  const messageElement = document.createElement('div');
  messageElement.className = `${sender.toLowerCase()}-message-container`;

  const messageBubble = document.createElement('div');
  messageBubble.className = 'message-bubble';
  messageBubble.textContent = message;

  if (sender === 'Bot') {
    speak(message);
  }
  // Create the indicator label
  const messageIndicator = document.createElement('div');
  messageIndicator.className = 'message-indicator';
  messageIndicator.textContent = sender === 'User' ? 'You' : 'Interview Bot'; // Change this text to whatever you want the indicators to say

  // Append the indicator to the bubble
  messageBubble.appendChild(messageIndicator);

  messageElement.appendChild(messageBubble);
  chatContainer.appendChild(messageElement);

  chatContainer.scrollTop = chatContainer.scrollHeight;
}



document.getElementById('interview-form').addEventListener('submit', function(event) {
  event.preventDefault();
  sendMessage();
});

// Start the interview when the page loads
window.onload = function() {
  setTimeout(function() {
    // Display initial bot message
    displayMessage('Bot', "Hello! To begin with the interview, tell me about yourself.");
  }, 2000); // 2000 milliseconds (2 seconds) delay
};


  function speak(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onboundary = function(event) {
      if (event.name === 'word') {
        const word = text.slice(event.charIndex).split(' ')[0];
        const expression = getExpressionForWord(word);
        updateAvatar(expression);
      }
    };
    speechSynthesis.speak(utterance); 
  }
  
  function getExpressionForWord(word) {
    // A very simple example of how you might determine the expression
    const firstChar = word[0].toLowerCase();
    const lastChar = word[word.length - 1].toLowerCase();
    let expression = 'Normal'; // Default expression
  
    // Check the first character and map it to a mouth position
    if ('aeir'.includes(firstChar)) {
      expression = 'A,E,I'; // Use an image for open mouth vowels
    } else if ('o'.includes(firstChar)) {
      expression = 'O';
    } else if ('u'.includes(firstChar)) {
        expression = 'U';
    } else if ('fv'.includes(firstChar)) {
      expression = 'F,V'; // Use an image for closed mouth consonants
    } else if ('bmp'.includes(firstChar)) {
      expression = 'B,M,P'; // Use an image for closed mouth consonants
    } else if ('cdnstxyz'.includes(firstChar)) {
      expression = 'C,D,N,S,T,X,Y,Z'; // Use an image for closed mouth consonants
    } else if ('gk'.includes(firstChar)) {
      expression = 'G,K'; // Use an image for closed mouth consonants
    } else if ('l'.includes(firstChar)) {
      expression = 'L'; // Use an image for closed mouth consonants
    } else if ('th'.includes(firstChar)) {
      expression = 'TH'; // Use an image for closed mouth consonants
    } else if ('ee'.includes(firstChar)) {
      expression = 'EE'; // Use an image for closed mouth consonants
    } else if ('wq'.includes(firstChar)) {
      expression = 'W,Q'; // Use an image for closed mouth consonants
    } 

    if ('aeiou'.includes(lastChar)) {
      expression = 'A,E,I'; // Use an image for open mouth vowels
    } else if ('o'.includes(lastChar)) {
      expression = 'O';
    } else if ('fv'.includes(lastChar)) {
      expression = 'F,V'; // Use an image for closed mouth consonants
    } else if ('bmp'.includes(lastChar)) {
      expression = 'B,M,P'; // Use an image for closed mouth consonants
    } else if ('cdnstxyz'.includes(lastChar)) {
      expression = 'C,D,N,S,T,X,Y,Z'; // Use an image for closed mouth consonants
    } else if ('gk'.includes(lastChar)) {
      expression = 'G,K'; // Use an image for closed mouth consonants
    } else if ('l'.includes(lastChar)) {
      expression = 'L'; // Use an image for closed mouth consonants
    } else if ('th'.includes(lastChar)) {
      expression = 'TH'; // Use an image for closed mouth consonants
    } else if ('ee'.includes(lastChar)) {
      expression = 'EE'; // Use an image for closed mouth consonants
    } else if ('wq'.includes(lastChar)) {
      expression = 'W,Q'; // Use an image for closed mouth consonants
    } 
  
    return expression;
  }
  
  function updateAvatar(expression) {
    const avatarImage = document.getElementById('avatar-image');
    avatarImage.src = `/assets/animation/${expression}.png`;
  }
  