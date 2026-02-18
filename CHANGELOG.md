# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added

- **Multi-Diagram Support**: Introduced a new sidebar for managing multiple diagrams. Users can now create, switch between, and delete diagrams.
- **State Management**: Implemented `useDiagramStore` using Pinia for robust state management across the application.
- **Sidebar Interface**: Added a collapsible sidebar (`TheDiagramSidebar.vue`) for easy access to diagram management features.
- **Keyboard Shortcuts**: Updated keyboard shortcuts to include new actions like toggling the sidebar (`Cmd+S`).
- **Toolbar Enhancements**: Added a sidebar toggle button to the main toolbar for better accessibility.

### Changed

- **Welcome Screen**: Integrated the welcome screen with the new diagram store to seamlessly load or create diagrams.
- **Preview Functionality**: Enhanced the preview pane (`ThePreview.vue`) to support the new state management and ensure accurate rendering.

### Fixed

- **UI consistency**: Addressed various UI inconsistencies and improved the overall look and feel.
- **Performance**: Optimized state updates for smoother diagram editing and switching.
