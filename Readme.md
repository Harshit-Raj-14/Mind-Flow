# MindFlow - Interactive Mind Map Builder

**Live Deployed Website - https://harshit-raj-14.github.io/Mind-Flow/**

## Overview

MindFlow is a powerful web-based mind mapping tool designed to help users organize thoughts, plan projects, and study effectively. With its intuitive interface and powerful features, MindFlow makes it easy to create, edit, and share mind maps for any purpose.

## Features

### Core Functionality

- **Interactive Mind Map Creation**: Create complex mind maps with an intuitive drag-and-drop interface
- **Auto-Expanding Nodes**: Easily expand your ideas with auto-arranging child nodes
- **Rich Node Customization**:
  - Add text and detailed notes to nodes
  - Choose from various colors to categorize ideas
  - Add icons for visual cues
- **Node Management**:
  - Add child nodes with a single click or keyboard shortcut
  - Connect related concepts with custom links
  - Collapse/expand branches to focus on specific sections

### Navigation & Layout

- **Canvas Navigation**: Pan and zoom to navigate large mind maps
- **Auto Layout**: Automatically arrange nodes for optimal visualization
- **Snap to Grid**: Align nodes precisely with optional grid snapping

### Productivity Tools

- **Keyboard Shortcuts**: Speed up your workflow with intuitive shortcuts
- **Undo/Redo**: Easily revert changes or restore deleted content
- **Auto-Save**: Never lose your work with automatic saving
- **Dark/Light Mode**: Choose the interface that's easiest on your eyes

### Study Tools

- **Flashcard Generation**: Convert your mind map into study flashcards
- **Quiz Generator**: Test your knowledge with auto-generated quizzes
- **Summary Creator**: Generate text summaries of your mind maps

### Export & Sharing

- **Multiple Export Formats**: Save your mind maps as PNG, PDF, or JSON
- **Sharing Capabilities**: Share your mind maps with others

## Technical Implementation

### Architecture

MindFlow is built using modern web technologies and follows a component-based architecture:

- **Frontend**: HTML5, CSS3, and vanilla JavaScript
- **Storage**: Local storage for saving maps and settings
- **Rendering**: Custom canvas-based rendering engine for mind map visualization


### Performance Optimizations

- **Efficient Rendering**: Only visible nodes are rendered to maintain performance
- **Throttled Events**: Event handlers are optimized to prevent performance issues
- **Lazy Loading**: Components are loaded as needed for faster initial load time

## Getting Started

### Installation

1. Download or clone the repository:
   ```bash
   git clone https://github.com/Harshit-Raj-14/Mind-Flow.git
   ```

2. Open the project folder and launch `index.html` in your web browser


### Usage

1. **Creating Your First Mind Map**
   - The canvas starts with a central "Main Idea" node
   - Click on a node and press `Tab` to create a child node
   - Double-click any node to edit its content

2. **Customizing Nodes**
   - Select a node and use the sidebar tools to change colors or add icons
   - Add detailed notes to nodes for additional information

3. **Organizing Your Map**
   - Drag nodes to reposition them
   - Use the auto-layout feature to organize complex maps
   - Collapse branches to focus on specific sections

4. **Using Study Tools**
   - Generate flashcards from your mind map for effective studying
   - Create quizzes to test your knowledge
   - Generate summaries for quick review

## Keyboard Shortcuts

| Shortcut | Action |
|---------|--------|
| `Tab` | Add child node to selected node |
| `Enter` | Add sibling node |
| `Delete` | Delete selected node |
| `Ctrl` + `Z` | Undo |
| `Ctrl` + `Y` | Redo |
| `Ctrl` + `S` | Save mind map |
| `Ctrl` + `+` | Zoom in |
| `Ctrl` + `-` | Zoom out |
| `Ctrl` + `0` | Reset zoom |


## Future Development

The MindFlow roadmap includes:

- Cloud synchronization across devices
- Collaborative real-time editing
- Template library for quick starts
- Advanced export options (SVG, interactive HTML)
- Integration with popular note-taking and productivity apps

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request


---

Made with ❤️ by Harshit Raj