# Validate Feature Skill

Records a video demonstration of newly implemented frontend functionality using the Chrome browser plugin.

## Usage

```
/validate-feature
```

## When to Use

This skill should be used automatically after implementing any feature that changes frontend behavior, including:
- New UI components or views
- Modified user interactions (forms, buttons, navigation)
- Visual changes to existing features
- New workflows or user journeys

## Prerequisites

- Chrome browser plugin (Claude in Chrome) must be enabled
- Dev servers should be running (use /dev if not)

## Steps

1. **Check if dev servers are running**
   - Backend should be on http://localhost:3000
   - Frontend should be on http://localhost:5173
   - If not running, start them with /dev skill

2. **Initialize browser session**
   - Use `tabs_context_mcp` to get current tab context
   - Create a new tab with `tabs_create_mcp` if needed
   - Navigate to http://localhost:5173

3. **Ask user for demonstration plan**
   - Use `AskUserQuestion` to confirm:
     - What feature was implemented
     - What user actions should be demonstrated
     - What the expected outcome is
   - Determine a meaningful filename for the GIF (e.g., "transaction-filtering-demo.gif")

4. **Start GIF recording**
   - Use `gif_creator` with action: "start_recording"
   - Immediately take a screenshot with `computer` tool to capture initial state

5. **Perform demonstration**
   - Execute the user actions that showcase the new functionality
   - Take screenshots between major steps to ensure smooth playback
   - Narrate what you're doing so the user can follow along

6. **Complete recording**
   - Take a final screenshot before stopping to capture end state
   - Use `gif_creator` with action: "stop_recording"

7. **Export GIF**
   - Use `gif_creator` with action: "export"
   - Set `download: true` to save the file
   - Use the agreed-upon filename
   - Optional: Configure options to show click indicators, action labels, etc.

8. **Confirm completion**
   - Inform the user the GIF has been downloaded
   - Summarize what was demonstrated
   - Ask if additional validation or changes are needed

## Example Flow

After implementing a transaction filtering feature:
1. Verify servers are running
2. Open browser to http://localhost:5173/transactions
3. Start recording
4. Click on filter button, select category, apply filter
5. Show filtered results
6. Stop recording and export as "transaction-category-filter.gif"

## Notes

- Keep demonstrations concise (under 30 seconds when possible)
- Focus on the happy path unless specifically testing error cases
- Always show the complete user journey from start to finish
- If demonstration fails, debug the issue before trying to record again
