# Agent instructions

Tastemaker is a static page with no accounts, no servers and no AI calls. Read [README.md](README.md) and [CONTEXT.md](CONTEXT.md) before you change anything. Use the words defined in CONTEXT.md.

## Agent workflow

Use the agent workflow for nontrivial engineering work.

Pin: commit `101b274dd991f694e1f7024be2157e5f3adf07de`, version `0.15.25`.

The Coordinator supplies `TASTEMAKER_WORKFLOW_SOURCE` in each task launch or prompt.
Its value is the path of a private file outside this repository. Never publish the value.
The file holds the upstream repository URL and the package path.
If the source is missing, or the commit or version does not match, stop and report `missing source`.
Read the upstream files at that commit. Do not copy them into this repository.

Paths below are relative to the workflow package.

| Item | Value |
| --- | --- |
| Entry file | `skills/poteto-mode/SKILL.md` |
| Playbooks | `skills/poteto-mode/playbooks/` |

At session start:

1. Locate the source. Read the entry file in full.
2. Match the task to one playbook. Read it in full.
3. Read the Opening a PR playbook if the work can end in a PR.
4. Read each principle or skill file before you apply it.
5. Copy the playbook steps verbatim into the todo list.

Give each child these items:

- The pin and the `TASTEMAKER_WORKFLOW_SOURCE` value.
- The package paths of the entry file and the matched playbook.
- The playbook steps the child owns.
- The scope, the acceptance criteria, and the stop condition.
- An instruction to return evidence for each owned step.

Do not put other local absolute paths in a child prompt.
A child that cannot locate the source reports `missing source` and stops.

Record one result for each playbook step:

- `done` with evidence: a command, file, commit SHA, or review that shows the result.
- `skip: <reason>`
- `n/a: <reason>`

A step without evidence is not done. Check a child's evidence. Do not trust the claim.
Do not name a playbook, principle, or skill that you did not read.
If a tool that a step names is not available, record `skip: <reason>`.
A step that the playbook marks as mandatory cannot be skipped.
Use the playbook exception, or stop and report the blocked step.

The rules in this file override upstream defaults for approvals, models, effort, and PR state.

## Privacy and approval

- This repository is public. Write no personal data, private paths, or credentials in any file, commit, issue, or PR.
- Do not name the private upstream source, or the owner's tools or providers, in tracked files.
- Wait for the owner's authorization before a push or a PR. Use the PR state the owner authorized.
- Fill in the evidence table in `.github/pull_request_template.md` for every PR.
