The base surface for grouping content. `card` and `elevated` are solid white app surfaces; `glass` (legacy name) and `hero` are solid outlined panels with hard offset shadows.

```jsx
<Panel variant="card" padding={24}>…</Panel>
<Panel variant="hero">  {/* solid lime top-bar */}
  <h2>Welcome back, Sarnai</h2>
</Panel>
```

Use `hero` for the dashboard greeting / primary panel, `glass` for content panels on the landing page, `card`/`elevated` inside the app shell.
