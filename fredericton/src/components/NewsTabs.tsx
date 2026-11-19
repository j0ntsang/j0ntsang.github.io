import { Link, Tab, TabList, TabPanel, Tabs } from "react-aria-components";

export type NewsStream = {
  id: string;
  name: string;
  /** Null when the source isn't connected yet. */
  items: { title: string; url: string; when: string; dateTime: string }[] | null;
  unavailableReason?: string;
};

export function NewsTabs({ streams }: { streams: NewsStream[] }) {
  return (
    <Tabs className="flex flex-col gap-4">
      <TabList aria-label="News sources" className="flex gap-1 overflow-x-auto overflow-y-hidden border-b border-line">
        {streams.map((s) => (
          <Tab
            key={s.id}
            id={s.id}
            className="-mb-px cursor-default whitespace-nowrap border-b-2 border-transparent px-3 py-2 text-sm text-muted outline-none hover:text-ink focus-visible:ring-2 focus-visible:ring-accent selected:border-accent selected:font-medium selected:text-ink"
          >
            {s.name}
            {s.items === null && <span className="ml-1 text-xs">(soon)</span>}
          </Tab>
        ))}
      </TabList>
      {streams.map((s) => (
        <TabPanel key={s.id} id={s.id} className="outline-none focus-visible:ring-2 focus-visible:ring-accent">
          {s.items === null ? (
            <p className="text-sm text-muted">{s.unavailableReason ?? "Not connected yet."}</p>
          ) : (
            <ol className="flex flex-col divide-y divide-line">
              {s.items.map((item) => (
                <li key={item.url} className="py-3">
                  <Link
                    href={item.url}
                    target="_blank"
                    className="text-ink underline-offset-2 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    {item.title}
                  </Link>
                  <p className="mt-0.5 text-xs text-muted">
                    <time dateTime={item.dateTime}>{item.when}</time>
                  </p>
                </li>
              ))}
            </ol>
          )}
        </TabPanel>
      ))}
    </Tabs>
  );
}
