function App() {
  return (
    <main className="shell">
      <header className="hero">
        <p className="eyebrow">Steps</p>
        <h1>Guided actions, one step at a time</h1>
        <p className="lede">
          A catalog of complex life processes — search an action, follow clear
          steps, track what you have done, and return later to continue.
        </p>
      </header>

      <section className="status" aria-label="Project status">
        <p>
          <strong>Phase 0:</strong> scaffold and documentation. Features
          (accounts, search, progress, contributor editor) are planned in{' '}
          <code>PLAN.md</code>.
        </p>
      </section>
    </main>
  )
}

export default App
