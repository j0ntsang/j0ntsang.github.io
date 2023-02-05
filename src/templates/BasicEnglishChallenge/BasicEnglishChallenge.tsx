import React, { useEffect } from "react";

import AppContainer from "templates/AppContainer";
import H1 from "atoms/H1";

export const BasicEnglishChallenge: React.VFC = () => {
  useEffect(() => {
    document.body.classList.add('bg-gray-900');
  }, []);

  return (
    <AppContainer>
      <H1 className="mb-4 text-white">Hello, Overleaf</H1>
    </AppContainer>
  );
};

export default BasicEnglishChallenge;
