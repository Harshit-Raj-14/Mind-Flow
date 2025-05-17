/**
 * MindFlow - Interactive Mind Map Builder
 * script.js - Part 1: Initialization and Core Setup
 */

document.addEventListener('DOMContentLoaded', function() {
    // ======= DOM ELEMENTS =======
    
    // Main Elements
    const sidebar = document.querySelector('.sidebar');
    const collapseBtn = document.getElementById('collapse-sidebar');
    const canvas = document.getElementById('mindmap-canvas');
    const mapTitle = document.getElementById('map-title');
    
    // Toolbar Elements
    const zoomInBtn = document.getElementById('zoom-in-btn');
    const zoomOutBtn = document.getElementById('zoom-out-btn');
    const zoomLevelEl = document.getElementById('zoom-level');
    const undoBtn = document.getElementById('undo-btn');
    const redoBtn = document.getElementById('redo-btn');
    const autoLayoutBtn = document.getElementById('auto-layout-btn');
    const exportButtons = {
        png: document.getElementById('export-png'),
        pdf: document.getElementById('export-pdf'),
        json: document.getElementById('export-json')
    };
    const shareBtn = document.getElementById('share-btn');
    
    // Sidebar Tool Elements
    const addNodeBtn = document.getElementById('add-node-btn');
    const deleteBtn = document.getElementById('delete-btn');
    const colorBtn = document.getElementById('color-btn');
    const connectBtn = document.getElementById('connect-btn');
    const textBtn = document.getElementById('text-btn');
    const iconBtn = document.getElementById('icon-btn');
    const expandAllBtn = document.getElementById('expand-all-btn');
    const collapseAllBtn = document.getElementById('collapse-all-btn');
    
    // Study Tool Elements
    const flashcardBtn = document.getElementById('flashcard-btn');
    const quizBtn = document.getElementById('quiz-btn');
    const summaryBtn = document.getElementById('summary-btn');
    
    // Modal Elements
    const nodeEditModal = document.getElementById('node-edit-modal');
    const settingsModal = document.getElementById('settings-modal');
    const helpModal = document.getElementById('help-modal');
    const nodeTextInput = document.getElementById('node-text');
    const nodeNotesInput = document.getElementById('node-notes');
    const colorOptions = document.querySelectorAll('.color-option');
    const iconOptions = document.querySelectorAll('.icon-option');
    const closeModalButtons = document.querySelectorAll('.close-modal, .cancel-btn, .close-btn');
    const saveButtons = document.querySelectorAll('.save-btn');
    
    // Settings Elements
    const themeSelect = document.getElementById('theme-select');
    const autoSaveToggle = document.getElementById('auto-save');
    const autoExpandToggle = document.getElementById('auto-expand');
    const snapToGridToggle = document.getElementById('snap-to-grid');
    
    // Others
    const mapList = document.getElementById('map-list');
    const newMapBtn = document.getElementById('new-map-btn');
    const settingsBtn = document.getElementById('settings-btn');
    const helpBtn = document.getElementById('help-btn');
    const toast = document.getElementById('toast');
    
    // ======= STATE MANAGEMENT =======
    
    let mindMap = {
        id: generateId(),
        title: 'My First Mind Map',
        nodes: [],
        connections: [],
        nextNodeId: 1,
        version: 1.0
    };
    
    let appState = {
        selectedNode: null,
        lastSelectedNode: null,
        currentTool: 'select',
        zoomLevel: 1,
        connectionStart: null,
        dragging: false,
        dragOffset: { x: 0, y: 0 },
        canvasOffset: { x: 0, y: 0 },
        undoStack: [],
        redoStack: [],
        autosave: true,
        autoExpand: true,
        snapToGrid: false,
        isDarkMode: false,
        isSidebarCollapsed: false,
        isCanvasDragging: false,
        lastMousePos: { x: 0, y: 0 },
        pendingChanges: false
    };
    
    // ======= INITIALIZATION =======
    
    function init() {
        // Initial theme based on system preference
        checkSystemTheme();
        
        // Create root node
        createRootNode();
        
        // Auto-save interval
        setInterval(autoSave, 30000); // Every 30 seconds
        
        // Apply settings from localStorage if available
        loadSettings();
        
        // Load last used mind map if available
        loadLastMindMap();
        
        // Render the initial mind map
        renderMindMap();
        
        // Initialize canvas position
        centerCanvas();
        
        // Initialize floating node menu
        initializeNodeMenu();
        
        // Initialize keyboard shortcuts
        initKeyboardShortcuts();
    }
    
    function checkSystemTheme() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            appState.isDarkMode = true;
            document.documentElement.setAttribute('data-theme', 'dark');
            if (themeSelect) themeSelect.value = 'dark';
        }
        
        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
            if (themeSelect && themeSelect.value === 'system') {
                appState.isDarkMode = e.matches;
                document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
            }
        });
    }
    
    function createRootNode() {
        const rootNode = {
            id: mindMap.nextNodeId++,
            text: 'Central Idea',
            notes: '',
            x: canvas.clientWidth / 2,
            y: canvas.clientHeight / 2,
            color: getComputedStyle(document.documentElement).getPropertyValue('--node-root-color').trim(),
            icon: null,
            children: [],
            isCollapsed: false,
            isRoot: true,
            level: 0
        };
        
        mindMap.nodes.push(rootNode);
        saveState();
    }
    
    function loadSettings() {
        try {
            const savedSettings = localStorage.getItem('mindflow_settings');
            if (savedSettings) {
                const settings = JSON.parse(savedSettings);
                
                // Apply saved settings
                if (settings.theme === 'dark') {
                    appState.isDarkMode = true;
                    document.documentElement.setAttribute('data-theme', 'dark');
                    if (themeSelect) themeSelect.value = 'dark';
                } else if (settings.theme === 'light') {
                    appState.isDarkMode = false;
                    document.documentElement.setAttribute('data-theme', 'light');
                    if (themeSelect) themeSelect.value = 'light';
                } else {
                    // System default already handled by checkSystemTheme()
                    if (themeSelect) themeSelect.value = 'system';
                }
                
                if (autoSaveToggle) autoSaveToggle.checked = settings.autosave ?? true;
                appState.autosave = settings.autosave ?? true;
                
                if (autoExpandToggle) autoExpandToggle.checked = settings.autoExpand ?? true;
                appState.autoExpand = settings.autoExpand ?? true;
                
                if (snapToGridToggle) snapToGridToggle.checked = settings.snapToGrid ?? false;
                appState.snapToGrid = settings.snapToGrid ?? false;
            }
        } catch (error) {
            console.error('Error loading settings:', error);
            // Continue with defaults
        }
    }
    
    function loadLastMindMap() {
        try {
            const savedMap = localStorage.getItem('mindflow_last_map');
            if (savedMap) {
                const loadedMap = JSON.parse(savedMap);
                mindMap = loadedMap;
                
                // Update UI
                if (mapTitle) mapTitle.value = mindMap.title;
                
                // Reset any state that shouldn't persist between sessions
                appState.selectedNode = null;
                appState.connectionStart = null;
            }
        } catch (error) {
            console.error('Error loading last mind map:', error);
            // Continue with default mind map
        }
    }
    
    function centerCanvas() {
        // Find the root node
        const rootNode = mindMap.nodes.find(node => node.isRoot);
        if (rootNode) {
            appState.canvasOffset.x = (canvas.clientWidth / 2) - rootNode.x;
            appState.canvasOffset.y = (canvas.clientHeight / 2) - rootNode.y;
        }
    }
    
    function autoSave() {
        if (appState.autosave && appState.pendingChanges) {
            saveMindMap();
            appState.pendingChanges = false;
        }
    }
    
    // Call init() to start the application
    init();

    /**
 * MindFlow - Interactive Mind Map Builder
 * script.js - Part 2: Node Menu and Keyboard Shortcuts
 */

// Initialize the floating node menu that appears when a node is selected
function initializeNodeMenu() {
    const menuHTML = `
        <div id="node-menu" class="node-menu">
            <button class="node-menu-btn add-child" title="Add Child Node">
                <i class="fas fa-plus"></i>
            </button>
            <button class="node-menu-btn edit-node" title="Edit Node">
                <i class="fas fa-pencil-alt"></i>
            </button>
            <button class="node-menu-btn delete-node" title="Delete Node">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    
    canvas.insertAdjacentHTML('beforeend', menuHTML);
    
    // Add event listeners to menu buttons
    const nodeMenu = document.getElementById('node-menu');
    
    if (nodeMenu) {
        // Menu positioning happens in the updateNodeMenu function
        
        // Add Child button
        nodeMenu.querySelector('.add-child').addEventListener('click', () => {
            if (appState.selectedNode) {
                const nodeId = parseInt(appState.selectedNode.dataset.id);
                addChildNode(nodeId);
            }
        });
        
        // Edit button
        nodeMenu.querySelector('.edit-node').addEventListener('click', () => {
            if (appState.selectedNode) {
                const nodeId = parseInt(appState.selectedNode.dataset.id);
                showNodeEditModal(nodeId);
            }
        });
        
        // Delete button
        nodeMenu.querySelector('.delete-node').addEventListener('click', () => {
            if (appState.selectedNode) {
                const nodeId = parseInt(appState.selectedNode.dataset.id);
                const node = findNodeById(nodeId);
                if (node && !node.isRoot) {
                    deleteNode(nodeId);
                } else {
                    showToast('Cannot delete the root node', 'warning');
                }
            }
        });
    }
}

function updateNodeMenu(nodeEl) {
    const nodeMenu = document.getElementById('node-menu');
    
    if (!nodeMenu || !nodeEl) return;
    
    const nodeRect = nodeEl.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();
    
    // Position menu slightly below and to the right of the node
    nodeMenu.style.display = 'flex';
    nodeMenu.style.top = `${nodeRect.bottom - canvasRect.top + 10}px`;
    nodeMenu.style.left = `${nodeRect.left - canvasRect.left + (nodeRect.width / 2) - (nodeMenu.offsetWidth / 2)}px`;
    
    // If node is root, disable delete button
    const nodeId = parseInt(nodeEl.dataset.id);
    const node = findNodeById(nodeId);
    const deleteBtn = nodeMenu.querySelector('.delete-node');
    
    if (node && node.isRoot) {
        deleteBtn.disabled = true;
        deleteBtn.classList.add('disabled');
    } else {
        deleteBtn.disabled = false;
        deleteBtn.classList.remove('disabled');
    }
}

function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Don't trigger shortcuts when editing text fields
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }
        
        // Tab: Add child node
        if (e.key === 'Tab' && appState.selectedNode) {
            e.preventDefault();
            const nodeId = parseInt(appState.selectedNode.dataset.id);
            addChildNode(nodeId);
        }
        
        // Enter: Add sibling node
        if (e.key === 'Enter' && appState.selectedNode) {
            e.preventDefault();
            const nodeId = parseInt(appState.selectedNode.dataset.id);
            const node = findNodeById(nodeId);
            if (node && !node.isRoot) {
                // Find the parent to add a sibling
                const parentNode = findParentNode(nodeId);
                if (parentNode) {
                    addChildNode(parentNode.id);
                }
            }
        }
        
        // Delete: Delete node
        if ((e.key === 'Delete' || e.key === 'Backspace') && appState.selectedNode) {
            e.preventDefault();
            const nodeId = parseInt(appState.selectedNode.dataset.id);
            const node = findNodeById(nodeId);
            if (node && !node.isRoot) {
                deleteNode(nodeId);
            } else if (node && node.isRoot) {
                showToast('Cannot delete the root node', 'warning');
            }
        }
        
        // Ctrl+Z: Undo
        if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            undo();
        }
        
        // Ctrl+Y: Redo
        if (e.key === 'y' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            redo();
        }
        
        // Ctrl+S: Save
        if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            saveMindMap();
        }
        
        // Ctrl+Plus: Zoom in
        if ((e.key === '+' || e.key === '=') && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            zoomIn();
        }
        
        // Ctrl+Minus: Zoom out
        if (e.key === '-' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            zoomOut();
        }
        
        // Ctrl+0: Reset zoom
        if (e.key === '0' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            resetZoom();
        }
        
        // Escape: Deselect node or close modal
        if (e.key === 'Escape') {
            // Close any open modal first
            const openModal = document.querySelector('.modal[style*="display: block"]');
            if (openModal) {
                closeAllModals();
            } else if (appState.selectedNode) {
                // Deselect node
                deselectNode();
            }
        }
    });
}

// Helper function to find a node by ID
function findNodeById(id) {
    return mindMap.nodes.find(n => n.id === id);
}

// Helper function to find the parent of a node
function findParentNode(childId) {
    return mindMap.nodes.find(n => n.children && n.children.includes(childId));
}

// Helper function to generate a unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// Helper function to get the appropriate color for a node based on its level
function getLevelColor(level) {
    const colors = [
        getComputedStyle(document.documentElement).getPropertyValue('--node-root-color').trim(),
        getComputedStyle(document.documentElement).getPropertyValue('--node-level1-color').trim(),
        getComputedStyle(document.documentElement).getPropertyValue('--node-level2-color').trim(),
        getComputedStyle(document.documentElement).getPropertyValue('--node-level3-color').trim(),
        getComputedStyle(document.documentElement).getPropertyValue('--node-level4-color').trim(),
        getComputedStyle(document.documentElement).getPropertyValue('--node-level5-color').trim(),
    ];
    
    // Use modulo to cycle through colors for deep levels
    return colors[level % colors.length];
}

/**
 * MindFlow - Interactive Mind Map Builder
 * script.js - Part 3: Event Listeners
 */

// ======= EVENT LISTENERS =======

// Collapse sidebar button
if (collapseBtn) {
    collapseBtn.addEventListener('click', () => {
        sidebar.classList.toggle('sidebar-collapsed');
        appState.isSidebarCollapsed = sidebar.classList.contains('sidebar-collapsed');
    });
}

// Map title change
if (mapTitle) {
    mapTitle.addEventListener('change', () => {
        mindMap.title = mapTitle.value;
        saveState();
    });
}

// Zoom controls
if (zoomInBtn) {
    zoomInBtn.addEventListener('click', zoomIn);
}

if (zoomOutBtn) {
    zoomOutBtn.addEventListener('click', zoomOut);
}

// Undo/Redo buttons
if (undoBtn) {
    undoBtn.addEventListener('click', undo);
}

if (redoBtn) {
    redoBtn.addEventListener('click', redo);
}

// Auto layout button
if (autoLayoutBtn) {
    autoLayoutBtn.addEventListener('click', autoLayout);
}

// Export buttons
if (exportButtons.png) {
    exportButtons.png.addEventListener('click', () => exportMindMap('png'));
}

if (exportButtons.pdf) {
    exportButtons.pdf.addEventListener('click', () => exportMindMap('pdf'));
}

if (exportButtons.json) {
    exportButtons.json.addEventListener('click', () => exportMindMap('json'));
}

// Share button
if (shareBtn) {
    shareBtn.addEventListener('click', shareMindMap);
}

// Toolbar buttons
if (addNodeBtn) {
    addNodeBtn.addEventListener('click', () => {
        setActiveTool('add');
        highlightActiveToolButton(addNodeBtn);
    });
}

if (deleteBtn) {
    deleteBtn.addEventListener('click', () => {
        setActiveTool('delete');
        highlightActiveToolButton(deleteBtn);
    });
}

if (colorBtn) {
    colorBtn.addEventListener('click', () => {
        if (appState.selectedNode) {
            showNodeEditModal(parseInt(appState.selectedNode.dataset.id));
        } else {
            showToast('Please select a node first', 'info');
        }
    });
}

if (connectBtn) {
    connectBtn.addEventListener('click', () => {
        setActiveTool('connect');
        highlightActiveToolButton(connectBtn);
    });
}

if (textBtn) {
    textBtn.addEventListener('click', () => {
        if (appState.selectedNode) {
            showNodeEditModal(parseInt(appState.selectedNode.dataset.id));
        } else {
            showToast('Please select a node first', 'info');
        }
    });
}

if (iconBtn) {
    iconBtn.addEventListener('click', () => {
        if (appState.selectedNode) {
            showNodeEditModal(parseInt(appState.selectedNode.dataset.id));
        } else {
            showToast('Please select a node first', 'info');
        }
    });
}

if (expandAllBtn) {
    expandAllBtn.addEventListener('click', expandAllNodes);
}

if (collapseAllBtn) {
    collapseAllBtn.addEventListener('click', collapseAllNodes);
}

// Study tools
if (flashcardBtn) {
    flashcardBtn.addEventListener('click', generateFlashcards);
}

if (quizBtn) {
    quizBtn.addEventListener('click', generateQuiz);
}

if (summaryBtn) {
    summaryBtn.addEventListener('click', generateSummary);
}

// Settings and help buttons
if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
        settingsModal.style.display = 'block';
    });
}

if (helpBtn) {
    helpBtn.addEventListener('click', () => {
        helpModal.style.display = 'block';
    });
}

// New map button
if (newMapBtn) {
    newMapBtn.addEventListener('click', createNewMindMap);
}

// Close modal buttons
closeModalButtons.forEach(button => {
    button.addEventListener('click', () => {
        closeAllModals();
    });
});

// Save settings
saveButtons.forEach(button => {
    button.addEventListener('click', () => {
        const modalId = button.closest('.modal').id;
        
        if (modalId === 'settings-modal') {
            saveSettings();
        } else if (modalId === 'node-edit-modal') {
            saveNodeEdits();
        }
        
        closeAllModals();
    });
});

// Theme selection
if (themeSelect) {
    themeSelect.addEventListener('change', () => {
        const theme = themeSelect.value;
        
        if (theme === 'dark') {
            appState.isDarkMode = true;
            document.documentElement.setAttribute('data-theme', 'dark');
        } else if (theme === 'light') {
            appState.isDarkMode = false;
            document.documentElement.setAttribute('data-theme', 'light');
        } else {
            // System default
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            appState.isDarkMode = prefersDark;
            document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
        }
    });
}

// Autosave toggle
if (autoSaveToggle) {
    autoSaveToggle.addEventListener('change', () => {
        appState.autosave = autoSaveToggle.checked;
    });
}

// Auto expand toggle
if (autoExpandToggle) {
    autoExpandToggle.addEventListener('change', () => {
        appState.autoExpand = autoExpandToggle.checked;
    });
}

// Snap to grid toggle
if (snapToGridToggle) {
    snapToGridToggle.addEventListener('change', () => {
        appState.snapToGrid = snapToGridToggle.checked;
    });
}

// Canvas events
canvas.addEventListener('click', handleCanvasClick);
canvas.addEventListener('mousedown', handleCanvasMouseDown);
canvas.addEventListener('mousemove', handleCanvasMouseMove);
canvas.addEventListener('mouseup', handleCanvasMouseUp);
canvas.addEventListener('dblclick', handleCanvasDoubleClick);
canvas.addEventListener('wheel', handleCanvasWheel);

// Window events
window.addEventListener('resize', () => {
    // Re-render on resize to ensure everything is positioned correctly
    renderMindMap();
});

// Helper function to close all modals
function closeAllModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.style.display = 'none';
    });
}

// Helper function to show toast notifications
function showToast(message, type = 'success') {
    // Set icon based on message type
    const iconClass = type === 'success' ? 'fa-check-circle' :
                      type === 'warning' ? 'fa-exclamation-triangle' :
                      type === 'error' ? 'fa-times-circle' : 'fa-info-circle';
    
    const toastIcon = toast.querySelector('.toast-icon');
    toastIcon.className = `fas ${iconClass} toast-icon`;
    
    // Set toast color based on type
    toast.className = 'toast ' + type;
    
    // Set message
    toast.querySelector('.toast-message').textContent = message;
    
    // Show the toast
    toast.classList.add('show');
    
    // Hide after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}