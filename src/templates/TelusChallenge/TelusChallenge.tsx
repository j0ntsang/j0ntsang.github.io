import React, { useEffect, useState } from "react";

import AppContainer from "../../templates/AppContainer";
import H1 from "atoms/H1";
import { FarmerSearch } from "./organisms/FarmerSearch";

export const TelusChallenge: React.VFC = () => {
  const [farmers, setFarmers] = useState({});

  useEffect(() => {
    fetch("https://assets.codepen.io/70720/farmers.json")
      .then(response => response.json())
      .then(json => {
        setFarmers(json.data);
      });
  }, [])

  return (
    <AppContainer>
      <H1 className="mb-4">Hello, TELUS</H1>
      <FarmerSearch farmers={farmers} />
    </AppContainer>
  );
};

export default TelusChallenge;
