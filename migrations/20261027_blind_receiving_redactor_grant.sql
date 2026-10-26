-- Pure immutable redactor accepts only caller-provided JSON; it reads no tables.
GRANT EXECUTE ON FUNCTION private.strip_transfer_quantities(jsonb) TO authenticated;
