import { expect, it, vi } from 'vitest';

const { save } = vi.hoisted(() => ({ save: vi.fn() }));
vi.mock('jspdf', async (importOriginal) => {
  const original = await importOriginal<typeof import('jspdf')>();
  return {
    ...original,
    default: function (...args: ConstructorParameters<typeof original.default>) {
      const doc = new original.default(...args);
      doc.save = save;
      return doc;
    },
  };
});

import { exportPDF } from './export-pdf';

it('génère le PDF existant et ses tableaux avec un franchissement de tranche', () => {
  exportPDF({ nom: 'Test', prenom: 'Client', age: '40' }, 33697 / 0.9, 5000, 1, true);
  expect(save).toHaveBeenCalledWith('simulation-per-Test-Client.pdf');
});

