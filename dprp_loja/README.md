# 📦 Resource de Entrega FiveM - Distrito Paulista RP (`dprp_loja`)

Resource oficial de entrega automática de pacotes (Coins, Gemas, VIPs, Especiais, Policial e Packs) integrado diretamente com a sua loja própria Next.js e Mercado Pago.

---

## 🚀 Instalação no Servidor FiveM

1. Copie a pasta `dprp_loja` para a pasta de resources do seu servidor:
   ```
   [resources]/[scripts]/dprp_loja
   ```

2. Abra o arquivo `config.lua` e configure:
   - `Config.ApiUrl`: Endereço onde a sua loja Next.js está rodando (ex: `http://127.0.0.1:3000` se estiver na mesma VPS, ou `https://loja.distritopaulistarp.com.br`).
   - `Config.ApiSecret`: O mesmo segredo configurado no `.env.local` da loja (`FIVEM_API_SECRET`).
   - `Config.DiscordWebhook`: (Opcional) Webhook de um canal privado do Discord para registrar os logs de cada entrega concluída.

3. Adicione ao seu `server.cfg`:
   ```cfg
   ensure dprp_loja
   ```

4. Reinicie o servidor ou dê `refresh` e `ensure dprp_loja` no console.

---

## ⚙️ Como Funciona o Ciclo de Entrega

1. **Compra na Loja Web**: O jogador escolhe o pacote, insere seu Discord, nome, CPF e o **"Seu ID na cidade"** e clica em **Pagar**.
2. **Geração do PIX**: A loja comunica com o Mercado Pago e exibe o QR Code e o código Copia e Cola instantâneo.
3. **Pagamento Confirmado**: O banco confirma o Pix -> O Webhook do Mercado Pago atualiza o status do pedido para `PAID` no banco de dados local da loja.
4. **Entrega In-Game Automática**: O script `dprp_loja` no FiveM faz checagem periódica (a cada 10 segundos):
   - Se o jogador estiver **online**: entrega os itens diretamente no inventário/perfil e emite uma notificação na tela (`ox_lib`).
   - Se o jogador estiver **offline**: adiciona diretamente na base MySQL ou na tabela de recompensas pendentes para quando ele entrar na cidade.
5. **Confirmação e Log**: O script notifica a loja que a entrega foi realizada com sucesso (`status = DELIVERED`) e envia o comprovante para a staff no Discord.

