import fetch from 'node-fetch'
import configFile from '../config'
import {readFileSync, existsSync, writeFileSync} from 'fs'
import TelegramBotApi, { EditMessageTextOptions } from 'node-telegram-bot-api'
if(!existsSync("./trivia.json"))
  writeFileSync("./trivia.json", JSON.stringify([]))

const config:Config = configFile;

//Fetch latest trivia questions
async function updateTrivia(){
  console.log(`Fetching latest trivia data...`)
  const response = await fetch(config.dataEndpoint, {
      "method":"GET",
      "headers":{
          "authorization":config.dataEndpointAuthorizationHeader || undefined
      }
  })
  const data = (await response.json() as TriviaConfig)
  writeFileSync("./trivia.json", JSON.stringify(data))
  console.log("Latest trivia data fetched")
}
updateTrivia()
setInterval(() => {
  updateTrivia()
}, 60 * 60 * 1000)

const token = config.token;
const bot = new TelegramBotApi(token, {"polling":true});

bot.on("message", (message) => {
  if(message.text.match(/\/start/)){
    let triviaQuestions:TriviaConfig = existsSync("./trivia.json")?JSON.parse(readFileSync("./trivia.json").toString()):[]
    const currentQuestionIndex = Math.floor(Math.random() * triviaQuestions.length)
    const currentQuestion = triviaQuestions[currentQuestionIndex]
    bot.sendMessage(message.chat.id, `@${message.chat.username}\n${currentQuestion.question}`, {
      "reply_markup": {
        "one_time_keyboard":true,
        "inline_keyboard":currentQuestion.choices.map(c => {
          return [
            {
              "text":c.title,
              "callback_data":`answer%%${currentQuestionIndex}%%${c.optionName}`
            }
          ]
        })
      }
    })
  }
})
bot.on('callback_query', (cbq) => {
  let triviaQuestions:TriviaConfig = existsSync("./trivia.json")?JSON.parse(readFileSync("./trivia.json").toString()):[]
  const action = cbq.data;
  const msg = cbq.message;
  const opts:EditMessageTextOptions = {
    chat_id: msg.chat.id,
    message_id: msg.message_id,
    parse_mode:"Markdown"
  };
  //answer%%<question_index>%%<option name>
  let providedAnswer = action.split("%%")[2];
  let questionIndex = action.split("%%")[1];
  let isAnswerCorrect = false;

  const currentQuestion = triviaQuestions[(questionIndex as any as number)]
  if(currentQuestion.answer == providedAnswer)
    isAnswerCorrect = true;
  
    if(isAnswerCorrect == true){
      bot.editMessageText(`✅ **Answer correct**\nYou answered the question __${currentQuestion.question}__ correctly! Run /start to play again.`, opts);
    }else{
      bot.editMessageText(`❌ **Answer incorrect**\nYou answered the question __${currentQuestion.question}__ incorrectly. Run /start to play again.`, opts);
    }
})