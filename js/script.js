/**
 * MindFlow - Interactive Mind Map Builder
 * script.js
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
    
    // ======= EVENT HANDLERS =======
    
    function handleCanvasClick(e) {
        e.preventDefault();
        
        // Check if we clicked on a node
        if (e.target.closest('.node')) {
            const nodeEl = e.target.closest('.node');
            const nodeId = parseInt(nodeEl.dataset.id);
            
            // Handle different tools
            if (appState.currentTool === 'delete') {
                const node = findNodeById(nodeId);
                if (node && !node.isRoot) {
                    deleteNode(nodeId);
                    setActiveTool('select'); // Reset to select tool after deletion
                } else {
                    showToast('Cannot delete the root node', 'warning');
                }
            } else if (appState.currentTool === 'select') {
                // Toggle node selection
                if (appState.selectedNode === nodeEl) {
                    deselectNode();
                } else {
                    selectNode(nodeEl);
                }
            } else if (appState.currentTool === 'connect') {
                // Handle connection tool
                if (!appState.connectionStart) {
                    // Start the connection
                    appState.connectionStart = nodeId;
                    nodeEl.classList.add('connection-source');
                } else {
                    // Finish the connection if different nodes
                    if (appState.connectionStart !== nodeId) {
                        addConnection(appState.connectionStart, nodeId);
                        
                        // Reset connection state
                        const sourceNodeEl = document.querySelector(`.node[data-id="${appState.connectionStart}"]`);
                        if (sourceNodeEl) {
                            sourceNodeEl.classList.remove('connection-source');
                        }
                        appState.connectionStart = null;
                        
                        // Return to select tool
                        setActiveTool('select');
                    } else {
                        // Clicked on the same node, cancel connection
                        nodeEl.classList.remove('connection-source');
                        appState.connectionStart = null;
                    }
                }
            } else if (appState.currentTool === 'add') {
                // Add a child node
                addChildNode(nodeId);
                setActiveTool('select'); // Return to select tool
            }
            
            // Check if the click was on the collapse toggle
            if (e.target.closest('.collapse-toggle')) {
                toggleNodeCollapse(nodeId);
                e.stopPropagation();
                return;
            }
        } else {
            // Clicked on empty canvas
            deselectNode();
            
            // Cancel any pending connections
            if (appState.connectionStart) {
                const sourceNodeEl = document.querySelector(`.node[data-id="${appState.connectionStart}"]`);
                if (sourceNodeEl) {
                    sourceNodeEl.classList.remove('connection-source');
                }
                appState.connectionStart = null;
            }
            
            // If add tool is active, create a new node at click position
            if (appState.currentTool === 'add') {
                const canvasRect = canvas.getBoundingClientRect();
                const x = e.clientX - canvasRect.left - appState.canvasOffset.x;
                const y = e.clientY - canvasRect.top - appState.canvasOffset.y;
                addFreeNode(x, y);
                setActiveTool('select'); // Return to select tool
            }
        }
    }
    
    function handleCanvasDoubleClick(e) {
        if (e.target.closest('.node')) {
            const nodeEl = e.target.closest('.node');
            const nodeId = parseInt(nodeEl.dataset.id);
            showNodeEditModal(nodeId);
        } else {
            // Double-click on empty canvas - create a new node
            const canvasRect = canvas.getBoundingClientRect();
            const x = e.clientX - canvasRect.left - appState.canvasOffset.x;
            const y = e.clientY - canvasRect.top - appState.canvasOffset.y;
            addFreeNode(x, y);
        }
    }
    
    function handleCanvasMouseDown(e) {
        e.preventDefault();
        
        if (e.target.closest('.node')) {
            const nodeEl = e.target.closest('.node');
            
            // Skip if clicked on collapse toggle
            if (e.target.closest('.collapse-toggle')) {
                return;
            }
            
            // Start node dragging
            appState.dragging = true;
            appState.dragTarget = nodeEl;
            
            const nodeId = parseInt(nodeEl.dataset.id);
            const node = findNodeById(nodeId);
            
            if (node) {
                const canvasRect = canvas.getBoundingClientRect();
                appState.dragOffset.x = (e.clientX - canvasRect.left) - (node.x + appState.canvasOffset.x);
                appState.dragOffset.y = (e.clientY - canvasRect.top) - (node.y + appState.canvasOffset.y);
                
                selectNode(nodeEl);
            }
        } else {
            // Start canvas panning
            appState.isCanvasDragging = true;
            appState.lastMousePos.x = e.clientX;
            appState.lastMousePos.y = e.clientY;
            canvas.style.cursor = 'grabbing';
        }
    }
    
    function handleCanvasMouseMove(e) {
        e.preventDefault();
        
        // Node dragging
        if (appState.dragging && appState.dragTarget) {
            const nodeId = parseInt(appState.dragTarget.dataset.id);
            const node = findNodeById(nodeId);
            
            if (node) {
                const canvasRect = canvas.getBoundingClientRect();
                let newX = (e.clientX - canvasRect.left) - appState.dragOffset.x - appState.canvasOffset.x;
                let newY = (e.clientY - canvasRect.top) - appState.dragOffset.y - appState.canvasOffset.y;
                
                // Apply snap to grid if enabled
                if (appState.snapToGrid) {
                    const gridSize = 20;
                    newX = Math.round(newX / gridSize) * gridSize;
                    newY = Math.round(newY / gridSize) * gridSize;
                }
                
                // Update node position
                node.x = newX;
                node.y = newY;
                
                // Re-render the mind map
                renderMindMap();
                
                // Mark changes as pending
                appState.pendingChanges = true;
            }
        }
        
        // Canvas panning
        if (appState.isCanvasDragging) {
            const dx = e.clientX - appState.lastMousePos.x;
            const dy = e.clientY - appState.lastMousePos.y;
            
            appState.canvasOffset.x += dx;
            appState.canvasOffset.y += dy;
            
            appState.lastMousePos.x = e.clientX;
            appState.lastMousePos.y = e.clientY;
            
            renderMindMap();
        }
    }
    
    function handleCanvasMouseUp(e) {
        e.preventDefault();
        
        // End node dragging
        if (appState.dragging && appState.pendingChanges) {
            saveState();
            appState.pendingChanges = false;
        }
        
        appState.dragging = false;
        appState.dragTarget = null;
        
        // End canvas panning
        if (appState.isCanvasDragging) {
            appState.isCanvasDragging = false;
            canvas.style.cursor = 'default';
        }
    }
    
    function handleCanvasWheel(e) {
        e.preventDefault();
        
        if (e.ctrlKey || e.metaKey) {
            // Zoom with Ctrl+Wheel
            if (e.deltaY < 0) {
                zoomIn();
            } else {
                zoomOut();
            }
        } else {
            // Pan vertically and horizontally with wheel
            appState.canvasOffset.y -= e.deltaY;
            
            if (e.shiftKey) {
                // Horizontal scrolling with Shift+Wheel
                appState.canvasOffset.x -= e.deltaY;
            }
            
            renderMindMap();
        }
    }
    
    // ======= NODE OPERATIONS =======
    
    function addChildNode(parentId) {
        const parentNode = findNodeById(parentId);
        
        if (!parentNode) return;
        
        // If node is collapsed, expand it
        if (parentNode.isCollapsed) {
            parentNode.isCollapsed = false;
        }
        
        // Calculate position for the new node
        let x, y;
        
        // Place in a circle around the parent if it has other children
        const childCount = parentNode.children ? parentNode.children.length : 0;
        const radius = 120 + (childCount * 5); // Increase radius slightly with more children
        const angle = (childCount * (2 * Math.PI / 8)) + (Math.PI / 8); // Distribute up to 8 nodes evenly
        
        x = parentNode.x + radius * Math.cos(angle);
        y = parentNode.y + radius * Math.sin(angle);
        
        // Create the new node
        const newNode = {
            id: mindMap.nextNodeId++,
            text: 'New Node',
            notes: '',
            x: x,
            y: y,
            color: getLevelColor(parentNode.level + 1),
            icon: null,
            children: [],
            isCollapsed: false,
            level: parentNode.level + 1
        };
        
        // Add to nodes array
        mindMap.nodes.push(newNode);
        
        // Update parent's children array
        if (!parentNode.children) {
            parentNode.children = [];
        }
        parentNode.children.push(newNode.id);
        
        // Add hierarchical connection
        mindMap.connections.push({
            source: parentId,
            target: newNode.id,
            type: 'hierarchy'
        });
        
        // Save state and re-render
        saveState();
        renderMindMap();
        
        // Select the new node
        setTimeout(() => {
            const newNodeEl = document.querySelector(`.node[data-id="${newNode.id}"]`);
            if (newNodeEl) {
                selectNode(newNodeEl);
                showNodeEditModal(newNode.id); // Open edit modal automatically
            }
        }, 100);
    }
    
function addFreeNode(x, y) {
        // Create a new standalone node
        const newNode = {
            id: mindMap.nextNodeId++,
            text: 'New Node',
            notes: '',
            x: x,
            y: y,
            color: getLevelColor(1),
            icon: null,
            children: [],
            isCollapsed: false,
            level: 1
        };
        
        // Add to nodes array
        mindMap.nodes.push(newNode);
        
        // Save state and re-render
        saveState();
        renderMindMap();
        
        // Select the new node and open edit modal
        setTimeout(() => {
            const newNodeEl = document.querySelector(`.node[data-id="${newNode.id}"]`);
            if (newNodeEl) {
                selectNode(newNodeEl);
                showNodeEditModal(newNode.id);
            }
        }, 100);
    }
    
    function deleteNode(nodeId) {
        const node = findNodeById(nodeId);
        
        if (!node || node.isRoot) return;
        
        // Keep track of all nodes to delete (this node and all descendants)
        const nodesToDelete = [nodeId];
        collectDescendants(node, nodesToDelete);
        
        // Remove all nodes and their connections
        mindMap.nodes = mindMap.nodes.filter(n => !nodesToDelete.includes(n.id));
        mindMap.connections = mindMap.connections.filter(
            c => !nodesToDelete.includes(c.source) && !nodesToDelete.includes(c.target)
        );
        
        // Remove references from parent nodes
        mindMap.nodes.forEach(n => {
            if (n.children) {
                n.children = n.children.filter(childId => !nodesToDelete.includes(childId));
            }
        });
        
        // If the deleted node was selected, deselect it
        if (appState.selectedNode && parseInt(appState.selectedNode.dataset.id) === nodeId) {
            deselectNode();
        }
        
        // Save state and re-render
        saveState();
        renderMindMap();
        
        showToast('Node deleted', 'success');
    }
    
    function collectDescendants(node, nodeList) {
        if (node.children && node.children.length > 0) {
            for (const childId of node.children) {
                nodeList.push(childId);
                const childNode = findNodeById(childId);
                if (childNode) {
                    collectDescendants(childNode, nodeList);
                }
            }
        }
    }
    
    function toggleNodeCollapse(nodeId) {
        const node = findNodeById(nodeId);
        
        if (node && (node.children || []).length > 0) {
            node.isCollapsed = !node.isCollapsed;
            saveState();
            renderMindMap();
        }
    }
    
    function expandAllNodes() {
        let changed = false;
        
        mindMap.nodes.forEach(node => {
            if (node.isCollapsed) {
                node.isCollapsed = false;
                changed = true;
            }
        });
        
        if (changed) {
            saveState();
            renderMindMap();
            showToast('All nodes expanded', 'success');
        }
    }
    
    function collapseAllNodes() {
        let changed = false;
        
        // Keep root node expanded, collapse everything else with children
        mindMap.nodes.forEach(node => {
            if (!node.isRoot && !node.isCollapsed && (node.children || []).length > 0) {
                node.isCollapsed = true;
                changed = true;
            }
        });
        
        if (changed) {
            saveState();
            renderMindMap();
            showToast('All branches collapsed', 'success');
        }
    }
    
    function addConnection(sourceId, targetId) {
        // Check if connection already exists
        const existingConnection = mindMap.connections.find(
            c => (c.source === sourceId && c.target === targetId) || 
                 (c.source === targetId && c.target === sourceId)
        );
        
        if (existingConnection) {
            showToast('Connection already exists', 'info');
            return;
        }
        
        // Add the new non-hierarchical connection
        mindMap.connections.push({
            source: sourceId,
            target: targetId,
            type: 'custom'
        });
        
        saveState();
        renderMindMap();
        showToast('Connection created', 'success');
    }
    
    function selectNode(nodeEl) {
        // Deselect previously selected node
        if (appState.selectedNode) {
            appState.selectedNode.classList.remove('selected');
        }
        
        // Select new node
        nodeEl.classList.add('selected');
        appState.selectedNode = nodeEl;
        
        // Show node menu
        updateNodeMenu(nodeEl);
    }
    
    function deselectNode() {
        if (appState.selectedNode) {
            appState.selectedNode.classList.remove('selected');
            appState.selectedNode = null;
            
            // Hide node menu
            const nodeMenu = document.getElementById('node-menu');
            if (nodeMenu) {
                nodeMenu.style.display = 'none';
            }
        }
    }
    
    function showNodeEditModal(nodeId) {
        const node = findNodeById(nodeId);
        
        if (!node) return;
        
        // Populate modal fields
        nodeTextInput.value = node.text;
        nodeNotesInput.value = node.notes || '';
        
        // Reset selections
        colorOptions.forEach(opt => opt.classList.remove('selected'));
        iconOptions.forEach(opt => opt.classList.remove('selected'));
        
        // Select current color
        const currentColor = node.color;
        colorOptions.forEach(opt => {
            if (opt.style.backgroundColor === currentColor) {
                opt.classList.add('selected');
            }
        });
        
        // Select current icon
        if (node.icon) {
            iconOptions.forEach(opt => {
                if (opt.querySelector('i').className === node.icon) {
                    opt.classList.add('selected');
                }
            });
        }
        
        // Store node ID for saving
        nodeEditModal.dataset.nodeId = nodeId;
        
        // Show modal
        nodeEditModal.style.display = 'block';
    }
    
    function saveNodeEdits() {
        const nodeId = parseInt(nodeEditModal.dataset.nodeId);
        const node = findNodeById(nodeId);
        
        if (!node) return;
        
        // Update node properties
        node.text = nodeTextInput.value;
        node.notes = nodeNotesInput.value;
        
        // Update color
        const selectedColor = document.querySelector('.color-option.selected');
        if (selectedColor) {
            node.color = selectedColor.style.backgroundColor;
        }
        
        // Update icon
        const selectedIcon = document.querySelector('.icon-option.selected');
        if (selectedIcon) {
            node.icon = selectedIcon.querySelector('i').className;
        } else {
            node.icon = null;
        }
        
        // Save and re-render
        saveState();
        renderMindMap();
        showToast('Node updated', 'success');
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
    
    // ======= RENDERING =======
    
    function renderMindMap() {
        // Clear the canvas
        while (canvas.firstChild) {
            // Keep the node menu if it exists
            if (canvas.firstChild.id === 'node-menu') {
                const nodeMenu = canvas.firstChild;
                canvas.removeChild(nodeMenu);
                canvas.innerHTML = '';
                canvas.appendChild(nodeMenu);
                break;
            }
            canvas.removeChild(canvas.firstChild);
        }
        
        // Apply zoom level to the canvas
        const transformGroup = document.createElement('div');
        transformGroup.className = 'transform-group';
        transformGroup.style.transform = `scale(${appState.zoomLevel})`;
        transformGroup.style.transformOrigin = 'center center';
        transformGroup.style.width = '100%';
        transformGroup.style.height = '100%';
        transformGroup.style.position = 'absolute';
        canvas.appendChild(transformGroup);
        
        // Update zoom level display
        if (zoomLevelEl) {
            zoomLevelEl.textContent = `${Math.round(appState.zoomLevel * 100)}%`;
        }
        
        // Render connections first (so they appear behind nodes)
        renderConnections(transformGroup);
        
        // Render visible nodes
        renderNodes(transformGroup);
        
        // Update node menu position if a node is selected
        if (appState.selectedNode) {
            const nodeEl = document.querySelector(`.node[data-id="${appState.selectedNode.dataset.id}"]`);
            if (nodeEl) {
                appState.selectedNode = nodeEl;
                selectNode(nodeEl);
            } else {
                deselectNode();
            }
        }
    }
    
    function renderNodes(container) {
        const visibleNodes = getVisibleNodes();
        
        visibleNodes.forEach(node => {
            const nodeEl = document.createElement('div');
            nodeEl.className = `node${node.isRoot ? ' root' : ''}`;
            nodeEl.dataset.id = node.id;
            nodeEl.style.left = `${node.x + appState.canvasOffset.x}px`;
            nodeEl.style.top = `${node.y + appState.canvasOffset.y}px`;
            nodeEl.style.backgroundColor = node.color;
            
            const nodeContent = document.createElement('div');
            nodeContent.className = 'node-content';
            
            if (node.icon) {
                const iconEl = document.createElement('i');
                iconEl.className = node.icon;
                iconEl.classList.add('node-icon');
                nodeContent.appendChild(iconEl);
            }
            
            const textEl = document.createElement('span');
            textEl.textContent = node.text;
            nodeContent.appendChild(textEl);
            
            nodeEl.appendChild(nodeContent);
            
            // Add collapse toggle for nodes with children
            if ((node.children || []).length > 0) {
                const toggleEl = document.createElement('div');
                toggleEl.className = 'collapse-toggle';
                toggleEl.innerHTML = node.isCollapsed ? 
                    '<i class="fas fa-plus"></i>' : 
                    '<i class="fas fa-minus"></i>';
                nodeEl.appendChild(toggleEl);
            }
            
            container.appendChild(nodeEl);
        });
    }
    
    function renderConnections(container) {
        // Filter to only show connections between visible nodes
        const visibleNodeIds = getVisibleNodes().map(node => node.id);
        
        mindMap.connections.forEach(conn => {
            if (visibleNodeIds.includes(conn.source) && visibleNodeIds.includes(conn.target)) {
                renderConnection(container, conn);
            }
        });
    }
    
    function renderConnection(container, connection) {
        const sourceNode = findNodeById(connection.source);
        const targetNode = findNodeById(connection.target);
        
        if (!sourceNode || !targetNode) return;
        
        // Get corrected positions (with canvas offset)
        const sourceX = sourceNode.x + appState.canvasOffset.x;
        const sourceY = sourceNode.y + appState.canvasOffset.y;
        const targetX = targetNode.x + appState.canvasOffset.x;
        const targetY = targetNode.y + appState.canvasOffset.y;
        
        // Calculate line dimensions
        const dx = targetX - sourceX;
        const dy = targetY - sourceY;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;
        
        // Create line element
        const line = document.createElement('div');
        line.className = `connection-line${connection.type === 'custom' ? ' custom' : ''}`;
        line.style.width = `${length}px`;
        line.style.left = `${sourceX}px`;
        line.style.top = `${sourceY}px`;
        line.style.transform = `rotate(${angle}deg)`;
        
        // Custom connections have different styling
        if (connection.type === 'custom') {
            line.style.borderTop = '2px dashed var(--node-level3-color)';
            line.style.opacity = '0.6';
        }
        
        container.appendChild(line);
    }
    
    function getVisibleNodes() {
        // Get all visible nodes (not hidden by collapsed parents)
        const visibleNodes = [];
        const collapsedNodes = new Set();
        
        // First, identify all collapsed nodes
        mindMap.nodes.forEach(node => {
            if (node.isCollapsed) {
                // Add all children of collapsed nodes to the set
                collectAllChildren(node, collapsedNodes);
            }
        });
        
        // Then filter out nodes that are children of collapsed nodes
        mindMap.nodes.forEach(node => {
            if (!collapsedNodes.has(node.id)) {
                visibleNodes.push(node);
            }
        });
        
        return visibleNodes;
    }
    
    function collectAllChildren(node, collapsedNodes) {
        if (node.children && node.children.length > 0) {
            node.children.forEach(childId => {
                collapsedNodes.add(childId);
                const childNode = findNodeById(childId);
                if (childNode) {
                    collectAllChildren(childNode, collapsedNodes);
                }
            });
        }
    }

// ======= TOOL & SETTINGS MANAGEMENT =======
    
    function setActiveTool(tool) {
        appState.currentTool = tool;
        
        // Reset tool-specific states
        if (tool !== 'connect' && appState.connectionStart) {
            const sourceNodeEl = document.querySelector(`.node[data-id="${appState.connectionStart}"]`);
            if (sourceNodeEl) {
                sourceNodeEl.classList.remove('connection-source');
            }
            appState.connectionStart = null;
        }
        
        // Update cursor style
        switch (tool) {
            case 'select':
                canvas.style.cursor = 'default';
                break;
            case 'add':
                canvas.style.cursor = 'crosshair';
                break;
            case 'delete':
                canvas.style.cursor = 'no-drop';
                break;
            case 'connect':
                canvas.style.cursor = 'cell';
                break;
            default:
                canvas.style.cursor = 'default';
        }
    }
    
    function highlightActiveToolButton(btn) {
        const toolButtons = document.querySelectorAll('.tool-btn');
        toolButtons.forEach(b => b.classList.remove('active'));
        
        if (btn) {
            btn.classList.add('active');
        }
    }
    
    function saveSettings() {
        const settings = {
            theme: themeSelect.value,
            autosave: autoSaveToggle.checked,
            autoExpand: autoExpandToggle.checked,
            snapToGrid: snapToGridToggle.checked
        };
        
        localStorage.setItem('mindflow_settings', JSON.stringify(settings));
        
        appState.autosave = settings.autosave;
        appState.autoExpand = settings.autoExpand;
        appState.snapToGrid = settings.snapToGrid;
        
        showToast('Settings saved', 'success');
    }
    
    // ======= ZOOM CONTROLS =======
    
    function zoomIn() {
        if (appState.zoomLevel < 2) {
            appState.zoomLevel += 0.1;
            renderMindMap();
        }
    }
    
    function zoomOut() {
        if (appState.zoomLevel > 0.5) {
            appState.zoomLevel -= 0.1;
            renderMindMap();
        }
    }
    
    function resetZoom() {
        appState.zoomLevel = 1;
        renderMindMap();
    }
    
    // ======= MIND MAP LAYOUT =======
    
    function autoLayout() {
        // Find the root node
        const rootNode = mindMap.nodes.find(node => node.isRoot);
        if (!rootNode) return;
        
        // Reset root position to center
        rootNode.x = canvas.clientWidth / 2;
        rootNode.y = canvas.clientHeight / 2;
        
        // Position all other nodes using a radial layout
        positionChildNodes(rootNode, 0, 2 * Math.PI);
        
        // Save state and re-render
        saveState();
        renderMindMap();
        showToast('Mind map layout optimized', 'success');
    }
    
    function positionChildNodes(parentNode, startAngle, endAngle) {
        if (!parentNode.children || parentNode.children.length === 0) return;
        
        const childCount = parentNode.children.length;
        const angleStep = (endAngle - startAngle) / childCount;
        const radius = 150 + (30 * parentNode.level); // Increase radius by level
        
        parentNode.children.forEach((childId, index) => {
            const childNode = findNodeById(childId);
            if (!childNode) return;
            
            const childAngle = startAngle + (index * angleStep) + (angleStep / 2);
            
            // Position this child
            childNode.x = parentNode.x + radius * Math.cos(childAngle);
            childNode.y = parentNode.y + radius * Math.sin(childAngle);
            
            // Recursively position grandchildren in a narrower angle range
            positionChildNodes(
                childNode, 
                childAngle - (angleStep / 2) * 0.8, 
                childAngle + (angleStep / 2) * 0.8
            );
        });
    }
    
    // ======= IMPORT/EXPORT/SAVE =======
    
    function saveMindMap() {
        // Store in localStorage
        localStorage.setItem('mindflow_last_map', JSON.stringify(mindMap));
        
        // Also store in map list (not implemented in this version)
        // TODO: Add map list management
        
        showToast('Mind map saved', 'success');
    }
    
    function exportMindMap(format) {
        switch (format) {
            case 'png':
                exportPNG();
                break;
            case 'pdf':
                exportPDF();
                break;
            case 'json':
                exportJSON();
                break;
        }
    }
    
    function exportPNG() {
        showToast('Exporting as PNG...', 'info');
        
        // In a real implementation, use html2canvas or a similar library
        // For this demo, we'll simulate the export
        setTimeout(() => {
            showToast('PNG export feature will be available in the next update', 'info');
        }, 1000);
    }
    
    function exportPDF() {
        showToast('Exporting as PDF...', 'info');
        
        // In a real implementation, use jsPDF or a similar library
        // For this demo, we'll simulate the export
        setTimeout(() => {
            showToast('PDF export feature will be available in the next update', 'info');
        }, 1000);
    }
    
    function exportJSON() {
        const dataStr = JSON.stringify(mindMap, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', `${mindMap.title.replace(/\s+/g, '_')}.json`);
        linkElement.click();
        
        showToast('Mind map exported as JSON', 'success');
    }
    
    function shareMindMap() {
        // In a real implementation, generate a shareable link or integrate with sharing services
        showToast('Sharing feature will be available in the next update', 'info');
    }
    
    function createNewMindMap() {
        // Confirm with user if there are unsaved changes
        if (appState.pendingChanges) {
            if (!confirm('You have unsaved changes. Create a new mind map anyway?')) {
                return;
            }
        }
        
        // Reset the mind map to initial state
        mindMap = {
            id: generateId(),
            title: 'New Mind Map',
            nodes: [],
            connections: [],
            nextNodeId: 1,
            version: 1.0
        };
        
        // Reset app state
        appState.selectedNode = null;
        appState.connectionStart = null;
        appState.pendingChanges = false;
        appState.undoStack = [];
        appState.redoStack = [];
        
        // Update UI
        if (mapTitle) mapTitle.value = mindMap.title;
        
        // Create new root node
        createRootNode();
        
        // Center the view and render
        centerCanvas();
        renderMindMap();
        
        showToast('New mind map created', 'success');
    }
    
    // ======= STUDY TOOLS =======
    
    function generateFlashcards() {
        showToast('Generating flashcards from your mind map...', 'info');
        
        // In a real implementation, convert nodes to flashcards
        // For this demo, we'll simulate the feature
        setTimeout(() => {
            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.id = 'flashcard-modal';
            modal.style.display = 'block';
            
            const modalContent = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Flashcards</h3>
                        <button class="close-modal">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="flashcard-container">
                            <div class="flashcard" id="current-card">
                                <div class="flashcard-front">
                                    <p>${mindMap.title}</p>
                                </div>
                                <div class="flashcard-back">
                                    <p>${mindMap.nodes.length - 1} key concepts in this mind map</p>
                                </div>
                            </div>
                            <div class="flashcard-controls">
                                <button id="prev-card"><i class="fas fa-chevron-left"></i></button>
                                <button id="flip-card"><i class="fas fa-sync-alt"></i> Flip</button>
                                <button id="next-card"><i class="fas fa-chevron-right"></i></button>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="close-btn">Close</button>
                        <button class="save-btn">Export Flashcards</button>
                    </div>
                </div>
            `;
            
            modal.innerHTML = modalContent;
            document.body.appendChild(modal);
            
            // Close button functionality
            modal.querySelector('.close-modal').addEventListener('click', () => {
                document.body.removeChild(modal);
            });
            
            modal.querySelector('.close-btn').addEventListener('click', () => {
                document.body.removeChild(modal);
            });
            
            // Simulate card flipping
            modal.querySelector('#flip-card').addEventListener('click', () => {
                modal.querySelector('#current-card').classList.toggle('flipped');
            });
        }, 1000);
    }
    
    function generateQuiz() {
        showToast('Generating quiz questions from your mind map...', 'info');
        
        // In a real implementation, convert nodes to quiz questions
        // For this demo, we'll simulate the feature
        setTimeout(() => {
            showToast('Quiz generation feature will be available in the next update', 'info');
        }, 1000);
    }
    
    function generateSummary() {
        showToast('Creating summary from your mind map...', 'info');
        
        // In a real implementation, generate a textual summary of the mind map
        // For this demo, we'll simulate the feature
        setTimeout(() => {
            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.id = 'summary-modal';
            modal.style.display = 'block';
            
            const rootNode = mindMap.nodes.find(node => node.isRoot);
            const mainTopics = rootNode ? 
                mindMap.nodes.filter(node => rootNode.children && rootNode.children.includes(node.id)) : 
                [];
            
            const modalContent = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Mind Map Summary</h3>
                        <button class="close-modal">&times;</button>
                    </div>
                    <div class="modal-body">
                        <h4>${mindMap.title}</h4>
                        <p>This mind map explores ${rootNode ? rootNode.text : 'a central idea'} with ${mainTopics.length} main branches:</p>
                        <ul>
                            ${mainTopics.map(topic => `<li><strong>${topic.text}</strong></li>`).join('')}
                        </ul>
                        <p>The mind map contains a total of ${mindMap.nodes.length} concepts and ${mindMap.connections.length} connections.</p>
                    </div>
                    <div class="modal-footer">
                        <button class="close-btn">Close</button>
                        <button class="save-btn">Export Summary</button>
                    </div>
                </div>
            `;
            
            modal.innerHTML = modalContent;
            document.body.appendChild(modal);
            
            // Close button functionality
            modal.querySelector('.close-modal').addEventListener('click', () => {
                document.body.removeChild(modal);
            });
            
            modal.querySelector('.close-btn').addEventListener('click', () => {
                document.body.removeChild(modal);
            });
        }, 1000);
    }
    
    // ======= UTILITY FUNCTIONS =======
    
    function findNodeById(id) {
        return mindMap.nodes.find(n => n.id === id);
    }
    
    function findParentNode(childId) {
        return mindMap.nodes.find(n => n.children && n.children.includes(childId));
    }
    
    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }
    
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
    
    function closeAllModals() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.style.display = 'none';
        });
    }
    
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
    
    // ======= UNDO/REDO FUNCTIONALITY =======
    
    function saveState() {
        // Store current state in undo stack
        appState.undoStack.push(JSON.stringify(mindMap));
        
        // Clear redo stack when a new action is performed
        appState.redoStack = [];
        
        // Limit undo stack size
        if (appState.undoStack.length > 30) {
            appState.undoStack.shift();
        }
        
        // Save to localStorage if autoSave is enabled
        if (appState.autosave) {
            localStorage.setItem('mindflow_last_map', JSON.stringify(mindMap));
        }
        
        // Mark that changes are pending
        appState.pendingChanges = true;
    }
    
    function undo() {
        if (appState.undoStack.length === 0) {
            showToast('Nothing to undo', 'info');
            return;
        }
        
        // Save current state to redo stack
        appState.redoStack.push(JSON.stringify(mindMap));
        
        // Restore previous state
        const previousState = appState.undoStack.pop();
        mindMap = JSON.parse(previousState);
        
        // Update UI
        if (mapTitle) mapTitle.value = mindMap.title;
        
        // Re-render
        renderMindMap();
        showToast('Undo successful', 'success');
    }
    
    function redo() {
        if (appState.redoStack.length === 0) {
            showToast('Nothing to redo', 'info');
            return;
        }
        
        // Save current state to undo stack
        appState.undoStack.push(JSON.stringify(mindMap));
        
        // Restore next state
        const nextState = appState.redoStack.pop();
        mindMap = JSON.parse(nextState);
        
        // Update UI
        if (mapTitle) mapTitle.value = mindMap.title;
        
        // Re-render
        renderMindMap();
        showToast('Redo successful', 'success');
    }
    
    function autoSave() {
        if (appState.autosave && appState.pendingChanges) {
            saveMindMap();
            appState.pendingChanges = false;
        }
    }
    
    // ======= NODE MENU =======
    
    // Add styles for the node menu (it will be visible when a node is selected)
    const nodeMenuStyle = document.createElement('style');
    nodeMenuStyle.textContent = `
        .node-menu {
            position: absolute;
            display: none;
            background-color: var(--bg-color);
            border-radius: var(--border-radius);
            box-shadow: var(--box-shadow-md);
            padding: 5px;
            z-index: 50;
        }
        
        .node-menu-btn {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background-color: var(--bg-alt-color);
            border: none;
            color: var(--text-light);
            margin: 0 3px;
            cursor: pointer;
            transition: var(--transition);
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .node-menu-btn:hover {
            background-color: var(--primary-light);
            color: white;
        }
        
        .node-menu-btn.disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        .connection-source {
            box-shadow: 0 0 0 3px var(--secondary-color);
        }
        
        .flashcard {
            width: 100%;
            height: 200px;
            perspective: 1000px;
            margin-bottom: 20px;
        }
        
        .flashcard-front, .flashcard-back {
            position: absolute;
            width: 100%;
            height: 100%;
            backface-visibility: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            border-radius: var(--border-radius);
            box-shadow: var(--box-shadow);
            background-color: var(--bg-alt-color);
            transition: transform 0.6s;
        }
        
        .flashcard-back {
            transform: rotateY(180deg);
        }
        
        .flashcard.flipped .flashcard-front {
            transform: rotateY(180deg);
        }
        
        .flashcard.flipped .flashcard-back {
            transform: rotateY(0deg);
        }
        
        .flashcard-controls {
            display: flex;
            justify-content: center;
            gap: 10px;
            margin-top: 10px;
        }
        
        .flashcard-controls button {
            padding: 8px 16px;
            background-color: var(--bg-alt-color);
            border: 1px solid var(--border-color);
            border-radius: var(--border-radius);
            cursor: pointer;
            transition: var(--transition);
        }
        
        .flashcard-controls button:hover {
            background-color: var(--primary-light);
            color: white;
        }
    `;
    document.head.appendChild(nodeMenuStyle);
    
    // Initialize the application
    init();
});