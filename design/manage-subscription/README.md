# Manage subscription and the Settings top bar (1.0.2): review captures

Captured from the development build at 2x (`node <scratch>/review-shots.mjs`; "simulated in DEV build" only appears in that build).

| File | What it shows |
|---|---|
| `screenshots/plan-pro-en-light.png` | Settings › Plan for a Pro user, light theme: **Manage subscription** under the title, with what it opens. The plans and "Already paid? Restore purchase" are for Free users only. |
| `screenshots/plan-pro-fr-dark.png` | The same in French, dark theme: **Gérer l’abonnement**. |
| `screenshots/topbar-fr-1100-before.png` | The French top bar at 1100 px before the fix, Free plan, on the Plan view: the fifth tab (Abonnement) is clipped out of sight. |
| `screenshots/topbar-fr-1100-after.png` | The same with `fitTopbar()`: the tab icons and the plan chip step aside, and all five tabs show. |
| `screenshots/topbar-fr-900-before.png` | At 900 px before: Statistiques is clipped and Abonnement is gone. |
| `screenshots/topbar-fr-900-after.png` | At 900 px after: the bar also tightens its padding and drops the PRO tags, and all five tabs show. |

Measured before the fix (Free plan, tab strip overflow): French and Spanish clipped tabs below 1200 px (up to 293 px at 961 px), German below 1100 px, English at 961–1000 px. After: no clipping from 1280 to 761 px in any language, Free or Pro (`focusfence/tests/topbar.spec.mjs`).
