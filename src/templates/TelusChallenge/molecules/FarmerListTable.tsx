import { FarmerTableHeader } from './FarmerTableHeader';
import { FarmersJSONType } from 'types/TelusChallenge';

interface Props {
  farmers: Object;
};

export const FarmerListTable = ({ farmers }: Props) => {

  return (
    <>
      <div className="overflow-x-auto relative shadow-md sm:rounded-lg border border-gray-600">
        <table className="w-full text-sm text-left text-gray-300">
          <FarmerTableHeader />
          <tbody className="border-b bg-gray-800 border-gray-700">
            {Object.values(farmers).map((farmer: FarmersJSONType, index: number) => {
              const {
                city,
                cp_spend: crop_spend,
                farmer_name: name,
                seed_purchases: seed,
                state
              }: FarmersJSONType = farmer;

              return (
                <tr key={index} className="border-b border-gray-700 hover:bg-gray-700">
                  <td className="py-3 px-3 font-medium text-white whitespace-nowrap">{name}</td>
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
