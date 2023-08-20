import type { Knex } from 'knex';
import type { Attribute } from '#app/db/schema/showtimes_manager/attribute';
import type { TheaterHasAttributes } from '#app/db/schema/theater/theater_has_attributes';
import { TABLE } from '#app/db/schema/theater/theater_has_attributes';

export const purge = (
  knex: Knex | Knex.Transaction,
  uuids: Attribute['uuid'][]
) =>
  knex
    .raw<{ rows: TheaterHasAttributes[] }>(
      /* sql */ `
      WITH

      source AS (
        SELECT id, attribute_uids
        FROM ${TABLE}
        WHERE attribute_uids \\?| ?
        ORDER BY id
      ),

      updated AS (
        SELECT
          id,
          COALESCE(
            array_agg(attribute_uuid) FILTER (
              WHERE attribute_uuid IS NOT NULL
            ),
            '{}'::text[]
          ) as attribute_uids
        FROM source
        LEFT JOIN LATERAL jsonb_array_elements_text(attribute_uids) as attribute_uuid
          ON attribute_uuid NOT IN (${uuids.map((_) => '?')})
        GROUP BY id
      )

      UPDATE ${TABLE} AS original
      SET attribute_uids = array_to_json(updated.attribute_uids)
      FROM updated
      WHERE updated.id = original.id

      RETURNING *;
      `,
      [uuids, ...uuids]
    )
    .then((result) => result.rows);
