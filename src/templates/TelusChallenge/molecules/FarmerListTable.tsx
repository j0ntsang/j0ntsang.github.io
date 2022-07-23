import { FarmerTableHeader } from './FarmerTableHeader';
import { FarmerListResults } from '../atoms/FarmerListResults';

interface Props {
  farmers: Object;
};

interface FarmersJSON {
  city: String;
  cp_spend: number;
  farmer_name: String;
  seed_purchases: number;
  state: String;
};

export const FarmerListTable = ({ farmers }: Props) => {
  const resultsCount = Object.values(farmers).length;

  return (
    <>
      <FarmerListResults count={resultsCount} />
        <div className="overflow-x-auto relative shadow-md sm:rounded-lg">
          <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
          <FarmerTableHeader />
          <tbody className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
            {Object.values(farmers).map((farmer: FarmersJSON, index: number) => {
              const {
                city,
                cp_spend: crop_spend,
                farmer_name: name,
                seed_purchases: seed,
                state
              }: FarmersJSON = farmer;

              return (
                <tr key={index}>
                  <td className="py-3 px-3 font-medium text-gray-900 whitespace-nowrap dark:text-white">{name}</td>
                  <td className="py-3 px-3">{city}</td>
                  <td className="py-3 px-3">{state}</td>
                  <td className="py-3 px-3 text-right">
                    ${crop_spend.toFixed(2).replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')}
                  </td>
                  <td className="py-3 px-3">{seed}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
};
