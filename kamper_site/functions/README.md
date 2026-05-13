Webhook de pagamento para atualizar pedidos no Firestore.

Como funciona:
- o provedor de pagamento envia um `POST` para a Cloud Function
- a function lê `orderId` e `status`
- se o status representar pagamento confirmado, o pedido vira `approved`

Payloads aceitos:
```json
{
  "orderId": "PED-1712345678901",
  "status": "paid",
  "provider": "generic"
}
```

Também aceita:
- `order_id`
- `external_reference`
- `metadata.orderId`

Status mapeados:
- `paid`, `approved`, `succeeded`, `success` -> `approved`
- `refused`, `rejected`, `cancelled`, `failed` -> `rejected`
- `shipped` -> `shipped`
- `delivered` -> `delivered`

Segurança:
- defina `WEBHOOK_SECRET`
- envie o segredo em `x-webhook-secret` ou `Authorization: Bearer ...`

Próximos passos:
1. instalar dependências em `functions`
2. configurar a variável `WEBHOOK_SECRET`
3. publicar a function
4. cadastrar a URL no painel do seu provedor de pagamento
