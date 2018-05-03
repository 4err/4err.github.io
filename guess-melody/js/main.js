(function () {
'use strict';

/**
 * Created by Denis on 30.03.2018.
 */

/**
 * Slow cloning obj function
 * @param {Object} o
 * @return {Object}
 */
const clone = (o) => JSON.parse(JSON.stringify(o));

/**
 * Plural function
 * @param {int} num
 * @param {Array} pluralArr
 * @return {*}
 */
const plural = (num, pluralArr) => {
  let n = Math.abs(num);

  n %= 100;
  if (n >= 5 && n <= 20) {
    return pluralArr[2];
  }
  n %= 10;
  if (n === 1) {
    return pluralArr[0];
  }
  if (n >= 2 && n <= 4) {
    return pluralArr[1];
  }
  return pluralArr[3];
};

/**
 * Created by Denis on 13.04.2018.
 */

class AbstractView {
  constructor(data = ``) {
    this.data = data;
    this._element = null;
  }

  get template() {
  }

  render(html) {
    let template = document.createElement(`div`);
    template.innerHTML = html;
    return template;
  }

  bind() {
  }

  get element() {
    if (this._element === null) {
      let node = this.render(this.template);
      this._element = node;

      this.bind(node);
    }

    return this._element;
  }
}

/**
 * Created by Denis on 30.03.2018.
 */

class WelcomeView extends AbstractView {
  get template() {
    return `
    <section class="logo" title="Угадай мелодию"><h1>Угадай мелодию</h1></section>
    <button class="main-play">Начать игру</button>
    <h2 class="title main-title">Правила игры</h2>
    <p class="text main-text">
      Правила просты&nbsp;— за&nbsp;${Math.round(this.data.time / 60)} ${plural(Math.round(this.data.time / 60), [`минуту`, `минуты`, `минут`])} ответить на все вопросы.<br>
      Ошибиться можно ${this.data.maxErrors} ${plural(this.data.maxErrors, [`раз`, `раза`, `раз`])}.<br>
      Удачи!
    </p>
`;
  }

  bind(node) {
    node.querySelector(`.main-play`).addEventListener(`click`, () => {
      this.onStart();
    });
  }

  onStart() {

  }

}

/**
 * Created by Denis on 28.04.2018.
 */

class LoadingView extends AbstractView {

  get template() {
    return `<section class="logo" title="Угадай мелодию"><h1>Угадай мелодию</h1></section>

    <h2 class="title">${this.data.title}</h2>
    <div class="main-stat">${this.data.text}</div>`;
  }
}

/**
 * Created by Denis on 10.04.2018.
 */
const defaultSettings = {
  time: 300,
  maxErrors: 3,
};

const IS_DEBUG = false;

const COUNT_RULES = {
  isCorrect: 1,
  isFast: 1,
  isFail: 2,
  fastTime: 30
};

const Result = {
  TIME: 0,
  MISTAKES: 1,
  WIN: 2,
  NEXT_LEVEL: 3
};

const initialGameStatus = {
  questionNum: -1,
  time: defaultSettings.time,
  mistakes: 0,
  maxErrors: defaultSettings.maxErrors,
  points: 0,
  answers: []
};

/**
 * Created by Denis on 23.04.2018.
 */

class GameModel {
  constructor(questions) {
    this._questions = questions;
    this._status = Result.NEXT_LEVEL;

    this._timeLineOffsetStep = 7.75;

    this.restart();
  }

  get state() {
    return this._state;
  }

  get status() {
    return this._status;
  }

  get time() {
    return this._state.time;
  }

  get mistakes() {
    return this._state.mistakes;
  }

  get answers() {
    return this._state.answers;
  }

  get currQuestion() {
    return this._state.question;
  }

  get points() {
    return this._state.points;
  }

  set points(points) {
    this._state.points = points;
  }

  hasNextQuestion() {
    return this.getQuestion(this._state.questionNum + 1) !== void 0;
  }

  nextQuestion() {
    this._state.question = this.getQuestion(this._state.questionNum + 1);
    this._state.questionNum++;
  }

  restart() {
    this._state = clone(initialGameStatus);
    this._state.timeOffset = 0;
    this.nextQuestion();
  }

  tick() {
    this._state.time--;

    this._state.timeOffset += this._timeLineOffsetStep;

    if (this._state.time <= 0) {
      this._status = Result.TIME;
    }
  }

  wrongAnswer() {
    this._state.mistakes++;
  }

  addAnswer(answer) {
    this._state.answers.push(answer);
    this.updateStatus();
  }

  updateStatus() {
    if (this._state.mistakes === this._state.maxErrors) {
      this._status = Result.MISTAKES;
    }

    if (!this.hasNextQuestion()) {
      this._status = Result.WIN;
    }
  }

  getQuestion(n) {
    return this._questions[n];
  }
}

/*
 * Created by Denis on 10.04.2018.
 */

class HeaderView extends AbstractView {

  get template() {
    return `
<div class="header">
<svg xmlns="http://www.w3.org/2000/svg" class="timer" viewBox="0 0 780 780">
      <circle
        cx="390" cy="390" r="370"
        class="timer-line"
        style="
        stroke-dasharray: 2325;
        stroke-dashoffset: ${this.data.timeOffset};
        filter: url(.#blur); 
        transform: rotate(-90deg) scaleY(-1);
        transform-origin: center
        "></circle>
      <div class="timer-value" xmlns="http://www.w3.org/1999/xhtml">
        <span class="timer-value-mins">${Math.floor(this.data.time / 60)}</span><!--    
        --><span class="timer-value-dots">:</span><!--
        --><span class="timer-value-secs">${(`0` + (this.data.time % 60)).substr(-2)}</span>
      </div>
    </svg>
    <div class="main-mistakes">
    ${new Array(this.data.mistakes)
      .fill(`<img class="main-mistake" src="img/wrong-answer.png" width="35" height="49">`)
      .join(``)}
    </div>
</div>
`;
  }
}

/**
 * Created by Denis on 16.04.2018.
 */

class LevelView extends AbstractView {
  constructor(data) {
    super(data);

    this._answers = [];
    this._time = 35;
  }

  get template() {

  }

  answerTemplate() {

  }

  stopAllAudio() {
    const audios = this._element.querySelectorAll(`audio`);

    for (const audio of audios) {
      audio.pause();
      audio.nextElementSibling.classList.remove(`player-control--pause`);
    }
  }

  bindAudio() {
    const audioButtons = this._element.querySelectorAll(`.player .player-control`);

    for (const button of audioButtons) {
      button.addEventListener(`click`, (e) => {
        e.preventDefault();

        if (button.previousElementSibling.paused === false) {
          button.previousElementSibling.pause();
        } else {
          this.stopAllAudio();
          button.previousElementSibling.play();
        }

        button.classList.toggle(`player-control--pause`);

      });
    }

    this.audioAutoStart();
  }

  audioAutoStart() {
    const audio = this._element.querySelector(`audio`);
    audio.play();
    audio.nextElementSibling.classList.toggle(`player-control--pause`);
  }

  buildAnswers() {
    let answersArr = [];
    for (let i = 0; i < this.data.answers.length; i++) {

      let it = this.data.answers[i];
      let template = this.answerTemplate(it, i);

      answersArr.push(template);
    }

    return answersArr.join(``);
  }

  get answer() {
    return {
      answer: this._answers,
      time: this._time
    };
  }

}

/**
 * Created by Denis on 30.03.2018.
 */

class GenreView extends LevelView {
  get template() {
    let answers = this.buildAnswers();

    return `
     <div class="main-wrap">
      <h2 class="title">${this.data.text}</h2>
      <form class="genre">
        ${answers}
        <button class="genre-answer-send" disabled type="submit">Ответить</button>
      </form>
    </div>
`;
  }

  answerTemplate(answer, num) {
    let debug = ``;
    if (IS_DEBUG && answer.isCorrect) {
      debug = `debug`;
    }
    return `<div class="genre-answer">
          <div class="player-wrapper">
            <div class="player">
              <audio src="${answer.audio}"></audio>
              <button class="player-control"></button>
              <div class="player-track">
                <span class="player-status"></span>
              </div>
            </div>
          </div>
          <input type="checkbox" name="answer" value="${num}" id="a-${num}">
          <label class="genre-answer-check ${debug}" for="a-${num}"></label>
      </div>`;
  }

  bind(node) {
    this.bindAudio();
    let sendButton = node.querySelector(`.genre-answer-send`);
    let answerButtons = node.querySelectorAll(`input[name="answer"]`);

    for (let button of answerButtons) {
      button.addEventListener(`change`, function () {
        let checkedNum = document.querySelectorAll(`input[name="answer"]:checked`).length;
        if (checkedNum > 0 && sendButton.disabled) {
          sendButton.disabled = false;
        } else if (checkedNum === 0) {
          sendButton.disabled = true;
        }
      });
    }

    sendButton.addEventListener(`click`, (e) => {
      e.preventDefault();

      let checked = document.querySelectorAll(`input[name="answer"]:checked`);
      for (let it of checked) {
        this._answers.push(it.value);
      }

      this.onAnswerClick(this._answers, this._time);
    });
  }

  onAnswerClick() {
  }

}

/**
 * Created by Denis on 30.03.2018.
 */

class ArtistView extends LevelView {
  get template() {
    let answers = this.buildAnswers();

    return `
    <div class="main-wrap">
      <h2 class="title main-title">Кто исполняет эту песню?</h2>
      <div class="player-wrapper">
        <div class="player">
          <audio src="${this.data.audio}"></audio>
          <button class="player-control"></button>
          <div class="player-track">
            <span class="player-status"></span>
          </div>
        </div>
      </div>
      <form class="main-list">
          ${answers}
      </form>
    </div>
`;
  }

  answerTemplate(answer, num) {
    let debug = ``;
    if (IS_DEBUG && answer.isCorrect) {
      debug = `debug`;
    }

    return `<div class="main-answer-wrapper">
          <input class="main-answer-r" type="radio" id="answer-${num}" name="answer" value="${num}"/>
          <label class="main-answer  ${debug}" for="answer-${num}">
            <img class="main-answer-preview" src="${answer.pic}"
                 alt="${answer.name}" width="134" height="134">
            ${answer.name}
          </label>
    </div>`;
  }

  bind(node) {
    this.bindAudio();

    let answerButtons = node.querySelectorAll(`input[name="answer"]`);
    for (let button of answerButtons) {
      button.addEventListener(`change`, () => {
        let answer = button.value;
        this._answers.push(answer);
        this.onAnswerClick(this._answers);
      });
    }
  }

  onAnswerClick() {
  }

}

/**
 * Created by Denis on 25.04.2018.
 */

class GameScreen {
  constructor(model) {
    this.model = model;
    this.header = new HeaderView(this.model.state);
    this.content = this.question;

    this.root = document.createElement(`div`);
    this.root.appendChild(this.header.element);
    this.root.appendChild(this.content.element);
    this._interval = null;
  }

  get element() {
    return this.root;
  }

  get question() {
    const currentQuestion = this.model.currQuestion;
    let question = ``;

    switch (currentQuestion.type) {
      case `artist`:
        question = new ArtistView(currentQuestion);
        break;
      case `genre`:
        question = new GenreView(currentQuestion);
        break;
      default:
        throw new Error(`Missing question type`);
    }

    return question;
  }

  init() {
    this.nextQuestion();

    this._interval = setInterval(() => {
      if (this.model.status === Result.TIME) {
        this.endGame();
      }
      this.model.tick();
      this.updateHeader();
    }, 1000);
  }

  endGame() {
    clearInterval(this._interval);
    this.onEnd(this.model);
  }

  updateHeader() {
    const header = new HeaderView(this.model.state);
    this.root.replaceChild(header.element, this.header.element);
    this.header = header;
  }

  updateContent(view) {
    this.root.replaceChild(view.element, this.content.element);
    this.content = view;
  }

  nextQuestion() {
    this.updateHeader();

    const question = this.question;
    question.onAnswerClick = this.checkAnswer.bind(this);
    this.updateContent(question);
  }

  checkAnswer(answers) {
    let curr = this.model.currQuestion.answers;
    let err = 0;
    let answer = {
      isCorrect: true,
      time: this.model.time
    };

    for (let it of answers) {
      if (!curr[it].isCorrect) {
        err++;
      }
    }

    if (err > 0) {
      this.model.wrongAnswer();
      answer.isCorrect = false;
    }

    this.model.addAnswer(answer);

    if (this.model.status === Result.NEXT_LEVEL) {
      this.model.nextQuestion();
      this.nextQuestion();
    } else {
      this.endGame();
    }

  }

  onEnd() {

  }
}

/**
 * Created by Denis on 11.04.2018.
 */

class ResultView extends AbstractView {
  get template() {
    return `
    <section class="logo" title="Угадай мелодию"><h1>Угадай мелодию</h1></section>

    <h2 class="title">${this.data.title}</h2>
    <div class="main-stat">${this.data.stat}</div>
    <span role="button" tabindex="0" class="main-replay">${this.data.replay}</span>
`;
  }

  bind(node) {
    node.querySelector(`.main-replay`).addEventListener(`click`, () => {
      this.onRestart();
    });
  }

  onRestart() {

  }
}

/**
 * Created by Denis on 28.04.2018.
 */

const resultsTemplates = {
  timeout: {
    title: `Увы и ах!`,
    replay: `Попробовать ещё раз`
  },
  fail: {
    title: `Какая жалость!`,
    replay: `Попробовать ещё раз`
  },
  win: {
    title: `Вы настоящий меломан!`,
    replay: `Сыграть ещё раз`
  }
};

class ResultScreen {
  constructor(model) {
    this.model = model;
    this._result = ``;
    this.content = new ResultView(this.result);
  }

  get element() {
    return this.content.element;
  }

  showResult() {
    const view = new ResultView(this._result);
    view.onRestart = this.restartGame.bind(this);

    this.content = view;
  }

  restartGame() {
    this.onRestart();
  }

  countPoints() {
    let points = 0;
    let answers = this.model.answers;

    let lastAnswerTime = 300;
    for (let currentAnswer of answers) {
      if (currentAnswer.isCorrect) {
        points += COUNT_RULES.isCorrect;

        if ((lastAnswerTime - currentAnswer.time) < COUNT_RULES.fastTime) {
          points += COUNT_RULES.isFast;
        }
      } else {
        points -= COUNT_RULES.isFail;
      }
      lastAnswerTime = currentAnswer.time;
    }

    this.model.points = points;
  }

  getFailResult() {
    let result = ``;

    if (this.model.status === Result.TIME) {
      result = resultsTemplates.timeout;
      result[`stat`] = `Время вышло!<br>Вы не успели отгадать все мелодии`;
    }

    if (this.model.status === Result.MISTAKES) {
      result = resultsTemplates.fail;
      result[`stat`] = `У вас закончились все попытки.<br>Ничего, повезёт в следующий раз!`;
    }

    this._result = result;
  }

  getWinResult(statistic) {
    let result = resultsTemplates.win;
    const place = statistic.indexOf(this.model.points) + 1;
    const placesCount = statistic.length;
    const percent = Math.round((placesCount - place) / placesCount * 100);
    result.stat = `Вы заняли ${place}-ое место из ${placesCount} ${plural(placesCount, [`игрока`, `игроков`, `игроков`])}.<br> Это лучше, чем у ${percent}% игроков`;

    this._result = result;
  }

  onRestart() {

  }
}

/**
 * Created by Denis on 28.04.2018.
 */

const APP_ID = `7956`;

const QUESTIONS_URL = `https://es.dump.academy/guess-melody/questions`;
const STATS_URL = `https://es.dump.academy/guess-melody/stats/${APP_ID}`;

const checkStatus = (response) => {
  if (response.status >= 200 && response.status < 300) {
    return response;
  } else {
    throw new Error(`${response.status}: ${response.statusText}`);
  }
};

class Loader {
  static loadQuestions() {
    return window.fetch(QUESTIONS_URL)
        .then(checkStatus)
        .then((response) => response.json());
  }

  static getStats() {
    return window.fetch(STATS_URL).then(checkStatus).then((response) => response.json());
  }

  static saveResults(points) {
    const requestSettings = {
      body: JSON.stringify({
        points
      }),
      headers: {
        'Content-Type': `application/json`
      },
      method: `POST`
    };
    return fetch(STATS_URL, requestSettings).then(checkStatus);
  }

}

/**
 * Created by Denis on 26.04.2018.
 */

const QuestionType = {
  GENRE: `genre`,
  ARTIST: `artist`
};

const adaptServerData = (data) => {
  for (const question of data) {
    switch (question.type) {
      case QuestionType.ARTIST:
        question.audio = question.src;
        question.answers = adaptArtistAnswers(question.answers);
        break;
      case QuestionType.GENRE:
        question.text = question.question;
        question.answers = adaptGenreAnswers(question.answers, question.genre);
        break;
    }
  }

  return data;
};

const adaptArtistAnswers = (answers) =>
  answers.map((answer) => ({
    name: answer.title,
    pic: answer.image.url,
    isCorrect: answer.isCorrect
  }));

const adaptGenreAnswers = (answers, genre) =>
  answers.map((answer) => ({
    audio: answer.src,
    isCorrect: answer.genre === genre
  }));

const getAudioList = (data) => {
  let audios = new Set();
  for (let question of data) {
    if (question.type === `genre`) {
      for (let answer of question.answers) {
        audios.add(answer.audio);
      }
    } else {
      audios.add(question.audio);
    }
  }

  return audios;
};

/**
 * Created by Denis on 25.04.2018.
 */

const mainView = document.querySelector(`section.main`);
const changeView = (element, type = ``, isLevel = false) => {

  mainView.classList = `main`;

  if (isLevel) {
    mainView.classList.add(`main--level`);
  }

  mainView.classList.add(`main--${type}`);
  mainView.innerHTML = ``;
  mainView.appendChild(element);
};

const showLoadingScreen = (title, text = ``) => {
  const data = {
    title,
    text
  };

  const loading = new LoadingView(data);
  changeView(loading.element, `result`);
};

const loadingAudio = (data) => {
  return new Promise((onLoaded) => {
    const audios = getAudioList(data);
    let currentLoadedAudio = 0;

    for (let audio of audios) {
      let sound = new Audio(audio);

      sound.addEventListener(`canplaythrough`, () => {
        currentLoadedAudio++;
        const text = `${plural(currentLoadedAudio, [`Загружена`, `Загружено`, `Загружено`])} ${currentLoadedAudio}
                    ${plural(currentLoadedAudio, [`мелодия`, `мелодии`, `мелодий`])} из ${audios.size}`;

        showLoadingScreen(`Загружаем музыку!`, text);

        if (currentLoadedAudio === audios.size) {
          onLoaded(data);
        }
      });
    }

  });
};

class Application {

  static start() {
    showLoadingScreen(`Загружаем вопросы!`);

    Loader.loadQuestions()
        .then((data)=>adaptServerData(data))
        .then((data) => loadingAudio(data))
        .then((data)=>Application.showWelcome(data));
  }

  static showWelcome(data) {
    const welcome = new WelcomeView(defaultSettings);

    welcome.onStart = () => {
      this.showGame(data);
    };
    changeView(welcome.element, `welcome`);
  }

  static showGame(data) {
    const gameScreen = new GameScreen(new GameModel(data));
    gameScreen.onEnd = (stats) => {
      this.showStats(stats);
    };
    changeView(gameScreen.element, ``, true);
    gameScreen.init();
  }

  static showStats(model) {
    const results = new ResultScreen(model);

    if (model.status === Result.WIN) {
      showLoadingScreen(`Загружаем статистику!`);
      results.countPoints();

      Loader.saveResults(model.points)
          .then(Loader.getStats)
          .then((stats) => stats.map((result) => (result.points)))
          .then((stats) => (stats.sort((left, right) => right - left)))
          .then((stats) => (results.getWinResult(stats)))
          .then(() => (results.showResult()))
          .then(()=> (changeView(results.element, `result`)));
    } else {
      results.getFailResult();
      results.showResult();
      changeView(results.element, `result`);
    }

    results.onRestart = () => {
      this.start();
    };
  }

}

/**
 * Created by Denis on 27.03.2018.
 */
Application.start();

}());

//# sourceMappingURL=main.js.map
