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
      <FarmerSearch />
    </AppContainer>
  );
};

export default TelusChallenge;
