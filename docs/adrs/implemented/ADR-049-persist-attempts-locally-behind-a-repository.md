# ADR-049: Persist Attempts Locally Behind a Repository

**Status:** Implemented

**Date:** 2026-08-01

## Context

Practice history should survive page reloads without requiring an account, server database, or network connection. The first slice stores a small number of compact attempt summaries for one personal user. It does not need relational queries, synchronization, or a raw archive of every incoming MIDI message.

Browser persistence can fail because storage is unavailable, blocked, corrupt, or over quota. Binding controllers and views directly to a browser storage API would also make those failure modes harder to test and make a later storage migration invasive.

## Decision

Attempt persistence will be local-first and accessed through a typed `AttemptRepository` boundary. The initial browser repository will use `localStorage` with a namespaced key and a versioned, JSON-serializable envelope.

Persisted records will contain compact attempt results and the canonical exercise identity and version needed to interpret them. The live evaluator will not persist raw MIDI traffic as practice history. Repository implementations must validate decoded data, treat missing storage as empty history, and contain storage or parsing failures so an unavailable history does not prevent practice.

Controllers and views will depend on the repository contract rather than the global `Storage` object. Tests can therefore use a deterministic in-memory implementation. If history volume, querying, or migration needs outgrow synchronous key-value storage, a later implementation may move the same boundary to IndexedDB.

No cloud synchronization, authentication, or remote analytics are part of this decision.

## Trigger

The first complete exercise slice requires persisted completed attempts and a minimal local practice-history summary.

## Consequences

**Positive:**

- Practice history works offline and requires no account or backend.
- A repository seam keeps browser storage mechanics out of the evaluator and rendered views.
- Versioned envelopes make incompatible stored shapes detectable and allow deliberate migrations.
- The initial implementation uses a native browser capability without another dependency.

**Negative:**

- `localStorage` is synchronous and has limited quota, so it is unsuitable for large event logs or rich imported score data.
- Data remains tied to one browser profile and can be cleared by the user or browser.
- Cross-device history and backup are unavailable.

**Neutral:**

- A future IndexedDB repository would be a storage implementation change, but stored-data migration would still need explicit design and tests.
- Local persistence does not imply that every in-progress input event is durable.

## Alternatives Considered

### Use IndexedDB In The First Slice

IndexedDB provides asynchronous transactions, larger capacity, and better structured queries. Those capabilities are not yet needed for compact attempt summaries, while its transaction and migration surface would add complexity to the smallest useful slice. It remains the preferred migration path if the data model grows.

### Access `localStorage` Directly From UI Code

This is initially shorter, but it couples UI behavior to serialization, global state, and quota failures and makes deterministic testing and later migration harder.

### Persist Attempts In A Server Database

This would enable synchronization, but it also requires authentication, privacy policy, network failure handling, and backend operations that are explicitly outside the first slice.
