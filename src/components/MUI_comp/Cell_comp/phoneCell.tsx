const PhoneCell = ({ phoneNumbers }: { phoneNumbers: string[] }) => {
  if (phoneNumbers.length < 1) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          color: "red",
          textAlign: "center",
        }}
      >
        No phone number
      </div>
    );
  }
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        width: "100%",
        overflowY: "auto",
        overflowX: "hidden",
        padding: "8px 0",
      }}
    >
      {phoneNumbers.map((phoneNumber, id) => {
        return (
          <div
            key={id}
            style={{
              width: "fit-content",
              padding: "4px 8px",
              backgroundColor: "#f5f5f5",
              borderRadius: "4px",
              overflow: "hidden",
              textOverflow: "hidden",
              whiteSpace: "nowrap",
              fontSize: "0.875rem",
              color: "#000000",
              display: "block",
              minHeight: "24px",
              lineHeight: "16px",
              border: "1px solid #e0e0e0",
            }}
          >
            {phoneNumber}
          </div>
        );
      })}
    </div>
  );
};

export default PhoneCell;
