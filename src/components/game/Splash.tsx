import heroImg from "@/assets/bustville-hero.jpg";

export function Splash({ onStart, onReset }: { onStart: () => void; onReset: () => void }) {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <img
        src={heroImg}
        alt="Bustville at dusk"
        className="absolute inset-0 h-full w-full object-cover opacity-50"
        width={1536}
        height={896}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/70 to-background" />
      <div className="absolute inset-0 scan-lines opacity-30" />
      <div className="relative z-10 mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 text-center">
        <p className="font-display text-xs uppercase tracking-[0.4em] text-accent">
          A Lula-style sim
        </p>
        <h1 className="mt-4 text-6xl font-black uppercase leading-none neon-text md:text-8xl">
          Bustville
          <br />
          Empire
        </h1>
        <p className="mt-6 max-w-xl text-balance text-lg text-muted-foreground">
          Klikk deg gjennom byen. Brygg moonshine bak skuret, bestikk sheriffen, rekrutter dansere
          på Dirty Dan's, og bygg deg opp til neon-imperium.
        </p>
        <button
          onClick={() => {
            onReset();
            onStart();
          }}
          className="mt-10 rounded-xl bg-primary px-10 py-5 text-2xl font-black uppercase tracking-widest text-primary-foreground pulse-pink hover:brightness-110 transition"
        >
          ▶ Start a New Empire
        </button>
        <button
          onClick={onStart}
          className="mt-3 text-sm text-muted-foreground underline hover:text-foreground"
        >
          Continue saved game
        </button>
        <p className="mt-10 text-xs text-muted-foreground/70">
          Satirical comedy game. All characters fictional. 18+.
        </p>
      </div>
    </main>
  );
}

export function WinScreen({ onReset }: { onReset: () => void }) {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 text-center">
      <div className="max-w-xl">
        <p className="text-accent uppercase tracking-[0.3em] text-xs">Epilogue</p>
        <h1 className="mt-3 text-6xl font-black neon-text">Porn King of the South</h1>
        <p className="mt-6 text-muted-foreground text-lg">
          Du startet i en rusten trailer. Nå har du et imperium.
        </p>
        <button
          onClick={onReset}
          className="mt-8 rounded-xl bg-primary px-8 py-4 font-black uppercase tracking-widest text-primary-foreground pulse-pink"
        >
          Play Again
        </button>
      </div>
    </main>
  );
}
