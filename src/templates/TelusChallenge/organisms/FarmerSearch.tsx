import { useEffect, useMemo, useState } from "react";
import styled from 'styled-components';

import Divider from 'atoms/Divider';
import { FarmerStateDropdown } from '../atoms/FarmerStateDropdown';
import { FarmerListResults } from '../atoms/FarmerListResults';
import { FarmerListTable } from '../molecules/FarmerListTable';
import { FarmerPropertyToggle } from '../atoms/FarmerPropertyToggle';
import { FarmerSearchBar } from '../atoms/FarmerSearchBar';

const SearchOptionGroup = styled.div`
  display: flex;
  flex-direction: row;
`;

export const FarmerSearch: React.VFC = () => {
  const [allFarmers, setAllFarmers] = useState({});
  const [farmerStates, setFarmerStates] = useState([]) as any;
  const [searchQuery, setSearchQuery] = useState("");
  const [hasCropProtection, setHasCropProtection] = useState(true);
  const [hasSeedPurchases, setHasSeedPurchases] = useState(false);
  const [resultsCount, setResultsCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);


  useEffect(() => {
    fetch("https://assets.codepen.io/70720/farmers.json")
      .then(response => response.json())
      .then(json => {
        setAllFarmers(json.data);
      });
  }, [])

  useEffect(() => {
    const stateOptions = Array.from(
      new Set(
        Object.values(allFarmers).map((farmer: any, index: number, self: any) => farmer.state)
      )
    );
    setTotalCount(Object.values(allFarmers).length);
    setFarmerStates(Array.from(new Set(stateOptions)));
  }, [allFarmers]);

  const filteredFarmers = useMemo(() => {
    let filtered = Object.values(allFarmers).filter((farmer: any, index: number, self: any) => {
      const crops = (hasCropProtection && farmer.cp_spend > 0) ? true : (!hasCropProtection);
      const seeds = (hasSeedPurchases && farmer.seed_purchases > 0) ? true : (!hasSeedPurchases);
      if (!crops || !seeds) return false;
      if (searchQuery !== "") {
        const name = farmer.farmer_name.toLowerCase();
        const city = farmer.city.toLowerCase();
        return name.includes(searchQuery.toLowerCase()) || city.includes(searchQuery.toLowerCase());
      }
      return true;
    });

    return filtered;
  }, [allFarmers, hasCropProtection, hasSeedPurchases, searchQuery]);

  useEffect(() => {
    setResultsCount(Object.values(filteredFarmers).length);
  }, [filteredFarmers]);

  return (
    <>
      <SearchOptionGroup className="mb-6">
        <FarmerStateDropdown states={farmerStates} />
        <Divider />
        <FarmerSearchBar handleChange={setSearchQuery} />
        <Divider />
        <FarmerPropertyToggle
          handleChange={() => setHasCropProtection(!hasCropProtection)}
          isChecked={hasCropProtection}
          label={"Has Crop Protection Purchases"}
        />
        <FarmerPropertyToggle
          handleChange={() => setHasSeedPurchases(!hasSeedPurchases)}
          isChecked={hasSeedPurchases}
          label={"Has Seed Purchases"}
        />
      </SearchOptionGroup>
      <FarmerListResults totalCount={totalCount} resultsCount={resultsCount} />
      <FarmerListTable farmers={filteredFarmers} />
    </>
  )
};
