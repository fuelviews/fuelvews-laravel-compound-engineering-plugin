# Chrome Browser Integration (claude-in-chrome MCP)

Browser automation tools for visual verification, debugging, and testing during implementation and review.

## Tools

| Tool | What it does | When to use |
|------|-------------|-------------|
| `tabs_context_mcp` | Get current browser tab state | Always call first before automating |
| `navigate` | Open a URL in Chrome | Navigate to local dev site for testing |
| `read_page` | Screenshot + DOM snapshot | Visual verification after UI changes |
| `get_page_text` | Extract visible text from page | Verify rendered content matches expectations |
| `javascript_tool` | Execute JS in page context | Debug Alpine/Livewire state, check runtime values |
| `read_console_messages` | Read browser console output | Catch JS errors, debug Alpine/Livewire |
| `read_network_requests` | Monitor network activity | Verify API calls, check for N+1 HTTP requests |
| `form_input` | Fill form fields | Test form submissions |
| `find` | Find elements on page | Locate UI components for interaction |
| `computer` | Click, scroll, interact with page | Test user flows end-to-end |
| `gif_creator` | Record interaction as GIF | Document UI changes for PR descriptions |
| `resize_window` | Change browser viewport size | Test responsive layouts |

## When to Use Browser Tools

### During fv:work (implementation)

**After UI changes:**
1. `tabs_context_mcp` -- check browser state
2. `navigate` -- go to affected page
3. `read_page` -- screenshot to verify change looks correct
4. `read_console_messages` -- check for JS errors
5. If Livewire/Alpine: `javascript_tool` to verify component state
6. If form changes: `form_input` + `computer` to test the flow
7. `gif_creator` to record interaction for the PR

**When debugging HTTP/JS errors:**
1. `navigate` to the failing route
2. `read_network_requests` to inspect response
3. `read_console_messages` for client-side errors
4. `javascript_tool` to inspect page state

### During fv:review (end-to-end testing)

1. Navigate to affected pages
2. Screenshot for before/after comparison
3. Check console for errors
4. Test form submissions and interactions
5. Record GIFs of key flows for PR documentation

### During fv:work Phase 4 (screenshot capture for PR)

1. `navigate` to the page
2. `read_page` for screenshot (returns screenshot + DOM)
3. `gif_creator` for animated interactions
4. `resize_window` to capture mobile/desktop variants

## Important Notes

- Always call `tabs_context_mcp` first to understand browser state
- Do NOT trigger JavaScript alerts/confirms/prompts -- they block the extension
- Use `read_console_messages` with `pattern` parameter to filter verbose output
- For new tabs, use `tabs_create_mcp` instead of reusing existing tabs
- Browser tools are optional -- only use when the task involves UI, Livewire, or browser-visible behavior
