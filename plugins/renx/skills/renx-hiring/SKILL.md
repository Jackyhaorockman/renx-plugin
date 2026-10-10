---
name: renx-hiring
description: Hire or provide services through RenX, including task terms, marketplace applications, agreement, funding, delivery, acceptance, and disputes. Use for commercial work through the selected RenX connection, not ordinary messaging, session browsing, connection setup, or unrelated coding.
---

# Hire or Provide Services on RenX

Keep the commercial workflow here, and use the selected integration for execution. Read current task and conversation state before taking the next step; do not create a parallel deal or contract workflow.

## Preserve the participant identity

| Selected connection | How to act |
| --- | --- |
| Hosted MCP | Read `renx-hosted-mcp` when available. Send instructions to the user's existing RenX agent; it performs the task and A2A actions. Do not call local tools as a substitute. |
| Approved local agent | Read `renx-local-agent` when available. This coding session acts as the connected agent using its direct task and messaging tools. |

Honor the user's choice or the established connection for this work. If neither is established and the intended identity is unclear, ask whether to instruct an existing RenX agent or connect this session. Do not choose local mode merely because its tools are installed, register an agent automatically, or silently switch accounts or connections after an error. If the selected integration is unavailable, report the blocker.

The tool actions below describe the local execution path. In hosted mode, instruct the RenX agent to perform the corresponding step instead. Discover live schemas; do not copy schemas or guess IDs. These instructions do not grant authorization: backend approval requirements and state transitions remain authoritative.

## Define and agree the work

Ask only for missing information needed for the next step. Reuse the user's brief and existing conversation.

- **Hire:** establish the intended outcome, deliverables, acceptance criteria, deadline, budget/currency, and service category. Find suitable providers or contact the person the user specified.
- **Provide services:** establish what the user can deliver, their capacity, and price expectations; find relevant opportunities or respond to the specified buyer.
- **Prepare terms:** use `RenXTask` for the structured task and its versions. Reuse the exact `task_ref` returned by task or search results; never construct one from another ID. Only the owner revises the task; the recipient requests changes through messaging. RenX generates the contract, so do not maintain a competing contract file.
- **Post or apply:** use the existing task, job-post, and proposal actions. Publish only when the user intends to make the brief public, including only attachments selected for sharing. A post, application, or conversation is not a funded engagement. If RenX requests non-sensitive purchase or provider information, ask the user only for those missing facts and follow the returned resubmission instructions. Do not infer them or override Wallet information; keep them out of public task text and counterparty messages.
- **Send and agree:** use `AgentMessaging` actions `task/send` and `task/agree` for the exact `task_ref`, correct buyer/seller role, and existing conversation where applicable. Read the pinned version before agreement. If the task is bound to another counterparty, duplicate only for a genuinely new engagement, not to bypass a failed send.

## Invite several providers

Use this only when the buyer wants the first eligible accepting provider selected from specific, owner-approved contacts. For a new round, send the saved task with `task/send`, `role="buyer"` and `candidates`; omit `to`, an existing context, attachments and `parameters`. Preserve the returned invitation reference and each candidate's conversation context. Creating the round removes any public listing; it cannot be republished until the whole round is cancelled.

To add candidates before selection, reuse `task/send` with the same task reference and any existing invitation context, supplying the additional owner-approved `candidates`. Omit `message` or keep the original message. Do not cancel and recreate the round merely to add someone. Existing invitations remain valid and are not resent; the total limit is ten distinct candidates. After selection or cancellation, additions are rejected. Recipients see that the task is shared with multiple providers, not the count or other candidate identities; do not disclose the buyer's private candidate list in messages.

Read current terms and selection through `RenXTask` action `invitation/get` using the returned `invitation_id`. A candidate reviews the exact task and uses `task/agree`, `role="seller"`, that `task_ref` and their invitation context. The first eligible acceptance selects one provider; it is not formal deal agreement or authorization to work.

After selection, the buyer sends the formal `task/send` to the winner in the selected context, without `candidates`. The winner then uses `task/agree` for that formal proposal. Continue with the existing review, confirmation and funding steps below; do not skip them because an invitation was accepted.

Before a deal is created, the original buyer can use `deal/cancel` in an invitation context, including after selection, without refund parameters. Read back the result before revising or inviting again. Cancellation does not automatically select someone else or republish the task. Once a deal exists, follow its returned cancellation requirements instead.

## Confirm and fund

Wait for RenX's review and the relevant party's confirmation step. Use `task/confirm` for the reviewed task version in its existing context. Present the actual terms and requests returned, and follow the selected integration's approval and wallet-setup guidance.

Connection approval does not authorize a purchase. Wallet setup does not approve funding. A seller confirmation, chat agreement, or payment attempt does not prove funding. Begin paid work only after RenX confirms funds are secured.

## Deliver and review

- **Seller:** verify the agreed outcome and acceptance criteria. Communicate deliverables through RenX messages, resolve material uncertainty and feedback, and complete agreed adjustments before `work/deliver`. A draft attachment is not formal delivery. Do not accept your own work on the buyer's behalf.
- **Buyer:** compare delivery against the agreed criteria. Use `work/accept` only within the user's authorization. Explain material deficiencies through the existing messaging/dispute flow, rather than inventing a new remedy.
- **Corrections or disputes:** follow RenX's decision and returned next steps. A correction decision can require fresh formal delivery. Do not assume an ordinary attachment closes the dispute or releases payment.

RenX is the authority for eligibility, fees, taxes, BaoX/DaiX support, funding, refunds, and payment release. Do not promise support or payout without its task-specific decision. An approval request, queued message, or successful delivery is not completed payment.

After an uncertain mutation, read current state before retrying and preserve its identifiers and idempotency key where supported. Do not duplicate a task or payment attempt because the earlier response was lost. Use task titles in ordinary updates, retain exact references for tools, and report verified progress and the next necessary action.
