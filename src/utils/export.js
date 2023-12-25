import fastcsv from "fast-csv";
import moment from "moment";

export const exportToCSV = (data, filename, res) => {
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

  const columnHeaders = data.fields.map((field) => field.name);

  const csvStream = fastcsv.format({ headers: columnHeaders });
  csvStream.pipe(res);

  data.rows.forEach((row) => {
    const rowData = Object.values(row).map((value, index) => {
      // change dates to a more readable format
      // Dates are reserved under the data type ID 1082
      if (data.fields[index].dataTypeID === 1082) {
        // Format date columns to YYYY-MM-DD
        return moment(value).format("YYYY-MM-DD");
      }
      return value;
    });

    csvStream.write(rowData);
  });

  csvStream.end();
};
