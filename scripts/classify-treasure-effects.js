/**
 * One-time (or re-run-as-needed) AI classification pass that tags every
 * treasure's `effect` text with a structured effectTags[] used by the
 * "similar effect" substitution feature (lib/effectTags.ts).
 *
 * This is OPTIONAL — the app already works without it via a zero-setup
 * keyword-based tagger (lib/effectTags.ts) that runs at request time when
 * effectTags is absent. Run this script when you want more accurate
 * substitution suggestions than the regex fallback can produce.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-ant-... npm run tag:treasures
 *
 * Keep the TAG enum below in sync with `EffectTag` in lib/effectTags.ts —
 * this is a plain Node script so it can't import the TS type directly.
 */
const fs = require('fs');
const path = require('path');
const Anthropic = require('@anthropic-ai/sdk');

const CATALOG_PATH = path.join(__dirname, '../data/classic-catalog.json');
const BATCH_SIZE = 25;

const TAGS = [
  'coin_bonus', 'score_bonus', 'jelly_bonus', 'xp_bonus',
  'speed_boost', 'speed_penalty', 'energy_hp', 'shield_defense',
  'magnet', 'revive', 'obstacle_clear', 'duration_extend', 'other',
];

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY is not set. Export it before running this script.');
    process.exit(1);
  }

  const client = new Anthropic();
  const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf-8'));
  const treasures = catalog.treasures;

  const schema = {
    type: 'object',
    properties: {
      classifications: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            effectTags: { type: 'array', items: { type: 'string', enum: TAGS } },
          },
          required: ['id', 'effectTags'],
          additionalProperties: false,
        },
      },
    },
    required: ['classifications'],
    additionalProperties: false,
  };

  let tagged = 0;
  for (let i = 0; i < treasures.length; i += BATCH_SIZE) {
    const batch = treasures.slice(i, i + BATCH_SIZE);
    const listText = batch
      .map(t => `- id: ${t.id}\n  effect: ${t.effect}\n  plus9Effect: ${t.enhancementStats?.plus9Effect || ''}`)
      .join('\n');

    console.log(`Classifying treasures ${i + 1}-${Math.min(i + BATCH_SIZE, treasures.length)} of ${treasures.length}...`);

    const response = await client.messages.parse({
      model: 'claude-opus-5',
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content:
          'Classify each Cookie Run treasure below by its game-mechanic effect, using ONLY these tags: ' +
          `${TAGS.join(', ')}. A treasure can have more than one tag if its effect text clearly implies it ` +
          '(e.g. a treasure that boosts both coins and score gets both coin_bonus and score_bonus). Use ' +
          '"other" only when none of the specific tags apply — do not leave it empty.\n\n' +
          `${listText}`,
      }],
      output_config: { format: { type: 'json_schema', schema } },
    });

    if (response.stop_reason === 'refusal' || !response.parsed_output) {
      console.warn('  Batch declined or unparsable, skipping.');
      continue;
    }

    const byId = new Map(response.parsed_output.classifications.map(c => [c.id, c.effectTags]));
    for (const t of batch) {
      const tags = byId.get(t.id);
      if (tags && tags.length > 0) {
        t.effectTags = tags;
        tagged++;
      }
    }
  }

  const backupPath = CATALOG_PATH.replace(
    '.json',
    `.backup.${new Date().toISOString().replace(/[:.]/g, '')}.json`
  );
  fs.copyFileSync(CATALOG_PATH, backupPath);
  console.log(`Backed up existing catalog to ${path.basename(backupPath)}`);

  catalog.lastUpdated = new Date().toISOString();
  fs.writeFileSync(CATALOG_PATH, JSON.stringify(catalog, null, 2), 'utf-8');
  console.log(`Done — tagged ${tagged}/${treasures.length} treasures with effectTags.`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
