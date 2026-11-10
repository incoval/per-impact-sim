import { act, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Simulate } from 'react-dom/test-utils';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { TooltipProvider } from './ui/tooltip';
import IncomeEntry from './IncomeEntry';
import Hypotheses from './Hypotheses';
import { computeIRWithPER } from '@/lib/tax-engine';

let container: HTMLDivElement;
let root: Root;
const onCouple = vi.fn();
function Harness() {
  const [annual, setAnnual] = useState(96000);
  const [couple, setCouple] = useState(false);
  const tax = computeIRWithPER(annual, 3900, 2.5);
  return <TooltipProvider>
    <IncomeEntry revenuNet={annual} onChange={setAnnual} couple={couple} onCoupleChange={(value) => { setCouple(value); onCouple(); }} />
    <output data-testid="annual">{annual}</output>
    <output data-testid="taxable">{tax.avant.revenuImposable}</output>
  </TooltipProvider>;
}
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.stubGlobal('ResizeObserver', class {
    observe() {}
    unobserve() {}
    disconnect() {}
  });
  onCouple.mockClear();
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
  act(() => root.render(<Harness />));
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});
function monthly() {
  act(() => {
    const select = container.querySelector('select')!;
    select.value = 'monthly';
    select.dispatchEvent(new Event('change', { bubbles: true }));
  });
}
function changeIncome(id: string, value: string) {
  act(() => {
    const input = container.querySelector<HTMLInputElement>(id)!;
    input.value = value;
    Simulate.change(input);
  });
}

it('conserve la saisie annuelle et applique toujours automatiquement l’abattement', () => {
  expect(container.querySelector('#annual-income')).not.toBeNull();
  changeIncome('#annual-income', '80000');
  expect(container.querySelector('[data-testid="taxable"]')?.textContent).toBe('72000');
  expect(container.textContent).not.toContain("Revenu net imposable de l'avis");
});

it('annualise un revenu mensuel sans changer le calcul fiscal', () => {
  monthly();
  expect(container.querySelector<HTMLInputElement>('#monthly-income')?.value).toBe('8000');
  changeIncome('#monthly-income', '5000');
  expect(container.querySelector('[data-testid="annual"]')?.textContent).toBe('60000');
  expect(container.querySelector('[data-testid="taxable"]')?.textContent).toBe('54000');
});

it('additionne les revenus mensuels des conjoints puis applique l’abattement existant', () => {
  monthly();
  act(() => container.querySelector<HTMLInputElement>('#monthly-couple')!.click());
  expect(onCouple).toHaveBeenCalledOnce();
  expect(container.querySelector<HTMLInputElement>('#monthly-income')?.value).toBe('4000');
  changeIncome('#spouse-monthly-income', '3000');
  expect(container.querySelector('[data-testid="annual"]')?.textContent).toBe('84000');
  expect(container.querySelector('[data-testid="taxable"]')?.textContent).toBe('75600');
  changeIncome('#monthly-income', '0');
  expect(container.querySelector('[data-testid="annual"]')?.textContent).toBe('36000');
  expect(container.querySelector<HTMLInputElement>('#spouse-monthly-income')?.value).toBe('3000');
});

it('saisit les deux revenus annuels et conserve leur répartition en passant au mensuel', () => {
  act(() => container.querySelector<HTMLInputElement>('#monthly-couple')!.click());
  changeIncome('#monthly-income', '60000');
  changeIncome('#spouse-monthly-income', '30000');
  expect(container.querySelector('[data-testid="annual"]')?.textContent).toBe('90000');
  monthly();
  expect(container.querySelector<HTMLInputElement>('#monthly-income')?.value).toBe('5000');
  expect(container.querySelector<HTMLInputElement>('#spouse-monthly-income')?.value).toBe('2500');
  expect(container.querySelector('[data-testid="annual"]')?.textContent).toBe('90000');
});

it('passe à deux parts et désactive les choix inférieurs pour un foyer marié', () => {
  function PartsHarness() {
    const [parts, setParts] = useState(1);
    return <TooltipProvider><Hypotheses revenuNet={90000} setRevenuNet={() => {}}
      versementPER={4100} setVersementPER={() => {}} parts={parts} setParts={setParts}
      report5ans={false} setReport5ans={() => {}} onReset={() => {}} onExportPDF={() => {}} />
      <output data-testid="parts">{parts}</output></TooltipProvider>;
  }
  act(() => root.render(<PartsHarness />));
  act(() => container.querySelector<HTMLInputElement>('#monthly-couple')!.click());
  expect(container.querySelector('[data-testid="parts"]')?.textContent).toBe('2');
  act(() => Simulate.keyDown(container.querySelector('button[role="combobox"]')!, { key: 'ArrowDown' }));
  const disabledOptions = Array.from(document.querySelectorAll('[role="option"][data-disabled]'));
  expect(disabledOptions.map((option) => option.textContent)).toEqual(['1 part (célibataire)', '1,5 parts']);
});
