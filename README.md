# Bingo for the End of the World

A compact, eight-round survival bingo game about cheerful bureaucracy at the end of civilisation.

## Run it

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. Production build: `npm run build`. Tests: `npm test`.

## How to play

Each round, inspect two fully disclosed disasters and choose one. Its penalty happens, its three numbers are marked, and every newly completed row or column pays 3 supplies. Diagonals do not count. Use residents and emergency repairs, then pay upkeep. Base upkeep is 2 supplies in rounds 1–4 and rises to 3 in rounds 5–8; resident modifiers are added on top. Each missing upkeep supply costs 1 integrity. Survive round eight with at least 1 integrity to win.

Recruitment happens after rounds 2, 4, and 6. New residents start next round. The shelter holds three residents; when full, choose a replacement.

## Controls

- Mouse/touch: select cards, abilities, and highlighted bingo squares.
- Keyboard: `Tab` to navigate and `Enter`/`Space` to activate.
- `Escape`: cancel square targeting or close Help.
- Sound can be toggled in the header. Reduced-motion system preferences are respected.

Runs use seeded randomness. **Retry Same Run** recreates the original card and choices; **New Run** generates a new seed.

## BE02 — Difficult Choices and Shelter Clarity

Playtest feedback found that disaster choices were often obvious, the successful run needed slightly more late pressure, and recruitment, integrity, and upkeep needed clearer presentation.

BE02 adds deterministic bounded offer selection that favours a safer/lower-progress choice against a costlier/higher-progress choice without exposing an internal score. Disaster previews now show marks, lines, immediate supplies, and resulting resources using the same resolver as the committed action. The resource bar prominently shows supplies, integrity, and tonight’s calculated upkeep. Resident and recruitment cards now share exact rules, costs, frequency, state, eligibility, next-round availability, and upkeep previews. Replacement compares the leaving and arriving resident and shows the resulting upkeep change.

The trade-off selector makes at most 12 attempts and safely uses its first valid pair if none qualifies. It preserves three distinct called numbers and prioritises currently unmarked numbers.
