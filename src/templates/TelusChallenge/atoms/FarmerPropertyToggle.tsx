import styled from 'styled-components';

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

  return (
    <FarmerPropertyToggleWrapper className="flex items-center">
      <input onClick={handleChange} checked={isChecked} id="checkbox-1" type="checkbox" value="" className="w-4 h-4 text-blue-600 bg-gray-100 rounded border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" />
      <label htmlFor="checkbox" className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">{label}</label>
    </FarmerPropertyToggleWrapper>
  );
};
