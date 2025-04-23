
import React from "react";
import { useParams } from "react-router-dom";
import Header from "@/components/Header";
import { useSessionPageData } from "./hooks/useSessionPageData";
import SessionContainer from "./components/SessionContainer";

const SessionDetails = () => {
  const { sessionId } = useParams<{ sessionId?: string }>();
  const sessionData = useSessionPageData(sessionId);

  return (
    <>
      <Header />
      <SessionContainer 
        sessionId={sessionId} 
        {...sessionData} 
      />
    </>
  );
};

export default SessionDetails;
