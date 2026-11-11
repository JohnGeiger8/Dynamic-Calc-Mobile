export default function Battle() {
  return <div className="shell">
    <header className="header"><div><p className="eyebrow">DYNAMIC CALC</p><h1>Battle</h1></div><span className="game">Emerald Kaizo</span></header>
    <main id="main">
      <div className="intro"><p className="eyebrow">MATCHUP</p><h2>Set up your battle</h2><p>Choose both Pokémon to compare their moves.</p></div>
      <div className="combatants">
        <section className="card" aria-labelledby="your-heading"><p className="side">YOUR SIDE</p><h2 id="your-heading">Your Pokémon</h2><div className="empty"><span className="empty-icon" aria-hidden="true">+</span><div><h3>No Pokémon selected</h3><p>Selection will be available in a future update.</p></div></div></section>
        <section className="card" aria-labelledby="opponent-heading"><p className="side">OPPOSING SIDE</p><h2 id="opponent-heading">Opponent</h2><div className="empty"><span className="empty-icon" aria-hidden="true">+</span><div><h3>No Pokémon selected</h3><p>Selection will be available in a future update.</p></div></div></section>
      </div>
      <section className="results" aria-labelledby="results-heading"><p className="eyebrow">RESULTS</p><h2 id="results-heading">Damage comparison</h2><p>Select both Pokémon to see a comparison when calculations are available.</p></section>
    </main>
    <footer><span aria-current="page">Battle</span><a href="../index.html">Desktop calculator</a></footer>
  </div>;
}
