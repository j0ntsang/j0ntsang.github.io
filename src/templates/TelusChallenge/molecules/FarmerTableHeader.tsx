import React from "react";

export const FarmerTableHeader: React.VFC = () => {

  return (
    <thead className={"text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400"}>
      <tr>
        <th className={"py-3 px-3"} scope="col">Farmer Name</th>
        <th className={"py-3 px-3"} scope="col">City</th>
        <th className={"py-3 px-3"} scope="col">State</th>
        <th className={"py-3 px-3 text-right"} scope="col">Crop Protection Spend</th>
        <th className={"py-3 px-3"} scope="col">Seed (Bags)</th>
      </tr>
    </thead>
  );
};
