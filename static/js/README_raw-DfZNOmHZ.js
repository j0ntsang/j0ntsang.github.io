const e=`Your october calendars live here, one <year>.json per year.

The shipped calendar is read-only at /usr/share/october. Your copy holds
only your changes to it: movies you added, crossed off or removed. october
applies them over the shipped one, so its updates still show.
rm ~/october/<year>.json (or "Click to reset") drops your changes.

A <year>.legacy.json is a copy saved by an older october, which kept the
whole year. Where there's a shipped calendar, only its cross-offs of
shipped movies carried over; add back any movies of your own from it.
`;export{e as default};
