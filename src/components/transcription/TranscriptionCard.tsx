
import React from "react";
import TranscriptionCardContainer from "./components/TranscriptionCardContainer";
import { TranscriptionCardProps } from "./types";

const TranscriptionCard: React.FC<TranscriptionCardProps> = (props) => {
  return <TranscriptionCardContainer {...props} />;
};

export default TranscriptionCard;
