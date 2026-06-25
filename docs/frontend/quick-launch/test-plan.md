# Test Plan – Quick Launch: Claude & ChatGPT

- Unit tests:
  - Render of Claude and ChatGPT quick-launch buttons
  - ARIA and accessibility attributes present
  - Keyboard navigation flows (Tab, Shift+Tab, Enter/Space triggers)
- Integration tests:
  - Clicking Claude opens URL with prefilled Prompt V2 when allowed
  - Popup-block fallback path triggers inline panel and copy-to-editor flow
- Usability tests:
  - 5-8 participants simulate translation tasks; measure time-to-launch and success rate
- Performance:
  - Ensure popup/open latency < 300ms; fallback surface loads within 200ms
- Accessibility:
  - Screen reader pass with ATs; WCAG AA checks
