import { useState, useMemo } from 'react';
import { computeIRWithPER, computePlafondPER } from '@/lib/tax-engine';
import { exportPDF } from '@/lib/export-pdf';
import ClientInfo, { type ClientData } from './ClientInfo';
import Hypotheses from './Hypotheses';
import KPICards from './KPICards';
import ScenarioTable from './ScenarioTable';
import TaxChart from './TaxChart';
import { toast } from 'sonner';

const DEFAULTS = {
  revenuNet: 40000,
  versementPER: 4100,
  parts: 1,
};

export default function PERSimulator() {
  const [client, setClient] = useState<ClientData>({ nom: '', prenom: '', age: '' });
  const [revenuNet, setRevenuNetRaw] = useState(DEFAULTS.revenuNet);
  const [versementPER, setVersementPER] = useState(DEFAULTS.versementPER);
  const [parts, setParts] = useState(DEFAULTS.parts);

  const setRevenuNet = (v: number) => {
    setRevenuNetRaw(v);
    const plafond = computePlafondPER(v);
    setVersementPER((prev) => Math.min(prev, plafond));
  };

  const result = useMemo(
    () => computeIRWithPER(revenuNet, versementPER, parts),
    [revenuNet, versementPER, parts]
  );

  const handleReset = () => {
    setRevenuNetRaw(DEFAULTS.revenuNet);
    setVersementPER(DEFAULTS.versementPER);
    setParts(DEFAULTS.parts);
    setClient({ nom: '', prenom: '', age: '' });
  };

  const handleExportPDF = () => {
    if (!client.nom || !client.prenom || !client.age) {
      toast.error('Veuillez remplir les informations client (Nom, Prénom, Âge) avant l\'export.');
      return;
    }
    exportPDF(client, revenuNet, versementPER, parts);
    toast.success('PDF exporté avec succès !');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <h1 className="text-2xl md:text-3xl text-primary">
            Simulateur PER – Gain fiscal (IR)
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Estimez votre économie d'impôt grâce au Plan d'Épargne Retraite
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 space-y-6">
        {/* Client info */}
        <ClientInfo data={client} onChange={setClient} />

        {/* 2 columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left - Results */}
          <div className="lg:col-span-2 space-y-6">
            <KPICards avant={result.avant} apres={result.apres} gain={result.gain} />
            <TaxChart
              impotAvant={result.avant.impot}
              impotApres={result.apres.impot}
              riAvant={result.avant.revenuImposable}
              riApres={result.apres.revenuImposable}
            />
            <ScenarioTable revenuNet={revenuNet} versementPER={versementPER} parts={parts} />
          </div>

          {/* Right - Hypotheses */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24">
              <Hypotheses
                revenuNet={revenuNet}
                setRevenuNet={setRevenuNet}
                versementPER={versementPER}
                setVersementPER={setVersementPER}
                parts={parts}
                setParts={setParts}
                onReset={handleReset}
                onExportPDF={handleExportPDF}
              />
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-border mt-12 py-4 text-center text-xs text-muted-foreground">
        Barème IR 2025 — Calcul simplifié, hors décote et contributions exceptionnelles.
      </footer>
    </div>
  );
}
