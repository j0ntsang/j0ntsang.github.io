import React, { useEffect } from "react";

import AppContainer from "templates/AppContainer";
import H1 from "atoms/H1";
import { FarmerSearch } from "./organisms/FarmerSearch";

export const TelusChallenge: React.VFC = () => {
  useEffect(() => {
    document.body.classList.add('bg-gray-900');
  }, []);

  return (
    <AppContainer>
      <H1 className="mb-4 text-white">Hello, TELUS</H1>
      <p className="mb-4 text-white">
        The original file changeset can be viewed on the P/R: <a className="font-semibold" href="https://github.com/j0ntsang/j0ntsang.github.io/pull/1/files" target="_blank" rel="noopener noreferrer">telus-agriculture-technical-challenge</a>
      </p>
      <FarmerSearch />
    </AppContainer>
  );
};

export default TelusChallenge;
