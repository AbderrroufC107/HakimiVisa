import { render, screen } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { BulkActionToolbar } from '@/components/bulk/bulk-action-toolbar';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/services/bulk', () => ({
  bulkService: {
    statusChange: vi.fn(),
    createAppointments: vi.fn(),
    exportPdf: vi.fn(),
    exportExcel: vi.fn(),
    archive: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('BulkActionToolbar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null when no items selected and no result', () => {
    const { container } = render(
      <BulkActionToolbar selectedIds={[]} onClearSelection={vi.fn()} onRefresh={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('shows action buttons when items are selected', () => {
    render(
      <BulkActionToolbar selectedIds={['1', '2']} onClearSelection={vi.fn()} onRefresh={vi.fn()} />,
    );
    expect(screen.getByText('2 selected')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Status/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Appointment/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /PDF/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Excel/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Archive/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Delete/ })).toBeInTheDocument();
  });

  it('shows clear selection button', () => {
    const onClearSelection = vi.fn();
    render(
      <BulkActionToolbar selectedIds={['1']} onClearSelection={onClearSelection} onRefresh={vi.fn()} />,
    );
    expect(screen.getByRole('button', { name: '' })).toBeInTheDocument();
  });

  it('opens status change dialog on Status click', async () => {
    const user = userEvent.setup();
    render(
      <BulkActionToolbar selectedIds={['1']} onClearSelection={vi.fn()} onRefresh={vi.fn()} />,
    );
    await user.click(screen.getByRole('button', { name: /Status/ }));
    expect(screen.getByText(/Change Status for 1 Case/)).toBeInTheDocument();
  });

  it('opens appointment dialog on Appointment click', async () => {
    const user = userEvent.setup();
    render(
      <BulkActionToolbar selectedIds={['1']} onClearSelection={vi.fn()} onRefresh={vi.fn()} />,
    );
    await user.click(screen.getByRole('button', { name: /Appointment/ }));
    expect(screen.getByText(/Assign Appointment to 1 Case/)).toBeInTheDocument();
  });

  it('opens delete confirm dialog on Delete click', async () => {
    const user = userEvent.setup();
    render(
      <BulkActionToolbar selectedIds={['1']} onClearSelection={vi.fn()} onRefresh={vi.fn()} />,
    );
    await user.click(screen.getByRole('button', { name: /Delete/ }));
    expect(screen.getByText(/Delete 1 Case/)).toBeInTheDocument();
  });

  it('handles single item vs multiple items count text', () => {
    const { rerender } = render(
      <BulkActionToolbar selectedIds={['1']} onClearSelection={vi.fn()} onRefresh={vi.fn()} />,
    );
    expect(screen.getByText('1 selected')).toBeInTheDocument();

    rerender(
      <BulkActionToolbar selectedIds={['1', '2', '3']} onClearSelection={vi.fn()} onRefresh={vi.fn()} />,
    );
    expect(screen.getByText('3 selected')).toBeInTheDocument();
  });
});
