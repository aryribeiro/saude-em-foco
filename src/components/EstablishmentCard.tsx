"use client";

import type { Establishment } from "@/types";

interface EstablishmentCardProps {
  establishment: Establishment;
  showDistance?: boolean;
}

export default function EstablishmentCard({
  establishment,
  showDistance = true,
}: EstablishmentCardProps) {
  return (
    <div className="py-2">
      <p>
        <strong>Nome Fantasia:</strong> {establishment.noFantasia ?? "—"}
      </p>
      <p>
        <strong>Razão Social:</strong> {establishment.noRazaoSocial ?? "—"}
      </p>
      <p>
        <strong>Endereço:</strong> {establishment.noLogradouro},{" "}
        {establishment.nuEndereco}, {establishment.noBairro}, CEP:{" "}
        {establishment.coCep}
      </p>
      <p>
        <strong>Telefone:</strong> {establishment.nuTelefone}
      </p>
      <p>
        <strong>Turno de Atendimento:</strong>{" "}
        {establishment.dsTurnoAtendimento}
      </p>
      <p>
        <strong>Atende SUS:</strong> Sim
      </p>
      {showDistance && establishment.distance !== undefined && (
        <p>
          <strong>Distância:</strong> {establishment.distance.toFixed(2)} km
        </p>
      )}
    </div>
  );
}
