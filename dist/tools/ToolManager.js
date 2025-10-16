"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolManager = void 0;
const ReadTool_1 = require("./ReadTool");
const WriteTool_1 = require("./WriteTool");
const EditTool_1 = require("./EditTool");
const BashTool_1 = require("./BashTool");
const GlobTool_1 = require("./GlobTool");
const GrepTool_1 = require("./GrepTool");
const GitStatusTool_1 = require("./GitStatusTool");
const GitDiffTool_1 = require("./GitDiffTool");
const GitCommitTool_1 = require("./GitCommitTool");
const GitBranchTool_1 = require("./GitBranchTool");
const GitLogTool_1 = require("./GitLogTool");
class ToolManager {
    config;
    workingDir;
    snapshotManager;
    tools = new Map();
    constructor(config, workingDir, snapshotManager) {
        this.config = config;
        this.workingDir = workingDir;
        this.snapshotManager = snapshotManager;
        this.initializeTools();
    }
    initializeTools() {
        const toolConfig = this.config.get('tools');
        // Tools that need SnapshotManager for automatic backups
        if (toolConfig['write']) {
            const writeTool = new WriteTool_1.WriteTool(this.workingDir, this.config, this.snapshotManager);
            this.tools.set(writeTool.name, writeTool);
        }
        if (toolConfig['edit']) {
            const editTool = new EditTool_1.EditTool(this.workingDir, this.config, this.snapshotManager);
            this.tools.set(editTool.name, editTool);
        }
        // Other tools (no snapshot support needed)
        const standardToolClasses = [
            ReadTool_1.ReadTool,
            BashTool_1.BashTool,
            GlobTool_1.GlobTool,
            GrepTool_1.GrepTool,
            GitStatusTool_1.GitStatusTool,
            GitDiffTool_1.GitDiffTool,
            GitCommitTool_1.GitCommitTool,
            GitBranchTool_1.GitBranchTool,
            GitLogTool_1.GitLogTool
        ];
        for (const ToolClass of standardToolClasses) {
            const tool = new ToolClass(this.workingDir, this.config);
            if (toolConfig[tool.name]) {
                this.tools.set(tool.name, tool);
            }
        }
    }
    getToolSchemas() {
        return Array.from(this.tools.values()).map(tool => ({
            name: tool.name,
            description: tool.description,
            parameters: {
                type: 'object',
                properties: tool.parameters,
                required: Object.keys(tool.parameters)
            }
        }));
    }
    getTool(name) {
        return this.tools.get(name);
    }
    async executeTool(name, args) {
        const tool = this.tools.get(name);
        if (!tool) {
            throw new Error(`Tool not found: ${name}`);
        }
        return tool.execute(args);
    }
    getToolList() {
        return Array.from(this.tools.values()).map(tool => ({
            name: tool.name,
            description: tool.description
        }));
    }
}
exports.ToolManager = ToolManager;
//# sourceMappingURL=ToolManager.js.map