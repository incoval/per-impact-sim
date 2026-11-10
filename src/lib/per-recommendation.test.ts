import { describe, it, expect } from 'vitest';
import { computePERRecommendation } from './per-recommendation';
import { computeIRWithPER, generateScenarios, TRANCHES_IR_2025 } from './tax-engine';

const base = { year: 2026, revenuNet: 33697 / 0.9, versementPER: 5000, parts: 1, report5ans: true };

describe('préconisation PER', () => {
  it('affiche le seuil de 7 050 € même si le versement envisagé est de 4 100 €', () => {
    const r = computePERRecommendation({ ...base, revenuNet: 90000, parts: 2.5, versementPER: 4100 });
    expect(r.montantAvantTrancheInferieure).toBe(7050);
    expect(r.recommande).toBe(4100);
    expect(r.plafondAvantTranche).toBe(false);
  });
  it('limite le montant affiché au plafond disponible lorsque le seuil est inaccessible', () => {
    const r = computePERRecommendation({ ...base, plafondDisponible: 2000 });
    expect(r.montantAvantTrancheInferieure).toBe(2000);
    expect(r.plafondAvantTranche).toBe(true);
  });
  it('répartit 5 000 € en 4 117 € à 30 % et 883 € à 11 %', () => {
    const r = computePERRecommendation(base);
    expect(r.recommande).toBe(4117);
    expect(r.surplus).toBe(883);
    expect(r.portions).toEqual([{ taux: 0.3, montant: 4117 }, { taux: 0.11, montant: 883 }]);
  });
  it('ne réduit pas un versement entièrement dans la TMI initiale', () => {
    const r = computePERRecommendation({ ...base, versementPER: 3000 });
    expect(r.recommande).toBe(3000);
    expect(r.surplus).toBe(0);
  });
  it('répartit exactement plusieurs tranches, dont la tranche non imposée', () => {
    const r = computePERRecommendation({ ...base, revenuNet: 40000 / 0.9, versementPER: 35000, plafondDisponible: 40000 });
    expect(r.portions).toEqual([
      { taux: 0.3, montant: 10420 }, { taux: 0.11, montant: 17980 }, { taux: 0, montant: 6600 },
    ]);
    expect(r.portions.reduce((sum, p) => sum + p.montant, 0)).toBe(r.deductible);
  });
  it('limite le conseil au plafond PER sans confondre plafond et TMI', () => {
    const r = computePERRecommendation({ ...base, plafondDisponible: 2000 });
    expect(r.recommande).toBe(2000);
    expect(r.nonDeductible).toBe(3000);
    expect(r.plafondLimitant).toBe(true);
    expect(r.portionsInferieures).toEqual([]);
  });
  it('réutilise les revenus et plafonds propres à chaque année, avec une croissance de 2 %', () => {
    const first = computePERRecommendation(base);
    const nextParameters = { ...base, year: 2027, revenuNet: base.revenuNet * 1.02 };
    const next = computePERRecommendation(nextParameters);
    expect(next.year).toBe(2027);
    expect(next.recommande).toBe(4791);
    expect(next.recommande).toBeGreaterThan(first.recommande);
    // Both years remain at the minimum annual ceiling.
    expect(next.plafond).toBe(first.plafond);
    expect(next.tmiApres).toBe(computeIRWithPER(nextParameters.revenuNet, 5000, 1).apres.tmi);
  });
  it.each([0.11, 0.3, 0.41, 0.45])('traite la TMI %s avec des parts fractionnaires', (taux) => {
    const bracket = TRANCHES_IR_2025.find((b) => b.taux === taux)!;
    const taxable = bracket.min * 1.5 + 1000;
    // Invert the existing allowance, including its cap.
    const revenuNet = taxable / 0.9 <= 144260 ? taxable / 0.9 : taxable + 14426;
    const r = computePERRecommendation({ ...base, revenuNet, parts: 1.5, versementPER: 1500, plafondDisponible: 10000 });
    expect(r.tmiAvant).toBe(taux);
    expect(r.recommande).toBe(1000);
    expect(r.portions[0]).toEqual({ taux, montant: 1000 });
    expect(r.portionsInferieures.reduce((sum, p) => sum + p.montant, 0)).toBe(500);
  });
  it('distingue atteindre une frontière et verser dans la tranche inférieure', () => {
    const r = computePERRecommendation({ ...base, versementPER: 4117 });
    expect(r.tmiApres).toBe(0.11);
    expect(r.surplus).toBe(0);
    expect(r.portionsInferieures).toEqual([]);
    expect(computePERRecommendation({ ...base, versementPER: 4118 }).surplus).toBe(1);
  });
  it('respecte les arrondis du moteur et arrondit le plafond vers le bas', () => {
    expect(computePERRecommendation({ ...base, revenuNet: 33696.49 / 0.9 }).recommande).toBe(4116);
    expect(computePERRecommendation({ ...base, revenuNet: 33696.51 / 0.9 }).recommande).toBe(4117);
    expect(computePERRecommendation({ ...base, plafondDisponible: 2000.9 }).recommande).toBe(2000);
  });
  it('ne préconise aucune économie immédiate à TMI nulle', () => {
    expect(computePERRecommendation({ ...base, revenuNet: 10000 }).recommande).toBe(0);
    expect(computePERRecommendation({ ...base, versementPER: 0 }).surplus).toBe(0);
  });
  it('conserve les résultats existants utilisés par les graphiques et le PDF', () => {
    const parameters = { ...base, revenuNet: 40000, versementPER: 4100 };
    const before = computeIRWithPER(40000, 4100, 1);
    const scenarios = generateScenarios(40000, 4100, 1);
    computePERRecommendation(parameters);
    expect(before.gain).toBe(1230);
    expect(computeIRWithPER(40000, 4100, 1)).toEqual(before);
    expect(generateScenarios(40000, 4100, 1)).toEqual(scenarios);
  });
});
