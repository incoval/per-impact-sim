import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import PERRecommendation from './PERRecommendation';
import { computePERRecommendation } from '@/lib/per-recommendation';

let container: HTMLDivElement;
let root: Root;
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});
const parameters = { year: 2026, revenuNet: 33697 / 0.9, versementPER: 5000, parts: 1, report5ans: true };

it('applique le conseil et se recalcule après modification des paramètres', () => {
  const onApply = vi.fn();
  act(() => root.render(<PERRecommendation recommendations={[computePERRecommendation(parameters)]} onApply={onApply} />));
  act(() => container.querySelector('button')!.click());
  expect(onApply).toHaveBeenCalledWith(2026, 4117);
  act(() => root.render(<PERRecommendation recommendations={[computePERRecommendation({ ...parameters, versementPER: 3000 })]} onApply={onApply} />));
  expect(container.textContent).toContain('bénéficie intégralement');
  expect(container.querySelector('button')).toBeNull();
});

it('permet de consulter plusieurs années dans un seul encart', () => {
  const recommendations = [computePERRecommendation(parameters), computePERRecommendation({ ...parameters, year: 2027, revenuNet: parameters.revenuNet * 1.02 })];
  act(() => root.render(<PERRecommendation recommendations={recommendations} />));
  act(() => {
    const select = container.querySelector('select')!;
    select.value = '2027';
    select.dispatchEvent(new Event('change', { bubbles: true }));
  });
  expect(container.querySelector('h3')?.textContent).toBe('Notre préconisation pour 2027');
  expect(container.querySelectorAll('section')).toHaveLength(1);
});
