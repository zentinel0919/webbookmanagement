const axios = require('axios');

const rasaApiUrl = 'http://localhost:5505/webhooks/rest/webhook';
const grammarBotApiUrl = 'https://grammarbot-neural.p.rapidapi.com/v1/check'; // GrammarBot API URL
const grammarBotApiKey = '407ec1935emsh227d2b11b5eb8dcp1415ffjsnfadab579fc38'; // Replace with your GrammarBot API Key
const grammarBotApiHost = 'grammarbot-neural.p.rapidapi.com'; // Replace with your GrammarBot API Host

const sendMessageToRasa = async (message) => {
  try {
    const response = await axios.post(rasaApiUrl, {
      sender: 'user',
      message: message,
    });
    return response.data;
  } catch (error) {
    console.error('Error sending message to Rasa:', error);
    throw error;
  }
};

const checkGrammar = async (message) => {
  const grammarBotOptions = {
    method: 'POST',
    url: grammarBotApiUrl,
    headers: {
      'content-type': 'application/json',
      'X-RapidAPI-Key': grammarBotApiKey,
      'X-RapidAPI-Host': grammarBotApiHost,
    },
    data: {
      text: message,
      lang: 'en', // You can set the desired language here
    },
  };

  try {
    const response = await axios.request(grammarBotOptions);

    // Extract grammar mistakes or any other relevant information from the GrammarBot.io response
    const grammarMistakes = response.data.matches.length;

    // You can decide what to do with the grammar mistakes, like returning them or logging them
    console.log('Grammar Mistakes:', grammarMistakes);

    return response;
  } catch (error) {
    console.error('Error checking grammar with GrammarBot:', error);
    throw error;
  }
};

module.exports = { sendMessageToRasa, checkGrammar };
