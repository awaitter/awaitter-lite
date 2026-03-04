/**
 * CharlKnowledge — bakes the Charl ML language into awaitter's knowledge base.
 *
 * Charl is a statically-typed programming language for AI/ML research.
 * Because it is too new to be in any model's training data, this module
 * reads the cloned repo and compiles a comprehensive reference that is
 * injected into EVERY agent's system prompt whenever a .ch/.charl project
 * is detected — making awaitter a native Charl expert.
 *
 * Repo expected at: ~/Projects/charlcode
 */
export declare function getCharlBinPath(): string | null;
/**
 * Returns true if the working directory contains Charl source files.
 * Used to decide whether to inject the knowledge pack.
 */
export declare function isCharlProject(workingDir: string): boolean;
/**
 * Builds the Charl knowledge pack from the cloned repo.
 * Always returns a useful pack — either from the live repo or the embedded fallback.
 *
 * @param compact  true = shorter version for 8K-context models (qwen 14b/32b)
 *                 false = full version for large-context models
 */
export declare function getCharlKnowledgePack(compact?: boolean): string;
//# sourceMappingURL=CharlKnowledge.d.ts.map