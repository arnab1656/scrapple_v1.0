import { createTheme } from "@mui/material/styles";
import type {} from "@mui/x-data-grid/themeAugmentation";

export const theme = createTheme({
  components: {
    MuiDataGrid: {
      styleOverrides: {
        root: {
          backgroundColor: "#ffffff",
          "& .MuiDataGrid-cell": {
            padding: "16px",
          },
        },
        columnHeader: {
          backgroundColor: "#f5f5f5",
        },
      },
      defaultProps: {
        density: "comfortable",
        pageSizeOptions: [5, 10, 25],
      },
    },
  },
});
