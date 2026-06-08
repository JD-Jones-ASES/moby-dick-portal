# UX Principles

## Product Feel

The reader should feel literary, calm, and practical. It should help students move through a difficult book without making the book feel childish.

## First Screen

Build the actual reader first:

- Path selector.
- Chapter navigation.
- Reading pane.
- Optional context layer.
- Clear indication of what an abridged path includes or skips.

Avoid a marketing-first landing page until there is a working reading experience.

The current root page is the launch point and opens into the reader at Chapter 1. As data grows, the launch page should become a compact command surface: continue reading, choose a path, inspect annotation density, enter trails, open the map/place index, and reach teacher review queues. It should remain a working tool, not a hero page.

## Abridgment UX

Abridgment controls should be honest. If a path skips a chapter, the UI should show that a chapter was skipped and offer the summary or full chapter.

Recommended modes:

- **Read**: minimal help, clean text.
- **Guide**: summaries and essential glossary.
- **Study**: full annotations, reference cards, and source citations.

## Visual Direction

Use a restrained maritime-literary palette without letting the interface become one-note blue or brown. Prioritize readable typography, generous line height, predictable navigation, and stable controls.

Future color modes should be task-aware rather than only light/dark:

- Paper for long-form reading.
- Night Watch for low-light reading.
- Chart for map and data views.
- Review for teacher/editor source status, density warnings, and review queues.

Keep these as CSS-variable themes so the same reader, annotations, and indexes remain the source of truth.

## Navigation Ergonomics

Chapter navigation should be available at the top for orientation and at the bottom for reading flow. The bottom controls should label the previous and next units so students know what they are moving into.
