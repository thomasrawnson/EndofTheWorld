import { useState } from "react";

type ShareResultProps = {
  won: boolean;
  roundsSurvived: number;
  residentsAlive: number;
  totalResidents: number;
  bingoLines: number;
  integrity: number;
};

function buildShareText(p: ShareResultProps) {
  const result = p.won
    ? "I survived the end of the world."
    : "The apocalypse got me.";

  return `${result}

🌍 END OF THE WORLD

Rounds survived: ${p.roundsSurvived}
Residents alive: ${p.residentsAlive}/${p.totalResidents}
Bingo lines: ${p.bingoLines}
Shelter integrity: ${Math.round(p.integrity)}%

Can you do better?`;
}

export default function ShareResult(props: ShareResultProps) {
  const [shareStatus, setShareStatus] = useState("");

  const title = props.won ? "Shelter survived" : "Shelter lost";
  const strapline = props.won
    ? "Against all available evidence, civilisation continues."
    : "The paperwork outlived the residents.";

  async function handleShareResult() {
    const text = buildShareText(props);
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}${window.location.pathname}`
        : "";

    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: "End of the World", text, url });
        setShareStatus("Shared successfully.");
        return;
      }

      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url ? `${text}\n${url}` : text);
        setShareStatus("Result copied. Send it to someone brave.");
        return;
      }

      setShareStatus("Copy the page URL to share your result.");
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      setShareStatus("Sharing failed — copy the page URL instead.");
    }
  }

  return (
    <section className="share-result" aria-labelledby="share-result-title">
      <div className="share-result__stamp" aria-hidden="true">END OF RUN</div>

      <div className="share-result__heading">
        <p className="share-result__eyebrow">Final shelter report</p>
        <h3 id="share-result-title">{title}</h3>
        <p className="share-result__strapline">{strapline}</p>
      </div>

      <dl className="share-result__stats">
        <div className="share-result__stat">
          <dt>Rounds</dt>
          <dd>{props.roundsSurvived}</dd>
        </div>
        <div className="share-result__stat">
          <dt>Residents</dt>
          <dd>{props.residentsAlive}/{props.totalResidents}</dd>
        </div>
        <div className="share-result__stat">
          <dt>Bingo lines</dt>
          <dd>{props.bingoLines}</dd>
        </div>
        <div className="share-result__stat">
          <dt>Integrity</dt>
          <dd>{Math.round(props.integrity)}%</dd>
        </div>
      </dl>

      <div className="share-result__challenge">
        <strong>Think you did well?</strong>
        <span>Send the result to a friend and make them prove it.</span>
      </div>

      <button className="share-result__primary" type="button" onClick={handleShareResult}>
        Share my result
      </button>

      <p className="share-result__hint">
        Opens your phone's share sheet where supported. Otherwise the result is copied.
      </p>

      {shareStatus && (
        <p className="share-status" role="status" aria-live="polite">
          {shareStatus}
        </p>
      )}
    </section>
  );
}
