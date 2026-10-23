-- JavaScript signed Int32 hash parity, including negative overflow.
CREATE OR REPLACE FUNCTION private.pick_location_barcode(p_code text,p_location text) RETURNS text
LANGUAGE plpgsql IMMUTABLE SET search_path='' AS $$
DECLARE prefix text; payload text; h bigint:=0; digit integer; total integer:=0; doubled boolean:=false; i integer; m text[];
BEGIN
 IF p_location !~ '^[A-Z]-[0-9]{2}-[0-9]{2}$' THEN RETURN NULL; END IF;
 m:=regexp_match(p_code,'^[A-Z]{2}-([0-9]+)','i');
 IF m IS NULL THEN m:=regexp_match(p_code,'SITE-(?:[A-Z]{2}-)?([0-9]+)','i'); END IF;
 IF m IS NOT NULL THEN prefix:=lpad((m[1]::bigint%10000)::text,4,'0');
 ELSE
  FOR i IN 1..length(p_code) LOOP
   h:=((h*31+ascii(substr(p_code,i,1)))%4294967296+4294967296)%4294967296;
   IF h>2147483647 THEN h:=h-4294967296; END IF;
  END LOOP;
  prefix:=lpad((abs(h)%10000)::text,4,'0');
 END IF;
 payload:=prefix||lpad((ascii(substr(p_location,1,1))-64)::text,2,'0')||substr(p_location,3,2)||substr(p_location,6,2)||'0000';
 FOR i IN REVERSE length(payload)..1 LOOP
  digit:=substr(payload,i,1)::integer;
  IF doubled THEN digit:=digit*2; IF digit>9 THEN digit:=digit-9; END IF; END IF;
  total:=total+digit; doubled:=NOT doubled;
 END LOOP;
 RETURN payload||((10-total%10)%10)::text;
END; $$;
