import { useState } from "react";
import { Compass, ArrowRight } from "lucide-react";
import { Modal } from "./UI";
import { guideSteps } from "../data/onboarding";
export const GUIDE_KEY = "sudubox.guide.seen.v1";
export const showGuide = () =>
  window.dispatchEvent(new Event("sudubox:show-guide"));
export function Onboarding({ close }: { close: () => void }) {
  const [step, setStep] = useState(0);
  const current = guideSteps[step];
  return (
    <Modal title="新手向导" close={close}>
      <div
        className="guide-progress"
        aria-label={`第 ${step + 1} 步，共 ${guideSteps.length} 步`}
      >
        {guideSteps.map((item, i) => (
          <span key={item.title} className={i <= step ? "done" : ""} />
        ))}
      </div>
      <div className="guide-heading">
        <Compass size={26} />
        <h3>{current.title}</h3>
      </div>
      <p>{current.description}</p>
      <div className="guide-tools">
        {current.tools.map((tool) => (
          <a key={tool.route} href={`#/${tool.route}`} onClick={close}>
            <strong>
              {tool.name}
              <ArrowRight size={16} />
            </strong>
            <span>{tool.text}</span>
          </a>
        ))}
      </div>
      <div className="guide-controls">
        <button onClick={close}>稍后再看</button>
        <div className="inline">
          {step > 0 && (
            <button onClick={() => setStep((s) => s - 1)}>上一步</button>
          )}
          <button
            className="primary"
            onClick={() =>
              step === guideSteps.length - 1 ? close() : setStep((s) => s + 1)
            }
          >
            {step === guideSteps.length - 1 ? "开始使用" : "下一步"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
