/**
 * Interactive confirmation prompt for dangerous operations.
 * Used by Agent and WorkerAgent before executing destructive commands.
 */
export interface DangerInfo {
    reason: string;
    severity: 'high' | 'critical';
}
/**
 * Ask the user to confirm a dangerous command.
 * Stops any active spinner before prompting, then resumes after.
 * Returns true if user approved, false if rejected.
 */
export declare function askConfirmation(command: string, danger: DangerInfo): Promise<boolean>;
//# sourceMappingURL=ConfirmHelper.d.ts.map