#!/bin/bash
cd elixir_backend
echo "Iniciando servidor Phoenix..."
echo "Aguarde alguns segundos e acesse: http://localhost:4000"
echo ""
MIX_ENV=dev mix phx.server

