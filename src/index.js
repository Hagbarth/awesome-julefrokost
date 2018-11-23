const React = require("react");
const ReactDOM = require("react-dom");
const { Duration } = require("luxon");
const { Howl, Howler } = require("howler");
const audioUrl = require("../assets/okidoki.mp3");

function makeCounter(timeout) {
  const tickListeners = [];
  const doneListeners = [];
  let elapsed = 0;
  let interval;

  const reset = () => {
    elapsed = 0;
    clearInterval(interval);
  };

  return {
    reset,

    onTick: cb => tickListeners.push(cb),
    onDone: cb => doneListeners.push(cb),

    start: () => {
      interval = setInterval(() => {
        elapsed++;
        for (let listener of tickListeners) {
          listener({
            total: timeout,
            elapsed: elapsed,
            remaining: timeout - elapsed
          });
        }
        if (timeout - elapsed < 1) {
          for (let listener of doneListeners) {
            listener();
          }
          reset();
        }
      }, 1000);
    }
  };
}

const Counter = ({ remaining, playing }) => {
  return (
    <h1>{Duration.fromObject({ seconds: remaining }).toFormat("mm:ss")}</h1>
  );
};

// App
const tenMinutes = 10 * 60;
const okidoki = new Howl({
  src: [audioUrl]
});

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      remaining: tenMinutes,
      playing: false,
      timeout: tenMinutes
    };
    this.counter = makeCounter(tenMinutes);
    this.reset = this.reset.bind(this);
    this.start = this.start.bind(this);
    this.setTimeout = this.setTimeout.bind(this);
  }

  componentDidMount() {}

  start() {
    this.counter.start();

    const durationSec = parseInt(Math.ceil(okidoki.duration()));
    this.counter.onTick(({ total, elapsed, remaining }) => {
      this.setState({ remaining });
      if (remaining <= durationSec && !this.state.playing) {
        okidoki.play();
        this.setState({ playing: true });
      }
    });

    this.counter.onDone(() => {
      okidoki.stop();
      this.setState({ playing: false });
      this.counter.start();
    });
  }

  reset() {
    okidoki.stop();
    this.counter.reset();
    this.setState({ playing: false, remaining: this.state.timeout });
  }

  setTimeout() {
    const timeout = parseInt(this.input.value, 10) * 60;
    this.setState({ timeout, remaining: timeout });
    this.counter = makeCounter(timeout);
  }

  render() {
    return (
      <div className="app">
        <div>
          <button onClick={this.start}>START</button>
          <button onClick={this.reset}>RESET</button>
          <label>MINUTES:</label>
          <input
            type="number"
            ref={ref => {
              this.input = ref;
            }}
          />
          <button onClick={this.setTimeout}>SET MINUTES</button>
        </div>
        <Counter
          remaining={this.state.remaining}
          playing={this.state.playing}
        />
      </div>
    );
  }
}

okidoki.on("load", () =>
  ReactDOM.render(<App />, document.getElementById("react-root"))
);
