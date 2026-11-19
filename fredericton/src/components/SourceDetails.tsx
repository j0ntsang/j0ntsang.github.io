import { Button, Disclosure, DisclosurePanel, Heading, Link } from "react-aria-components";

type Props = {
  name: string;
  owner: string;
  homepage: string;
  licence: string;
  cadence: string;
  error?: string;
};

export function SourceDetails({ name, owner, homepage, licence, cadence, error }: Props) {
  return (
    <Disclosure className="group text-xs">
      <Heading className="m-0 font-normal">
        <Button
          slot="trigger"
          className="inline-flex items-center gap-1 rounded text-muted underline-offset-2 outline-none hover:text-ink hover:underline focus-visible:ring-2 focus-visible:ring-accent"
        >
          <svg aria-hidden viewBox="0 0 12 12" className="size-3 transition-transform group-data-[expanded]:rotate-90">
            <path d="M4 2l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          About this data<span className="sr-only">: {name}</span>
        </Button>
      </Heading>
      <DisclosurePanel>
        <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-muted">
          <dt>Source</dt>
          <dd>
            <Link href={homepage} target="_blank" className="text-accent underline-offset-2 hover:underline">
              {owner}
            </Link>
          </dd>
          <dt>Updates</dt>
          <dd>{cadence}</dd>
          <dt>Licence</dt>
          <dd>{licence}</dd>
          {error && (
            <>
              <dt>Last error</dt>
              <dd className="font-mono text-down">{error}</dd>
            </>
          )}
        </dl>
      </DisclosurePanel>
    </Disclosure>
  );
}
