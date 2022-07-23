interface Props {
  count: number;
};

export const FarmerListResults = ({ count }: Props) => {
  return (
    <p className="mb-2 text-sm text-gray-700">
      Results: <span className="font-semibold text-gray-900">{ count }</span>
    </p>
  );
};
