import React, { useEffect, useMemo, useRef, useState } from "react";
import ShareResult from "./components/ShareResult";
import "./styles/share-result.css";
import { createRoot } from "react-dom/client";
import {
  Game,
  LINES,
  RESIDENTS,
  ResidentId,
  chooseDisaster,
  disasterPreview,
  newGame,
  payUpkeep,
  recruit,
  recruitOptions,
  replacementUpkeep,
  residentAvailability,
  residentEligibleNumbers,
  upkeepBill,
  useResident,
} from "./rules";
import "./style.css";
import "./be02.css";

function Icon({ type }: { type: string }) {
  return (
    <span className={"icon " + type} aria-hidden="true">
      <i />
    </span>
  );
}
function Portrait({ id }: { id: ResidentId }) {
  return (
    <div className={"portrait " + id}>
      <span className="head" />
      <span className="body" />
    </div>
  );
}
function App() {
  const seedRef = useRef(Math.floor(Math.random() * 1e9));
  const [g, setG] = useState(() => newGame(seedRef.current));
  const [hover, setHover] = useState<number[]>([]);
  const [target, setTarget] = useState<ResidentId | null>(null);
  const [help, setHelp] = useState(false);
  const [sound, setSound] = useState(true);
  const [replace, setReplace] = useState<ResidentId | null>(null);
  const [flash, setFlash] = useState("");
  const nearly = useMemo(
    () =>
      LINES.filter(
        (l, i) =>
          !g.claimed.includes(i) &&
          l.filter((p) => !g.marked.includes(g.card[p])).length === 1,
      ).flat(),
    [g],
  );
  const preview = (d: Game["offers"][number]) => disasterPreview(g, d);
  const beep = (kind: "call" | "line" | "damage") => {
    if (!sound) return;
    try {
      const C = window.AudioContext || (window as any).webkitAudioContext,
        c = new C(),
        o = c.createOscillator(),
        v = c.createGain();
      o.frequency.value = kind === "line" ? 620 : kind === "damage" ? 120 : 360;
      v.gain.value = 0.035;
      o.connect(v);
      v.connect(c.destination);
      o.start();
      o.stop(c.currentTime + 0.09);
    } catch {}
  };
  const update = (next: Game, msg = "") => {
    if (next === g) return;
    setG(next);
    if (next.claimed.length > g.claimed.length) {
      beep("line");
      setFlash(`+${(next.claimed.length - g.claimed.length) * 3} SUPPLIES`);
    } else if (next.integrity < g.integrity) beep("damage");
    else beep("call");
    if (msg) setFlash(msg);
    setTimeout(() => setFlash(""), 1200);
  };
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setTarget(null);
        setHelp(false);
      }
    };
    addEventListener("keydown", k);
    return () => removeEventListener("keydown", k);
  }, []);
  const targetNums = target ? residentEligibleNumbers(g, target) : [];
  const clickSquare = (n: number) => {
    if (target && targetNums.includes(n)) {
      update(
        useResident(g, target, n),
        target === "raccoon" ? "PAW STAMP!" : "",
      );
      setTarget(null);
    }
  };
  const bill = upkeepBill(g.round, g.residents),
    short = Math.max(0, bill.total - g.supplies),
    afterI = Math.max(0, g.integrity - short),
    afterS = Math.max(0, g.supplies - bill.total);
  const reset = (same: boolean) => {
    if (!same) seedRef.current = Math.floor(Math.random() * 1e9);
    setG(newGame(seedRef.current));
    setTarget(null);
    setReplace(null);
  };
  return (
    <div className="app">
      <header>
        <div className="hatch">
          <b>!</b>
        </div>
        <div>
          <p className="eyebrow">CIVILISATION CONTINUITY FORM B-25</p>
          <h1>Bingo for the End of the World</h1>
        </div>
        <div className="stats">
          <span>
            ROUND <b>{g.round}/8</b>
          </span>
          <span className="supply resource">
            <i>▣</i> SUPPLIES <b>{g.supplies}</b>
          </span>
          <span className="integrity resource">
            <i>▰</i> SHELTER INTEGRITY <b>{g.integrity}/5</b>
            <small aria-label={`${g.integrity} of 5 integrity`}>
              {[1, 2, 3, 4, 5].map((x) => (
                <i className={x <= g.integrity ? "full" : ""} key={x} />
              ))}
            </small>
          </span>
          <span
            className={"tonight resource " + (short ? "danger" : "")}
            title={`Base ${bill.base}${bill.influencer ? " + Influencer 1" : ""} = ${bill.total} supplies`}
          >
            <i>▣</i> TONIGHT'S UPKEEP <b>{bill.total}</b>
            <small>
              Base {bill.base}
              {bill.influencer ? " + Influencer 1" : ""} = {bill.total}
            </small>
          </span>
          <button
            onClick={() => setSound(!sound)}
            aria-label={`Sound ${sound ? "on" : "off"}`}
          >
            SOUND {sound ? "ON" : "OFF"}
          </button>
          <button onClick={() => setHelp(true)}>HELP</button>
        </div>
      </header>
      <div className="schedule">
        UPKEEP NOTICE: Base upkeep rises to 3 from Round 5.
      </div>
      <main>
        <section className="panel disasters">
          <div className="panel-title">
            <span>01</span> INCOMING INCIDENTS
          </div>
          {g.phase === "choice" ? (
            <>
              {g.offers.map((d, i) => {
                const p = preview(d);
                return (
                  <button
                    className={"disaster " + (p.lethal ? "lethal" : "")}
                    key={d.id}
                    onMouseEnter={() => setHover(p.newMarks)}
                    onMouseLeave={() => setHover([])}
                    onFocus={() => setHover(p.newMarks)}
                    onBlur={() => setHover([])}
                    onClick={() => update(chooseDisaster(g, i))}
                  >
                    <div className="disaster-head">
                      <Icon type={d.icon} />
                      <div>
                        <b>{d.title}</b>
                        <small>{d.flavour}</small>
                      </div>
                    </div>
                    <div className="calls">
                      {d.numbers.map((n) => (
                        <span
                          className={g.marked.includes(n) ? "old" : ""}
                          key={n}
                        >
                          {n}
                          {g.marked.includes(n) && <i> marked</i>}
                        </span>
                      ))}
                    </div>
                    <div className="effect">
                      {d.integrity < 0 && `${-d.integrity} integrity damage · `}
                      {d.supply < 0 && `${-d.supply} supply cost · `}
                      {d.supply > 0 && `+${d.supply} salvage · `}
                      {!d.integrity && !d.supply && "No penalty · "}
                      <strong>
                        {p.newMarks.length} new marks · {p.lines} lines · +
                        {p.immediateReward} supplies now
                      </strong>
                      <small>
                        After incident: {p.suppliesAfter} supplies ·{" "}
                        {p.integrityAfter}/5 integrity
                      </small>
                      {p.lethal && <em> LETHAL — SHELTER LOST</em>}
                    </div>
                  </button>
                );
              })}
            </>
          ) : (
            g.chosen && (
              <div className="chosen">
                <span className="stamp">SELECTED</span>
                <Icon type={g.chosen.icon} />
                <h2>{g.chosen.title}</h2>
                <p>{g.chosen.flavour}</p>
                <div className="calls">
                  {g.chosen.numbers.map((n) => (
                    <span key={n}>{n}</span>
                  ))}
                </div>
                <small>Rejected: {g.rejected?.title}</small>
              </div>
            )
          )}
          <div className="log">
            <h3>RECENT INCIDENT LOG</h3>
            {g.log.map((x, i) => (
              <p key={i}>{x}</p>
            ))}
          </div>
        </section>
        <section className="board-wrap">
          <div className="board-head">
            <span>OFFICIAL SHELTER CARD</span>
            <b>ROWS + COLUMNS ONLY</b>
          </div>
          <div className="board">
            {g.card.map((n, i) => {
              const marked = g.marked.includes(n),
                claimed = g.claimed.some((l) => LINES[l].includes(i));
              return (
                <button
                  key={n}
                  disabled={!targetNums.includes(n)}
                  onClick={() => clickSquare(n)}
                  className={`${marked ? "marked " : ""}${hover.includes(n) ? "preview " : ""}${nearly.includes(i) ? "nearly " : ""}${claimed ? "claimed " : ""}`}
                >
                  <span>{i === 12 ? "FREE" : n}</span>
                  {marked && <i>✓</i>}
                  {claimed && <small>CLAIMED</small>}
                </button>
              );
            })}
          </div>
          <div className="legend">
            <span>
              <i className="dot near" /> One away
            </span>
            <span>
              <i className="dot mark" /> Marked
            </span>
            <span>
              <i className="dot prev" /> Choice preview
            </span>
          </div>
          {flash && <div className="flash">{flash}</div>}
        </section>
        <aside className="panel residents">
          <div className="panel-title">
            <span>02</span> REGISTERED RESIDENTS
          </div>
          {[0, 1, 2].map((slot) => {
            const id = g.residents[slot];
            if (!id)
              return (
                <div className="resident empty" key={slot}>
                  VACANT BUNK
                </div>
              );
            const r = RESIDENTS[id],
              eligible = residentEligibleNumbers(g, id),
              availability = residentAvailability(g, id);
            return (
              <div className="resident" key={id}>
                <Portrait id={id} />
                <div>
                  <h3>{r.name}</h3>
                  <p className="resident-rule">{r.rule}</p>
                  <b>
                    {r.frequency}
                    {r.drawback ? ` · ${r.drawback}` : ""}
                  </b>
                  <small
                    className={
                      "resident-state " +
                      availability.state.toLowerCase().replaceAll(" ", "-")
                    }
                  >
                    {availability.state}
                  </small>
                  <small>{availability.reason}</small>
                  {(id === "traveller" || id === "raccoon") && (
                    <small>Eligible: {eligible.join(", ") || "none"}</small>
                  )}
                  {id !== "influencer" && (
                    <button
                      disabled={!availability.canUse}
                      onClick={() => setTarget(id)}
                    >
                      {availability.canUse
                        ? "USE ABILITY"
                        : availability.state.toUpperCase()}
                    </button>
                  )}
                  <p className="flavour">{r.quote}</p>
                </div>
              </div>
            );
          })}
          <div className="scrap">
            <b>NEIGHBOUR'S CARD SCRAP</b>
            <div>
              {g.scrap.map((n) => (
                <span className={g.marked.includes(n) ? "old" : ""} key={n}>
                  {n}
                </span>
              ))}
            </div>
            <small>Raccoon targets refresh each round.</small>
          </div>
          <div className="repairs">
            <b>EMERGENCY PATCHES</b>
            <div>
              {[0, 1, 2].map((i) => (
                <span className={i < g.repairs ? "" : "used"} key={i}>
                  ✚
                </span>
              ))}
            </div>
            <button
              disabled={
                g.phase !== "actions" ||
                g.repairs === 0 ||
                g.supplies < 2 ||
                g.integrity === 5
              }
              onClick={() => {
                update(
                  {
                    ...g,
                    supplies: g.supplies - 2,
                    integrity: g.integrity + 1,
                    repairs: g.repairs - 1,
                    log: ["Emergency patch applied.", ...g.log].slice(0, 5),
                  },
                  "PATCHED +1",
                );
              }}
            >
              SPEND 2 · REPAIR 1
            </button>
          </div>
        </aside>
      </main>
      <footer className="action-dock">
        <div className="action-dock__guidance">
          <span className="action-dock__label">CURRENT STEP</span>

          <strong className="action-dock__instruction">
            {target
              ? `Choose a square for ${RESIDENTS[target].name}`
              : g.phase === "choice"
                ? "Choose one incident to survive"
                : g.phase === "actions"
                  ? "Use abilities or repairs, then end the round"
                  : g.phase === "recruitment"
                    ? "Choose whether to recruit a new resident"
                    : "Review the shelter report"}
          </strong>

          {target && (
            <button
              className="action-dock__cancel"
              onClick={() => setTarget(null)}
            >
              CANCEL — NO COST
            </button>
          )}
        </div>

        {g.phase === "actions" && (
          <div className={"round-action " + (short ? "shortfall" : "")}>
            <div className="round-action__summary">
              <span className="round-action__eyebrow">TONIGHT'S UPKEEP</span>

              <strong>{bill.total} supplies</strong>

              <span>
                After upkeep: {afterS} supplies · {afterI}/5 integrity
              </span>

              {short > 0 && (
                <em>
                  Short by {short} — shelter loses {short} integrity
                </em>
              )}
            </div>

            <button
              className={
                "end-round-button " + (afterI === 0 ? "lethal-action" : "")
              }
              onClick={() => update(payUpkeep(g))}
            >
              <span className="end-round-button__small">
                {afterI === 0 ? "WARNING — THIS WILL END THE RUN" : "READY?"}
              </span>

              <span className="end-round-button__main">
                {afterI === 0 ? "END ROUND — SHELTER LOST" : "END ROUND →"}
              </span>
            </button>
          </div>
        )}
      </footer>
      {g.phase === "recruitment" && (
        <div className="recruit panel">
          <div className="panel-title">
            <span>03</span> VOLUNTEER INTAKE · AVAILABLE NEXT ROUND
          </div>
          {recruitOptions(g).map((id) => {
            const r = RESIDENTS[id],
              next = replacementUpkeep(g.round, g.residents, id);
            return (
              <div className="candidate" key={id}>
                <Portrait id={id} />
                <div>
                  <h3>{r.name}</h3>
                  <p className="resident-rule">{r.rule}</p>
                  <b>
                    {r.frequency}
                    {r.drawback ? ` · ${r.drawback}` : ""}
                  </b>
                  <small>
                    Available next round · Next upkeep: {next.total} supplies
                  </small>
                  <p className="flavour">{r.quote}</p>
                </div>
                <button
                  onClick={() => {
                    if (g.residents.length < 3)
                      update(recruit(g, id), "RECRUITED");
                    else setReplace(id);
                  }}
                >
                  RECRUIT FREE
                </button>
              </div>
            );
          })}
          <button className="skip" onClick={() => update(recruit(g))}>
            SKIP RECRUITMENT
          </button>
          {replace && (
            <div className="replace">
              <b>Choose a resident to replace</b>
              <div className="arrival">
                <Portrait id={replace} />
                <span>
                  ARRIVING
                  <br />
                  <strong>{RESIDENTS[replace].name}</strong>
                </span>
              </div>
              {g.residents.map((id) => {
                const old = upkeepBill(g.round + 1, g.residents).total,
                  next = replacementUpkeep(
                    g.round,
                    g.residents,
                    replace,
                    id,
                  ).total;
                return (
                  <button
                    key={id}
                    onClick={() => {
                      update(recruit(g, replace, id), "ROSTER UPDATED");
                      setReplace(null);
                    }}
                  >
                    <span>LEAVING: {RESIDENTS[id].name}</span>
                    <strong>
                      Next upkeep {old} → {next}
                      {next === old ? " (no change)" : ""}
                    </strong>
                  </button>
                );
              })}
              <button onClick={() => setReplace(null)}>
                CANCEL — KEEP ROSTER
              </button>
            </div>
          )}
        </div>
      )}
      {g.phase === "results" && (
        <div className="overlay">
          <div className="result panel">
            <span className={"big-stamp " + g.outcome}>
              {g.outcome === "win" ? "SHELTER CERTIFIED" : "SHELTER CONDEMNED"}
            </span>

            <h2>
              {g.outcome === "win"
                ? "Civilisation remains technically operational."
                : "The apocalypse has won on a technicality."}
            </h2>

            <p>
              {g.round} rounds survived · {g.claimed.length}/10 lines completed
            </p>

            <p>
              Residents: {g.residents.map((x) => RESIDENTS[x].name).join(", ")}
            </p>

            <blockquote>
              {g.outcome === "win"
                ? "Evaluation: Adequate snacks, exemplary stamping."
                : "Evaluation: Structural optimism exceeded load-bearing limits."}
            </blockquote>

            <ShareResult
              won={g.outcome === "win"}
              roundsSurvived={g.round}
              residentsAlive={g.residents.length}
              totalResidents={3}
              bingoLines={g.claimed.length}
              integrity={g.integrity * 20}
            />

            <div>
              <button onClick={() => reset(true)}>RETRY SAME RUN</button>

              <button onClick={() => reset(false)}>NEW RUN</button>
            </div>
          </div>
        </div>
      )}
      {help && (
        <div
          className="overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setHelp(false);
          }}
        >
          <div className="help panel" role="dialog" aria-modal="true">
            <button className="close" onClick={() => setHelp(false)}>
              CLOSE ×
            </button>
            <h2>Emergency Operating Manual</h2>
            <p>
              Choose one of two disasters. Its three numbers are called after
              its costs and damage apply. Then use each resident at most once,
              patch the shelter, and pay upkeep.
            </p>
            <h3>Bingo</h3>
            <p>
              Complete rows and columns for 3 supplies each.{" "}
              <b>Diagonals do not count.</b> Lines pay once; a square may count
              in both a row and column.
            </p>
            <h3>Upkeep & survival</h3>
            <p>
              Base upkeep is 2 supplies in rounds 1–4 and rises to 3 from round
              5, plus resident modifiers. Every unpaid supply damages integrity
              by 1. Survive round eight upkeep to win. Zero integrity loses
              immediately.
            </p>
            <p>
              Keyboard: Tab navigates, Enter/Space activates, Escape cancels
              targeting or closes this manual.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
