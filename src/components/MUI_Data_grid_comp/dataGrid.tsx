import * as React from "react";
import { useState, useCallback, useEffect } from "react";
import Box from "@mui/material/Box";
import { DataGrid, GridColDef, GridRowParams } from "@mui/x-data-grid";
import { ExtractedDataType } from "@/services/engine/DOMFetcherService";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import EmailCell from "./Cell_comp/emailCell";
import PhoneCell from "./Cell_comp/phoneCell";
import { Button } from "@/components/ui/button";

const columns: GridColDef<ExtractedDataType>[] = [
  {
    field: "author",
    headerName: "Author",
    width: 250,
    editable: false,
    description: "Author of the post",
  },
  {
    field: "content",
    headerName: "Content",
    width: 350,
    flex: 1,
    description: "Content of the post",
    renderCell: (params) => (
      <div
        data-set="content-cell"
        style={{
          whiteSpace: "pre-wrap",
          lineHeight: "20px",
          width: "100%",
          padding: "16px",
          height: "100%",
          overflow: "auto",
        }}
      >
        {params.value}
      </div>
    ),

    editable: false,
  },
  {
    field: "email",
    headerName: "Email",
    description: "Email",
    width: 150,
    editable: false,
    renderCell: (params) => {
      return <EmailCell emails={params.value} />;
    },
  },
  {
    field: "phoneNumber",
    headerName: "Phone Number",
    description: "Phone number",
    type: "number",
    width: 110,
    editable: false,

    renderCell: (params) => {
      return <PhoneCell phoneNumbers={params.value} />;
    },
  },
  {
    field: "linkedInURL",
    headerName: "LinkedIn URL",
    description: "Url of the linkedin profile",
    width: 300,
    renderCell: (params) => (
      <div
        style={{
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {params.value}
      </div>
    ),
  },
];

export default function DataGridDemo({
  scrappedData,
}: {
  scrappedData: Array<ExtractedDataType>;
}) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<ExtractedDataType | null>(
    null
  );
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  const handleRowClick = useCallback(
    (params: GridRowParams) => {
      if (isMounted) {
        setSelectedRow(params.row as ExtractedDataType);
        setIsDialogOpen(true);
      }
    },
    [isMounted]
  );

  const rows = React.useMemo(
    () =>
      scrappedData.map((item) => ({
        id: item.id,
        author: item.author,
        content: item.content,
        email: item.email,
        phoneNumber: item.phoneNumber,
        linkedInURL: item.linkedInURL,
      })),
    [scrappedData]
  );

  if (!isMounted) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Box
        sx={{
          height: "calc(100vh - 100px)",
          width: "100%",
          "& .MuiDataGrid-root": {
            minWidth: 1200,
            overflowX: "auto",
          },
        }}
      >
        <DataGrid
          rows={rows}
          columns={columns}
          getRowHeight={({ id, model }) => {
            const content = model[id]?.content || "";
            const contentLines = Math.ceil(content.length / 40);
            return Math.max(150, contentLines * 24);
          }}
          onRowClick={handleRowClick}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 100 },
            },
          }}
          sx={{
            "& .MuiDataGrid-cell": {
              whiteSpace: "normal",
              padding: "0 10px",
              display: "flex",
              alignItems: "stretch",
              overflow: "hidden",
              cursor: "pointer",
            },
            "& .MuiDataGrid-row": {
              alignItems: "stretch",
              minHeight: "unset !important",
            },
            "& .MuiDataGrid-renderingZone": {
              maxHeight: "none !important",
            },
            "& .MuiDataGrid-virtualScroller": {
              overflow: "auto",
            },
            "& .MuiDataGrid-main": {
              overflow: "auto",
            },
          }}
          pageSizeOptions={[5]}
          checkboxSelection
          disableRowSelectionOnClick
        />
      </Box>
      {isMounted && (
        <DialogForRowData
          isDialogOpen={isDialogOpen}
          setIsDialogOpen={setIsDialogOpen}
          selectedRow={selectedRow}
        />
      )}
    </>
  );
}

const DialogForRowData = ({
  selectedRow,
  isDialogOpen,
  setIsDialogOpen,
}: {
  isDialogOpen: boolean;
  selectedRow: ExtractedDataType | null;
  setIsDialogOpen: (isDialogOpen: boolean) => void;
}) => {
  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {selectedRow?.author || "Profile Details"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <h3 className="font-semibold">Content</h3>
            <p className="text-sm">{selectedRow?.content}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 w-full">
              <h3 className="font-semibold">Email</h3>

              {selectedRow?.email && selectedRow?.email.length > 0 ? (
                <EmailCell emails={selectedRow?.email || []} />
              ) : (
                <p className="text-sm text-red-500">No Email</p>
              )}
            </div>

            <div className="space-y-2 ">
              <h3 className="font-semibold">Phone</h3>
              {selectedRow?.phoneNumber &&
              selectedRow?.phoneNumber.length > 0 ? (
                <PhoneCell phoneNumbers={selectedRow?.phoneNumber || []} />
              ) : (
                <p className="text-sm text-red-500">No Phone</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">LinkedIn URL</h3>
            <a
              href={selectedRow?.linkedInURL || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline break-all"
            >
              {selectedRow?.linkedInURL}
            </a>
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={() => setIsDialogOpen(false)}
            className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 cursor-pointer text-amber-700"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// TODO: ENHANCEMENT of the Loader component in the DataGrid component
