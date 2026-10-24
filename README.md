# Anvil Order

Find the cheapest order to combine enchanted books in a Minecraft (Java Edition) anvil.
Pick an item, pick enchantments, and get step-by-step anvil instructions with the level
and XP cost of each step. Share any setup with the **Copy link** button.

Built with Vite, React, Tailwind CSS v4 and shadcn/ui.

## Development

```bash
npm install
npm run dev
```

`npm run build` type-checks and builds to `dist/`. `npm run lint` runs oxlint.

## Enchantment data

`src/data/minecraft.json` is generated from Minecraft's own data pack (enchantment
definitions, item tags and the English language file). It's fetched from
[misode/mcmeta](https://github.com/misode/mcmeta), which mirrors the files extracted from
every official release.

```bash
npm run sync-data          # latest stable release
npm run sync-data -- 26.3  # a specific version
```

The script resolves each enchantment's supported items and exclusive sets, collapses
item variants into one pick (every sword is a sword), and fails if a group would mix
items that accept different enchantments, so a new release can't silently produce
wrong data.

The **Sync Minecraft data** GitHub Action runs this every Monday and opens a PR when a
new release changes anything. You can also run it by hand from the Actions tab.

## How the solver works

Each anvil step costs the sacrifice's enchantment value (level × book multiplier)
plus both sides' prior work penalty (`2^uses − 1`). Any step over 39 levels is
"Too Expensive!". A merge plan is a binary tree over the books, with the item always as
the leftmost target. Step costs only depend on which books are on each side and how
worn each side is, so `src/lib/solver.ts` runs an exact dynamic program over
(subset of inputs, work count) instead of trying every tree. It optimizes either total
levels or total XP and runs in a Web Worker.
