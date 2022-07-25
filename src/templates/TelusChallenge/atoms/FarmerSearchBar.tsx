import styled from 'styled-components';

const FarmerSearchBarWrapper = styled.form`
  min-width: 300px;
`;

interface Props {
  handleChange(e: string): any;
};

export const FarmerSearchBar = ({ handleChange }: Props) => {

  return (
    <FarmerSearchBarWrapper>
      <label htmlFor="default-search" className="mb-2 text-sm font-medium text-gray-300 sr-only">Search</label>
      <div className="relative">
        <div className="flex absolute inset-y-0 left-0 items-center pl-3 pointer-events-none">
          <svg aria-hidden="true" className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
        </div>
        <input onChange={(e) => handleChange(e.target.value) } type="search" id="default-search" className="block p-4 pl-10 w-full text-sm text-white bg-gray-50 rounded-lg border bg-gray-700 border-gray-600 placeholder-gray-400 text-white focus:ring-blue-500 focus:border-blue-500" placeholder="Name, City" />
        <button type="submit" className="text-white absolute right-2.5 bottom-2.5 bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-800 font-medium rounded-lg text-sm px-4 py-2">Search</button>
      </div>
    </FarmerSearchBarWrapper>
  );
};
