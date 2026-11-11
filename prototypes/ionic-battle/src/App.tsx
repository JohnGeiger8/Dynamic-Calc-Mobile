import { useRef, useState } from 'react';
import {
  IonApp, IonButton, IonContent, IonHeader, IonModal, IonPage,
  IonSearchbar, IonTitle, IonToolbar,
} from '@ionic/react';

type Side = 'player' | 'opponent';
type Sample = { id: string; name: string; description: string; maxHp: number; level: number };
type Selected = Sample & { currentHp: number };

const samples: Sample[] = [
  { id: 'swampert', name: 'Swampert', description: 'Water / Ground · sample', maxHp: 190, level: 50 },
  { id: 'sceptile', name: 'Sceptile', description: 'Grass · sample', maxHp: 155, level: 50 },
  { id: 'gardevoir', name: 'Gardevoir', description: 'Psychic · sample', maxHp: 158, level: 50 },
  { id: 'metagross', name: 'Metagross', description: 'Steel / Psychic · sample', maxHp: 165, level: 50 },
  { id: 'long-name', name: 'A very long sample combatant name', description: 'Wrap and enlargement check', maxHp: 180, level: 50 },
];

function label(side: Side): string {
  return side === 'player' ? 'Your Pokémon' : 'Opponent';
}

export default function App() {
  const [selected, setSelected] = useState<Record<Side, Selected | null>>({ player: null, opponent: null });
  const [pickerSide, setPickerSide] = useState<Side | null>(null);
  const [hpSide, setHpSide] = useState<Side | null>(null);
  const [search, setSearch] = useState('');
  const [draftHp, setDraftHp] = useState('');
  const hpModal = useRef<HTMLIonModalElement>(null);
  const pickerModal = useRef<HTMLIonModalElement>(null);
  const focusReturn = useRef<HTMLElement | null>(null);

  const filtered = samples.filter(item => item.name.toLowerCase().includes(search.trim().toLowerCase()));
  const hpTarget = hpSide ? selected[hpSide] : null;
  const numericHp = Number(draftHp);
  const hpValid = draftHp.trim() !== '' && Number.isInteger(numericHp) && numericHp >= 0 && !!hpTarget && numericHp <= hpTarget.maxHp;

  function rememberFocus() {
    focusReturn.current = document.activeElement as HTMLElement | null;
  }

  function restoreFocus() {
    requestAnimationFrame(() => focusReturn.current?.focus());
  }

  function openPicker(side: Side) {
    rememberFocus();
    setSearch('');
    setPickerSide(side);
  }

  function choose(sample: Sample) {
    if (!pickerSide) return;
    setSelected(current => ({ ...current, [pickerSide]: { ...sample, currentHp: sample.maxHp } }));
    setPickerSide(null);
  }

  function openHp(side: Side) {
    const target = selected[side];
    if (!target) return;
    rememberFocus();
    setDraftHp(String(target.currentHp));
    setHpSide(side);
  }

  function saveHp() {
    if (!hpSide || !hpValid) return;
    setSelected(current => ({
      ...current,
      [hpSide]: current[hpSide] && { ...current[hpSide], currentHp: numericHp },
    }));
    setHpSide(null);
  }

  return (
    <IonApp>
      <IonPage>
        <IonHeader className="topbar">
          <IonToolbar>
            <IonTitle>Battle <span className="header-suffix">/ interaction study</span></IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="battle-content">
          <main className="shell">
            <div className="eyebrow">EMERALD KAIZO · UI STACK STUDY</div>
            <h1>Read the matchup at a glance.</h1>
            <p className="intro">Try selection, search, and HP editing. Names and HP are illustrative; no game data or damage engine is connected.</p>
            <section aria-label="Battle combatants" className="cards">
              {(['player', 'opponent'] as const).map(side => {
                const value = selected[side];
                return <article className="combatant" key={side} aria-label={label(side)}>
                  <div className="card-topline"><span className="role">{label(side)}</span><span className="sample-badge">SAMPLE</span></div>
                  <div className="identity">
                    <div className="avatar" aria-hidden="true">{value?.name.slice(0, 1) ?? '?'}</div>
                    <div className="identity-text">
                      <h2>{value?.name ?? 'No selection'}</h2>
                      <p>{value ? `Lv. ${value.level} · ${value.description}` : 'Choose a sample to test the flow'}</p>
                    </div>
                  </div>
                  <div className="hp-line"><span>Current HP</span><strong>{value ? `${value.currentHp} / ${value.maxHp}` : '—'}</strong></div>
                  <div className="card-actions">
                    <IonButton fill="solid" onClick={() => openPicker(side)} aria-label={`Choose ${label(side).toLowerCase()}`}>
                      {value ? 'Change' : 'Choose'}
                    </IonButton>
                    <IonButton fill="outline" disabled={!value} onClick={() => openHp(side)} aria-label={`Edit ${label(side).toLowerCase()} HP`}>Edit HP</IonButton>
                  </div>
                </article>;
              })}
            </section>
            <section className="empty-results" aria-label="Damage results">
              <div className="empty-icon" aria-hidden="true">≈</div>
              <div><h2>Damage results unavailable</h2><p>This study tests the interface boundary. Issue #17 connects pinned Emerald Kaizo calculations; this screen does not estimate damage.</p></div>
            </section>
            <p className="prototype-note">Prototype for issue #15 · Desktop calculator remains at the repository root.</p>
          </main>
        </IonContent>
      </IonPage>

      <IonModal ref={pickerModal} isOpen={pickerSide !== null} onDidDismiss={() => { setPickerSide(null); restoreFocus(); }} className="picker-modal">
        <IonHeader><IonToolbar><IonTitle>Choose {pickerSide ? label(pickerSide).toLowerCase() : 'sample'}</IonTitle><IonButton slot="end" fill="clear" onClick={() => setPickerSide(null)}>Cancel</IonButton></IonToolbar></IonHeader>
        <IonContent className="modal-content">
          <div className="modal-inner">
            <p className="modal-help">Illustrative entries for interaction testing only.</p>
            <IonSearchbar aria-label="Search sample Pokémon" placeholder="Search sample Pokémon" value={search} onIonInput={event => setSearch(event.detail.value ?? '')} debounce={0} />
            {filtered.length ? <ul className="picker-list">{filtered.map(sample => <li key={sample.id}><button type="button" onClick={() => choose(sample)}><strong>{sample.name}</strong><span>{sample.description}</span></button></li>)}</ul> : <div className="no-results" role="status">No sample matches “{search}”. <button type="button" onClick={() => setSearch('')}>Clear search</button></div>}
          </div>
        </IonContent>
      </IonModal>

      <IonModal ref={hpModal} isOpen={hpSide !== null} breakpoints={[0, 0.65, 1]} initialBreakpoint={0.65} onDidDismiss={() => { setHpSide(null); restoreFocus(); }} className="hp-modal">
        <IonHeader><IonToolbar><IonTitle>Edit {hpSide ? label(hpSide).toLowerCase() : ''} HP</IonTitle></IonToolbar></IonHeader>
        <IonContent className="modal-content">
          <div className="modal-inner hp-form">
            <p className="modal-help">{hpTarget?.name} · maximum {hpTarget?.maxHp} HP</p>
            <label htmlFor="current-hp">Current HP</label>
            <input id="current-hp" type="number" inputMode="numeric" min="0" max={hpTarget?.maxHp} step="1" value={draftHp} aria-describedby="hp-guidance hp-error" aria-invalid={!hpValid} onFocus={() => { void hpModal.current?.setCurrentBreakpoint(1); }} onChange={event => setDraftHp(event.target.value)} />
            <p id="hp-guidance" className="guidance">Enter a whole number from 0 to {hpTarget?.maxHp}.</p>
            {!hpValid && <p id="hp-error" className="error" role="alert">Enter a whole number within the HP range.</p>}
            <div className="sheet-actions"><IonButton fill="outline" onClick={() => setHpSide(null)}>Cancel</IonButton><IonButton disabled={!hpValid} onClick={saveHp}>Done</IonButton></div>
          </div>
        </IonContent>
      </IonModal>
    </IonApp>
  );
}
