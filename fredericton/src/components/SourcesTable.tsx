import { useMemo, useState } from "react";
import { Cell, Column, Link, Row, Table, TableBody, TableHeader, type SortDescriptor } from "react-aria-components";

export type SourceRow = {
  id: string;
  name: string;
  section: string;
  owner: string;
  homepage: string;
  cadence: string;
  licence: string;
  status: "Checking" | "Current" | "Out of date" | "Unavailable" | "Bundled" | "Planned" | "Blocked";
  note?: string;
};

const STATUS_STYLE: Record<SourceRow["status"], string> = {
  Checking: "bg-surface-2 text-muted",
  Current: "bg-live/15 text-live",
  "Out of date": "bg-stale/15 text-stale",
  Unavailable: "bg-down/15 text-down",
  Bundled: "bg-live/15 text-live",
  Planned: "bg-surface-2 text-muted",
  Blocked: "bg-stale/15 text-stale",
};

const columnClass =
  "cursor-default border-b border-line px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted outline-none focus-visible:ring-2 focus-visible:ring-accent";

export function SourcesTable({ rows }: { rows: SourceRow[] }) {
  const [sort, setSort] = useState<SortDescriptor>({ column: "section", direction: "ascending" });

  const sorted = useMemo(() => {
    const key = sort.column as keyof SourceRow;
    const dir = sort.direction === "descending" ? -1 : 1;
    return [...rows].sort((a, b) => String(a[key]).localeCompare(String(b[key])) * dir);
  }, [rows, sort]);

  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-surface">
      <Table aria-label="Data sources" sortDescriptor={sort} onSortChange={setSort} className="w-full min-w-[720px] border-collapse text-sm">
        <TableHeader>
          <Column id="name" isRowHeader allowsSorting className={columnClass}>
            Source
          </Column>
          <Column id="section" allowsSorting className={columnClass}>
            Section
          </Column>
          <Column id="status" allowsSorting className={columnClass}>
            Status
          </Column>
          <Column id="cadence" className={columnClass}>
            Updates
          </Column>
          <Column id="licence" className={columnClass}>
            Licence
          </Column>
        </TableHeader>
        <TableBody items={sorted}>
          {(row) => (
            <Row id={row.id} className="border-b border-line outline-none last:border-0 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent">
              <Cell className="px-3 py-2 align-top">
                <div className="font-medium text-ink">{row.name}</div>
                <Link href={row.homepage} target="_blank" className="text-xs text-accent underline-offset-2 hover:underline">
                  {row.owner}
                </Link>
                {row.note && <p className="mt-1 text-xs text-muted">{row.note}</p>}
              </Cell>
              <Cell className="px-3 py-2 align-top text-muted">{row.section}</Cell>
              <Cell className="px-3 py-2 align-top">
                <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[row.status]}`}>{row.status}</span>
              </Cell>
              <Cell className="px-3 py-2 align-top text-muted">{row.cadence}</Cell>
              <Cell className="px-3 py-2 align-top text-muted">{row.licence}</Cell>
            </Row>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
