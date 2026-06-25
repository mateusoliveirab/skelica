# Quick Launch Components API Surface (design docs)

- QuickLaunchButton (Claude)
- QuickLaunchButton (ChatGPT)
- PromptV2Preview (readonly, monospace)
- FallbackInlinePanel (popover-style inline fallback)
- AIButtons (container for provider buttons)

Props (example):
- provider: 'claude'|'chatgpt'
- onClick: () => void
- disabled: boolean
- locale: string
- ariaLabel: string
