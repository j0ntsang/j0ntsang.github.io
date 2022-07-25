import { nanoid } from 'nanoid';
import styled from 'styled-components';

const FarmerStateDropdownWrapper = styled.div`
  min-width: 200px;
`;

const FarmerStateDropdownSelect = styled.select`
  appearance: none;
  background-image:
    linear-gradient(45deg, transparent 50%, gray 50%),
    linear-gradient(135deg, gray 50%, transparent 50%);
  background-position:
    calc(100% - 20px) calc(50%),
    calc(100% - 15px) calc(50%);
  background-size:
    5px 5px,
    5px 5px;
  background-repeat: no-repeat;
`;

interface Props {
  states: any;
};

export const FarmerStateDropdown = ({ states }: Props) => {

  return (
    <FarmerStateDropdownWrapper className="relative flex items-center">
      <FarmerStateDropdownSelect className="cursor-not-allowed bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-4" defaultValue="State" disabled>
        <option disabled>State</option>
        {states.map((state: string) => {
          return (
            <option key={nanoid()} value={state}>
              {state}
            </option>
          )
        })}
      </FarmerStateDropdownSelect>
    </FarmerStateDropdownWrapper>
  );
};
