interface Props {
  resultsCount: number;
  totalCount: number;
};

export const FarmerListResults = ({ resultsCount, totalCount }: Props) => {
  return (
    <p className="mb-2 text-sm text-gray-100">
      Showing: <span className="font-semibold text-white">{ resultsCount }</span> of <span className="font-semibold text-white">{ totalCount }</span> results
    </p>
  );
};
