# Issue Creation

When user selects "Create Issue", detect their project tracker from AGENTS.md:

1. **Check for tracker preference** in AGENTS.md (global or project). Fall back to CLAUDE.md:
   - Look for `project_tracker: github` or `project_tracker: linear`

2. **If GitHub:**
   ```bash
   gh issue create --title "<type>: <title>" --body-file <plan_path>
   ```

3. **If Linear:**
   ```bash
   linear issue create --title "<title>" --description "$(cat <plan_path>)"
   ```

4. **If no tracker configured:**
   Ask user: "Which project tracker do you use? (GitHub/Linear/Other)"
   Suggest adding `project_tracker:` to AGENTS.md.

5. **After creation:** Display the issue URL, offer `/fv:work`.
