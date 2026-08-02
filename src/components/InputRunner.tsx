import { useEffect } from "react";
import { useAppContext } from "../state/AppContext";
import "./InputRunner.css";

const PLAY_INTERVAL_MS = 700;

export function InputRunner() {
  const { state, dispatch } = useAppContext();
  const { inputString, simulation, currentStepIndex, isPlaying } = state;

  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => dispatch({ type: "STEP_FORWARD" }), PLAY_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [isPlaying, dispatch]);

  const totalSteps = simulation?.steps.length ?? 0;
  const atStart = currentStepIndex === -1;
  const atEnd = !simulation || currentStepIndex >= totalSteps - 1;
  const currentStep = currentStepIndex >= 0 ? simulation?.steps[currentStepIndex] : undefined;
  const cursorPos = currentStep ? currentStep.position : 0;

  return (
    <div className="input-runner">
      <h2>Input</h2>
      <textarea
        className="input-runner__input"
        rows={2}
        value={inputString}
        onChange={(e) => dispatch({ type: "SET_INPUT", value: e.target.value })}
        placeholder="Type the string to run through the machine…"
      />

      <div className="input-runner__preview" aria-label="input with read cursor">
        {inputString.length === 0 ? (
          <span className="input-runner__empty">(empty string)</span>
        ) : (
          inputString.split("").map((ch, i) => (
            <span key={i} className={`input-runner__char${simulation && i === cursorPos ? " input-runner__char--cursor" : ""}`}>
              {ch === "\n" ? "⏎" : ch}
            </span>
          ))
        )}
        {simulation && cursorPos >= inputString.length && <span className="input-runner__char input-runner__char--cursor">∎</span>}
      </div>

      <div className="input-runner__buttons">
        <button type="button" className="primary" onClick={() => dispatch({ type: "RUN" })}>
          Run
        </button>
        <button type="button" onClick={() => dispatch({ type: "RESET_PLAYBACK" })} disabled={!simulation}>
          Reset
        </button>
      </div>

      {simulation && (
        <div className="input-runner__playback">
          <button type="button" onClick={() => dispatch({ type: "STEP_BACKWARD" })} disabled={atStart} title="Previous step">
            ⏮
          </button>
          {isPlaying ? (
            <button type="button" onClick={() => dispatch({ type: "PAUSE" })} title="Pause">
              ⏸
            </button>
          ) : (
            <button type="button" onClick={() => dispatch({ type: "PLAY" })} disabled={atEnd} title="Play">
              ▶
            </button>
          )}
          <button type="button" onClick={() => dispatch({ type: "STEP_FORWARD" })} disabled={atEnd} title="Next step">
            ⏭
          </button>
          <input
            type="range"
            className="input-runner__slider"
            min={-1}
            max={totalSteps - 1}
            value={currentStepIndex}
            onChange={(e) => dispatch({ type: "GOTO_STEP", index: Number(e.target.value) })}
          />
          <span className="input-runner__step-count">
            {currentStepIndex + 1} / {totalSteps}
          </span>
        </div>
      )}

      {simulation && simulation.stuck && (
        <p className="input-runner__warning">
          The machine got stuck: no transition matched the character at position {simulation.steps.at(-1)?.position} in state "
          {simulation.steps.at(-1)?.fromState}".
        </p>
      )}
    </div>
  );
}
