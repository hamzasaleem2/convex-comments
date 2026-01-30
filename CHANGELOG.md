# Changelog

All notable changes to this project will be documented in this file.

## [1.0.2] - 2026-01-31

### Added
- New `getOrCreateThread` method to the `Comments` class and components. This simplifies the creation of "single-thread" comment sections for a specific entity.
- Expanded "Quick Start" in README with a complete "Entity-to-Thread" example for easier onboarding.

### Documentation
- Improved React usage examples in README with better component patterns.

## [1.0.1] - 2026-01-31

### Fixed
- Replaced `@your-org/comments` placeholders in JSDoc examples with the correct package name `@hamzasaleemorg/convex-comments`.

### Documentation
- Significant enrichment of JSDoc comments for the entire client library.
- Added detailed usage context, best practices, and permission reminders to all public methods.
- Expanded code examples for `Comments` class, `exposeApi`, and `registerRoutes`.

## [1.0.0] - 2026-01-31

### Added
- Initial release of the Convex Comments Component.
- Core data model for Zones, Threads, and Messages.
- Mentions parsing and autocomplete.
- Emoji reactions.
- Real-time typing indicators.
- Thread and Message resolution states.
- Attachment metadata support.
- Optional React UI components (`<Comments>`, `<Thread>`, `<Comment>`, `<AddComment>`).
- Exported `Comments` class for backend logic and callbacks.
- `registerRoutes` for exposing REST-like HTTP endpoints.
