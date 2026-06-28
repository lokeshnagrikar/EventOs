-- Migrate existing lead statuses to the new pipeline stages
UPDATE leads SET status = 'WON' WHERE status IN ('BOOKED', 'COMPLETED');
UPDATE leads SET status = 'QUALIFIED' WHERE status = 'CONTACTED';
UPDATE leads SET status = 'PROPOSAL_SENT' WHERE status = 'QUOTE_SENT';
