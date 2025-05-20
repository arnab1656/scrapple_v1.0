"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";

interface PostCardProps {
  postContent: string;
  authorName: string;
  profileURL: string;
  email: string;
  phone?: string;
}

export default function OutlinedCard({
  postContent,
  authorName,
  profileURL,
  email,
  phone,
}: PostCardProps) {
  return (
    <Box sx={{ minWidth: 275 }}>
      <Card variant="outlined">
        <CardContent>
          <Typography
            gutterBottom
            sx={{ color: "text.secondary", fontSize: 14 }}
          >
            {authorName}
          </Typography>
          <Typography variant="h5" component="div">
            {postContent}
          </Typography>
          <Typography sx={{ color: "text.secondary", mb: 1.5 }}>
            {profileURL}
          </Typography>
          <Typography variant="body2">{email}</Typography>
          {phone && (
            <Typography sx={{ color: "text.secondary", mb: 1.5 }}>
              {phone}
            </Typography>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

OutlinedCard.displayName = "OutlinedCard";

//🔍 Key Extracted Information:

// Author Name: Jitendrasinh Rana
// Profile URL: https://www.linkedin.com/in/jnrana
// email: jitendrasinhrana@gmail.com
// phone?: +91 98250 00000
// postContent: string
