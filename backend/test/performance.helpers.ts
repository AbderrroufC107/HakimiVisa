export interface MockVisaCase {
  id: string;
  caseNumber: string;
  clientId: string;
  visaCountry: string;
  visaType: string;
  currentStatus: 'EN_ATTENTE' | 'EN_TRAITEMENT' | 'RDV_OK' | 'VISA_OK' | 'VISA_REFUSEE';
  archived: boolean;
  openingDate: Date;
  notes: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export function generateMockVisaCases(count: number): MockVisaCase[] {
  const statuses: MockVisaCase['currentStatus'][] = [
    'EN_ATTENTE',
    'EN_TRAITEMENT',
    'RDV_OK',
    'VISA_OK',
    'VISA_REFUSEE',
  ];
  const countries = ['France', 'Spain', 'US', 'Canada', 'UK'];
  const visaTypes = ['Schengen', 'B1', 'F1', 'T4', 'Visitor'];

  return Array.from({ length: count }, (_, i) => ({
    id: `mock-vc-${i}`,
    caseNumber: `VISA-2026-${String(i + 1).padStart(4, '0')}`,
    clientId: `mock-client-${i % 100}`,
    visaCountry: countries[i % countries.length],
    visaType: visaTypes[i % visaTypes.length],
    currentStatus: statuses[i % statuses.length],
    archived: i % 10 === 0,
    openingDate: new Date(2026, 0, 1 + i),
    notes: i % 3 === 0 ? `Notes for case ${i}` : null,
    createdBy: 'mock-user',
    createdAt: new Date(2026, 0, 1 + i),
    updatedAt: new Date(2026, 5, 27),
  }));
}

export async function measureTime<T>(fn: () => Promise<T>): Promise<[T, number]> {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  return [result, end - start];
}
