# Security Specification: ManyChat Clone

## Data Invariants
1. A **User** document must always have a `userId` matching the authenticated UID.
2. A **Workspace** must have an `ownerId` matching the creator's UID.
3. A **Connection** or **Flow** must belong to a valid **Workspace** where the user has permissions.
4. Only the owner of a workspace can modify its connections or flows.
5. Critical timestamps like `createdAt` and `updatedAt` must be server-generated.

## The "Dirty Dozen" Payloads

1. **Identity Spoofing (User)**: Create a user document with a different `userId`.
2. **Identity Spoofing (Workspace)**: Create a workspace with an `ownerId` belonging to another user.
3. **Workspace Takeover**: Try to update a workspace's `ownerId`.
4. **Flow Hijacking**: Try to create a flow in a workspace ID that you don't own.
5. **PII Leak**: An authenticated user tries to read another user's profile.
6. **Orphaned Flow**: Create a flow referencing a non-existent workspace ID.
7. **Ghost Field Update**: Update a flow with an unknown field `isApproved: true`.
8. **State Skip**: Update a flow status directly from `draft` to `active` without satisfying requirements (if any).
9. **Resource Exhaustion**: Use an extremely long string for a flow name.
10. **ID Poisoning**: Use a document ID containing malicious characters or extremely long strings.
11. **Timestamp Manipulation**: Provide a client-side `createdAt` in the past.
12. **Anonymous Access**: Attempt to read any collection without being signed in.

## Test Runner (Conceptual) - firestore.rules.test.ts
(To be implemented if needed, but I will prioritize fixing the rules directly now).
