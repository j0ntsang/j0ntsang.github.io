import { useState } from "react";
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

interface Props {
  farmers: Object;
};

export const FarmerSearch = ({ farmers }: Props) => {
  const resultsCount = Object.values(farmers).length;

  const [hasCropProtection, setHasCropProtection] = useState(false);
  const [hasSeedPurchases, setHasSeedPurchases] = useState(false);



  return (
    <>
      <SearchOptionGroup className="mb-3">
        <FarmerStateDropdown handleChange={() => {}} />
        <Divider />
        <FarmerSearchBar handleChange={() => {}} />
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
      <FarmerListResults count={resultsCount} />
      <FarmerListTable farmers={farmers} />
    </>
  )
};
