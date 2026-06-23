import { sqliteTable, text, integer, real, index } from "drizzle-orm/sqlite-core";

export const establishments = sqliteTable(
  "establishments",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    coCnes: text("co_cnes").notNull().unique(),
    noFantasia: text("no_fantasia"),
    noRazaoSocial: text("no_razao_social"),
    noLogradouro: text("no_logradouro"),
    nuEndereco: text("nu_endereco"),
    noBairro: text("no_bairro"),
    coCep: text("co_cep"),
    cidade: text("cidade"),
    uf: text("uf").notNull(),
    coIbge: text("co_ibge"),
    latitude: real("latitude"),
    longitude: real("longitude"),
    nuTelefone: text("nu_telefone"),
    dsTurnoAtendimento: text("ds_turno_atendimento"),
    hasCoords: integer("has_coords").notNull().default(0),
    createdAt: text("created_at").notNull().default("datetime('now')"),
    updatedAt: text("updated_at").notNull().default("datetime('now')"),
  },
  (table) => [
    index("idx_establishments_uf").on(table.uf),
    index("idx_establishments_cidade").on(table.cidade),
    index("idx_establishments_coords").on(table.latitude, table.longitude),
    index("idx_establishments_cnes").on(table.coCnes),
  ]
);

export const coordinateCorrections = sqliteTable("coordinate_corrections", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  coCnes: text("co_cnes").notNull().unique(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  source: text("source").default("user"),
  createdAt: text("created_at").notNull().default("datetime('now')"),
});
