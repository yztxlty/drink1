# Forest Summary Metrics Design

## Goal

Make the three summary metrics on the explore page render from live data instead of static copy, and add an in-page explanation of how each value is calculated.

## Scope

- Update the explore summary card in `pages/explore`
- Reuse existing forest view-model data where it already exists
- Keep the current visual hierarchy and only add a small, non-intrusive rules entry point

## Decisions

### Dynamic values

- `森林氧气浓度` shows `oxygenValue` from the forest view model
- `融合进度` shows `collectionLabel` from the forest view model
- `治愈水滴` shows the live `dropCount`, derived from today's intake using the existing `getDropCount()` rule

### Rules hint

- Add a lightweight `计算规则` trigger in the summary section
- Tapping it opens a native modal so the page stays visually clean
- The hint explains the source of all three metrics in plain language

## Copy direction

- 氧气浓度：根据今日补水达成情况动态计算
- 融合进度：按当前森林融合进度实时更新
- 治愈水滴：每记录 50ml 补水生成 1 颗初始水滴

## Testing

- Add a regression check to ensure the summary binds to dynamic fields instead of hard-coded values
- Verify the rules trigger and rules copy exist on the explore page
- Run the focused explore checks and the smoke check
