import { useState, useCallback } from "react";
import { AutocompleteInput } from "./autocomplete-input";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";

interface TeamAutocompleteProps {
  value?: string;
  onChange: (value: string) => void;
}

export function TeamAutocomplete({
  value,
  onChange,
}: TeamAutocompleteProps) {
  const { data: teams = [] } = useQuery<string[]>({
    queryKey: ["/api/teams"],
  });

  return (
    <AutocompleteInput
      value={value}
      onChange={onChange}
      queryKey="/api/teams"
      placeholder="Select team"
      items={teams}
      createEndpoint="/api/teams"
      emptyText="No teams found"
    />
  );
}
