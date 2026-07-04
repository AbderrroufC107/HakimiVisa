import { render, screen } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { DataTable, type Column } from '@/components/shared/data-table';
import { describe, it, expect, vi } from 'vitest';

interface TestItem {
  id: string;
  name: string;
  email: string;
}

const columns: Column<TestItem>[] = [
  { header: 'Name', accessor: (r) => r.name, sortable: true, sortValue: (r) => r.name },
  { header: 'Email', accessor: (r) => r.email },
];

const data: TestItem[] = [
  { id: '1', name: 'Alice', email: 'alice@test.com' },
  { id: '2', name: 'Bob', email: 'bob@test.com' },
  { id: '3', name: 'Charlie', email: 'charlie@test.com' },
];

const keyExtractor = (item: TestItem) => item.id;

describe('DataTable', () => {
  it('renders column headers', () => {
    render(<DataTable columns={columns} data={data} keyExtractor={keyExtractor} />);
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('renders data rows', () => {
    render(<DataTable columns={columns} data={data} keyExtractor={keyExtractor} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Charlie')).toBeInTheDocument();
    expect(screen.getByText('alice@test.com')).toBeInTheDocument();
  });

  it('handles empty state', () => {
    render(
      <DataTable
        columns={columns}
        data={[]}
        keyExtractor={keyExtractor}
        emptyTitle="No records"
        emptyDescription="There are no items to display."
      />,
    );
    expect(screen.getByText('No records')).toBeInTheDocument();
    expect(screen.getByText('There are no items to display.')).toBeInTheDocument();
  });

  it('handles loading state', () => {
    const { container } = render(
      <DataTable columns={columns} data={[]} keyExtractor={keyExtractor} isLoading />,
    );
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
    expect(screen.queryByText('Name')).not.toBeInTheDocument();
  });

  it('renders pagination controls when totalPages > 1', () => {
    const onPageChange = vi.fn();
    render(
      <DataTable
        columns={columns}
        data={data}
        keyExtractor={keyExtractor}
        page={1}
        totalPages={3}
        total={30}
        onPageChange={onPageChange}
      />,
    );
    expect(screen.getByText('30')).toBeInTheDocument();
    expect(screen.getByLabelText('Previous page')).toBeInTheDocument();
    expect(screen.getByLabelText('Next page')).toBeInTheDocument();
    expect(screen.getByLabelText('Page 1')).toBeInTheDocument();
    expect(screen.getByLabelText('Page 2')).toBeInTheDocument();
    expect(screen.getByLabelText('Page 3')).toBeInTheDocument();
  });

  it('calls onPageChange when Next clicked', async () => {
    const onPageChange = vi.fn();
    const user = userEvent.setup();
    render(
      <DataTable
        columns={columns}
        data={data}
        keyExtractor={keyExtractor}
        page={1}
        totalPages={3}
        total={30}
        onPageChange={onPageChange}
      />,
    );
    await user.click(screen.getByLabelText('Next page'));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('calls onPageChange when Previous clicked', async () => {
    const onPageChange = vi.fn();
    const user = userEvent.setup();
    render(
      <DataTable
        columns={columns}
        data={data}
        keyExtractor={keyExtractor}
        page={2}
        totalPages={3}
        total={30}
        onPageChange={onPageChange}
      />,
    );
    await user.click(screen.getByLabelText('Previous page'));
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it('disables Previous on first page', () => {
    render(
      <DataTable
        columns={columns}
        data={data}
        keyExtractor={keyExtractor}
        page={1}
        totalPages={3}
        total={30}
        onPageChange={vi.fn()}
      />,
    );
    expect(screen.getByLabelText('Previous page')).toBeDisabled();
  });

  it('disables Next on last page', () => {
    render(
      <DataTable
        columns={columns}
        data={data}
        keyExtractor={keyExtractor}
        page={3}
        totalPages={3}
        total={30}
        onPageChange={vi.fn()}
      />,
    );
    expect(screen.getByLabelText('Next page')).toBeDisabled();
  });

  it('supports selectable rows', () => {
    const onSelectionChange = vi.fn();
    render(
      <DataTable
        columns={columns}
        data={data}
        keyExtractor={keyExtractor}
        selectable
        onSelectionChange={onSelectionChange}
      />,
    );
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(4);
    expect(screen.getByLabelText('Select all rows')).toBeInTheDocument();
    expect(screen.getByLabelText('Select row 1')).toBeInTheDocument();
  });

  it('selects all rows when select-all checkbox clicked', async () => {
    const onSelectionChange = vi.fn();
    const user = userEvent.setup();
    render(
      <DataTable
        columns={columns}
        data={data}
        keyExtractor={keyExtractor}
        selectable
        onSelectionChange={onSelectionChange}
      />,
    );
    await user.click(screen.getByLabelText('Select all rows'));
    expect(onSelectionChange).toHaveBeenCalledWith(new Set(['1', '2', '3']));
  });

  it('selects a single row on checkbox click', async () => {
    const onSelectionChange = vi.fn();
    const user = userEvent.setup();
    render(
      <DataTable
        columns={columns}
        data={data}
        keyExtractor={keyExtractor}
        selectable
        onSelectionChange={onSelectionChange}
      />,
    );
    await user.click(screen.getByLabelText('Select row 2'));
    expect(onSelectionChange).toHaveBeenCalledWith(new Set(['2']));
  });

  it('performs shift-click multi-selection', async () => {
    const onSelectionChange = vi.fn();
    const user = userEvent.setup();
    render(
      <DataTable
        columns={columns}
        data={data}
        keyExtractor={keyExtractor}
        selectable
        onSelectionChange={onSelectionChange}
      />,
    );

    const rowCheckboxes = screen.getAllByRole('checkbox').slice(1);
    await user.click(rowCheckboxes[0]!);
    expect(onSelectionChange).toHaveBeenLastCalledWith(new Set(['1']));

    onSelectionChange.mockClear();
    await user.keyboard('{Shift>}');
    await user.click(rowCheckboxes[2]!);
    await user.keyboard('{/Shift}');

    expect(onSelectionChange).toHaveBeenCalled();
    const calledSet = onSelectionChange.mock.calls[0]![0] as Set<string>;
    expect(calledSet.has('1')).toBe(true);
    expect(calledSet.has('2')).toBe(true);
    expect(calledSet.has('3')).toBe(true);
  });

  it('renders bulk actions when items selected', () => {
    render(
      <DataTable
        columns={columns}
        data={data}
        keyExtractor={keyExtractor}
        selectable
        selectedIds={new Set(['1'])}
        bulkActions={[{ label: 'Delete', action: vi.fn() }]}
      />,
    );
    expect(screen.getByText('1 selected')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
  });

  it('supports searchable mode', async () => {
    const onSearch = vi.fn();
    const user = userEvent.setup();
    render(
      <DataTable
        columns={columns}
        data={data}
        keyExtractor={keyExtractor}
        searchable
        onSearch={onSearch}
        searchPlaceholder="Filter results..."
      />,
    );
    const searchInput = screen.getByRole('textbox', { name: 'Filter results...' });
    expect(searchInput).toBeInTheDocument();
    await user.type(searchInput, 'Alice');
    expect(onSearch).toHaveBeenCalledWith('A');
  });
});
