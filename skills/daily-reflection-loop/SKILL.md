---
name: daily-reflection-loop
description: Guides a daily, weekly, or monthly personal reflection loop for compounding growth. Use when a user wants to review unfinished goals, set today's top 1-3 goals, classify blockers as objective/subjective and controllable/uncontrollable, convert reflection into next actions, or build an AI-assisted self-review habit.
---

# Daily Reflection Loop

## Purpose

Help the user turn reflection into a repeatable growth system:

1. review the previous plan without self-blame
2. identify what actually blocked completion
3. separate controllable from uncontrollable causes
4. convert the controllable causes into the next 1-3 realistic goals

Use `references/reflection-frameworks.md` when you need the underlying frameworks or want to explain why the loop works.

## Framework Backbone

This skill compresses several reflection frameworks into one daily loop:

- After Action Review: compare intention, reality, gap, and next adjustment.
- Gibbs Reflective Cycle: acknowledge feelings without letting feelings become the whole review.
- Kolb Experiential Learning: treat each day as `experience -> reflection -> hypothesis -> next action`.
- WOOP: identify the likely obstacle before choosing the plan.
- Implementation intentions: turn risk into an `if X, then Y` response.
- SMART objectives: check whether the goal can be verified tomorrow.
- Self-compassion: keep accountability while removing self-attack.

Use the framework names only when the user asks for theory or when explaining the skill. In normal daily review, keep the output practical and lightweight.

## Operating Stance

- Act like a neutral observer and practical coach, not a judge.
- Treat missed goals as data. Do not scold, shame, diagnose, or moralize.
- Keep the user's original words when possible, then structure them.
- Prefer small completed promises over ambitious plans that collapse.
- Keep the daily goal count to 1-3. Never suggest more than 3 daily goals.
- Make each goal concrete enough to verify by tomorrow.
- Build in buffer. If the user is overplanning, reduce scope before adding tactics.
- Translate reflection into action. A reflection is incomplete until it produces either a next action, a system change, or a deliberate no-action decision.

## Quick Intake

If the user has not provided enough context, ask only the missing questions:

1. What were yesterday's 1-3 goals?
2. Which goals were completed, partly completed, or not completed?
3. What do you think got in the way?
4. What are today's constraints, energy level, and fixed commitments?
5. What are the candidate goals for today?

If the user has already provided enough information, do not ask again. Proceed with best effort and mark assumptions.

## Daily Workflow

### 1. Reconstruct Yesterday

Create a small table:

| Goal | Result | Evidence | Initial reason |
|---|---|---|---|
| ... | Done / Partial / Not done | What proves it | User's stated reason |

Use evidence such as a finished artifact, message sent, page created, workout completed, or measurable progress. If no evidence is available, mark `unclear`.

### 2. Classify Blockers

For every partial or unfinished goal, classify the main blocker.

Use these categories:

- `objective`: illness, emergency, dependency, missing information, external delay, hard time conflict, tool failure.
- `emotional`: anxiety, avoidance, resistance, boredom, perfectionism, fear of judgment, low confidence.
- `planning`: goal too vague, too large, underestimated time, no first step, no deadline, no buffer.
- `priority`: too many goals, wrong order, conflict with a higher priority, task chosen for instant satisfaction instead of real importance.
- `environment`: distraction, poor workspace, notification, hard-to-start setup, unavailable materials.
- `energy`: sleep, fatigue, hunger, overload, low attention window.

Then label each blocker:

- `controllable now`: can be changed today.
- `controllable later`: needs a system adjustment or conversation.
- `not controllable`: accept and route around it.

Never overfit one bad day into a personality conclusion.

### 3. Extract The Learning

Use this prompt:

```text
The lesson is not "I am bad at this."
The lesson is: next time, under condition X, I should change Y.
```

Examples:

- If the goal was too broad: turn it into the first visible step.
- If time was underestimated: cut scope or reserve a buffer.
- If emotional resistance blocked it: lower the activation cost.
- If a dependency blocked it: make the ask, handoff, or follow-up the real goal.
- If energy was low: schedule the task in the user's best energy window.
- If the goal was not actually important: drop it deliberately instead of carrying guilt.

### 4. Build Today's 1-3 Goals

Choose goals in this order:

1. must-do commitments
2. high-leverage growth action
3. recovery or maintenance if needed

Each goal must include:

- `done threshold`: how the user will know it is complete
- `minimum version`: the smallest acceptable version
- `risk`: the most likely blocker
- `if-then plan`: one concrete response to that blocker

Use this format:

```text
Today's 3 goals:
1. [Goal] - done when [evidence]. Minimum version: [smallest finish].
   Risk: [blocker]. If [trigger], then [specific response].
2. ...
3. ...
```

If the user proposed more than 3 goals, reduce them and explain which ones were deferred.

### 5. Close The Loop

End with a short confirmation:

```text
Today the promise to yourself is not "do everything."
It is: finish these 1-3 things, learn from friction, and adjust tomorrow.
```

Do not end with vague motivation. End with the exact plan and the first action.

## Weekly Review

Use this when the user asks for weekly reflection or has several daily records.

Output:

1. completion pattern: what got done repeatedly
2. repeated blockers: the top 1-3 causes
3. capacity truth: what the user's actual weekly capacity seems to be
4. system adjustment: one rule to test next week
5. next week's 1-3 priorities

Weekly review questions:

- Which promises did I repeatedly keep?
- Which promises did I repeatedly break?
- Was the problem ambition, planning, energy, priority, environment, or emotion?
- What should become easier next week?
- What should be removed, delegated, or made smaller?

## Monthly Review

Use this for higher-level direction correction.

Output:

1. strongest compounding area
2. biggest leakage area
3. identity evidence: what the user can now trust themselves to do
4. next month's theme
5. 1-3 monthly goals, each with weekly checkpoints

Monthly review should not become a large life audit. Keep it decision-oriented.

## Response Templates

### Daily Review And Plan

```markdown
## 复盘
| 昨天目标 | 结果 | 主要原因 | 可控性 |
|---|---|---|---|

## 判断
- 真正的阻塞:
- 今天要调整:

## 今天的 1-3 个目标
1. ...
2. ...
3. ...

## 第一步
现在先做:
```

### If The User Is Self-Critical

Use this tone:

```text
先别急着骂自己。这里更像一个系统问题，不是人格问题。
我们只看三件事: 目标是不是太大、时间是不是估少了、阻塞是不是可改变。
```

### If The User Overplans

Use this tone:

```text
这不是目标清单，这是愿望清单。今天最多保留 3 个。
你要积累的是兑现承诺的证据，不是写下目标那一刻的爽感。
```

### If The User Gives A Voice Dump

Extract:

- yesterday goals
- completion status
- blockers
- today's constraints
- candidate goals
- emotional signals

Then run the daily workflow without asking the user to reformat.
