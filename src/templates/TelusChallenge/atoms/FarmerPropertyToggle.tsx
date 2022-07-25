import styled from 'styled-components';
import { nanoid } from 'nanoid';

const FarmerPropertyToggleWrapper = styled.div`
  margin-right: 16px;

  &:last-of-type {
    margin-right: 0;
  }
`;

interface Props {
  handleChange(): any;
  isChecked: boolean;
  label: String;
};

export const FarmerPropertyToggle = ({ handleChange, isChecked, label }: Props) => {
  const checkboxId = nanoid();
  return (
    <FarmerPropertyToggleWrapper className="flex items-center">
      <input onChange={handleChange} checked={isChecked} id={checkboxId} type="checkbox" value="" className="w-4 h-4 text-white bg-gray-100 rounded border-gray-300 focus:ring-blue-500" />
      <label htmlFor={checkboxId} className="ml-2 text-sm font-medium text-white">
        {label}
      </label>
    </FarmerPropertyToggleWrapper>
  );
};
