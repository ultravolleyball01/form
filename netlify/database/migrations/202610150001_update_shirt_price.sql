UPDATE ultra_app_state
SET data = jsonb_set(
      jsonb_set(
        jsonb_set(
          data,
          '{system_settings}',
          COALESCE(
            (
              SELECT jsonb_agg(
                CASE
                  WHEN setting->>'key' = 'shirt_price'
                    THEN jsonb_set(setting, '{value}', to_jsonb('7000'::text), false)
                  ELSE setting
                END
                ORDER BY position
              )
              FROM jsonb_array_elements(data->'system_settings')
                WITH ORDINALITY AS settings(setting, position)
            ),
            data->'system_settings'
          ),
          false
        ),
        '{registrations}',
        COALESCE(
          (
            SELECT jsonb_agg(
              CASE
                WHEN registration->>'amount' = '6000'
                  THEN jsonb_set(registration, '{amount}', '7000'::jsonb, false)
                ELSE registration
              END
              ORDER BY position
            )
            FROM jsonb_array_elements(data->'registrations')
              WITH ORDINALITY AS registrations(registration, position)
          ),
          data->'registrations'
        ),
        false
      ),
      '{payments}',
      COALESCE(
        (
          SELECT jsonb_agg(
            CASE
              WHEN updated_payment->>'paid_amount' = '6000'
                THEN jsonb_set(updated_payment, '{paid_amount}', '7000'::jsonb, false)
              ELSE updated_payment
            END
            ORDER BY position
          )
          FROM (
            SELECT
              position,
              CASE
                WHEN payment->>'amount' = '6000'
                  THEN jsonb_set(payment, '{amount}', '7000'::jsonb, false)
                ELSE payment
              END AS updated_payment
            FROM jsonb_array_elements(data->'payments')
              WITH ORDINALITY AS payments(payment, position)
          ) AS normalized_payments
        ),
        data->'payments'
      ),
      false
    ),
    version = version + 1,
    updated_at = NOW()
WHERE id = 1
  AND jsonb_typeof(data->'system_settings') = 'array';
